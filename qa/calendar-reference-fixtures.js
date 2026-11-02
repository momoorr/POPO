/* POPO Stage 2 reference dates, 2026-11-02.
 * Each external source provides YEAR/MONTH/DAY ganji only (not hour pillar).
 * Source is an external public calendar, not KASI primary-source verification.
 * 12:00 is a synthetic fixed time used solely to exercise the candidate engine.
 */
(function(root, factory) {
  const fixtures = factory();
  if (typeof module === 'object' && module.exports) module.exports = fixtures;
  if (root) root.PopoCalendarFixtures = fixtures;
})(typeof window !== 'undefined' ? window : null, function() {
  'use strict';
  const sourceJan = 'https://datedb.net/tool/conversion/solar_to_lunar/20000101/';
  const sourceFeb = 'https://datedb.net/tool/conversion/solar_to_lunar/20000210/';
  const sourceMar = 'https://datedb.net/tool/conversion/solar_to_lunar/20000310/';
  // The month grids on the linked pages provide the other 2000 dates.
  return Object.freeze({
    version: 'POPO-CALENDAR-REFERENCE-2026-11-02',
    description: 'Korean public almanac reference dates; not full four-pillar certification.',
    fixtures: Object.freeze([
      {date: '2000-01-01', year: '己卯', month: '丙子', day: '戊午', source: sourceJan},
      {date: '2000-01-02', year: '己卯', month: '丙子', day: '己未', source: sourceJan},
      {date: '2000-01-10', year: '己卯', month: '丁丑', day: '丁卯', source: sourceJan},
      {date: '2000-01-22', year: '己卯', month: '丁丑', day: '己卯', source: sourceJan},
      {date: '2000-02-01', year: '己卯', month: '丁丑', day: '己丑', source: sourceFeb},
      {date: '2000-02-02', year: '己卯', month: '丁丑', day: '庚寅', source: sourceFeb},
      {date: '2000-02-10', year: '庚辰', month: '戊寅', day: '戊戌', source: sourceFeb},
      {date: '2000-02-20', year: '庚辰', month: '戊寅', day: '戊申', source: sourceFeb},
      {date: '2000-03-01', year: '庚辰', month: '戊寅', day: '戊午', source: sourceMar},
      {date: '2000-03-02', year: '庚辰', month: '戊寅', day: '己未', source: sourceMar},
      {date: '2000-03-10', year: '庚辰', month: '己卯', day: '丁卯', source: sourceMar},
      {date: '2000-03-20', year: '庚辰', month: '己卯', day: '丁丑', source: sourceMar}
    ]),
    // Test denial paths already enforced in prototype/calc-core.js. This test
    // intentionally does NOT assert that these restrictions are definitive policy.
    rejected: Object.freeze([
      {name: '음력/윤달은 아직 미지원', patch: {calendar: '음력'}},
      {name: '출생 시간 미상은 아직 미지원', patch: {unknownTime: true}},
      {name: '지원하지 않는 출생지', patch: {place: '제주'}},
      {name: '날짜 형식 오류', patch: {date: '2000/01/01'}},
      {name: '존재하지 않는 날짜', patch: {date: '2000-02-30'}},
      {name: '지원 연도 미만', patch: {date: '1989-01-01'}},
      {name: '지원 연도 초과', patch: {date: '2041-01-01'}},
      {name: '절기 경계 보수적 차단', patch: {date: '2000-01-05'}},
      {name: '23시 자시 경계 차단', patch: {time: '23:20'}},
      {name: '00시 자시 경계 차단', patch: {time: '00:30'}},
      {name: '잘못된 시각', patch: {time: '25:90'}}
    ])
  });
});
