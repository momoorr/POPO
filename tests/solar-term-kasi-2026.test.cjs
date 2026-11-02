"use strict";
const assert=require('node:assert/strict');
const path=require('node:path');
const base=path.join(__dirname,'..');
const lunar=require(path.join(base,'prototype/vendor/lunar.min.js'));
const refs=require(path.join(base,'qa/solar-term-kasi-2026-fixtures.js'));
const {run}=require(path.join(base,'qa/solar-term-kasi-2026-check.js'));
const result=run(lunar,refs);
for(const x of result.checks){
  console.log(`${x.pass?'PASS':'FAIL'} ${x.name} | KASI ${x.source} | library ${x.raw||'n/a'} | shifted ${x.corrected||'n/a'}`);
}
console.log(`TOTAL ${result.total} PASS ${result.passed} FAIL ${result.failed}`);
console.log(`RAW_KST_MISMATCHES ${result.rawMismatchCount} of ${result.total}`);
console.log(`EARLY_IPCHUN_SWITCH ${result.boundary?.earlySwitch}`);
assert.equal(result.total,24);
assert.equal(result.failed,0,'One or more KASI minute comparisons failed');
assert.equal(result.rawMismatchCount,24,'Expected uncorrected ~1 hour offset');
assert.equal(result.boundary?.earlySwitch,true,'Expected to detect 04:30 KST premature boundary on unmodified engine');
assert.equal(result.safeForProduction,false);
console.log('NOT SAFE FOR PERSONAL SAJU: Verify timezone policy, hour/day pillars, midnight and independent almanacs before enabling chart service.');
