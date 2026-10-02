async (page) => {
  const base = page.url().replace(/[?#].*$/, '');
  await page.goto(`${base}?plan-check#five-step-plan`);
  await page.reload();
  const count = () => page.locator('#slide-five-step-plan .plan-step.is-in').count();
  const labels = ['Review','Choose','Prepare','Shop','Close'];
  if(await count()!==0) throw new Error('Plan must wait for advance');
  for(let i=0;i<5;i++) {
    await page.keyboard.press('ArrowRight');
    if(await count()!==i+1) throw new Error('Incorrect reveal count');
    if(await page.locator('.plan-detail h3').textContent()!==labels[i]) throw new Error('Incorrect detail');
    if(await page.locator('.plan-detail p').textContent() === '') throw new Error('Missing detail');
  }
  await page.keyboard.press('ArrowLeft');
  if(await page.locator('.plan-detail h3').textContent()!=='Shop') throw new Error('Back did not restore detail');
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowRight');
  if(!page.url().endsWith('#wrap')) throw new Error('Next slide not reached');
  await page.goto(`${base}?preview&plan-check#five-step-plan`);
  if(await count()!==5) throw new Error('Preview should show all steps');
  if(await page.locator('.plan-detail h3').textContent()!=='Close') throw new Error('Preview detail missing');
  return {status:'pass',steps:5,reverse:true,preview:true};
}
