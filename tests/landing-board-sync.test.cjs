'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const js = fs.readFileSync(path.join(root,'prototype/landing-board-sync.js'),'utf8');
const css = fs.readFileSync(path.join(root,'prototype/landing-board-sync.css'),'utf8');
let passed = 0;
function test(label, fn) {fn();passed++;console.log('PASS',label);}
class Node {
  constructor(tag){this.tag=tag;this.dataset={};this.attrs={};this.children=[];this.className='';this.textContent='';this.classList={add:value=>this.classes=(this.classes||[]).concat(value)};}
  replaceChildren(){this.children=[];}
  append(item){this.children.push(item);}
  appendChild(child){this.children.push(child);return child;}
  setAttribute(name,value){this.attrs[name]=value;}
  querySelector(selector){return this.nodes?.[selector]||null;}
}
function makeDom(isHome) {
  const hero=new Node('div'),title=new Node('h1'),desc=new Node('p'),button=new Node('button'),art=new Node('div'),eyebrow=new Node('span');
  hero.nodes={'.hero-left .eyebrow':eyebrow};
  const home={querySelector: selector=>({'.hero.storybook-hero':hero,'#home-title':title,'.hero-desc':desc,'#open-birth':button,'.hero-right':art})[selector]||null};
  const doc={readyState:'complete',querySelector: selector=>selector==='.view[data-panel="home"]'?(isHome?home:null):null,createElement:tag=>new Node(tag)};
  vm.runInNewContext(js,{document:doc,console});
  return {hero,title,desc,button,art,eyebrow};
}
test('no home view leaves page unchanged',()=>assert.equal(makeDom(false).hero.dataset.popoBoardSync,undefined));
test('hero retains idempotent view behavior',()=>{const a=makeDom(true);assert.equal(a.hero.dataset.popoBoardSync,'true');assert.deepEqual(a.hero.classes,['popo-board-landing']);});
test('working CTA remains DOM button',()=>{const a=makeDom(true);assert.equal(a.button.children[0],'사주 보기 시작하기');assert.equal(a.button.children[1].attrs['aria-hidden'],'true');});
test('accessible title and paragraph remain real HTML',()=>{const a=makeDom(true);assert.equal(a.title.children[0],'나를 읽는');assert.equal(a.title.children[2],'AI 사주 상담,');assert.equal(a.title.children[4].textContent,'POPO');assert.match(a.desc.children[2],/오늘과 내일/);});
test('old cropped scene and separate flowers are NOT added to DOM',()=>{const a=makeDom(true);assert.equal(a.art.children.length,0);assert.equal(a.hero.children.length,0);assert.doesNotMatch(js,/addDecorativeImage/);});
test('single desktop and mobile image without hard seam masks',()=>{assert.match(css,/popo-unified-hero-desktop\.webp/);assert.match(css,/popo-unified-hero-mobile\.webp/);assert.match(css,/background-size:100% 100%,cover/);assert.match(css,/display:none !important;[\s\S]*?\.cosmic-points/);});
test('asset contains high-resolution integrated artwork',()=>{for (const name of ['popo-unified-hero-desktop.webp','popo-unified-hero-mobile.webp']){
  const buf=fs.readFileSync(path.join(root,'prototype/assets',name));assert.equal(buf.toString('ascii',0,4),'RIFF');assert.equal(buf.toString('ascii',8,12),'WEBP');assert.ok(buf.length>100_000);
}});
test('desktop, 720px, 390px, reduced-motion breakpoints present',()=>{
 for(const term of ['max-width:1100px','max-width:720px','max-width:390px','prefers-reduced-motion:reduce'])assert.ok(css.includes(term),term);
});
console.log(`STAGE 4E.2 TOTAL ${passed} PASS ${passed} FAIL 0`);
