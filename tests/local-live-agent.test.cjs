'use strict';
const assert = require('node:assert/strict');
const live = require('../prototype/chat-live-local.js');
let passed = 0;
async function test(name, fn) {
  await fn();
  passed += 1;
  console.log('PASS', name);
}
class Elem {
  constructor(id) {
    this.id = id; this.value=''; this.placeholder=''; this.maxLength=180; this.textContent='';
    this.children=[];this.className='';this.disabled=false;this.dataset={};this.listeners=[];
    this.scrollTop=0;this.scrollHeight=0;this.focused=false;
  }
  addEventListener(type,handler,capture=false) {this.listeners.push({type,handler,capture:!!capture});}
  appendChild(child) {this.children.push(child);this.scrollHeight+=1;return child;}
  replaceChildren(...children) {this.children=children;}
  querySelector(selector) {return selector==='button[type="submit"]'?this.button:null;}
  focus(){this.focused=true;}
  async trigger(type) {
    let stopped=false;
    const evt={target:this,defaultPrevented:false,preventDefault(){this.defaultPrevented=true},stopImmediatePropagation(){stopped=true}};
    const listeners=this.listeners.filter(x=>x.type===type).sort((a,b)=>Number(b.capture)-Number(a.capture));
    for(const entry of listeners){await entry.handler(evt);if(stopped)break;}
    return evt;
  }
}
function makeDoc(){
  const names=['chat-form','chat-text','chat-list'];
  const lookup=Object.fromEntries(names.map(k=>[k,new Elem(k)]));
  const send=new Elem('send');lookup['chat-form'].button=send;
  const disclaimer=new Elem('disclaimer'), headLabel=new Elem('headLabel');
  const doc={getElementById:k=>lookup[k],createElement:k=>new Elem(k),querySelector:k=>({'.chat-disclaimer':disclaimer,'.chat-head .small-tag':headLabel})[k]};
  return {doc,form:lookup['chat-form'],input:lookup['chat-text'],list:lookup['chat-list'],send,disclaimer,headLabel};
}
const localhost={protocol:'http:',hostname:'127.0.0.1'}, pages={protocol:'https:',hostname:'momoorr.github.io'};
const okData={answer:'오행은 전통적인 다섯 상징을 뜻해.',tools_used:[],chart_verified:false,estimated_cost_usd:.00025};
const ok=(answer=okData.answer,tools_used=[])=>({ok:true,json:async()=>({...okData,answer,tools_used})});
async function main(){
 await test('public Pages does not mount or call localhost API',async()=>{
   const e=makeDoc();let called=0;
   assert.equal(live.isLocalPage(pages),false);
   assert.equal(live.mount(e.doc,pages,async()=>{called++}),false);
   e.input.value='오행이 뭐야?';await e.form.trigger('submit');
   assert.equal(called,0);
 });
 await test('local-only mounting updates existing chat UX without changing HTML',async()=>{
   const e=makeDoc();assert.equal(live.mount(e.doc,localhost,async()=>ok()),true);
   assert.equal(e.form.dataset.liveMode,'local-only');
   assert.match(e.send.textContent,/포포에게 보내기/);
   assert.match(e.disclaimer.textContent,/OpenAI API/);
   assert.match(e.list.children[0].textContent,/개인 사주/);
 });
 await test('real chat submit captures before legacy demo handler',async()=>{
   const e=makeDoc();let fixedHandlerCalls=0,requests=0;
   e.form.addEventListener('submit',()=>{fixedHandlerCalls++;});
   live.mount(e.doc,localhost,async(url,opts)=>{requests++;
     assert.equal(url,'http://127.0.0.1:8000/api/chat');
     assert.equal(opts.method,'POST');
     assert.equal(opts.headers['Content-Type'],'application/json');
     assert.equal(JSON.parse(opts.body).question,'오행이 뭐야?');
     return ok();
   });
   e.input.value='오행이 뭐야?';const evt=await e.form.trigger('submit');
   assert.equal(evt.defaultPrevented,true);assert.equal(fixedHandlerCalls,0);assert.equal(requests,1);
   assert.equal(e.list.children[1].textContent,'오행이 뭐야?');
   assert.equal(e.list.children[2].textContent,okData.answer);
   assert.equal(e.input.value,'');assert.equal(e.send.disabled,false);
 });
 await test('context sends successful turns in order, at most six, assistant <=800 chars',async()=>{
   const e=makeDoc();const histories=[];
   live.mount(e.doc,localhost,async(_url,options)=>{
     const payload=JSON.parse(options.body);histories.push(payload.history);
     return ok('응'.repeat(1200));
   });
   for(let i=0;i<5;i++){e.input.value='질문'+i;await e.form.trigger('submit');}
   assert.deepEqual(histories[0],[]);
   assert.equal(histories[1].length,2);
   assert.equal(histories[1][0].content,'질문0');
   assert.equal(histories[1][1].content.length,800);
   assert.equal(histories[4].length,6);
   assert.equal(histories[4][0].content,'질문1');
   assert.equal(histories[4][4].content,'질문3');
 });
 await test('tool call is labeled but no personal verified chart is displayed',async()=>{
   const e=makeDoc();live.mount(e.doc,localhost,async()=>ok('개인 명식은 아직 조회할 수 없어.',['get_saju_chart']));
   e.input.value='내 사주';await e.form.trigger('submit');
   const reply=e.list.children[2];
   assert.match(reply.textContent,/조회할 수 없어/);
   assert.match(reply.children[0].textContent,/개인 명식/);
 });
 await test('unexpected verified=true and arbitrary tool names fail closed',async()=>{
   assert.throws(()=>live.validateResponse({...okData,chart_verified:true}),/검증 상태/);
   assert.throws(()=>live.validateResponse({...okData,tools_used:['exec_shell']}),/검증 상태/);
   assert.throws(()=>live.validateResponse({...okData,answer:''}),/검증 상태/);
 });
 await test('server unavailable shows error and does not reuse static demo',async()=>{
   const e=makeDoc();live.mount(e.doc,localhost,async()=>{throw new TypeError('Failed to fetch')});
   e.input.value='연결 테스트';await e.form.trigger('submit');
   assert.match(e.list.children[2].textContent,/FastAPI/);
   assert.ok(e.list.children[2].className.includes('chat-local-error'));
 });
 await test('429 soft budget limit tells user without retrying',async()=>{
   const e=makeDoc();let calls=0;live.mount(e.doc,localhost,async()=>{calls++;return {ok:false,status:429};});
   e.input.value='질문';await e.form.trigger('submit');
   assert.equal(calls,1);assert.match(e.list.children[2].textContent,/예산 제한/);
 });
 await test('failed interaction is not sent as history in next request',async()=>{
   const e=makeDoc();let calls=0,secondPayload;
   live.mount(e.doc,localhost,async(_url,o)=>{calls++;
     if(calls===1)return {ok:false,status:502};
     secondPayload=JSON.parse(o.body);return ok();
   });
   e.input.value='실패';await e.form.trigger('submit');
   e.input.value='다시';await e.form.trigger('submit');
   assert.deepEqual(secondPayload.history,[]);
 });
 await test('busy-state ignores double submissions',async()=>{
   const e=makeDoc();let resolve,reached=0;
   live.mount(e.doc,localhost,async()=>{reached++;return new Promise(r=>resolve=r)});
   e.input.value='한 번';const first=e.form.trigger('submit');
   await Promise.resolve();
   const second=e.form.trigger('submit');
   await second;assert.equal(reached,1);assert.equal(e.send.disabled,true);
   resolve(ok());await first;assert.equal(e.send.disabled,false);
 });
 await test('AI reply is textContent, not innerHTML',async()=>{
   const e=makeDoc();live.mount(e.doc,localhost,async()=>ok('<script>alert(1)</script>'));
   e.input.value='질문';await e.form.trigger('submit');
   assert.equal(e.list.children[2].textContent,'<script>alert(1)</script>');
   assert.equal(e.list.children[2].children.length,0);
 });
 await test('input is bounded; empty submission does not call API',async()=>{
   const e=makeDoc();let called=0;live.mount(e.doc,localhost,async()=>{called++;return ok()});
   e.input.value='   ';await e.form.trigger('submit');assert.equal(called,0);
   e.input.value='a'.repeat(601);await e.form.trigger('submit');assert.equal(called,0);
   assert.match(e.list.children.at(-1).textContent,/600자/);
 });
 await test('untrusted exception text is not shown to UI',async()=>{
   const e=makeDoc();live.mount(e.doc,localhost,async()=>{throw Error('secret=EXPOSE_NEVER')});
   e.input.value='질문';await e.form.trigger('submit');
   assert.doesNotMatch(e.list.children[2].textContent,/EXPOSE_NEVER/);
 });
 console.log(`TOTAL ${passed} PASS ${passed} FAIL 0`);
}
main().catch(err=>{console.error(err.stack);process.exitCode=1;});
