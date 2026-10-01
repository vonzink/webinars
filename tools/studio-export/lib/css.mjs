/* CSS rewrites needed by the Webinar Studio content policy.
   Studio rejects a backslash anywhere in a declaration value and any url() that
   is not an asset token or an allowed https origin, so string escapes become
   literal characters and local url() paths become local asset tokens.
   Comments and everything else pass through untouched. */

const HEX = /[0-9a-fA-F]/;

function decodeString(body, quote) {
  let out = '';
  for (let i = 0; i < body.length; i += 1) {
    const char = body[i];
    if (char !== '\\') { out += char; continue; }
    let hex = '';
    let j = i + 1;
    while (j < body.length && hex.length < 6 && HEX.test(body[j])) { hex += body[j]; j += 1; }
    if (hex) {
      if (/\s/.test(body[j] || '')) j += 1;        // one whitespace terminates the escape
      const decoded = String.fromCodePoint(parseInt(hex, 16));
      /* A decoded quote or backslash would need escaping again; keep the
         original so the policy check reports it instead of silently changing it. */
      out += decoded === quote || decoded === '\\' || decoded === '\n' ? body.slice(i, j) : decoded;
      i = j - 1;
      continue;
    }
    const next = body[i + 1];
    if (next === undefined || next === '\n' || next === quote || next === '\\') { out += char; continue; }
    out += next;
    i += 1;
  }
  return out;
}

/* Walk the stylesheet once, handing strings and url() bodies to the callbacks. */
function scan(css, { onString = (raw) => raw, onUrl = (raw) => raw }) {
  let out = '';
  let i = 0;
  while (i < css.length) {
    if (css.startsWith('/*', i)) {
      const end = css.indexOf('*/', i + 2);
      const stop = end < 0 ? css.length : end + 2;
      out += css.slice(i, stop);
      i = stop;
      continue;
    }
    const char = css[i];
    if (char === '"' || char === "'") {
      let j = i + 1;
      while (j < css.length && css[j] !== char && css[j] !== '\n') j += css[j] === '\\' ? 2 : 1;
      out += char + onString(css.slice(i + 1, j), char) + (css[j] === char ? char : '');
      i = css[j] === char ? j + 1 : j;
      continue;
    }
    if (/^url\(/i.test(css.slice(i, i + 4)) && !/[a-zA-Z0-9_-]/.test(css[i - 1] || '')) {
      const end = css.indexOf(')', i + 4);
      if (end > 0) {
        out += `url(${onUrl(css.slice(i + 4, end))})`;
        i = end + 1;
        continue;
      }
    }
    out += char;
    i += 1;
  }
  return out;
}

export function decodeCssStringEscapes(css) {
  return scan(css, { onString: decodeString });
}

/* resolve(path) returns the replacement for a local path, or null to keep it. */
export function rewriteCssUrls(css, resolve) {
  return scan(css, {
    onUrl(raw) {
      const trimmed = raw.trim();
      const quote = trimmed[0] === '"' || trimmed[0] === "'" ? trimmed[0] : '';
      const value = quote ? trimmed.slice(1, trimmed.endsWith(quote) ? -1 : undefined) : trimmed;
      if (!value || /^(?:[a-z][a-z0-9+.-]*:|#|\{\{)/i.test(value)) return raw;
      const replacement = resolve(value);
      return replacement == null ? raw : replacement;
    },
  });
}
