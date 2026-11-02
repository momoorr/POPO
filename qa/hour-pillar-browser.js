(function(){
  'use strict';
  const summary=document.getElementById('summary'),scope=document.getElementById('scope'),area=document.getElementById('groups');
  try{
    const report=window.PopoHourReference.run(window.PopoCalcCore,window.Solar?{Solar:window.Solar}:window.lunar,window.PopoCalendarFixtures);
    summary.textContent=`시주 검증 ${report.total}건 · PASS ${report.passed} · FAIL ${report.failed}`;
    summary.dataset.state=report.failed?'fail':'pass';
    scope.textContent=report.scope;
    const groups=new Map();
    report.results.forEach(x=>{if(!groups.has(x.group))groups.set(x.group,[]);groups.get(x.group).push(x);});
    for(const [name,checks] of groups){
      const failures=checks.filter(x=>!x.pass);
      const row=document.createElement('li');row.dataset.state=failures.length?'fail':'pass';
      const label=document.createElement('strong');label.textContent=`${failures.length?'FAIL':'PASS'} | ${name} (${checks.length-failures.length}/${checks.length})`;
      const detail=document.createElement('small');detail.textContent=failures.length?failures.map(x=>`${x.name}: ${x.message}`).join(' / '):checks.map(x=>x.message.split(' ')[1]).slice(0,4).join(' · ')+' 외 시주 일치';
      row.append(label,detail);area.append(row);
    }
  }catch(err){summary.textContent='실행 불가: '+String(err&&err.message||err);summary.dataset.state='fail';scope.textContent='파일 버전 및 스크립트 경로를 확인해 주세요.';}
})();
