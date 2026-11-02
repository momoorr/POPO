'use strict';
// Run after upload in the cloned POPO repository; real pinned lunar JS needed.
// This is computation integration QA, not full Korean Almanac certification.
const assert = require('node:assert/strict');
const bridge = require('../backend/chart_bridge.cjs');
const calendar = '양력', place = '서울', unknownTime = false;
const make = (date,time) => ({calendar,date,time,place,unknownTime});
const r = bridge.calculate(make('2000-01-01', '12:00'));
assert.equal(r.status, 'candidate_only');
assert.equal(r.verified, false);
assert.equal(r.can_personalize, false);
assert.deepEqual(r.pillars, {year:'己卯',month:'丙子',day:'戊午',hour:'戊午'});
assert.deepEqual(r.counts, {wood:1,fire:3,earth:3,metal:0,water:1});
assert.equal(Object.values(r.counts).reduce((a,b)=>a+b,0),8);
assert.equal(r.engine,'lunar-javascript@1.7.7');
assert.equal(bridge.shiftInput(make('2026-06-10','00:48'),-60).day,9);
for(const bad of [
  make('2000-01-05','12:00'),make('2000-01-01','23:15'),
  make('2000-02-30','12:00'),{...make('2000-01-01','12:00'),calendar:'음력'},
]) assert.throws(()=>bridge.calculate(bad));
console.log('PASS: Stage 3 pinned-engine integration candidate (not verified; no AI connected)');
