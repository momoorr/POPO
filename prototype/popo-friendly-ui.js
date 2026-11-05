/* POPO Stage 4C: keep the local-live chat status clear without altering
 * public demo mode or sending any browser request. The brand is static HTML/CSS.
 */
(function(root, factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root && root.document){
    const start=()=>api.mount(root.document,root.location);
    if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',start,{once:true});
    else start();
  }
})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  function isLocal(loc){return !!(loc && loc.protocol==='http:' &&
    ['localhost','127.0.0.1'].includes(loc.hostname));}
  function mount(doc,loc){
    const isLive=isLocal(loc) && !!doc.getElementById('chat-form') &&
      doc.getElementById('chat-form').dataset.liveMode==='local-only';
    // The public mockup cannot invoke the private API.
    if(!isLive)return false;
    const banner=doc.querySelector('.prototype-disclaimer .proto-spacer');
    const kicker=doc.querySelector('[data-panel="chat"] .page-intro .overline');
    const subtitle=doc.querySelector('.chat-head strong + span');
    if(banner)banner.textContent='· 로컬 AI 상담을 시험하고 있어 · 개인 사주 풀이는 검증 중';
    if(kicker)kicker.textContent='AI CONSULTATION · LOCAL TEST';
    if(subtitle)subtitle.textContent='궁금한 건 포포에게 편하게 물어봐';
    return true;
  }
  return {isLocal,mount};
});
