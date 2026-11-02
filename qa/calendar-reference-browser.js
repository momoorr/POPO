(function(){
  'use strict';
  const area = document.getElementById('results');
  const summary = document.getElementById('summary');
  try {
    const report = window.PopoCalendarCheck.run(
      window.PopoCalcCore,
      window.Solar ? {Solar: window.Solar} : window.lunar,
      window.PopoCalendarFixtures
    );
    summary.textContent = `검증 ${report.total}건 · PASS ${report.passed} · FAIL ${report.failed}`;
    summary.dataset.state = report.failed ? 'fail' : 'pass';
    for(const t of report.results){
      const li=document.createElement('li');
      const strong=document.createElement('strong');
      strong.textContent = `${t.pass ? 'PASS' : 'FAIL'} | ${t.name}`;
      const detail=document.createElement('small');
      detail.textContent = t.message;
      li.dataset.state=t.pass?'pass':'fail';
      li.append(strong,detail);
      area.appendChild(li);
    }
    const note=document.getElementById('scope');
    note.textContent=report.scope;
  } catch(err){
    summary.textContent='실행 불가: '+String(err && err.message||err);
    summary.dataset.state='fail';
  }
})();
