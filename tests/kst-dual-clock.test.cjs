'use strict';
// Unit wiring tests with a synthetic Solar adapter. NOT a live lunar-library test.
const assert = require('node:assert/strict');
const experiment = require('../qa/kst-dual-clock-candidate.js');
const terms = [
  ['小寒','2026-01-05 17:23'], ['立春','2026-02-04 05:02'],
  ['惊蛰','2026-03-05 22:59'], ['清明','2026-04-05 03:40'],
  ['立夏','2026-05-05 20:49'], ['芒种','2026-06-06 00:48'],
  ['小暑','2026-07-07 10:57'], ['立秋','2026-08-07 20:43'],
  ['白露','2026-09-07 23:41'], ['寒露','2026-10-08 15:29'],
  ['立冬','2026-11-07 18:52'], ['大雪','2026-12-07 11:53']
];
const refs = {year:2026,terms: [...terms.map(([key,kst])=>({key,kst,label:key})), ...Array.from({length:12}, (_,i)=>({key:"OTHER_"+i, kst:"2026-01-01 12:00", label:"OTHER"}))]};
const thresholds = terms.map(([key,kst],index)=>({
  ms: experiment.parseCivilClock(experiment.shiftCivilClock(kst,-60)),index
}));
const fake = {
  fromYmdHms(year,month,day,hour,minute) {
    const ms = Date.UTC(year,month-1,day,hour,minute,0);
    const switched = thresholds.filter(x => ms >= x.ms).length;
    const values = {
      setSect() {},
      getYear() { return switched >= 2 ? '丙午' : '乙巳'; },
      getMonth() { return ['戊子','己丑','庚寅','辛卯','壬辰','癸巳','甲午','乙未','丙申','丁酉','戊戌','己亥','庚子'][switched]; },
      getDay() { return day % 2 ? '甲子' : '乙丑'; },
      getTime() { return hour % 2 ? '丙寅' : '丁卯'; }
    };
    return {getLunar() {return {getEightChar() {return values;}};}};
  }
};
const tests=[
  ['valid civil conversion',()=>assert.equal(experiment.shiftCivilClock('2026-02-04 05:03',-60),'2026-02-04 04:03')],
  ['cross day conversion',()=>assert.equal(experiment.shiftCivilClock('2026-06-06 00:48',-60),'2026-06-05 23:48')],
  ['leap day conversion',()=>assert.equal(experiment.shiftCivilClock('2024-03-01 00:20',-60),'2024-02-29 23:20')],
  ['invalid date rejection',()=>assert.throws(()=>experiment.parseCivilClock('2026-02-30 05:00'))],
  ['invalid clock rejection',()=>assert.throws(()=>experiment.parseCivilClock('2026-01-01 25:00'))],
  ['invalid offset rejection',()=>assert.throws(()=>experiment.shiftCivilClock('2026-01-01 02:00',1.5))],
  ['strict year/month and day/hour split',()=>{
    const v=experiment.calculateDiagnostic(fake,'2026-02-04 04:30');
    assert.equal(v.verified,false);
    assert.equal(v.status,'qa_only');
    assert.equal(v.pillars.year,'乙巳');
    assert.equal(v.pillars.month,'己丑');
    assert.equal(v.pillars.day,v.raw.day);
    assert.equal(v.pillars.hour,v.raw.hour);
  }],
  ['12 simulated boundaries and 4 safeguards',()=>{
    const report=experiment.report(fake,refs);
    assert.equal(report.total,16);
    assert.equal(report.failed,0);
    assert.equal(report.safeForProduction,false);
  }],
  ['fail closed missing engine',()=>assert.throws(()=>experiment.calculateDiagnostic(null,'2026-02-04 04:30'))],
  ['fail closed invalid fixtures',()=>assert.throws(()=>experiment.report(fake,{year:2026,terms:[]}))]
];
for(const [name,test] of tests){test();console.log('PASS | '+name)}
console.log(`OFFLINE UNIT TESTS ${tests.length}/${tests.length} PASS (synthetic adapter; real lunar-javascript untested here)`);
