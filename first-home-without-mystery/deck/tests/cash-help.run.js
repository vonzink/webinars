async (page) => {
  const base = 'http://127.0.0.1:4199/?v=cash-help-test#cash-ingredients';
  const check = (ok, message) => { if (!ok) throw new Error(message); };
  const results = [];
  for (const viewport of [{width:1600,height:1000},{width:480,height:800},{width:800,height:480}]) {
    await page.setViewportSize(viewport);
    await page.goto(base);
    await page.reload();
    await page.locator('.cash-help-trigger').click();
    await page.waitForTimeout(250);
    let height;
    for (const label of ['Seller concessions', 'Down payment assistance', 'Gift funds']) {
      await page.getByRole('tab', {name:label,exact:true}).click();
      check(await page.getByRole('tabpanel').count() === 1, 'Only one panel should be accessible');
      const geometry = await page.evaluate(async () => {
        const {inspectComposedSurface, assertComposedSurface} = await import('./tests/fit-browser-audit.js');
        const shell=document.querySelector('#modal-root .modal-shell'), surface=shell.querySelector('.modal');
        assertComposedSurface(inspectComposedSurface({shell,surface}), 'Cash help');
        const r=shell.getBoundingClientRect();
        return {height:r.height, fits:r.left>=-1 && r.top>=-1 && r.right<=innerWidth+1 && r.bottom<=innerHeight+1};
      });
      check(geometry.fits, 'Popup must fit viewport');
      if (height) check(Math.abs(height-geometry.height)<1, 'Tab switching must keep popup size stable');
      height=geometry.height;
    }
    await page.getByRole('tab',{name:'Seller concessions',exact:true}).focus();
    await page.keyboard.press('ArrowRight');
    check(await page.getByRole('tab',{name:'Down payment assistance',exact:true}).getAttribute('aria-selected') === 'true','Arrow keys select tabs');
    await page.keyboard.press('End');
    check(await page.getByRole('tab',{name:'Gift funds',exact:true}).getAttribute('aria-selected') === 'true','End selects last tab');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.activeElement?.classList.contains('cash-help-trigger'));
    await page.locator('.cash-help-trigger').click();
    check(await page.getByRole('tab',{name:'Seller concessions',exact:true}).getAttribute('aria-selected') === 'true','Reopening resets tab');
    results.push(viewport);
  }
  return {status:'pass',viewports:results};
}
