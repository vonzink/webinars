import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';

let composition = {};
try {
  composition = await import('../js/studio/composition.js');
} catch {
  // RED: Task 3 starts before the sandbox composition module exists.
}

const {
  buildSlideCsp,
  composeSlideDocument: composeWithBrowserParser,
  createInertHtmlParser,
  createSlideDocumentComposer,
  replaceAssetTokens,
} = composition;

const NONCE = '550e8400-e29b-41d4-a716-446655440000';
const ASSET_ID = '11111111-1111-4111-8111-111111111111';
const SECOND_ASSET_ID = '22222222-2222-4222-8222-222222222222';
const LETTERED_ASSET_ID = 'abcdefab-cdef-4abc-8def-abcdefabcdef';
const ASSET_URL = `https://assets.example/approved/sha256/${'a'.repeat(64)}/asset`;
const SECOND_ASSET_URL = `https://assets.example/approved/sha256/${'b'.repeat(64)}/asset`;

const policy = Object.freeze({
  assetOrigin: 'https://assets.example',
  stylesheetOrigins: Object.freeze(['https://styles-b.example', 'https://styles-a.example']),
  fontOrigins: Object.freeze(['https://fonts.example']),
});

const baseMaster = Object.freeze({
  html: '<main class="webinar-slide">{{SLIDE_CONTENT}}</main>',
  css: ':root { --brand: #8cc63e; }',
});

const baseSlide = Object.freeze({
  html: `<section><img src="{{ASSET:${ASSET_ID}}}" alt=""></section>`,
  css: '.webinar-slide { color: white; }',
  javascript: 'window.slideBooted = true;',
});

const assets = Object.freeze({ [ASSET_ID]: ASSET_URL });

function errorCode(fn) {
  try {
    fn();
  } catch (error) {
    assert.equal(error.message, 'Slide composition failed');
    assert.doesNotMatch(String(error), /11111111|evil|secret|private/i);
    return error.code;
  }
  assert.fail('Expected composition to fail');
}

function nodeList(values) {
  return {
    length: values.length,
    item(index) { return values[index] || null; },
  };
}

function parsedElement({ name = 'div', attributes = [], children = [], template = [] } = {}) {
  return {
    nodeType: 1,
    localName: name,
    attributes: nodeList(attributes.map(attribute => (
      typeof attribute === 'string' ? { name: attribute, value: '' } : attribute
    ))),
    childNodes: nodeList(children),
    ...(name.toLowerCase() === 'template'
      ? { content: { nodeType: 11, childNodes: nodeList(template) } }
      : {}),
  };
}

function parsedTreeWithAttributes(attributes = []) {
  return parsedElement({
    name: 'html',
    children: attributes.length ? [parsedElement({ attributes })] : [],
  });
}

function composerForParsedSource(expectedSource, attributes = []) {
  return createSlideDocumentComposer(source => {
    assert.equal(source, expectedSource);
    return parsedTreeWithAttributes(attributes);
  });
}

function composerReportingReservedMount(masterHtml, slideHtml, attribute = 'data-slide-mount') {
  const mount = masterHtml.indexOf('{{SLIDE_CONTENT}}');
  assert.notEqual(mount, -1);
  const expectedSource = masterHtml.slice(0, mount)
    + slideHtml
    + masterHtml.slice(mount + '{{SLIDE_CONTENT}}'.length);
  return composerForParsedSource(expectedSource, [attribute]);
}

const composeSlideDocument = typeof createSlideDocumentComposer === 'function'
  ? createSlideDocumentComposer(() => parsedTreeWithAttributes())
  : undefined;

function scriptFrom(srcdoc) {
  const scripts = [...srcdoc.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 1, 'the composed document must contain one controlled script element');
  return scripts[0][1];
}

function runComposedRuntime(srcdoc) {
  const posted = [];
  const dispatched = [];
  const appendedScripts = [];
  const listeners = new Map();
  const parentWindow = {
    postMessage(message, targetOrigin) {
      posted.push({
        message: JSON.parse(JSON.stringify(message)),
        targetOrigin,
      });
    },
  };

  class RuntimeEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail;
      this.defaultPrevented = false;
    }

    preventDefault() {
      this.defaultPrevented = true;
    }
  }

  const sandbox = {
    parent: parentWindow,
    CustomEvent: RuntimeEvent,
    Event: RuntimeEvent,
  };

  sandbox.addEventListener = (type, listener) => {
    const registered = listeners.get(type) || [];
    registered.push(listener);
    listeners.set(type, registered);
  };
  sandbox.dispatchEvent = event => {
    dispatched.push({ type: event.type, detail: event.detail });
    for (const listener of listeners.get(event.type) || []) listener.call(sandbox, event);
    return !event.defaultPrevented;
  };
  sandbox.document = {
    createElement(tagName) {
      return { tagName: String(tagName).toUpperCase(), textContent: '' };
    },
    body: {
      appendChild(node) {
        if (node.tagName === 'SCRIPT') {
          appendedScripts.push(node.textContent);
          try {
            new vm.Script(node.textContent, { filename: 'slide-runtime.js' }).runInContext(context);
          } catch (error) {
            const location = /slide-runtime\.js:(\d+):(\d+)/.exec(error.stack || '');
            const event = new RuntimeEvent('error');
            event.lineno = Number(location?.[1]) || 1;
            event.colno = Number(location?.[2]) || 0;
            sandbox.dispatchEvent(event);
          }
        }
        return node;
      },
    },
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  const context = vm.createContext(sandbox);
  vm.runInContext(scriptFrom(srcdoc), context);

  return {
    posted,
    dispatched,
    appendedScripts,
    window: sandbox,
    dispatchMessage(data, source = parentWindow) {
      const encoded = JSON.stringify(JSON.stringify(data));
      const cloned = vm.runInContext(`JSON.parse(${encoded})`, context);
      sandbox.dispatchEvent({ type: 'message', data: cloned, source });
    },
    dispatchWindowEvent(type, fields = {}) {
      const event = new RuntimeEvent(type);
      Object.assign(event, fields);
      sandbox.dispatchEvent(event);
      return event;
    },
  };
}

test('asset replacement resolves every exact canonical token from only the supplied map', () => {
  const source = `a={{ASSET:${ASSET_ID}}};b={{ASSET:${SECOND_ASSET_ID}}};a2={{ASSET:${ASSET_ID}}}`;
  const resolved = replaceAssetTokens(source, {
    [SECOND_ASSET_ID]: SECOND_ASSET_URL,
    [ASSET_ID]: ASSET_URL,
  });

  assert.equal(resolved, `a=${ASSET_URL};b=${SECOND_ASSET_URL};a2=${ASSET_URL}`);
  assert.equal(source.includes('{{ASSET:'), true);
});

test('asset replacement fails closed for malformed, noncanonical, unknown, or unsafe entries', () => {
  const malformed = [
    '{{ASSET:not-a-uuid}}',
    `{{ASSET:${LETTERED_ASSET_ID.toUpperCase()}}}`,
    `{{asset:${ASSET_ID}}}`,
    `{{ ASSET:${ASSET_ID}}}`,
    `{{ASSET: ${ASSET_ID}}}`,
    `{{ASSET:${ASSET_ID}`,
  ];
  for (const source of malformed) {
    assert.equal(errorCode(() => replaceAssetTokens(source, assets)), 'ASSET_TOKEN_INVALID');
  }

  assert.equal(errorCode(() => replaceAssetTokens(
    `{{ASSET:${SECOND_ASSET_ID}}}`,
    assets,
  )), 'ASSET_TOKEN_UNKNOWN');

  assert.equal(errorCode(() => replaceAssetTokens(
    `{{ASSET:${ASSET_ID}}}`,
    { [ASSET_ID]: 'javascript:alert(1)' },
  )), 'ASSET_URL_INVALID');
});

test('asset maps reject inherited keys, prototype pollution, symbols, and getters without reading them', () => {
  const inherited = Object.create({ [ASSET_ID]: ASSET_URL });
  assert.equal(errorCode(() => replaceAssetTokens(`{{ASSET:${ASSET_ID}}}`, inherited)), 'ASSET_MAP_INVALID');

  const symbolMap = { [ASSET_ID]: ASSET_URL, [Symbol('hidden')]: ASSET_URL };
  assert.equal(errorCode(() => replaceAssetTokens(`{{ASSET:${ASSET_ID}}}`, symbolMap)), 'ASSET_MAP_INVALID');

  let reads = 0;
  const getterMap = {};
  Object.defineProperty(getterMap, ASSET_ID, {
    enumerable: true,
    get() {
      reads += 1;
      return ASSET_URL;
    },
  });
  assert.equal(errorCode(() => replaceAssetTokens(`{{ASSET:${ASSET_ID}}}`, getterMap)), 'ASSET_MAP_INVALID');
  assert.equal(reads, 0);
});

test('the slide CSP is deterministic, sorted, and restricted to the approved capabilities', () => {
  assert.equal(buildSlideCsp(policy), [
    "default-src 'none'",
    "connect-src 'none'",
    "script-src 'unsafe-inline'",
    "style-src 'unsafe-inline' https://styles-a.example https://styles-b.example",
    'img-src https://assets.example data: blob:',
    'media-src https://assets.example blob:',
    'font-src https://assets.example https://fonts.example',
    "form-action 'none'",
    "base-uri 'none'",
    "object-src 'none'",
    "worker-src 'none'",
    "child-src 'none'",
  ].join('; '));
});

test('the slide CSP rejects wildcard, non-HTTPS, path-bearing, credentialed, and injected origins', () => {
  const invalidOrigins = [
    '*',
    'http://assets.example',
    'javascript:alert(1)',
    'https://assets.example/path',
    'https://user:pass@assets.example',
    "https://assets.example; connect-src https://evil.example",
    'https://assets.example\nscript-src https://evil.example',
  ];

  for (const assetOrigin of invalidOrigins) {
    assert.equal(errorCode(() => buildSlideCsp({ ...policy, assetOrigin })), 'RESOURCE_POLICY_INVALID');
  }

  assert.equal(errorCode(() => buildSlideCsp({ ...policy, stylesheetOrigins: ['https://*.example'] })), 'RESOURCE_POLICY_INVALID');
  assert.equal(errorCode(() => buildSlideCsp({ ...policy, fontOrigins: ['http://fonts.example'] })), 'RESOURCE_POLICY_INVALID');
  assert.equal(errorCode(() => buildSlideCsp({ ...policy, extraDirective: 'connect-src *' })), 'RESOURCE_POLICY_INVALID');
});

test('the inert HTML parser boundary fails closed when its parser or sink is unavailable', () => {
  assert.equal(typeof createInertHtmlParser, 'function');
  assert.equal(typeof createSlideDocumentComposer, 'function');

  const input = {
    master: { html: '<main>{{SLIDE_CONTENT}}</main>', css: '' },
    slide: { html: '<section>Slide</section>', css: '', javascript: '' },
    assets: {}, policy, nonce: NONCE, previewMode: false,
  };
  assert.equal(errorCode(() => composeWithBrowserParser(input)), 'HTML_PARSER_UNAVAILABLE');
  assert.equal(errorCode(() => createSlideDocumentComposer(null)(input)), 'HTML_PARSER_UNAVAILABLE');

  for (const createInertDocument of [null, () => null, () => ({
    defaultView: {},
    createElement() {},
  })]) {
    const parse = createInertHtmlParser(createInertDocument);
    const compose = createSlideDocumentComposer(parse);
    assert.equal(errorCode(() => compose(input)), 'HTML_PARSER_UNAVAILABLE');
  }

  let sinkCalls = 0;
  const sinkDocument = {
    defaultView: null,
    createElement() {
      const root = parsedTreeWithAttributes();
      root.ownerDocument = sinkDocument;
      Object.defineProperty(root, 'innerHTML', {
        set(_value) {
          sinkCalls += 1;
          throw new TypeError('PRIVATE_TRUSTED_TYPES_CANARY');
        },
      });
      return root;
    },
  };
  const composeWithBrokenSink = createSlideDocumentComposer(
    createInertHtmlParser(() => sinkDocument),
  );
  assert.equal(errorCode(() => composeWithBrokenSink(input)), 'HTML_PARSER_UNAVAILABLE');
  assert.equal(sinkCalls, 1);

  let parsedMarkup = '';
  const validDocument = {
    defaultView: null,
    createElement() {
      const root = parsedTreeWithAttributes();
      root.ownerDocument = validDocument;
      Object.defineProperty(root, 'innerHTML', {
        set(value) {
          if (value === '<i></i>') {
            root.childNodes = nodeList([parsedElement({ name: 'i' })]);
            return;
          }
          parsedMarkup = value;
          root.childNodes = nodeList([parsedElement({ name: 'p' })]);
        },
      });
      return root;
    },
  };
  const parsed = createInertHtmlParser(() => validDocument)('<p>safe</p>');
  assert.equal(parsed.ownerDocument, validDocument);
  assert.equal(parsedMarkup, '<p>safe</p>');
});

test('author markup cannot collide with the inert parser availability probe', () => {
  const internalAttribute = 'data-msfg-studio-parser-root';
  const parsedAssignments = [];
  const inertDocument = {
    defaultView: null,
    createElement(name) {
      const root = parsedElement({ name });
      root.ownerDocument = inertDocument;
      Object.defineProperty(root, 'innerHTML', {
        set(value) {
          parsedAssignments.push(value);
          if (value === '<i></i>') {
            root.childNodes = nodeList([parsedElement({ name: 'i' })]);
            return;
          }
          const occurrences = [...value.matchAll(/data-msfg-studio-parser-root/gi)].length;
          root.childNodes = nodeList(occurrences
            ? [parsedElement({ attributes: Array.from({ length: occurrences }, () => internalAttribute) })]
            : []);
        },
      });
      return root;
    },
  };
  const parse = createInertHtmlParser(() => inertDocument);
  const authored = `<section ${internalAttribute}>Safe authored attribute</section>`;

  const parsed = parse(authored);

  assert.equal(parsed.ownerDocument, inertDocument);
  assert.deepEqual(parsedAssignments, ['<i></i>', authored]);
  assert.equal(parsed.childNodes.item(0).attributes.item(0).name, internalAttribute);
});

test('parsed-node inspection is recursive, case-insensitive, and ignores attribute values', () => {
  assert.equal(typeof createSlideDocumentComposer, 'function');
  const input = {
    master: { html: '<main>{{SLIDE_CONTENT}}</main>', css: '' },
    slide: { html: '<template><svg DATA-SLIDE-MOUNT></svg></template>', css: '', javascript: '' },
    assets: {}, policy, nonce: NONCE, previewMode: false,
  };
  const reservedTree = parsedElement({
    name: 'html',
    children: [parsedElement({
      attributes: [{ name: 'title', value: 'data-slide-mount' }],
      children: [parsedElement({ name: 'TEMPLATE', template: [parsedElement({
        name: 'svg',
        attributes: ['DATA-SLIDE-MOUNT'],
      })] })],
    })],
  });
  const compose = createSlideDocumentComposer(() => reservedTree);

  assert.equal(errorCode(() => compose(input)), 'RESERVED_MOUNT_ATTRIBUTE');

  const safeTree = parsedElement({
    name: 'html',
    children: [parsedElement({
      attributes: [{ name: 'title', value: 'data-slide-mount' }],
    })],
  });
  const safeDocument = createSlideDocumentComposer(() => safeTree)({
    ...input,
    slide: { html: '<p title="data-slide-mount">Safe value</p>', css: '', javascript: '' },
  });
  assert.match(safeDocument, /title="data-slide-mount">Safe value/);
});

test('composition has one mount and bootstrap in the exact Master CSS, slide CSS, HTML, runtime order', () => {
  const srcdoc = composeSlideDocument({
    master: baseMaster,
    slide: baseSlide,
    assets,
    policy,
    nonce: NONCE,
    previewMode: false,
  });

  assert.equal((srcdoc.match(/data-slide-mount/g) || []).length, 1);
  assert.equal((srcdoc.match(/sandbox-runtime-bootstrap/g) || []).length, 1);
  assert.equal((srcdoc.match(/<script>/g) || []).length, 1);
  assert.equal((srcdoc.match(/<\/script>/g) || []).length, 1);
  assert.match(srcdoc, /connect-src 'none'/);
  assert.match(srcdoc, /script-src 'unsafe-inline'/);
  assert.doesNotMatch(srcdoc, /frame-ancestors/);
  assert.doesNotMatch(srcdoc, /allow-same-origin/);
  assert.doesNotMatch(srcdoc, /\{\{ASSET:/);
  assert.match(srcdoc, new RegExp(ASSET_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

  const masterCss = srcdoc.indexOf('data-studio-master-css');
  const slideCss = srcdoc.indexOf('data-studio-slide-css');
  const mount = srcdoc.indexOf('data-slide-mount');
  const bootstrap = srcdoc.indexOf('sandbox-runtime-bootstrap');
  assert.ok(masterCss < slideCss);
  assert.ok(slideCss < mount);
  assert.ok(mount < bootstrap);
});

test('composition inserts slide HTML only at one literal Master mount token', () => {
  const before = '<header>{{SLIDE_CONTENT}}</header>';
  const srcdoc = composeSlideDocument({
    master: { html: before, css: '' },
    slide: { html: '<article>Only here</article>', css: '', javascript: '' },
    assets: {},
    policy,
    nonce: NONCE,
    previewMode: false,
  });
  assert.match(srcdoc, /<header><article>Only here<\/article><\/header>/);

  for (const masterHtml of [
    '<main>No token</main>',
    '{{SLIDE_CONTENT}}{{SLIDE_CONTENT}}',
    '{{slide_content}}',
  ]) {
    assert.equal(errorCode(() => composeSlideDocument({
      master: { html: masterHtml, css: '' },
      slide: { html: '', css: '', javascript: '' },
      assets: {},
      policy,
      nonce: NONCE,
      previewMode: false,
    })), 'MASTER_SLIDE_TOKEN_INVALID');
  }
});

test('authored Master and slide elements cannot claim the trusted mount attribute', () => {
  const authoredAttributes = [
    'data-slide-mount',
    'DATA-SLIDE-MOUNT',
    'data-slide-mount="owned"',
    "data-slide-mount='owned'",
    'data-slide-mount=owned',
    'DaTa-SlIdE-MoUnT = unquoted',
  ];

  for (const attribute of authoredAttributes) {
    const masterHtml = `<main ${attribute}>{{SLIDE_CONTENT}}</main>`;
    const masterSlideHtml = '<section>Slide</section>';
    const composeMaster = composerReportingReservedMount(masterHtml, masterSlideHtml);
    assert.equal(errorCode(() => composeMaster({
      master: { html: masterHtml, css: '' },
      slide: { html: masterSlideHtml, css: '', javascript: '' },
      assets: {},
      policy,
      nonce: NONCE,
      previewMode: false,
    })), 'RESERVED_MOUNT_ATTRIBUTE');

    const slideMasterHtml = '<main>{{SLIDE_CONTENT}}</main>';
    const slideHtml = `<svg><g ${attribute}></g></svg>`;
    const composeSlide = composerReportingReservedMount(slideMasterHtml, slideHtml);
    assert.equal(errorCode(() => composeSlide({
      master: { html: slideMasterHtml, css: '' },
      slide: { html: slideHtml, css: '', javascript: '' },
      assets: {},
      policy,
      nonce: NONCE,
      previewMode: false,
    })), 'RESERVED_MOUNT_ATTRIBUTE');
  }
});

test('mount reservation parses attributes without false positives in text, comments, raw text, or values', () => {
  const safeSlideHtml = [
    '<p>data-slide-mount is documentation text.</p>',
    '<p title="data-slide-mount">Attribute value</p>',
    '<p data-slide-mountish data-note=data-slide-mount>Unrelated attributes</p>',
    '<!-- <div data-slide-mount>commented example</div> -->',
    '<textarea><div data-slide-mount>textarea text</div></textarea>',
    '<style>.example::after{content:"<div data-slide-mount>"}</style>',
    '<pre>&lt;div data-slide-mount&gt;</pre>',
  ].join('');
  const srcdoc = composeSlideDocument({
    master: { html: '<main>{{SLIDE_CONTENT}}</main>', css: '' },
    slide: { html: safeSlideHtml, css: '', javascript: '' },
    assets: {},
    policy,
    nonce: NONCE,
    previewMode: false,
  });

  assert.match(srcdoc, /<body><div data-slide-mount><main>/);
  assert.match(srcdoc, /data-slide-mount is documentation text/);
  assert.match(srcdoc, /title="data-slide-mount"/);
});

test('bogus declarations cannot quote-mask a mount after their first closing angle', () => {
  const authoredFragments = [
    '<!not-a-declaration "><div data-slide-mount>\">',
    "<?processing-instruction '><section DATA-SLIDE-MOUNT='owned'>'>",
  ];

  for (const fragment of authoredFragments) {
    const masterHtml = `<main>${fragment}{{SLIDE_CONTENT}}</main>`;
    const masterSlideHtml = '<section>Slide</section>';
    const composeMaster = composerReportingReservedMount(masterHtml, masterSlideHtml);
    assert.equal(errorCode(() => composeMaster({
      master: { html: masterHtml, css: '' },
      slide: { html: masterSlideHtml, css: '', javascript: '' },
      assets: {},
      policy,
      nonce: NONCE,
      previewMode: false,
    })), 'RESERVED_MOUNT_ATTRIBUTE');

    const slideMasterHtml = '<main>{{SLIDE_CONTENT}}</main>';
    const composeSlide = composerReportingReservedMount(slideMasterHtml, fragment);
    assert.equal(errorCode(() => composeSlide({
      master: { html: slideMasterHtml, css: '' },
      slide: { html: fragment, css: '', javascript: '' },
      assets: {},
      policy,
      nonce: NONCE,
      previewMode: false,
    })), 'RESERVED_MOUNT_ATTRIBUTE');
  }
});

test('real comments and declaration text before the first closing angle do not claim the mount', () => {
  const safeFragments = [
    '<!-- "><div data-slide-mount>commented example</div>" -->',
    '<!not-a-declaration "<div data-slide-mount>">',
    '<?processing-instruction "<div data-slide-mount>">',
    '<!DOCTYPE html PUBLIC "<div data-slide-mount>">',
  ];

  for (const fragment of safeFragments) {
    const masterDocument = composeSlideDocument({
      master: { html: `<main>${fragment}{{SLIDE_CONTENT}}</main>`, css: '' },
      slide: { html: '<section>Slide</section>', css: '', javascript: '' },
      assets: {},
      policy,
      nonce: NONCE,
      previewMode: false,
    });
    const slideDocument = composeSlideDocument({
      master: { html: '<main>{{SLIDE_CONTENT}}</main>', css: '' },
      slide: { html: fragment, css: '', javascript: '' },
      assets: {},
      policy,
      nonce: NONCE,
      previewMode: false,
    });

    assert.match(masterDocument, /<body><div data-slide-mount><main>/);
    assert.match(slideDocument, /<body><div data-slide-mount><main>/);
  }
});

test('SVG and MathML CDATA keeps mount-looking markup inert but exposes later real elements', () => {
  const safeForeignCdata = [
    '<svg><![CDATA[marker > <g data-slide-mount>text</g><style>]]></svg>',
    '<math><![CDATA[marker > <mrow data-slide-mount>text</mrow><style>]]></math>',
    '<math><annotation-xml encoding="application/xml"><![CDATA[marker > <span data-slide-mount>text</span>]]></annotation-xml></math>',
  ];
  const authoredForeignMounts = [
    '<svg><![CDATA[marker > <style>]]><g data-slide-mount></g></style></svg>',
    '<math><![CDATA[marker > <style>]]><mrow data-slide-mount></mrow></style></math>',
    '<svg><![CDATA[text only]]></svg><div data-slide-mount></div>',
    '<math><![CDATA[text only]]></math><section DATA-SLIDE-MOUNT="owned"></section>',
  ];

  for (const fragment of safeForeignCdata) {
    const masterDocument = composeSlideDocument({
      master: { html: `<main>${fragment}{{SLIDE_CONTENT}}</main>`, css: '' },
      slide: { html: '<section>Slide</section>', css: '', javascript: '' },
      assets: {}, policy, nonce: NONCE, previewMode: false,
    });
    const slideDocument = composeSlideDocument({
      master: { html: '<main>{{SLIDE_CONTENT}}</main>', css: '' },
      slide: { html: fragment, css: '', javascript: '' },
      assets: {}, policy, nonce: NONCE, previewMode: false,
    });
    assert.match(masterDocument, /<body><div data-slide-mount><main>/);
    assert.match(slideDocument, /<body><div data-slide-mount><main>/);
  }

  for (const fragment of authoredForeignMounts) {
    const masterHtml = `<main>${fragment}{{SLIDE_CONTENT}}</main>`;
    const masterSlideHtml = '<section>Slide</section>';
    const composeMaster = composerReportingReservedMount(masterHtml, masterSlideHtml);
    assert.equal(errorCode(() => composeMaster({
      master: { html: masterHtml, css: '' },
      slide: { html: masterSlideHtml, css: '', javascript: '' },
      assets: {}, policy, nonce: NONCE, previewMode: false,
    })), 'RESERVED_MOUNT_ATTRIBUTE');

    const slideMasterHtml = '<main>{{SLIDE_CONTENT}}</main>';
    const composeSlide = composerReportingReservedMount(slideMasterHtml, fragment);
    assert.equal(errorCode(() => composeSlide({
      master: { html: slideMasterHtml, css: '' },
      slide: { html: fragment, css: '', javascript: '' },
      assets: {}, policy, nonce: NONCE, previewMode: false,
    })), 'RESERVED_MOUNT_ATTRIBUTE');
  }
});

test('foreign-content HTML integration points expose authored mount attributes', () => {
  const authoredIntegrationMounts = [
    '<svg><foreignObject><![CDATA[marker > <div data-slide-mount></div>]]></foreignObject></svg>',
    '<svg><desc><![CDATA[marker > <div data-slide-mount></div>]]></desc></svg>',
    '<svg><title><![CDATA[marker > <div data-slide-mount></div>]]></title></svg>',
    '<svg><title>prefix<![CDATA[marker > <div data-slide-mount></div>]]></title></svg>',
    ...['mi', 'mo', 'mn', 'ms', 'mtext'].map(tag => (
      `<math><${tag}><![CDATA[marker > <span data-slide-mount></span>]]></${tag}></math>`
    )),
    '<math><annotation-xml encoding="text/html"><![CDATA[marker > <span data-slide-mount></span>]]></annotation-xml></math>',
    '<math><annotation-xml encoding="APPLICATION/XHTML+XML"><![CDATA[marker > <span data-slide-mount></span>]]></annotation-xml></math>',
    '<math><annotation-xml encoding="text/html">prefix<![CDATA[marker > <span data-slide-mount></span>]]></annotation-xml></math>',
  ];

  for (const fragment of authoredIntegrationMounts) {
    const masterHtml = `<main>${fragment}{{SLIDE_CONTENT}}</main>`;
    const masterSlideHtml = '<section>Slide</section>';
    const composeMaster = composerReportingReservedMount(masterHtml, masterSlideHtml);
    assert.equal(errorCode(() => composeMaster({
      master: { html: masterHtml, css: '' },
      slide: { html: masterSlideHtml, css: '', javascript: '' },
      assets: {}, policy, nonce: NONCE, previewMode: false,
    })), 'RESERVED_MOUNT_ATTRIBUTE');

    const slideMasterHtml = '<main>{{SLIDE_CONTENT}}</main>';
    const composeSlide = composerReportingReservedMount(slideMasterHtml, fragment);
    assert.equal(errorCode(() => composeSlide({
      master: { html: slideMasterHtml, css: '' },
      slide: { html: fragment, css: '', javascript: '' },
      assets: {}, policy, nonce: NONCE, previewMode: false,
    })), 'RESERVED_MOUNT_ATTRIBUTE');
  }
});

test('an asset resolved before the Master mount cannot shift the slide insertion point', () => {
  const srcdoc = composeSlideDocument({
    master: {
      html: `<header><img src="{{ASSET:${ASSET_ID}}}"></header><main>{{SLIDE_CONTENT}}</main>`,
      css: '',
    },
    slide: { html: '<article>Mounted slide</article>', css: '', javascript: '' },
    assets,
    policy,
    nonce: NONCE,
    previewMode: false,
  });

  assert.match(srcdoc, new RegExp(`<header><img src="${ASSET_URL}"></header><main><article>Mounted slide</article></main>`));
});

test('composition rejects external script elements and keeps style text from breaking its element', () => {
  assert.equal(errorCode(() => composeSlideDocument({
    master: baseMaster,
    slide: { ...baseSlide, html: '<script src="https://evil.example/x.js"></script>' },
    assets,
    policy,
    nonce: NONCE,
    previewMode: false,
  })), 'HTML_SCRIPT_FORBIDDEN');

  const srcdoc = composeSlideDocument({
    master: { ...baseMaster, css: 'body{--payload:"</style><script src=https://evil.example>"}' },
    slide: { ...baseSlide, css: '.x{--payload:"</style><script>evil()</script>"}' },
    assets,
    policy,
    nonce: NONCE,
    previewMode: false,
  });
  assert.equal((srcdoc.match(/<script>/g) || []).length, 1);
  assert.equal((srcdoc.match(/<\/style>/g) || []).length, 2);
  assert.doesNotMatch(srcdoc, /<script src=/i);
});

test('composition validates asset URLs against the exact configured asset origin', () => {
  assert.equal(errorCode(() => composeSlideDocument({
    master: baseMaster,
    slide: baseSlide,
    assets: { [ASSET_ID]: ASSET_URL.replace('assets.example', 'other.example') },
    policy,
    nonce: NONCE,
    previewMode: false,
  })), 'ASSET_ORIGIN_MISMATCH');
});

test('composition never serializes private or editor-only fields from caller records', () => {
  let privateReads = 0;
  const master = { ...baseMaster, privateNotes: 'PRIVATE_MASTER_CANARY' };
  const slide = {
    ...baseSlide,
    speakerNotes: 'PRIVATE_SLIDE_CANARY',
    editorState: { source: 'PRIVATE_EDITOR_CANARY' },
  };
  Object.defineProperty(slide, 'owner', {
    enumerable: true,
    get() {
      privateReads += 1;
      return 'PRIVATE_OWNER_CANARY';
    },
  });

  const srcdoc = composeSlideDocument({
    master,
    slide,
    assets,
    policy,
    nonce: NONCE,
    previewMode: false,
  });
  assert.doesNotMatch(srcdoc, /PRIVATE_MASTER_CANARY|PRIVATE_SLIDE_CANARY|PRIVATE_EDITOR_CANARY|PRIVATE_OWNER_CANARY/);
  assert.equal(privateReads, 0);
});

test('script-safe serialization preserves adversarial slide source without creating markup or interpolation', () => {
  const adversarial = '</script><img src=x onerror=evil()><!--\u2028\u2029${globalThis.evil=true}">';
  const srcdoc = composeSlideDocument({
    master: baseMaster,
    slide: {
      ...baseSlide,
      javascript: `window.adversarial = ${JSON.stringify(adversarial)};`,
    },
    assets,
    policy,
    nonce: NONCE,
    previewMode: false,
  });

  assert.equal((srcdoc.match(/<\/script/gi) || []).length, 1);
  assert.doesNotMatch(srcdoc, /<img src=x|<!--|\u2028|\u2029|\$\{/);

  const runtime = runComposedRuntime(srcdoc);
  assert.equal(runtime.window.adversarial, adversarial);
  assert.equal(runtime.window.evil, undefined);
  assert.deepEqual(runtime.posted.at(-1), {
    message: { v: 1, nonce: NONCE, type: 'runtime-ready', payload: {} },
    targetOrigin: '*',
  });
});

test('the classic runtime preserves the non-module script semantics accepted by server validation', () => {
  const srcdoc = composeSlideDocument({
    master: baseMaster,
    slide: {
      ...baseSlide,
      javascript: 'with ({ value: 7 }) { window.nonStrictResult = value; }',
    },
    assets,
    policy,
    nonce: NONCE,
    previewMode: false,
  });
  const runtime = runComposedRuntime(srcdoc);

  assert.equal(runtime.window.nonStrictResult, 7);
  assert.deepEqual(runtime.posted.at(-1).message, {
    v: 1,
    nonce: NONCE,
    type: 'runtime-ready',
    payload: {},
  });
});

test('authored strict-mode directives remain at the start of the classic slide script', () => {
  const srcdoc = composeSlideDocument({
    master: baseMaster,
    slide: {
      ...baseSlide,
      javascript: '"use strict"; accidentalGlobal = 7;',
    },
    assets,
    policy,
    nonce: NONCE,
    previewMode: false,
  });
  const runtime = runComposedRuntime(srcdoc);

  assert.equal(runtime.appendedScripts[0].startsWith('"use strict";'), true);
  assert.equal(runtime.window.accidentalGlobal, undefined);
  assert.deepEqual(runtime.posted.map(entry => entry.message.type), ['runtime-error']);
  assert.deepEqual(runtime.posted[0].message.payload, { code: 'SLIDE_RUNTIME_ERROR' });
});

test('a hashbang remains the first characters of authored classic slide source', () => {
  const source = '#!/usr/bin/env node\nwindow.hashbangRan = true;';
  const srcdoc = composeSlideDocument({
    master: baseMaster,
    slide: { ...baseSlide, javascript: source },
    assets,
    policy,
    nonce: NONCE,
    previewMode: false,
  });
  const runtime = runComposedRuntime(srcdoc);

  assert.equal(runtime.appendedScripts[0].startsWith(source), true);
  assert.equal(runtime.window.hashbangRan, true);
  assert.deepEqual(runtime.posted.map(entry => entry.message.type), ['runtime-ready']);
});

test('an actual synchronous preview throw reports its bounded location and never announces ready', () => {
  const srcdoc = composeSlideDocument({
    master: baseMaster,
    slide: {
      ...baseSlide,
      javascript: 'window.beforeThrow = true;\nthrow new Error("PRIVATE_SYNC_THROW");',
    },
    assets,
    policy,
    nonce: NONCE,
    previewMode: true,
  });
  const runtime = runComposedRuntime(srcdoc);

  assert.equal(runtime.window.beforeThrow, true);
  assert.deepEqual(runtime.posted.map(entry => entry.message.type), ['runtime-error']);
  assert.deepEqual(runtime.posted[0].message.payload, {
    code: 'SLIDE_RUNTIME_ERROR',
    line: 2,
    column: 7,
  });
  assert.doesNotMatch(JSON.stringify(runtime.posted), /PRIVATE_SYNC_THROW/);
});

test('the bootstrap accepts messages only from parent with exact version and nonce and dispatches fixed events', () => {
  const srcdoc = composeSlideDocument({
    master: baseMaster,
    slide: {
      ...baseSlide,
      javascript: [
        "window.received = [];",
        "window.addEventListener('msfg:animation-forward', event => window.received.push(event.detail));",
        "window.msfgRuntime.emit('animation-state', { current: 1, total: 3, playing: false });",
      ].join('\n'),
    },
    assets,
    policy,
    nonce: NONCE,
    previewMode: false,
  });
  const runtime = runComposedRuntime(srcdoc);

  assert.deepEqual(runtime.posted.slice(0, 2), [{
    message: {
      v: 1,
      nonce: NONCE,
      type: 'animation-state',
      payload: { current: 1, total: 3, playing: false },
    },
    targetOrigin: '*',
  }, {
    message: { v: 1, nonce: NONCE, type: 'runtime-ready', payload: {} },
    targetOrigin: '*',
  }]);

  const good = { v: 1, nonce: NONCE, type: 'animation-forward', payload: {} };
  runtime.dispatchMessage(good, {});
  runtime.dispatchMessage({ ...good, nonce: 'wrong-nonce-value' });
  runtime.dispatchMessage({ ...good, v: 2 });
  runtime.dispatchMessage({ ...good, type: 'set-html', payload: '<b>x</b>' });
  assert.deepEqual(JSON.parse(JSON.stringify(runtime.window.received)), []);

  runtime.dispatchMessage(good);
  assert.deepEqual(JSON.parse(JSON.stringify(runtime.window.received)), [{}]);
  assert.equal(runtime.dispatched.some(event => event.type === 'msfg:animation-forward'), true);
});

test('the bootstrap rejects malformed outbound calls and redacts public runtime errors', () => {
  const privateCanary = 'PRIVATE_RUNTIME_SOURCE_AND_STACK_CANARY';
  const srcdoc = composeSlideDocument({
    master: baseMaster,
    slide: {
      ...baseSlide,
      javascript: [
        "window.invalidEmitAccepted = window.msfgRuntime.emit('set-html', { html: '<b>x</b>' });",
        `throw new Error(${JSON.stringify(privateCanary)});`,
      ].join('\n'),
    },
    assets,
    policy,
    nonce: NONCE,
    previewMode: false,
  });
  const runtime = runComposedRuntime(srcdoc);

  assert.equal(runtime.window.invalidEmitAccepted, false);
  const messages = runtime.posted.map(entry => entry.message);
  assert.deepEqual(messages, [{
    v: 1,
    nonce: NONCE,
    type: 'runtime-error',
    payload: { code: 'SLIDE_RUNTIME_ERROR' },
  }]);
  assert.doesNotMatch(JSON.stringify(runtime.posted), new RegExp(privateCanary));

  const event = runtime.dispatchWindowEvent('unhandledrejection', {
    reason: new Error(privateCanary),
  });
  assert.equal(event.defaultPrevented, true);
  assert.deepEqual(runtime.posted.at(-1).message.payload, { code: 'SLIDE_RUNTIME_ERROR' });
});

test('preview errors may add only bounded line and column while public errors never expose location or source', () => {
  const publicRuntime = runComposedRuntime(composeSlideDocument({
    master: baseMaster,
    slide: baseSlide,
    assets,
    policy,
    nonce: NONCE,
    previewMode: false,
  }));
  publicRuntime.dispatchWindowEvent('error', {
    message: 'PRIVATE_PUBLIC_MESSAGE',
    filename: 'PRIVATE_PUBLIC_SOURCE.js',
    lineno: 41,
    colno: 9,
  });
  assert.deepEqual(publicRuntime.posted.at(-1).message.payload, { code: 'SLIDE_RUNTIME_ERROR' });

  const previewRuntime = runComposedRuntime(composeSlideDocument({
    master: baseMaster,
    slide: baseSlide,
    assets,
    policy,
    nonce: NONCE,
    previewMode: true,
  }));
  previewRuntime.dispatchWindowEvent('error', {
    message: 'PRIVATE_PREVIEW_MESSAGE',
    filename: 'PRIVATE_PREVIEW_SOURCE.js',
    lineno: 41,
    colno: 9,
  });
  assert.deepEqual(previewRuntime.posted.at(-1).message.payload, {
    code: 'SLIDE_RUNTIME_ERROR',
    line: 41,
    column: 9,
  });
  assert.doesNotMatch(JSON.stringify(previewRuntime.posted), /PRIVATE_PREVIEW_MESSAGE|PRIVATE_PREVIEW_SOURCE/);
});
