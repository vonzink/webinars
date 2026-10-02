// Render the source deck with Seth-approved content and manual reveal order.
export function renderSourceSlide(el, d, { esc, portrait, logo, housing, bookingUrl }) {
  const c=d.sourceLayout;
  el.classList.add('source-slide',`source-${c.kind||'standard'}`);
  el.dataset.sourceNumber=d.sourceNumber;
  const text=(value)=>esc(value).replaceAll('www.msfg.us','<a href="https://www.msfg.us/" target="_blank" rel="noopener noreferrer">www.msfg.us</a>');
  const block=(i,tag='p',cls='')=>i===undefined?'':`<${tag} class="${cls}" data-source-block="${i}">${text(d.sourceBlocks[i])}</${tag}>`;
  const group=(indexes)=>indexes.map((i,j)=>block(i,j===0?'h3':'p',j===0?'source-label':'source-copy')).join('');
  const footer=()=>`<footer class="source-footer"><img src="${logo}" alt="Mountain State Financial Group">${block(c.footer,'p','source-footer-copy')}<span class="source-page">${d.displayNumber}</span><img class="source-housing" src="${housing}" alt="Equal Housing Lender"></footer>`;
  const notes=()=>`${block(c.humor,'p','source-humor')}${block(c.disclaimer,'p','source-disclaimer')}`;
  if(c.kind==='cover'){
    el.innerHTML=`<div class="source-cover"><div class="source-cover-copy">${block(2,'p','source-kicker')}${block(0,'h1','source-title')}${block(1,'p','source-cover-subtitle')}<div class="accent-bar"></div>${block(5,'h2','source-presenter')}${block(6)}${block(7)}${block(8)}</div><div class="source-cover-photo"><img src="${portrait}" alt="Seth Angell">${block(3,'span','source-equity-badge')}</div></div>${footer()}`;
    return;
  }
  let content='';
  if(c.lead)content+=`<div class="source-lead">${c.lead.map(i=>block(i)).join('')}</div>`;
  if(c.bullet!==undefined)content+=`<div class="source-bullets-row">${block(c.bullet,'p','source-bullets')}${c.stat?`<aside class="source-stat">${group(c.stat)}</aside>`:''}</div>`;
  if(c.groups){
    const cols=c.kind==='myths'?2:Math.min(c.groups.length,5);
    if(c.kind==='equity') content+=`<div class="source-equation-words">${[c.groups[0][0],c.equation[0],c.groups[1][0],c.equation[1],c.groups[2][0]].map(i=>block(i,'span')).join('')}</div>`;
    content+=`<div class="source-groups" style="--source-cols:${cols}">${c.groups.map((g,j)=>`<article class="source-group build">${group(c.kind==='equity'?g.slice(1):g)}${c.arrows&&j<c.arrows.length?block(c.arrows[j],'span','source-arrow'):''}</article>`).join('')}</div>`;
    if(c.equation && c.kind!=='equity')content+=`<div class="source-equation-words">${c.equation.map(i=>block(i,'span')).join('')}</div>`;
  }
  if(c.after && c.kind!=='bridge')content+=`<div class="source-after">${c.after.map(i=>block(i,'p',c.afterBuild?'build':'')).join('')}</div>`;
  if(c.callouts)content+=`<div class="source-callouts">${c.callouts.map(g=>`<aside class="source-callout${c.calloutBuild?' build':''}">${g.map((i,j)=>block(i,j===g.length-1?'p':'h3',j===0&&!c.untaggedCallouts?'source-callout-tag':'')).join('')}</aside>`).join('')}</div>`;
  if(c.kind==='bridge')content+=`<div class="source-after">${c.after.map(i=>block(i,'p',c.afterBuild?'build':'')).join('')}</div>`;
  if(c.kind==='contact' && bookingUrl) content+=`<aside class="source-booking"><h3>Choose a time to talk</h3><p>Schedule a consultation using our online calendar.</p><a class="source-booking-link" href="${esc(bookingUrl)}" target="_blank" rel="noopener noreferrer">Open appointment calendar ↗</a></aside>`;
  el.innerHTML=`<header class="source-header">${block(0,'h2','source-title')}<div class="accent-bar"></div></header><div class="source-content">${content}</div>${notes()}${footer()}`;
}
