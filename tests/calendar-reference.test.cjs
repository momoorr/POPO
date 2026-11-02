'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const base = path.resolve(__dirname, '..');
const core = require(path.join(base, 'prototype/calc-core.js'));
const lunar = require(path.join(base, 'prototype/vendor/lunar.min.js'));
const fixtures = require(path.join(base, 'qa/calendar-reference-fixtures.js'));
const check = require(path.join(base, 'qa/calendar-reference-check.js'));
const report = check.run(core, lunar, fixtures);
for (const t of report.results) {
  const line = `${t.pass ? 'PASS' : 'FAIL'} ${t.name} :: ${t.message}`;
  (t.pass ? console.log : console.error)(line);
}
console.log(`TOTAL ${report.total}, PASS ${report.passed}, FAIL ${report.failed}`);
assert.equal(report.failed, 0, 'External-date candidate check failed; inspect the lines above.');
console.log('IMPORTANT: This does NOT validate Korean hour/solar-term boundary or an official KASI four-pillars calculation.');
