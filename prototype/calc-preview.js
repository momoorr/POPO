/* Existing chart and five-elements illustration remain demo-only.
 * This module renders an explicitly unverified library candidate alongside them.
 */
(function(){
  'use strict';
  const byId=id=>document.getElementById(id);
  const core=window.PopoCalcCore;
  const btn=byId('calc-beta-trigger');
  if(!core||!btn)return;
  const output=byId('calc-beta-output');
  const message=byId('calc-beta-message');
  const pillars=byId('calc-beta-pillars');
  const counts=byId('calc-beta-counts');
  const follow=byId('calc-beta-explore');
  const summary=byId('calc-element-summary');
  const summaryValues=byId('calc-element-values');
  let lastCandidate=null;
  function clearChildren(node){node.replaceChildren();}
  function showError(text){
    lastCandidate=null;
    output.hidden=false;output.dataset.state='error';message.textContent=text;
    clearChildren(pillars);clearChildren(counts);follow.hidden=true;
    summary.hidden=true;clearChildren(summaryValues);
  }
  function render(result){
    output.hidden=false;output.dataset.state='success';
    message.textContent=result.displayLabel+' · '+result.engine+' / 정책 '+result.version;
    clearChildren(pillars);clearChildren(counts);
    for(const [key,title] of [['year','년주'],['month','월주'],['day','일주'],['hour','시주']]){
      const li=document.createElement('li');
      const name=document.createElement('strong');name.textContent=title+' ';
      li.append(name,document.createTextNode(result.pillars[key]));pillars.append(li);
    }
    for(const key of core.ORDER){
      const span=document.createElement('span');span.className='calc-element-chip';
      span.textContent=core.LABELS[key]+' '+result.counts[key]+'개';counts.append(span);
    }
    follow.hidden=false;
    summary.hidden=false;
    clearChildren(summaryValues);
    for(const key of core.ORDER){
      const span=document.createElement('span');span.className='calc-element-chip';
      span.textContent=core.LABELS[key]+' '+result.counts[key]+'개';summaryValues.append(span);
    }
    lastCandidate=result;
  }
  // Changing any source input invalidates the in-memory candidate result.
  for(const id of ['calendar-type','birthday','birthtime','unknown-time','birthplace','leap-month']){
    const field=byId(id);
    if(!field)continue;
    for(const evt of ['input','change'])field.addEventListener(evt,()=>{
      if(!lastCandidate && output.hidden)return;
      lastCandidate=null;
      output.hidden=true;
      summary.hidden=true;
      clearChildren(summaryValues);
      clearChildren(pillars);
      clearChildren(counts);
    });
  }
  btn.addEventListener('click',()=>{
    const locationOption=byId('birthplace').selectedOptions[0];
    const data={
      calendar:byId('calendar-type').value,date:byId('birthday').value,
      time:byId('birthtime').value,unknownTime:byId('unknown-time').checked,
      place:locationOption?locationOption.textContent:''
    };
    try{
      const api=window.Solar?{Solar:window.Solar}:(window.lunar&&window.lunar.Solar?window.lunar:null);
      const result=core.calculateCandidate(data,api);render(result);
    }catch(err){showError(err && err.message?err.message:'계산 후보 실행 중 오류가 발생했습니다.');}
  });
  follow.addEventListener('click',()=>{
    if(!lastCandidate)return;
    byId('birth-dialog').close();
    // reuses existing view router; no replacement of the chart's sample pillars.
    if(typeof window.showView==='function')window.showView('elements');
    else{const link=document.querySelector('[data-view="elements"]');if(link)link.click();}
  });
  // Do not persist raw input, calculated pillars, or selection to storage or network.
})();
