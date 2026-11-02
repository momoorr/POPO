(function(){
  'use strict';
  const summary=document.getElementById('summary');
  const warning=document.getElementById('risk');
  const list=document.getElementById('results');
  try{
    const report=window.PopoKasiTermCheck.run(
      {Solar:window.Solar||(window.lunar&&window.lunar.Solar)},window.PopoKasiTerms2026);
    summary.textContent='2026 절기 '+report.total+'건 · PASS '+report.passed+' · FAIL '+report.failed;
    summary.dataset.state=report.failed?'fail':'pass';
    const risk=report.boundary;
    warning.textContent= report.rawMismatchCount+'개 절기 모두 보정 전 한국 시각과 5분 이상 차이. '
      +(risk.earlySwitch?'입춘 04:30(KST)은 국내 기준 절입 전인데 라이브러리 원본은 연·월주를 이미 전환함. ':'')
      +'결과가 일치해도 기존 사주 계산을 정식으로 공개하면 안 됩니다.';
    for(const check of report.checks){
      const li=document.createElement('li');li.dataset.state=check.pass?'pass':'fail';
      const heading=document.createElement('strong');heading.textContent=(check.pass?'PASS':'FAIL')+' | '+check.name+' · KASI '+check.source;
      const sub=document.createElement('span');sub.textContent=check.raw?
        '원본 '+check.raw+' / 검증용 +60분 → '+check.corrected+(check.error?' / '+check.error:''):
        check.error;
      li.append(heading,sub);list.appendChild(li);
    }
    document.getElementById('scope').textContent=report.scope;
  }catch(e){summary.textContent='검증 실행 불가: '+String(e&&e.message||e);summary.dataset.state='fail';warning.textContent='원인 확인 전까지 계산 엔진 승인 불가.';}
})();
