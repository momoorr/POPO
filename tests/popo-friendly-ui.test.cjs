'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ui=require('../prototype/popo-friendly-ui.js');
const root=path.resolve(__dirname,'..');
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS',name);}
const local={protocol:'http:',hostname:'127.0.0.1'};
const publicPage={protocol:'https:',hostname:'momoorr.github.io'};
function fakeDoc(live){
  const elems={'.prototype-disclaimer .proto-spacer':{textContent:'original'},'[data-panel="chat"] .page-intro .overline':{textContent:'DEMO'},'.chat-head strong + span':{textContent:'sample'}};
  return {elems,getElementById:id=>id==='chat-form'?{dataset:{liveMode:live?'local-only':undefined}}:null,querySelector:s=>elems[s]||null};
}
test('public site never advertises live AI',()=>{
 const d=fakeDoc(false);assert.equal(ui.mount(d,publicPage),false);assert.equal(d.elems['.prototype-disclaimer .proto-spacer'].textContent,'original');
});
test('local preview shows live/verification state',()=>{
 const d=fakeDoc(true);assert.equal(ui.mount(d,local),true);assert.match(d.elems['.prototype-disclaimer .proto-spacer'].textContent,/로컬 AI 상담/);assert.match(d.elems['.chat-head strong + span'].textContent,/포포에게/);
});
test('local site without enabled chat stays unchanged',()=>{
 const d=fakeDoc(false);assert.equal(ui.mount(d,local),false);
});
test('remote HTTP site never calls local mode',()=>{
 assert.equal(ui.isLocal({protocol:'http:',hostname:'momoorr.github.io'}),false);
});
test('header uses English popo with decorative star marks',()=>{
 const s=fs.readFileSync(path.join(root,'prototype/index.html'),'utf8');
 assert.match(s,/class="popo-logo-word"/);assert.match(s,/popo-logo-star-in/);assert.match(s,/popo 포포 홈/);
 assert.doesNotMatch(s,/brand-en">POPO/);
});
test('friendly font is loaded by CSS only, not shipped',()=>{
 const s=fs.readFileSync(path.join(root,'prototype/popo-friendly.css'),'utf8');
 assert.match(s,/Henny\+Penny/);assert.match(s,/\.popo-logo-word/);
});
test('live model safety and user tone coexist',()=>{
 const s=fs.readFileSync(path.join(root,'backend/main.py'),'utf8');
 assert.match(s,/get_saju_chart/);assert.match(s,/반말\(해체\)/);assert.match(s,/verified=false/);assert.match(s,/getattr\(response, "status", None\) == "incomplete"/);
});
test('brand and dialog accessibility IDs remain',()=>{
 const s=fs.readFileSync(path.join(root,'prototype/index.html'),'utf8');
 assert.match(s,/id="open-birth"/);assert.match(s,/id="calc-server-local"/);assert.match(s,/id="chat-form"/);assert.match(s,/aria-label="popo 포포 홈"/);
});
console.log(`TOTAL ${passed} PASS ${passed} FAIL 0`);
