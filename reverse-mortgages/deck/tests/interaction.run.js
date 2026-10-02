async page => {
 const base=await page.evaluate(()=>location.href.split('?')[0].split('#')[0]);
 const errors=[];
 await page.context().route('**/*',route=>route.continue());
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);
 const manual=await page.evaluate(async()=>(await import('./content/slides.js')).SLIDES.filter(s=>s.manualBuild).map(s=>({id:s.id,count:(s.sourceLayout.groups?.length||0)+(s.sourceLayout.calloutBuild?s.sourceLayout.callouts.length:0)+(s.sourceLayout.afterBuild?s.sourceLayout.after.length:0)})));
 for(const {id,count} of manual){
  await page.evaluate(id=>location.hash=id,id);await page.waitForTimeout(60);
  if(await page.locator('.slide.is-active .build.is-in').count()!==0)throw Error(id+' initial reveal');
  for(let n=1;n<=count;n++){await page.keyboard.press('ArrowRight');if(await page.locator('.slide.is-active .build.is-in').count()!==n)throw Error(id+' reveal '+n);}
  await page.keyboard.press('ArrowLeft');if(await page.locator('.slide.is-active .build.is-in').count()!==count-1)throw Error(id+' reverse');
  await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');if(page.url().endsWith('#'+id))throw Error(id+' transition');
 }
 await page.goto(base+'#retirement-bridge');
 const pending=page.waitForEvent('popup');await page.keyboard.press('p');const presenter=await pending;
 presenter.on('pageerror',e=>errors.push(e.message));await presenter.waitForLoadState();
 await presenter.locator('#p-notes').filter({hasText:'124%'}).waitFor();
 if(await presenter.locator('.p-appendix').isVisible())throw Error('Pacing guide shown away from the opening slide');
 await page.evaluate(()=>{location.hash='opening';});await presenter.locator('.p-appendix summary').waitFor({state:'visible'});
 await presenter.locator('.p-appendix summary').click();
 const appendix=await presenter.locator('#p-source-appendix p').allTextContents();
 const expected=await page.evaluate(async()=>(await import('./content/slides.js')).SOURCE_APPENDIX.blocks);
 if(JSON.stringify(appendix)!==JSON.stringify(expected))throw Error('Appendix content differs');
 await page.evaluate(()=>{location.hash='retirement-bridge';});await presenter.locator('#p-notes').filter({hasText:'124%'}).waitFor();
 await presenter.screenshot({path:'/Users/zacharyzink/MSFG/Webinars/output/reverse-seth-round2/presenter.png',fullPage:true});
 await presenter.locator('#p-next-btn').click();await page.waitForURL('**/#growing-balance');
 await presenter.locator('#p-prev').click();await page.waitForURL('**/#retirement-bridge');
 await presenter.close();
 if(errors.length)throw Error(JSON.stringify(errors));
 return {status:'pass',manualSlides:manual.length,presenter:true,appendixBlocks:appendix.length,errors};
}
