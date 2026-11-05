/* POPO Stage 4G — header moon account entry and floating scroll navigation.
 * UI only. No session, credentials, social-login simulation or personal data persistence.
 * The My Page label is available to a future server-verified auth adapter, not via a demo login.
 */
(function(root, factory){
  'use strict';
  const api = factory();
  if(typeof module === 'object' && module.exports)module.exports = api;
  if(root && root.document){
    root.PopoAccountNav = api;
    const start=()=>api.mount(root.document,root);
    if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',start,{once:true});
    else start();
  }
})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  const MENU_ITEMS=Object.freeze([
    ['home','⌂','홈'],
    ['chart','☯','내 사주'],
    ['elements','✿','오행'],
    ['fortune','☾','운세'],
    ['chat','✧','AI 상담']
  ]);
  function authenticatedFromVerifiedSession(s){
    // This determines only UI labels; a future backend MUST still authorize access.
    return !!(s && s.authenticated===true && s.serverVerified===true &&
      typeof s.userId==='string' && s.userId.length>0);
  }
  function node(doc,tag,cls,text){
    const el=doc.createElement(tag);
    if(cls)el.className=cls;
    if(text!==undefined)el.textContent=text;
    return el;
  }
  function moon(doc){
    const svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 40 40');svg.setAttribute('width','30');svg.setAttribute('height','30');
    svg.setAttribute('aria-hidden','true');svg.classList.add('popo-account-moon');
    const arc=doc.createElementNS('http://www.w3.org/2000/svg','path');
    arc.setAttribute('d','M26.5 5.2C19.2 5.5 13.3 11.5 13.3 19.1c0 8.1 6.5 14.5 14.5 14.5 2.6 0 4.8-.7 6.9-1.8C31.6 36.7 26.4 39 20.5 39 10.8 39 3 31.2 3 21.4 3 11.7 10.8 3.8 20.5 3.8c2.2 0 4.2.5 6 1.4Z');
    arc.setAttribute('fill','#ffe3a0');arc.setAttribute('transform','translate(1 -1) scale(.92)');
    const star=doc.createElementNS('http://www.w3.org/2000/svg','path');
    star.setAttribute('d','M29 3.5l1.9 5.9 5.9 1.9-5.9 1.9-1.9 5.9-1.9-5.9-5.9-1.9 5.9-1.9z');
    star.setAttribute('fill','#fff7e1');
    svg.append(arc,star);return svg;
  }
  let mountedInstance=null;
  function mount(doc,win){
    if(!doc || !win)return false;
    const topbar=doc.querySelector('.app-shell .topbar');
    if(!topbar)return false;
    if(doc.getElementById('popo-account-trigger'))return mountedInstance||false;

    // Accessible icon button replaces the old right-aligned guide link without deleting it.
    const account=node(doc,'button','popo-account-trigger');account.id='popo-account-trigger';
    account.type='button';account.setAttribute('aria-haspopup','dialog');
    account.append(moon(doc),node(doc,'span','popo-account-label','로그인'));
    topbar.append(account);

    const dialog=node(doc,'dialog','popo-account-dialog');dialog.id='popo-account-dialog';
    dialog.setAttribute('aria-labelledby','popo-account-heading');
    const card=node(doc,'div','popo-account-sheet');
    const close=node(doc,'button','popo-account-close','×');close.type='button';close.setAttribute('aria-label','닫기');
    const mark=node(doc,'span','popo-account-mark','☾ ✦');
    const heading=node(doc,'h2','','포포의 달빛 로그인');heading.id='popo-account-heading';
    const subtitle=node(doc,'p','popo-account-description',
      '다음에는 로그인해서 사주 기록을 모아볼 수 있도록 준비하고 있어. 지금은 로그인 기능이 아직 연결되지 않았어.');
    const note=node(doc,'p','popo-account-status','계정 기능 · 준비 중');
    const primary=node(doc,'button','popo-account-continue','비회원으로 둘러보기');primary.type='button';
    const privacy=node(doc,'button','popo-account-privacy','서비스 안내 보기');privacy.type='button';
    card.append(close,mark,heading,subtitle,note,primary,privacy);dialog.append(card);doc.body.append(dialog);
    close.addEventListener('click',()=>dialog.close());
    primary.addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
    privacy.addEventListener('click',()=>{
      dialog.close();const existing=doc.getElementById('open-privacy');if(existing)existing.click();
    });
    account.addEventListener('click',()=>{if(!dialog.open)dialog.showModal();});

    const float=node(doc,'aside','popo-float-tools');float.id='popo-float-tools';
    const panel=node(doc,'nav','popo-float-panel');panel.id='popo-float-panel';
    panel.setAttribute('aria-label','빠른 화면 이동');panel.hidden=true;
    const quickBtn=node(doc,'button','popo-float-trigger');quickBtn.id='popo-float-trigger';quickBtn.type='button';
    quickBtn.setAttribute('aria-label','빠른 이동 메뉴 열기');quickBtn.setAttribute('aria-expanded','false');
    quickBtn.setAttribute('aria-controls','popo-float-panel');
    quickBtn.append(node(doc,'span','popo-float-glyph','✦'),node(doc,'span','popo-float-caption','메뉴'));
    function closeMenu(returnFocus){panel.hidden=true;quickBtn.setAttribute('aria-expanded','false');
      quickBtn.setAttribute('aria-label','빠른 이동 메뉴 열기');
      if(returnFocus)quickBtn.focus();}
    function navigate(view){
      // Click an existing routed control so app.js and Stage4F handlers remain authoritative.
      const target=doc.querySelector(`.desktop-nav [data-view="${view}"]`) ||
        doc.querySelector(`.mobile-nav [data-view="${view}"]`);
      closeMenu(false);
      if(target)target.click();
      if(typeof win.scrollTo==='function')win.scrollTo({top:0,behavior:'instant'});
    }
    for(const [view,symbol,label] of MENU_ITEMS){
      const b=node(doc,'button','popo-float-link');b.type='button';
      b.dataset.destination=view;
      b.append(node(doc,'span','popo-float-link-icon',symbol),node(doc,'span','',label));
      b.addEventListener('click',()=>navigate(view));panel.append(b);
    }
    const up=node(doc,'button','popo-float-top','↑ 맨 위로');up.type='button';
    up.addEventListener('click',()=>{
      closeMenu(false);
      const reduced=win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(typeof win.scrollTo==='function')win.scrollTo({top:0,behavior:reduced?'auto':'smooth'});
    });panel.append(up);
    quickBtn.addEventListener('click',()=>{
      const next=panel.hidden;panel.hidden=!next;
      quickBtn.setAttribute('aria-expanded',String(next));
      quickBtn.setAttribute('aria-label',next?'빠른 이동 메뉴 닫기':'빠른 이동 메뉴 열기');
    });
    float.append(panel,quickBtn);doc.body.append(float);
    doc.addEventListener('click',e=>{
      if(!panel.hidden && !float.contains(e.target))closeMenu(false);
    });
    doc.addEventListener('keydown',e=>{
      if(e.key==='Escape' && !panel.hidden){e.preventDefault();closeMenu(true);}
    });
    win.addEventListener('scroll',()=>{float.classList.toggle('has-scrolled',win.scrollY>80);},{passive:true});
    const update=()=>{
      const field=doc.activeElement;
      float.classList.toggle('input-focused',!!(field && field.matches &&
        field.matches('input,textarea,select')));
    };
    doc.addEventListener('focusin',update);
    doc.addEventListener('focusout',()=>win.requestAnimationFrame(update));

    const applyVerifiedSession=session=>{
      const signedIn=authenticatedFromVerifiedSession(session);
      account.querySelector('.popo-account-label').textContent=signedIn?'마이페이지':'로그인';
      account.setAttribute('aria-label',signedIn?'마이페이지 열기':'로그인 안내 열기');
      heading.textContent=signedIn?'포포의 마이페이지':'포포의 달빛 로그인';
      subtitle.textContent=signedIn?'로그인 상태야. 저장한 사주와 기록은 서버 연동이 완료되면 이곳에서 볼 수 있어.':
        '다음에는 로그인해서 사주 기록을 모아볼 수 있도록 준비하고 있어. 지금은 로그인 기능이 아직 연결되지 않았어.';
      note.textContent=signedIn?'계정 메뉴 · 서버 인증 확인됨':'계정 기능 · 준비 중';
      primary.textContent=signedIn?'계속 둘러보기':'비회원으로 둘러보기';
      return signedIn;
    };
    // Not persisted and not a source of authorization. Future actual auth provider must
    // verify with backend before calling this presentation-only adapter.
    mountedInstance=Object.freeze({applyVerifiedSession,account,dialog,quickBtn,panel});
    return mountedInstance;
  }
  function updateFromVerifiedSession(session){
    return mountedInstance ? mountedInstance.applyVerifiedSession(session) : false;
  }
  return {mount,MENU_ITEMS,authenticatedFromVerifiedSession,updateFromVerifiedSession};
});
