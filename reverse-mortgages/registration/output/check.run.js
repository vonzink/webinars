async page => {
 await page.waitForTimeout(2000);
 const checks=[];
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:1000});
  await page.waitForTimeout(3500);
  await page.frameLocator("iframe[data-form-id]").getByPlaceholder("Enter your first name").waitFor({state:"visible"});
  checks.push(await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,title:document.querySelector('h1').textContent.replace(/\s+/g,' ').trim(),cta:!!document.querySelector('a[href="#reverse-register"]'),iframe:document.querySelector('iframe').getAttribute('src'),images:[...document.querySelectorAll('img')].map(i=>({loaded:i.complete&&i.naturalWidth>0,width:i.clientWidth,height:i.clientHeight}))})));
  await page.screenshot({path:`/Users/zacharyzink/MSFG/Webinars/reverse-mortgages/registration/output/${width}.png`,fullPage:true});
 }
 const forms=[];for(const frame of page.frames().slice(1)){forms.push({url:frame.url(),text:(await frame.locator('body').innerText().catch(()=>'' )).slice(0,2000)});}
 return {checks,forms};
}
