import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SLIDES, SOURCE_APPENDIX } from '../content/slides.js';
import { LINKS } from '../content/presenters.js';
const source=JSON.parse(readFileSync(new URL('../content/source-transcript.json',import.meta.url),'utf8'));
const slide=n=>SLIDES.find(s=>s.sourceNumber===n);
const visible=n=>slide(n).visibleBlocks.map(i=>slide(n).sourceBlocks[i]).join('\n');
test('Seth requested sequence and removals, with unchanged source text elsewhere',()=>{
 assert.deepEqual(SLIDES.map(s=>s.sourceNumber),[1,3,2,4,5,6,7,8,9,10,11,12,13,14,16,17,18,19,20,21]);
 for(const [index,s] of SLIDES.entries()){
  assert.equal(s.displayNumber,index+1);
  const c=s.sourceLayout,used=[0];
  for(const key of ['lead','rest','after','arrows','equation','stat'])used.push(...c[key]||[]);
  for(const key of ['groups','callouts'])used.push(...(c[key]||[]).flat());
  for(const key of ['bullet','disclaimer','humor','footer'])if(c[key]!==undefined)used.push(c[key]);
  assert.deepEqual(used.sort((a,b)=>a-b),s.visibleBlocks);
  assert.equal(new Set(used).size,used.length);
  if(s.sourceNumber===2)continue;
  for(const i of used){
   if((s.sourceNumber===5&&i===1)||(s.sourceNumber===19&&i===2)||(s.sourceNumber===8&&i===7)||(s.sourceNumber===18&&i===15)||(s.sourceNumber===20&&i===1))continue;
   assert.equal(s.sourceBlocks[i],source[s.sourceNumber-1].blocks[i].replaceAll('msfg.us','www.msfg.us'));
  }
 }
 for(const n of [4,6,9,11,14,18])assert.doesNotMatch(visible(n),/A little perspective/i);
 assert.doesNotMatch(visible(1),/25–30/);
 assert.doesNotMatch(visible(3),/Important distinction|2026 HECM LIMIT|1,249,125/);
 assert.doesNotMatch(visible(4),/counseling/i);
 assert.doesNotMatch(visible(5),/principal limit/i);
 assert.doesNotMatch(visible(8),/approved/);
 assert.doesNotMatch(visible(10),/Planning point/i);
 assert.doesNotMatch(visible(21),/FARGO|BISMARCK|\bND\b/);
 assert.ok(visible(18).includes('Pay required liens/debts and begin receiving funds if requested'));
 assert.ok(visible(20).includes('Then decide whether a home equity conversion mortgage should be part of the solution.'));
});
test('requested fly-ins are manual and examples follow groups',()=>{
 for(const n of [2,4,7,8,9,13,16,18,19])assert.equal(slide(n).manualBuild,true);
 for(const n of [7,8,9,13])assert.equal(slide(n).sourceLayout.calloutBuild,true);
 for(const n of [18,19])assert.equal(slide(n).sourceLayout.afterBuild,true);
 assert.equal(slide(4).sourceLayout.groups.length,3);
 assert.equal(slide(13).sourceLayout.callouts.length,2);
 assert.equal(slide(16).sourceLayout.groups.length,5);
 assert.equal(slide(19).sourceLayout.after.length,5);
});
test('original appendix and untouched slides remain available',()=>{
 assert.deepEqual(SOURCE_APPENDIX,source[21]);
 for(const n of [12,17])assert.deepEqual(slide(n).sourceBlocks,source[n-1].blocks.map(t=>t.replaceAll('msfg.us','www.msfg.us')));
 assert.match(LINKS.bookingUrl,/^https:\/\/info.msfgmortgage.com\/widget\/booking\//);
});

test('Seth second review wording and reveal sequence',()=>{
 assert.match(visible(2),/all property taxes, homeowner's insurance, HOA and maintenance are kept current/);
 assert.match(visible(2),/can be refinanced into the heir's names/);
 assert.match(visible(5),/Age of Youngest Borrower or Eligible Non-Borrowing Spouse/);
 assert.equal(slide(6).manualBuild,true);
 assert.doesNotMatch(visible(7),/A little perspective/i);
 assert.equal(slide(9).sourceLayout.lead,undefined);
 assert.equal(slide(10).sourceLayout.calloutBuild,true);
 assert.equal(slide(10).sourceLayout.afterBuild,true);
 for(const n of [13,17])assert.doesNotMatch(visible(n),/example/i);
 assert.match(visible(19),/2. What cash-flow concern am I trying to solve/);
});
