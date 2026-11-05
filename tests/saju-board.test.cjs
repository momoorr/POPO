'use strict';
const assert=require('node:assert/strict');
const board=require('../prototype/saju-board.js');
let n=0;
function check(name,fn){fn();n++;console.log('PASS',name);}
check('fixture has four valid pillars and five elements summing to 8',()=>assert.equal(board.validChart(board.DEMO),true));
check('verification must stay false',()=>assert.equal(board.validChart({...board.DEMO,verified:true}),false));
check('invalid pillar is refused',()=>assert.equal(board.validChart({...board.DEMO,pillars:{...board.DEMO.pillars,year:'??'}}),false));
check('counts not totaling 8 are refused',()=>assert.equal(board.validChart({...board.DEMO,counts:{...board.DEMO.counts,wood:2}}),false));
check('joint maximum is explicitly reported (no arbitrary representative)',()=>assert.deepEqual(board.maxElements(board.DEMO.counts),['화','토']));
check('all five elements are ordered correctly',()=>assert.deepEqual(board.ELEMENTS.map(e=>e.ko),['목','화','토','금','수']));
check('donut uses exactly eight-character fractions',()=>{const s=board.donutBackground(board.DEMO.counts);assert.match(s,/12\.5%/);assert.match(s,/50%/);assert.match(s,/100%/);});
check('public URL is never considered local',()=>assert.equal(board.localAddress({protocol:'https:',hostname:'momoorr.github.io'}),false));
check('local HTTP is eligible for candidate results',()=>assert.equal(board.localAddress({protocol:'http:',hostname:'127.0.0.1'}),true));
function fakeOutput(state,values,counts) {return {dataset:{state},querySelectorAll(selector){return selector==='ul li'?values.map(t=>({textContent:t})):counts.map(t=>({textContent:t}));}};}
const rows=['년주  己卯','월주  丙子','일주  戊午','시주  戊午'];
const counts=['목 1개','화 3개','토 3개','금 0개','수 1개'];
check('successful server candidate may enter local dashboard as unverified',()=>{const c=board.readCandidate(fakeOutput('success',rows,counts));assert.equal(c.source,'candidate');assert.equal(c.verified,false);assert.equal(c.pillars.hour,'戊午');});
check('server error never enters local dashboard',()=>assert.equal(board.readCandidate(fakeOutput('error',rows,counts)),null));
check('malformed server output never enters local dashboard',()=>assert.equal(board.readCandidate(fakeOutput('success',rows,['목 2개',...counts.slice(1)])),null));
console.log(`STAGE 4F TOTAL ${n} PASS ${n} FAIL 0`);
