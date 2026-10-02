async (page) => {
  const base = 'http://127.0.0.1:4196/reverse-mortgages/deck/';
  const out = 'reverse-mortgages/deck/output/playwright'; // relative to the repository root, where the session is opened
  await page.context().route('**/*', route => route.continue());
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if(r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(`${base}?preview`);
  await page.evaluate(() => document.fonts.ready);
  const ids = await page.evaluate(async () => (await import('./content/slides.js')).SLIDES.map(s=>s.id));
  const fit = [];
  for (const size of [{width:1920,height:1080},{width:1280,height:720},{width:1440,height:900},{width:1024,height:768}]) {
    await page.setViewportSize(size);
    for (const [i,id] of ids.entries()) {
      await page.evaluate(id => {location.hash=id;},id);
      await page.waitForTimeout(70);
      const result = await page.evaluate(async () => {
        const {inspectComposedSurface}=await import('./tests/fit-browser-audit.js');
        const slide=document.querySelector('.slide.is-active');
        const result=inspectComposedSurface({shell:document.querySelector('.slide-fit-shell'),surface:slide});
        const footer=slide.querySelector('.source-footer').getBoundingClientRect();
        const disclaimer=slide.querySelector('.source-disclaimer')?.getBoundingClientRect();
        const floor=disclaimer?.top ?? footer.top;
        const selectors='.source-header,.source-content,.source-cover';
        const overlaps=[...slide.querySelectorAll(selectors)].filter(el=>el.getBoundingClientRect().bottom>floor+2 && !el.hidden).map(el=>el.className);
        const sourceNumber=Number(slide.dataset.sourceNumber);
        const {SLIDES}=await import('./content/slides.js');
        const blocks=[...slide.querySelectorAll('[data-source-block]')];
        const data=SLIDES.find(s=>s.sourceNumber===sourceNumber);
        const textIssues=data.visibleBlocks.flatMap(i=>{
          const text=data.sourceBlocks[i];
          const matches=blocks.filter(el=>Number(el.dataset.sourceBlock)===i);
          return matches.length!==1||matches[0].textContent!==text?[i]:[];
        });
        return {...result,overlaps,textIssues};
      });
      fit.push({id,size,result});
      if(size.width===1920) await page.screenshot({path:`${out}/${String(i+1).padStart(2,'0')}-${id}.png`});
    }
  }
  await page.setViewportSize({width:1280,height:720});
  const modalIds=await page.evaluate(async()=>Object.keys((await import('./content/modals.js')).MODALS));
  const modals=[];
  for(const id of modalIds) {
    await page.evaluate(async id=>(await import('./js/modal.js')).openModal(id),id);
    await page.waitForTimeout(240);
    const result=await page.evaluate(async()=>{
      const {inspectComposedSurface}=await import('./tests/fit-browser-audit.js');
      return inspectComposedSurface({shell:document.querySelector('.modal-shell'),surface:document.querySelector('.modal')});
    });
    modals.push({id,result});
    if(id==='heirs') await page.screenshot({path:`${out}/heirs-popout.png`});
    await page.keyboard.press('Escape');
  }
  const issues=fit.filter(({result:r})=>!r.insideViewport||!r.surfaceFitsLayout||r.clippedContent.length||r.overlaps.length||r.textIssues.length);
  const modalIssues=modals.filter(({result:r})=>!r.insideViewport||!r.surfaceFitsLayout||r.clippedContent.length);
  return {slides:ids.length,checks:fit.length,popouts:modals.length,errors,issues,modalIssues};
}
