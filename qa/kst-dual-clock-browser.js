(function() {
  'use strict';
  const summary = document.getElementById('summary');
  const list = document.getElementById('results');
  try {
    const api = window.PopoKstClockExperiment;
    const engine = window.Solar || (window.lunar && window.lunar.Solar);
    const results = api.report(engine, window.PopoKasiTerms2026);
    summary.textContent = '2026년 절입 12건 + 보호 검사 4건 · PASS ' + results.passed + ' · FAIL ' + results.failed;
    summary.dataset.status = results.failed ? 'fail' : 'pass';
    document.getElementById('scope').textContent = results.scope;
    for (const item of results.rows) {
      const row = document.createElement('li');
      row.dataset.status = item.pass ? 'pass' : 'fail';
      const title = document.createElement('strong');
      title.textContent = (item.pass ? 'PASS' : 'FAIL') + ' | ' + item.label + ' · KST ' + item.kst;
      const detail = document.createElement('small');
      detail.textContent = '2분 전: ' + item.beforePillars.year + ' ' + item.beforePillars.month
        + ' → 2분 후: ' + item.afterPillars.year + ' ' + item.afterPillars.month
        + ' | 원본 조기 전환 ' + (item.prematureRaw ? '확인' : '미확인')
        + ' | 일·시주 원본 유지 ' + (item.respectsDateAndHour ? '확인' : '실패');
      row.append(title, detail);
      list.appendChild(row);
    }
    for (const item of results.checks) {
      const row = document.createElement('li');
      row.dataset.status = item.pass ? 'pass' : 'fail';
      const title = document.createElement('strong');
      title.textContent = (item.pass ? 'PASS' : 'FAIL') + ' | ' + item.label;
      row.append(title);
      list.appendChild(row);
    }
  } catch (error) {
    summary.textContent = '실행 불가: ' + String(error && error.message || error);
    summary.dataset.status = 'fail';
  }
})();
