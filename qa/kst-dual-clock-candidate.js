/* POPO Stage 2D diagnostic only: investigate KST/CST clock separation.
 * NO production chart, public birth form, server tool, or AI may call this.
 * Raw lunar-javascript solar-term clock is observed one hour behind KASI KST
 * in 2026. This experiment uses shifted time ONLY for year/month pillars;
 * day/hour remain at the input KST civil clock. Other policy choices unresolved.
 */
(function(root, factory) {
  'use strict';
  const exported = factory();
  if (typeof module === 'object' && module.exports) module.exports = exported;
  if (root) root.PopoKstClockExperiment = exported;
})(typeof window !== 'undefined' ? window : null, function() {
  'use strict';
  const OFFSET_MINUTES = 60;
  const PILLAR_PATTERN = /^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/;
  const JIE_KEYS = Object.freeze(['小寒', '立春', '惊蛰', '清明', '立夏', '芒种', '小暑', '立秋', '白露', '寒露', '立冬', '大雪']);
  function parseCivilClock(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(String(value));
    if (!match) throw new Error('KST test clock must be YYYY-MM-DD HH:mm');
    const [year, month, day, hour, minute] = match.slice(1).map(Number);
    if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) throw new Error('Invalid test clock');
    // Pure wall-clock arithmetic: Date.UTC avoids host timezone and DST.
    const ms = Date.UTC(year, month - 1, day, hour, minute, 0);
    const checked = new Date(ms);
    if (checked.getUTCFullYear() !== year || checked.getUTCMonth() !== month - 1 || checked.getUTCDate() !== day) {
      throw new Error('Nonexistent date');
    }
    return ms;
  }
  function parts(ms) {
    const d = new Date(ms);
    return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes()];
  }
  function civilText(ms) {
    const a = parts(ms);
    return String(a[0]).padStart(4, '0') + '-' + String(a[1]).padStart(2, '0') + '-' + String(a[2]).padStart(2, '0') + ' ' + String(a[3]).padStart(2, '0') + ':' + String(a[4]).padStart(2, '0');
  }
  function shiftCivilClock(clock, minutes) {
    if (!Number.isInteger(minutes) || Math.abs(minutes) > 1440) throw new Error('Invalid offset');
    return civilText(parseCivilClock(clock) + minutes * 60000);
  }
  function fourPillars(Solar, clock) {
    if (!Solar || typeof Solar.fromYmdHms !== 'function') throw new Error('Missing lunar-javascript Solar API');
    const e = Solar.fromYmdHms(...parts(parseCivilClock(clock)), 0).getLunar().getEightChar();
    if (typeof e.setSect === 'function') e.setSect(2);
    const result = {year: e.getYear(), month: e.getMonth(), day: e.getDay(), hour: e.getTime()};
    if (!Object.values(result).every(p => PILLAR_PATTERN.test(p))) throw new Error('Unexpected ganzhi output');
    return result;
  }
  function calculateDiagnostic(Solar, birthKst) {
    const lookupClock = shiftCivilClock(birthKst, -OFFSET_MINUTES);
    const nativeClock = fourPillars(Solar, birthKst);
    const termClock = fourPillars(Solar, lookupClock);
    return Object.freeze({
      status: 'qa_only', verified: false, yearMonthLookupClock: lookupClock,
      birthKst,
      pillars: Object.freeze({year: termClock.year, month: termClock.month, day: nativeClock.day, hour: nativeClock.hour}),
      raw: Object.freeze(nativeClock),
      evidence: '2026 year/month solar-term boundary experiment; day/hour remain unapproved'
    });
  }
  function report(Solar, fixtures) {
    if (!fixtures || fixtures.year !== 2026 || !Array.isArray(fixtures.terms) || fixtures.terms.length !== 24) {
      throw new Error('2026 KASI reference fixtures missing');
    }
    const rows = [];
    for (const key of JIE_KEYS) {
      const term = fixtures.terms.find(t => t.key === key);
      if (!term) throw new Error('Missing Jie fixture: ' + key);
      const before = shiftCivilClock(term.kst, -2);
      const after = shiftCivilClock(term.kst, 2);
      const b = calculateDiagnostic(Solar, before);
      const a = calculateDiagnostic(Solar, after);
      const switched = b.pillars.year !== a.pillars.year || b.pillars.month !== a.pillars.month;
      const prematureRaw = b.raw.year === a.raw.year && b.raw.month === a.raw.month;
      const respectsDateAndHour = b.pillars.day === b.raw.day && b.pillars.hour === b.raw.hour
        && a.pillars.day === a.raw.day && a.pillars.hour === a.raw.hour;
      rows.push({label: term.label, kst: term.kst, before, after,
        beforePillars: b.pillars, afterPillars: a.pillars,
        prematureRaw, switched, respectsDateAndHour,
        pass: switched && prematureRaw && respectsDateAndHour});
    }
    const gap = calculateDiagnostic(Solar, '2026-02-04 04:30');
    const later = calculateDiagnostic(Solar, '2026-02-04 05:03');
    const checks = [
      {label: '입춘 전 04:30 원본 조기 전환 검출', pass: gap.raw.year === '丙午' && gap.raw.month === '庚寅' && gap.pillars.year === '乙巳' && gap.pillars.month === '己丑'},
      {label: '입춘 후 05:03 정상 전환 검출', pass: later.pillars.year === '丙午' && later.pillars.month === '庚寅'},
      {label: '출생 시각과 절입 조회 시각 분리', pass: gap.pillars.day === gap.raw.day && gap.pillars.hour === gap.raw.hour && gap.yearMonthLookupClock === '2026-02-04 03:30'},
      {label: '자정 넘김: QA 진단만, 서비스는 여전히 차단', pass: shiftCivilClock('2026-06-06 00:48', -60) === '2026-06-05 23:48'}
    ];
    const passed = rows.filter(x => x.pass).length + checks.filter(x => x.pass).length;
    return {total: rows.length + checks.length, passed, failed: rows.length + checks.length - passed,
      boundaryCases: rows.length, rows, checks, status: 'qa_only', safeForProduction: false,
      scope: '2026 KASI 12 Jie boundaries (+/-2 min) and 4 safeguards; no regional longitude, historical clocks, midnight zishi, lunar leap month or national four-pillar certification'};
  }
  return {OFFSET_MINUTES, JIE_KEYS, parseCivilClock, shiftCivilClock, calculateDiagnostic, report};
});
