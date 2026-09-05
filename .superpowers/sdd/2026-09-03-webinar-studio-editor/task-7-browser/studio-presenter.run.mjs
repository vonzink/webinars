/* Task 7 real-browser check for the authenticated presenter tab.
   Build the harness first: DASHBOARD_ROOT=<dashboard checkout> ./build-harness.sh
   Then: node studio-presenter.run.mjs   (needs `playwright` installed where node can resolve it)
   The harness runs the real Studio modules with in-memory ServerAPI fixtures for
   webinars, notes, and presenter settings, plus a recording preview factory. */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
const H = process.env.STUDIO_HARNESS_DIR || new URL('./harness', import.meta.url).pathname;
const PORT = 4193;
const FAMILY = '11111111-1111-4111-8111-111111111111';
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', H], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 1200));
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? '  ' + detail : ''}`); };
const browser = await chromium.launch({ headless: true });
const harnessOnly = url => /favicon\.ico$/.test(url) || url.startsWith('https://assets.example/') || url.startsWith('https://msfgmortgage.com/');
async function freshPage(viewport) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('requestfailed', r => { if (!harnessOnly(r.url())) errors.push(`request failed ${r.url()}`); });
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto(`http://127.0.0.1:${PORT}/studio.html`);
  await page.waitForFunction(() => window.WebinarStudio && !document.getElementById('webinarStudioLauncher').disabled);
  await page.evaluate(() => window.WebinarStudio.open());
  await page.waitForSelector('#wsSettingsPanel [data-presenter-panel]');
  return { page, errors };
}
const P = '#wsSettingsPanel ';
for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  const label = `${viewport.width}x${viewport.height}`;
  const { page, errors } = await freshPage(viewport);
  await page.waitForFunction(() => document.querySelector('#wsSettingsPanel [data-note-id="5"]'));
  check(`${label}: presenter tab is the default and renders position, notes, and clocks`,
    (await page.locator(P + '[data-position]').textContent()).trim() === '1 / 2'
    && (await page.locator(P + '[data-clock="total"]').textContent()).trim() === '02:30'
    && (await page.locator(P + '[data-note-id="5"] [data-note-body]').textContent()).includes('cash example'));
  // The coordinator posts the first candidate only after the host frame has
  // loaded (or its bounded load wait expires), so the boot is asynchronous.
  await page.waitForFunction(() => window.__previewBoots.length > 0, null, { timeout: 15000 }).catch(() => {});
  const boots = await page.evaluate(() => window.__previewBoots.map(b => b.slideHtml));
  check(`${label}: up-next preview booted once with the next slide`, boots.length === 1 && boots[0].includes('agenda'), JSON.stringify(boots));
  // Animation row directly above nav row, compact icon buttons.
  const order = await page.evaluate(() => {
    const anim = document.querySelector('#wsSettingsPanel [data-animation-row]');
    const nav = document.querySelector('#wsSettingsPanel [data-nav-row]');
    return anim && nav && anim.nextElementSibling === nav && [...anim.querySelectorAll('[data-animation]')].every(b => b.getBoundingClientRect().width <= 40);
  });
  check(`${label}: animation controls sit immediately above Back/Next/Start timer and are compact`, order);
  // Timer.
  await page.click(P + '[data-timer-start]');
  await page.waitForTimeout(1300);
  const slideClock = (await page.locator(P + '[data-clock="slide"]').textContent()).trim();
  check(`${label}: slide clock advances after Start timer`, /00:0[1-3]/.test(slideClock), slideClock);
  // Notes: add via the compact save icon, then edit inline, then delete with confirm.
  await page.fill(P + '[data-note-input]', 'Added in browser');
  await page.click(P + '[data-note-save]');
  await page.waitForFunction(() => document.querySelectorAll('#wsSettingsPanel [data-note-id]').length === 2);
  const saveBox = await page.locator(P + '[data-note-save]').boundingBox();
  const composerBox = await page.locator(P + '.ws-note-add').boundingBox();
  check(`${label}: note save icon sits upper-right of the composer`, saveBox && composerBox && saveBox.x + saveBox.width >= composerBox.x + composerBox.width - 12 && saveBox.y <= composerBox.y + 12);
  await page.click(P + '[data-note-id="5"] [data-note-edit]');
  await page.fill(P + '[data-note-id="5"] [data-note-editor]', 'Mention the cash example first');
  await page.click(P + '[data-note-id="5"] [data-note-editor-save]');
  await page.waitForFunction(() => document.querySelector('#wsSettingsPanel [data-note-id="5"] [data-note-body]')?.textContent.includes('first'));
  check(`${label}: inline edit updates the chosen note`, true);
  page.once('dialog', d => d.accept());
  const newId = await page.evaluate(() => [...document.querySelectorAll('#wsSettingsPanel [data-note-id]')].map(n => n.dataset.noteId).find(id => id !== '5'));
  await page.click(P + `[data-note-id="${newId}"] [data-note-delete]`);
  await page.waitForFunction(() => document.querySelectorAll('#wsSettingsPanel [data-note-id]').length === 1);
  check(`${label}: delete removes the note after confirmation`, true);
  // Keyboard: ArrowRight advances; typing in the note textarea does not.
  await page.click(P + '[data-nav="next"]');
  await page.waitForFunction(() => document.querySelector('#wsSettingsPanel [data-position]')?.textContent.trim() === '2 / 2');
  await page.click(P + '[data-nav="previous"]');
  await page.waitForFunction(() => document.querySelector('#wsSettingsPanel [data-position]')?.textContent.trim() === '1 / 2');
  await page.locator('#wsClose').focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(100);
  const afterKey = (await page.locator(P + '[data-position]').textContent()).trim();
  check(`${label}: ArrowRight shortcut advances the slide (audience offline = rehearsal)`, afterKey === '2 / 2', afterKey);
  await page.focus(P + '[data-note-input]');
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(100);
  check(`${label}: shortcuts are suppressed inside the note textarea`, (await page.locator(P + '[data-position]').textContent()).trim() === '2 / 2');
  // Shortcuts: capture, duplicate rejection, save once.
  await page.locator(P + '[data-shortcut-settings] summary').click();
  await page.click(P + '[data-shortcut-capture="toggleDrawing"]');
  await page.keyboard.press('m');
  check(`${label}: captured key renders on the action`, (await page.locator(P + '[data-shortcut-capture="toggleDrawing"]').textContent()).trim() === 'M');
  await page.click(P + '[data-shortcut-capture="toggleFullscreen"]');
  await page.keyboard.press('ArrowRight');
  check(`${label}: duplicate key is rejected with the owning action named`, /already assigned to Next slide/.test(await page.locator(P + '[data-shortcut-status]').textContent()));
  const putsBefore = await page.evaluate(() => window.__requests.filter(r => r.method === 'PUT' && r.path === '/webinar-presenter-settings/me').length);
  await page.click(P + '[data-shortcut-save]');
  await page.waitForFunction(() => /Saved/.test(document.querySelector('#wsSettingsPanel [data-shortcut-status]')?.textContent || ''));
  const putsAfter = await page.evaluate(() => window.__requests.filter(r => r.method === 'PUT' && r.path === '/webinar-presenter-settings/me').length);
  const savedM = await page.evaluate(() => window.__settings.shortcuts.toggleDrawing);
  check(`${label}: shortcuts saved exactly once for the account`, putsAfter === putsBefore + 1 && savedM === 'KeyM', `puts=${putsAfter - putsBefore} toggleDrawing=${savedM}`);
  // Nothing was published.
  const publishes = await page.evaluate(() => window.__requests.filter(r => r.method === 'PUT' && /\/webinars\/\d+\/(master|slides)/.test(r.path)).length);
  check(`${label}: no live-content writes happened`, publishes === 0);
  // Horizontal overflow check.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  check(`${label}: no horizontal page overflow`, !overflow);
  const header = await page.evaluate(() => {
    const heading = document.querySelector('#webinarStudioModal .ws-heading');
    const close = document.getElementById('wsClose');
    const h = heading.getBoundingClientRect(), c = close.getBoundingClientRect();
    return { headingFlex: getComputedStyle(heading).display === 'flex', closeRightOfHeading: c.left > h.left + 40 && Math.abs(c.top - h.top) < 60 };
  });
  check(`${label}: Studio header is a flex row with the close button to the right`, header.headingFlex && header.closeRightOfHeading, JSON.stringify(header));
  check(`${label}: no page errors`, errors.length === 0, errors.join(' | '));
  await page.screenshot({ path: new URL(`./presenter-${viewport.width}.png`, import.meta.url).pathname, fullPage: viewport.width < 500 });
  await page.close();
}
await browser.close(); server.kill();
const failed = results.filter(r => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
