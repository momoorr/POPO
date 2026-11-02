'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const hour=require(path.join(root,'qa/hour-pillar-reference.js'));
const refs=require(path.join(root,'qa/calendar-reference-fixtures.js'));
// Independently fixed traditional-rule examples (NOT taken from lunar candidate).
for(const [day,time,want] of [
  ['戊午','12:00','戊午'],['己未','01:30','乙丑'],['庚寅','03:30','戊寅'],
  ['丁卯','21:30','辛亥'],['戊戌','11:00','戊午'],
  ['戊午','01:00','癸丑'],['戊午','02:59','癸丑'],['戊午','03:00','甲寅']
])assert.equal(hour.hourPillar(day,time),want,`${day} @${time}`);
for(const time of ['00:00','00:30','23:00','25:00','01:60'])assert.throws(()=>hour.hourPillar('戊午',time));
assert.throws(()=>hour.hourPillar('AB','12:00'));
assert.equal(hour.HOURS.length,11);assert.equal(hour.BOUNDARY.length,12);
console.log('PASS: 8 fixed hour-pillar examples, 6 invalid inputs, 11 slots and 12 boundary slots');
// A mocked engine checks the QA runner contract, NOT actual astronomical correctness.
let current=null;
const core={calculateCandidate(input){
  const fixture=refs.fixtures.find(f=>f.date===input.date);
  if(!fixture)throw Error('unknown fake fixture');
  const hourValue=hour.hourPillar(fixture.day,input.time);
  return {pillars:{year:fixture.year,month:fixture.month,day:fixture.day,hour:hourValue}};
}};
const lunarApi={Solar:{fromYmdHms(){return {};}}};
const good=hour.run(core,lunarApi,refs);
assert.equal(good.total,156);assert.equal(good.passed,156);assert.equal(good.failed,0);
console.log('PASS: 156/156 QA checks with DETERMINISTIC MOCK engine (real library not exercised)');
let failOnce=true;
const broken={calculateCandidate(input){const result=core.calculateCandidate(input);if(failOnce){failOnce=false;result.pillars.hour='甲子';}return result;}};
const bad=hour.run(broken,lunarApi,refs);
assert.equal(bad.failed,1);assert.equal(bad.passed,155);
console.log('PASS: Deliberately corrupted hour pillar detected (1/156 FAIL expected)');
