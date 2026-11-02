/* Pure, dependency-free regression test runner for POPO calc candidate.
 * The lunar bundle is a third-party candidate. Never infer official validity
 * from these results or send unverified chart results into the AI Agent.
 */
(function(root, factory) {
  const tool = factory();
  if (typeof module === 'object' && module.exports) module.exports = tool;
  if (root) root.PopoCalendarCheck = tool;
})(typeof window !== 'undefined' ? window : null, function() {
  'use strict';
  function run(core, lunarApi, fixtures) {
    const results = [];
    const record = (name, fn, detail) => {
      try {
        const message = fn();
        results.push({name, pass: true, message: message || 'PASS', detail: detail || ''});
      } catch (err) {
        results.push({name, pass: false, message: String(err && err.message || err), detail: detail || ''});
      }
    };
    if (!core || typeof core.calculateCandidate !== 'function' || typeof core.countPillars !== 'function') {
      throw new Error('Missing calculation core: prototype/calc-core.js');
    }
    if (!lunarApi || !lunarApi.Solar || typeof lunarApi.Solar.fromYmdHms !== 'function') {
      throw new Error('Missing calculation library: prototype/vendor/lunar.min.js');
    }
    if (!fixtures || !Array.isArray(fixtures.fixtures)) {
      throw new Error('Missing fixture list: qa/calendar-reference-fixtures.js');
    }
    const base = {calendar: '양력', date: '2000-01-01', time: '12:00', unknownTime: false, place: '서울'};
    for (const fixture of fixtures.fixtures) {
      record('외부 날짜 대조 · ' + fixture.date, () => {
        const found = core.calculateCandidate({...base, date: fixture.date}, lunarApi);
        const mismatches = ['year','month','day']
          .filter(key => found.pillars[key] !== fixture[key])
          .map(key => `${key}: 기준 ${fixture[key]}, 후보 ${found.pillars[key]}`);
        if (mismatches.length) throw new Error(mismatches.join(' / '));
        if (!/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/.test(found.pillars.hour)) {
          throw new Error('시주 형식 오류 (시주 정확성 검증은 별도)');
        }
        const counts = found.counts;
        const total = ['wood','fire','earth','metal','water'].reduce((a,k) => a + counts[k], 0);
        if (total !== 8) throw new Error(`8글자 오행 집계 합계 오류: ${total}`);
        if (found.verified === true) throw new Error('미검증 후보에 verified=true가 설정됨');
        return `년·월·일 3주 일치 | 시주 ${found.pillars.hour} (형식만 검증) | 오행 ${total}/8`;
      }, fixture.source);
    }
    for (const item of fixtures.rejected) {
      record('정책 차단 · ' + item.name, () => {
        let rejected = false;
        try { core.calculateCandidate({...base, ...item.patch}, lunarApi); }
        catch (err) { rejected = true; }
        if (!rejected) throw new Error('차단해야 하는 입력이 허용됨');
      });
    }
    record('엔진 누락 시 오류 처리', () => {
      let rejected = false;
      try { core.calculateCandidate(base, null); }
      catch (err) { rejected = true; }
      if (!rejected) throw new Error('엔진 누락이 허용됨');
    });
    record('부정확한 간지 문자열 차단', () => {
      let rejected = false;
      try { core.countPillars({year:'XX',month:'丙子',day:'戊午',hour:'戊午'}); }
      catch (err) { rejected = true; }
      if (!rejected) throw new Error('비정상 간지가 허용됨');
    });
    record('기준 시험값 오행 회귀 점검 · 2000-01-01 12:00', () => {
      // EXPECTED COUNTS HERE ARE FROM PREVIOUS POPO PROTOTYPE RUNS,
      // not from an independent Korean source. This is a *regression* check.
      const counts = core.calculateCandidate(base, lunarApi).counts;
      const expected = {wood:1, fire:3, earth:3, metal:0, water:1};
      for (const [key, value] of Object.entries(expected)) {
        if (counts[key] !== value) throw new Error(`${key}: 기대 ${value}, 실제 ${counts[key]}`);
      }
      return '이전 POPO 시험값과 동일 (독립 역법 검증 아님)';
    });
    return {
      version: fixtures.version,
      total: results.length,
      passed: results.filter(t => t.pass).length,
      failed: results.filter(t => !t.pass).length,
      results,
      scope: '외부 날짜별 연·월·일주 / 코드 입력 차단 / 기존 집계 회귀. 시주·절입·한국 지역 시간 보정 미검증.'
    };
  }
  return {run};
});
