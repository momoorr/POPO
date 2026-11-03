'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const preview = require('../prototype/calc-server-preview.js');
const base = path.resolve(__dirname, '..');
let passed=0;
function test(name,fn) {return Promise.resolve().then(fn).then(()=>{passed++; console.log('PASS',name)});}
class Element {
  constructor(id){this.id=id;this.value='';this.checked=false;this.textContent='';this.hidden=true;this.disabled=false;this.children=[];this.className='';this.dataset={};this.handlers={};this.selectedOptions=[];}
  addEventListener(k,fn){(this.handlers[k] ||= []).push(fn);}
  trigger(k){return Promise.all((this.handlers[k]||[]).map(fn=>fn({target:this})));}
  appendChild(node){this.children.push(node);}
  replaceChildren(...items){this.children=items;}
}
function fakeDocument(){
 const ids=['calc-server-local','calc-server-trigger','calc-server-output','calc-server-message','calc-server-pillars','calc-server-counts','calendar-type','birthday','birthtime','unknown-time','birthplace','leap-month'];
 const elements=Object.fromEntries(ids.map(id=>[id,new Element(id)]));
 elements['calendar-type'].value='양력';
 elements.birthday.value='2000-01-01';
 elements.birthtime.value='12:00';
 elements.birthplace.selectedOptions=[{textContent:'서울 (예시)'}];
 return {elements,getElementById:id=>elements[id]||null,createElement:tag=>new Element(tag)};
}
const response={status:'candidate_only',verified:false,can_personalize:false,
 pillars:{year:'己卯',month:'丙子',day:'戊午',hour:'戊午'},
 counts:{wood:1,fire:3,earth:3,metal:0,water:1},engine:'lunar-javascript@1.7.7'};
const local={protocol:'http:',hostname:'localhost'};
async function main(){
 await test('public Pages never mounts local API UI',()=>{
   const doc=fakeDocument();assert.equal(preview.isLocalPage({protocol:'https:',hostname:'momoorr.github.io'}),false);
   assert.equal(preview.mount(doc,{protocol:'https:',hostname:'momoorr.github.io'},()=>{throw Error('no request')}),false);
   assert.equal(doc.elements['calc-server-local'].hidden,true);
 });
 await test('local HTTP URL mounts its QA button',()=>{
   const doc=fakeDocument();assert.equal(preview.mount(doc,local,async()=>({ok:true,json:async()=>response})),true);
   assert.equal(doc.elements['calc-server-local'].hidden,false);
 });
 await test('frontend request uses unknown_time and mapped city',async()=>{
   const doc=fakeDocument();let target='',wire;
   preview.mount(doc,local,async(url,options)=>{target=url;wire=JSON.parse(options.body);return {ok:true,json:async()=>response};});
   await doc.elements['calc-server-trigger'].trigger('click');
   assert.equal(target,'http://127.0.0.1:8000/api/chart/probe');
   assert.deepEqual(wire,{calendar:'양력',date:'2000-01-01',time:'12:00',place:'서울',unknown_time:false});
   assert.equal(Object.hasOwn(wire,'unknownTime'),false);
   assert.equal(doc.elements['calc-server-output'].dataset.state,'success');
   assert.equal(doc.elements['calc-server-pillars'].children.length,4);
   assert.equal(doc.elements['calc-server-counts'].children.length,5);
   assert.match(doc.elements['calc-server-message'].textContent,/검증 전/);
 });
 await test('verified=true is rejected even when other fields look valid',()=>{
   assert.throws(()=>preview.checkResult({...response,verified:true}),/검증 상태/);
   assert.throws(()=>preview.checkResult({...response,chart_id:'fake-id'}),/검증 상태/);
 });
 await test('incorrect counts or malformed pillar rejected',()=>{
   assert.throws(()=>preview.checkResult({...response,counts:{...response.counts,fire:4}}),/오행/);
   assert.throws(()=>preview.checkResult({...response,pillars:{...response.pillars,year:'??'}}),/명식/);
 });
 await test('only three supported cities are sent to server',()=>{
   const doc=fakeDocument();doc.elements.birthplace.selectedOptions=[{textContent:'기타 · 미확정'}];
   assert.throws(()=>preview.getPayload(doc),/서울·부산·대전/);
 });
 await test('422 input error shown without fake fallback',async()=>{
   const doc=fakeDocument();preview.mount(doc,local,async()=>({ok:false,status:422}));
   await doc.elements['calc-server-trigger'].trigger('click');
   assert.equal(doc.elements['calc-server-output'].dataset.state,'error');
   assert.equal(doc.elements['calc-server-pillars'].children.length,0);
 });
 await test('server unavailable shows error without fake calculations',async()=>{
   const doc=fakeDocument();preview.mount(doc,local,async()=>{throw new TypeError('Failed to fetch');});
   await doc.elements['calc-server-trigger'].trigger('click');
   assert.equal(doc.elements['calc-server-output'].dataset.state,'error');
   assert.equal(doc.elements['calc-server-counts'].children.length,0);
 });
 await test('changing input clears an existing result',async()=>{
   const doc=fakeDocument();preview.mount(doc,local,async()=>({ok:true,json:async()=>response}));
   await doc.elements['calc-server-trigger'].trigger('click');
   assert.equal(doc.elements['calc-server-output'].hidden,false);
   await doc.elements.birthday.trigger('change');
   assert.equal(doc.elements['calc-server-output'].hidden,true);
   assert.equal(doc.elements['calc-server-pillars'].children.length,0);
 });
 await test('pending reply cannot overwrite a changed input',async()=>{
   const doc=fakeDocument();let release;
   preview.mount(doc,local,async()=>new Promise(resolve=>{release=resolve;}));
   const running=doc.elements['calc-server-trigger'].trigger('click');
   await doc.elements.birthday.trigger('change');
   release({ok:true,json:async()=>response});
   await running;
   assert.equal(doc.elements['calc-server-output'].hidden,true);
   assert.equal(doc.elements['calc-server-pillars'].children.length,0);
 });
 await test('metadata in HTML fragment is local-only',()=>{
   const appliedHtml = path.join(base,'prototype/index.html');
   const html=fs.readFileSync(fs.existsSync(appliedHtml)?appliedHtml:path.join(base,'patch_html_fragment.html'),'utf8');
   assert.match(html,/id="calc-server-local"[^\n]*hidden/);
   assert.match(html,/id="calc-server-trigger"/);
   assert.match(html,/role="status"/);
 });
 console.log(`TOTAL ${passed} PASS ${passed} FAIL 0`);
}
main().catch(err=>{console.error(err.stack);process.exitCode=1;});
