'use strict';
/** POPO Stage 3 local-only, Node.js bridge to the existing pinned JS lunar engine.
 * No HTTP, no shell, no persistence. Input is received only on stdin.
 * The +60-minute dual-clock experiment is applied ONLY to year/month lookup.
 * NEVER return verified:true or a verified chart ID from this probe.
 */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const core = require(path.join(root, 'prototype', 'calc-core.js'));
const lunar = require(path.join(root, 'prototype', 'vendor', 'lunar.min.js'));
const OFFSET_MINUTES = 60;
const PILLAR = /^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/u;
const z2 = x => String(x).padStart(2, '0');
function shiftInput(input, minutes) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.date);
  const t = /^(\d{2}):(\d{2})$/.exec(input.time);
  if (!m || !t) throw new Error('Incorrect date or time format');
  const millis = Date.UTC(+m[1], +m[2]-1, +m[3], +t[1], +t[2]) + minutes*60000;
  const d = new Date(millis);
  return {year:d.getUTCFullYear(),month:d.getUTCMonth()+1,day:d.getUTCDate(),hour:d.getUTCHours(),minute:d.getUTCMinutes()};
}
function calculate(input) {
  if (!input || Array.isArray(input) || typeof input !== 'object') throw new Error('Invalid input object');
  // Existing canonical adapter applies conservative input policy.
  const original = core.calculateCandidate(input, {Solar:lunar.Solar});
  const yearMonthClock = shiftInput(input, -OFFSET_MINUTES);
  const e = lunar.Solar.fromYmdHms(yearMonthClock.year,yearMonthClock.month,yearMonthClock.day,
    yearMonthClock.hour,yearMonthClock.minute,0).getLunar().getEightChar();
  if (typeof e.setSect === 'function') e.setSect(2);
  const pillars = {
    year: e.getYear(),month:e.getMonth(),
    day:original.pillars.day,hour:original.pillars.hour
  };
  if (!Object.values(pillars).every(value => PILLAR.test(value))) throw new Error('Unexpected pillar data');
  const counts = core.countPillars(pillars);
  return {
    status:'candidate_only',verified:false,can_personalize:false,
    pillars, counts,
    engine:core.ENGINE,
    probe_version:'POPO-CHART-PROBE-STAGE3-2026-11-02',
    policy:'KST -60 min year/month lookup, raw KST day/hour; no longitude correction',
    limitations:'출생지 경도·균시차·자시·윤달·역사시각·다른 연도 절기 검증 전. 개인 사주로 확정하거나 AI 해석에 사용하지 않음.'
  };
}
function main() {
  // Never log input or dates. Only a sanitized JSON response goes to stdout.
  let buffer='';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => {
    buffer+=chunk;
    if (Buffer.byteLength(buffer,'utf8')>2048) process.exit(3);
  });
  process.stdin.on('end', () => {
    try{
      const input=JSON.parse(buffer);
      process.stdout.write(JSON.stringify(calculate(input))+'\n');
    }catch(_err){
      process.stderr.write('Chart candidate computation failed\n');
      process.exitCode=2;
    }
  });
}
if (require.main===module) main();
module.exports={calculate,shiftInput,OFFSET_MINUTES};
