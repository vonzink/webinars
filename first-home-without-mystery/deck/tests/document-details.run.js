async (page) => {
  const check=(ok,message)=>{if(!ok)throw new Error(message);};
  const results=[];
  for(const viewport of [{width:1600,height:1000},{width:480,height:800},{width:800,height:480}]) {
    await page.setViewportSize(viewport);
    await page.goto('http://127.0.0.1:4199/?v=document-details-test#document-story');
    await page.reload();
    for(const name of ['Income','Assets','Identity + property']) {
      const card=page.getByRole('button',{name:`${name} — open document details`,exact:true});
      await card.focus(); await page.keyboard.press('Enter');
      await page.waitForTimeout(250);
      const tabs=page.getByRole('tab');
      check(await tabs.count()===3,'Expected three tabs');
      for(let i=0;i<3;i++) {
        await tabs.nth(i).click();
        check(await page.getByRole('tabpanel').count()===1,'Only active panel is accessible');
        await page.evaluate(async()=>{
          const {inspectComposedSurface,assertComposedSurface}=await import('./tests/fit-browser-audit.js');
          const shell=document.querySelector('#modal-root .modal-shell');
          assertComposedSurface(inspectComposedSurface({shell,surface:shell.querySelector('.modal')}),'Document popup');
          const r=shell.getBoundingClientRect();
          if(r.top < -1 || r.left < -1 || r.right > innerWidth+1 || r.bottom > innerHeight+1) throw new Error('Popup outside viewport');
        });
      }
      await tabs.nth(2).focus(); await page.keyboard.press('ArrowRight');
      check(await tabs.nth(0).getAttribute('aria-selected')==='true','Keyboard tab wrap');
      await page.keyboard.press('Escape');
      await page.waitForFunction(()=>document.activeElement?.hasAttribute('data-document-modal'));
      check(await card.evaluate(el=>el===document.activeElement),'Restore focus to correct card');
      results.push(`${viewport.width}x${viewport.height}: ${name}`);
    }
  }
  return {status:'pass',checks:results};
}
