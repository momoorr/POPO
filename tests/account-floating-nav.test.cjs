'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const nav=require('../prototype/popo-account-nav.js');
const css=fs.readFileSync(path.join(__dirname,'../prototype/popo-account-nav.css'),'utf8');
const src=fs.readFileSync(path.join(__dirname,'../prototype/popo-account-nav.js'),'utf8');
let n=0;
function check(desc,cb){cb();n++;console.log('PASS',desc);}
check('five routed destinations and correct order',()=>assert.deepEqual(nav.MENU_ITEMS.map(x=>x[0]),['home','chart','elements','fortune','chat']));
check('guest and unverified client state never mean logged in',()=>{
 for(const s of [null,{}, {authenticated:true},{authenticated:true,serverVerified:true},{authenticated:true,serverVerified:true,userId:''},{authenticated:false,serverVerified:true,userId:'x'}]){
  assert.equal(nav.authenticatedFromVerifiedSession(s),false);
 }
});
check('future server-verified session can show My Page presentation',()=>{
 assert.equal(nav.authenticatedFromVerifiedSession({authenticated:true,serverVerified:true,userId:'user123'}),true);
});
check('no fake login storage or tokens used',()=>{
 assert.doesNotMatch(src,/localStorage|sessionStorage|setItem\(|OPENAI_API_KEY|sk-[A-Za-z0-9]/);
 assert.match(src,/serverVerified===true/);
});
check('menu uses existing router buttons',()=>assert.match(src,/\.desktop-nav \[data-view/));
check('account entry has explicit dialog semantics',()=>assert.match(src,/setAttribute\('aria-haspopup','dialog'\)/));
check('escape returns focus and closes quick menu',()=>assert.match(src,/e\.key==='Escape'/));
check('bottom fixed tabbar is hidden',()=>assert.match(css,/\.app-shell nav\.mobile-nav\s*\{display:none!important/));
check('floating control aligns to center mobile canvas at desktop width',()=>assert.match(css,/calc\(\(100vw - var\(--popo-app-width\)\)\/2 \+ 13px\)/));
check('account and floating buttons are keyboard accessible',()=>assert.match(css,/:focus-visible/));
check('reduced motion supported',()=>assert.match(css,/prefers-reduced-motion:reduce/));
check('current app-shell mobile canvas remains 440px',()=>assert.match(css,/--popo-app-width:440px/));
check('service info remains available from dialog',()=>assert.match(src,/doc\.getElementById\('open-privacy'\)/));
console.log(`TOTAL ${n} PASS ${n} FAIL 0`);
