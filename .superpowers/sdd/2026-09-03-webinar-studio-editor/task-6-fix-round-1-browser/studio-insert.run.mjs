/* Task 6 Fix real-browser check for asset insertion.
   Build the harness first: DASHBOARD_ROOT=<dashboard checkout> ./build-harness.sh
   Then: node studio-insert.run.mjs   (needs `playwright` installed where node can resolve it)
   The harness runs the real Studio modules with deterministic ServerAPI fixtures and a
   recording preview factory; see harness-tail.html for exactly what is stubbed. */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const H = process.env.STUDIO_HARNESS_DIR || new URL('./harness', import.meta.url).pathname;
const PORT = 4190;
const FAMILY = '11111111-1111-4111-8111-111111111111';
const VERSION = '22222222-2222-4222-8222-222222222222';
const SECOND = '55555555-5555-4555-8555-555555555555';
const TOKEN = `{{ASSET:${VERSION}}}`;
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', H], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 1200));

const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? '  ' + detail : ''}`); };

const browser = await chromium.launch({ headless: true });
async function freshPage(viewport = { width: 1440, height: 900 }) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  // Harness-only resources: the favicon the harness never ships and the fixture
  // asset thumbnail at assets.example, which this sandbox cannot reach.
  // Also the configured preview host: the sandboxed iframe requests it, but the
  // harness has no network route to it. Its reachability is a Task 9 concern.
  const harnessOnly = url => /favicon\.ico$/.test(url) || url.startsWith('https://assets.example/') || url.startsWith('https://msfgmortgage.com/');
  page.on('pageerror', e => errors.push(e.message));
  page.on('requestfailed', r => { if (!harnessOnly(r.url())) errors.push(`request failed ${r.url()} ${r.failure()?.errorText}`); });
  page.on('response', r => { if (r.status() >= 400 && !harnessOnly(r.url())) errors.push(`${r.status()} ${r.url()}`); });
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto(`http://127.0.0.1:${PORT}/studio.html`);
  await page.waitForFunction(() => window.WebinarStudio && !document.getElementById('webinarStudioLauncher').disabled);
  await page.evaluate(() => window.WebinarStudio.open());
  await page.waitForSelector('#wsWorkspace .ws-workspace-intro');
  return { page, errors };
}
const tab = (page, name) => page.click(`#wsSettings [data-ws-tab="${name}"]`);
const codeSel = (field, slide = FAMILY) => `#wsSettingsPanel textarea[data-code-field="${field}"][data-slide-id="${slide}"]`;

// ---------- Scenario 1: slide HTML selection -> Assets -> Insert -> Code ----------
{
  const { page, errors } = await freshPage();
  await tab(page, 'code');
  await page.waitForSelector(codeSel('html'));
  const html = page.locator(codeSel('html'));
  await html.click();
  await html.evaluate(el => { el.focus(); el.setSelectionRange(16, 21); el.dispatchEvent(new Event('select', { bubbles: true })); });
  check('slide textarea has focus before Assets', await page.evaluate(() => document.activeElement?.dataset?.codeField === 'html'));
  await tab(page, 'assets');
  await page.waitForSelector('#wsSettingsPanel [data-insert-asset-reference]');
  check('focus moved off the editor (activeElement is the Assets tab)', await page.evaluate(() => document.activeElement?.dataset?.wsTab === 'assets'));
  const insert = page.locator('#wsSettingsPanel [data-insert-asset-reference]');
  check('Insert enabled with a logical target', !(await insert.isDisabled()), await insert.textContent());
  const bootsBefore = await page.evaluate(() => window.__previewBoots.length);
  const t0 = Date.now();
  await insert.click();
  const activity = await page.locator('#wsSettingsPanel [data-asset-activity]').textContent();
  check('activity message confirms insertion', /inserted/i.test(activity), activity.trim());
  await tab(page, 'code');
  await page.waitForSelector(codeSel('html'));
  const value = await page.locator(codeSel('html')).inputValue();
  check('exact canonical token replaced the selection', value === `<section>before ${TOKEN}</section>`, value);
  const sel = await page.locator(codeSel('html')).evaluate(el => ({ s: el.selectionStart, e: el.selectionEnd, focused: document.activeElement === el }));
  check('caret sits after the token and textarea is focused', sel.s === 16 + TOKEN.length && sel.e === sel.s && sel.focused, JSON.stringify(sel));
  const badge = await page.locator(`#wsSettingsPanel [data-dirty-surface="${FAMILY}"]`).textContent();
  check('slide shows Unsaved', badge === 'Unsaved', badge);
  await page.waitForFunction(n => window.__previewBoots.length > n, bootsBefore, { timeout: 3000 });
  const boots = await page.evaluate(() => window.__previewBoots);
  const last = boots.at(-1);
  const elapsed = Date.now() - t0;
  check('preview booted once with the inserted token after the 300 ms debounce', boots.length === bootsBefore + 1 && last.slideHtml.includes(TOKEN) && elapsed >= 280, `boots=${boots.length - bootsBefore} elapsed≈${elapsed}ms`);
  const status = await page.locator(`#wsSettingsPanel [data-preview-status][data-surface="${FAMILY}"]`).textContent();
  check('preview status reports ready', /ready/i.test(status), status);
  const factory = await page.evaluate(() => window.__previewFactoryCalls);
  check('coordinator built the canonical preview controller once with an exact origin and an attached un-sandboxed host frame',
    factory.length === 1 && factory[0].allowedOrigin === 'https://msfgmortgage.com' && factory[0].sandbox === null && factory[0].attached === true && factory[0].src.startsWith('https://msfgmortgage.com/'),
    JSON.stringify(factory));
  check('no page errors in scenario 1', errors.length === 0, errors.join(' | '));
  await page.screenshot({ path: new URL('./studio-after-insert.png', import.meta.url).pathname, fullPage: true });
  await page.close();
}

// ---------- Scenario 2: Master CSS via mouse selection ----------
{
  const { page, errors } = await freshPage();
  await tab(page, 'code');
  const css = page.locator('#wsSettingsPanel textarea[data-master-field="css"]');
  await css.click();
  await css.evaluate(el => { el.setSelectionRange(5, 8); });
  await css.dispatchEvent('mouseup');
  await tab(page, 'assets');
  const insert = page.locator('#wsSettingsPanel [data-insert-asset-reference]');
  await insert.waitFor();
  check('Master CSS target enables Insert', !(await insert.isDisabled()));
  await insert.click();
  await tab(page, 'code');
  const value = await page.locator('#wsSettingsPanel textarea[data-master-field="css"]').inputValue();
  check('Master CSS received the token in place of the selection', value === `main{${TOKEN}:8px}`, value);
  check('slide HTML untouched by the master insertion', (await page.locator(codeSel('html')).inputValue()) === '<section>before after</section>');
  check('no page errors in scenario 2', errors.length === 0, errors.join(' | '));
  await page.close();
}

// ---------- Scenario 3: no target -> disabled; click yields guidance, no mutation ----------
{
  const { page, errors } = await freshPage();
  await tab(page, 'assets');
  const insert = page.locator('#wsSettingsPanel [data-insert-asset-reference]');
  await insert.waitFor();
  check('Insert disabled without a chosen Code field', await insert.isDisabled(), await insert.textContent());
  check('disabled title explains the fix', /choose a code field/i.test(await insert.getAttribute('title') || ''), await insert.getAttribute('title'));
  await insert.click({ force: true });
  await tab(page, 'code');
  check('no token appeared anywhere', !(await page.locator('#wsSettingsPanel').innerHTML()).includes('{{ASSET:'));
  check('no page errors in scenario 3', errors.length === 0, errors.join(' | '));
  await page.close();
}

// ---------- Scenario 4: context change (switch webinar) invalidates ----------
{
  const { page, errors } = await freshPage();
  await tab(page, 'code');
  const html = page.locator(codeSel('html'));
  await html.click();
  await html.evaluate(el => { el.setSelectionRange(9, 15); });
  await html.press('ArrowRight'); await html.press('ArrowLeft'); // keyup captures
  await page.click('#wsDeckList [data-ws-webinar-id="13"]');
  await page.waitForFunction(() => document.querySelector('#wsStatus')?.textContent.includes('Live version') && document.querySelector('#wsDeckList [data-ws-webinar-id="13"]')?.getAttribute('aria-current') === 'true');
  await tab(page, 'assets');
  const insert = page.locator('#wsSettingsPanel [data-insert-asset-reference]');
  await insert.waitFor();
  check('switching webinars disables Insert', await insert.isDisabled());
  await insert.click({ force: true });
  await tab(page, 'code');
  const value = await page.locator(codeSel('html')).inputValue();
  check('new webinar slide HTML unchanged', value === '<section>before after</section>', value);
  check('no page errors in scenario 4', errors.length === 0, errors.join(' | '));
  await page.close();
}

// ---------- Scenario 5: deleting the bookmarked slide invalidates; keyboard-only path ----------
{
  const { page, errors } = await freshPage();
  await tab(page, 'code');
  await page.locator(`#wsSettingsPanel details[data-slide-id="${SECOND}"] summary`).click();
  const agenda = page.locator(codeSel('html', SECOND));
  await agenda.focus();
  await page.keyboard.press('End');
  page.once('dialog', d => d.accept());
  await page.locator(`#wsSettingsPanel [data-delete-slide][data-slide-id="${SECOND}"]`).click();
  await page.waitForFunction(id => !document.querySelector(`#wsSettingsPanel details[data-slide-id="${id}"]`), SECOND);
  await tab(page, 'assets');
  const insert = page.locator('#wsSettingsPanel [data-insert-asset-reference]');
  await insert.waitFor();
  check('deleting the bookmarked slide disables Insert', await insert.isDisabled());
  check('no page errors in scenario 5', errors.length === 0, errors.join(' | '));
  await page.close();
}

// ---------- Scenario 6: narrow viewport sanity ----------
{
  const { page, errors } = await freshPage({ width: 390, height: 844 });
  await tab(page, 'code');
  const html = page.locator(codeSel('html'));
  await html.click();
  await html.evaluate(el => { el.setSelectionRange(0, 0); });
  await tab(page, 'assets');
  const insert = page.locator('#wsSettingsPanel [data-insert-asset-reference]');
  await insert.waitFor();
  check('390px: Insert enabled after choosing a field', !(await insert.isDisabled()));
  await insert.click();
  await tab(page, 'code');
  const value = await page.locator(codeSel('html')).inputValue();
  check('390px: token inserted at caret 0', value === `${TOKEN}<section>before after</section>`, value);
  check('no page errors in scenario 6', errors.length === 0, errors.join(' | '));
  await page.close();
}

await browser.close(); server.kill();
const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
