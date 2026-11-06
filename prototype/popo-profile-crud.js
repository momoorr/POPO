/* POPO Stage 5C.4 — return to the originating screen and refresh the vault after writes.
 * Builds its own accessible dialog and reuses Stage 5B's Supabase Auth client.
 * Never writes reports, stores tokens, or exposes service_role credentials.
 */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object' && module.exports)module.exports=api;
  if(root && root.document){
    root.PopoProfileCrud=api;
    const start=()=>api.mount(root.document,root);
    if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',start,{once:true});
    else start();
  }
})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  const MAX_PROFILES=5; // UI limit only; Stage 5A does not enforce a DB quota.
  const PAGE_SIZE=20;
  const REQUEST_TIMEOUT_MS=15000;
  const RELATIONS=Object.freeze([
    {value:'self',label:'본인'},
    {value:'partner',label:'연인'},
    {value:'family',label:'가족'},
    {value:'friend',label:'친구'},
    {value:'other',label:'기타 (직접 입력)'}
  ]);
  const REGIONS=Object.freeze([
    '서울특별시','부산광역시','대구광역시','인천광역시','대전광역시','울산광역시',
    '세종특별자치시','전남광주통합특별시','경기도','강원특별자치도','충청북도',
    '충청남도','전북특별자치도','경상북도','경상남도','제주특별자치도',
    '광주광역시','전라남도'
  ]);
  const SELECT_COLUMNS='id,user_id,display_name,relationship,relationship_custom,calendar_type,leap_month,birth_date,birth_time,birth_time_unknown,birth_region,gender,created_at';
  const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const el=(doc,tag,cls,txt)=>{
    const n=doc.createElement(tag);if(cls)n.className=cls;
    if(txt!==undefined)n.textContent=txt;
    return n;
  };
  function option(doc,value,label){const o=doc.createElement('option');o.value=value;o.textContent=label;return o;}
  function field(doc,labelText,id,child){
    const wrap=el(doc,'div','popo-profile-field');
    const label=el(doc,'label','',labelText);label.htmlFor=id;
    child.id=id;wrap.append(label,child);return wrap;
  }
  function validDate(s){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(s)))return false;
    const y=Number(s.slice(0,4));if(y<1900||y>2100)return false;
    const date=new Date(s+'T00:00:00.000Z');
    return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===s;
  }
  function normalizeProfile(value){
    const data={
      display_name:String(value.display_name||'').trim(),
      relationship:String(value.relationship||''),
      relationship_custom:null,
      calendar_type:String(value.calendar_type||''),
      leap_month:!!value.leap_month,
      birth_date:String(value.birth_date||''),
      birth_time:null,
      birth_time_unknown:!!value.birth_time_unknown,
      birth_region:String(value.birth_region||''),
      gender:String(value.gender||'unknown')
    };
    if(!data.display_name||data.display_name.length>40)throw new Error('이름은 1~40자로 입력해 줘.');
    if(!RELATIONS.some(item=>item.value===data.relationship))throw new Error('나와의 관계를 선택해 줘.');
    if(data.relationship==='other'){
      const custom=String(value.relationship_custom||'').trim();
      if(!custom||custom.length>40)throw new Error('기타 관계를 1~40자로 입력해 줘.');
      data.relationship_custom=custom;
    }
    if(!['solar','lunar'].includes(data.calendar_type))throw new Error('양력 또는 음력을 선택해 줘.');
    if(data.calendar_type!=='lunar')data.leap_month=false;
    if(data.calendar_type==='lunar' && /^\d{4}-02-30$/.test(data.birth_date))
      throw new Error('음력 2월 30일은 현재 저장 형식에서 지원하지 않아. 다른 날짜로 바꿔 저장하지 말아 줘.');
    if(!validDate(data.birth_date) || (data.calendar_type==='lunar' && Number(data.birth_date.slice(8))>30))
      throw new Error('올바른 생년월일을 선택해 줘.');
    if(!data.birth_time_unknown){
      const time=String(value.birth_time||'');
      if(!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time))throw new Error('출생 시간을 입력하거나 ‘시간 모름’을 체크해 줘.');
      data.birth_time=time;
    }
    if(!REGIONS.includes(data.birth_region))throw new Error('출생지역을 선택해 줘.');
    if(!['male','female','unknown'].includes(data.gender))throw new Error('성별을 다시 선택해 줘.');
    return data;
  }
  function displayRelation(row){
    const selected=RELATIONS.find(item=>item.value===row.relationship);
    return row.relationship==='other' ? String(row.relationship_custom||'기타') : (selected?selected.label:'기타');
  }
  function failureText(error,action){
    const code=error && error.code;
    if(code==='42501'||code==='PGRST301')return '접근 권한을 확인할 수 없어. 다시 로그인해 줘.';
    if(code==='23514'||code==='22P02')return '입력값을 다시 확인해 줘.';
    return action+'에 실패했어. 연결 상태를 확인하고 다시 시도해 줘.';
  }
  async function verifiedUser(client){
    if(!client||!client.auth||typeof client.auth.getUser!=='function')throw new Error('로그인 연결을 확인하고 다시 시도해 줘.');
    const res=await client.auth.getUser();
    const u=res&&res.data&&res.data.user;
    if(!u||res.error||u.is_anonymous===true||typeof u.id!=='string'||!UUID.test(u.id))throw new Error('카카오 로그인이 필요해. 다시 로그인해 줘.');
    return u;
  }
  function timeParts(value){
    if(!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(value||'')))return {period:null,hour:null,minute:null};
    const [h,m]=value.split(':').map(Number);
    return {period:h<12?'am':'pm',hour:h%12||12,minute:m};
  }
  function composeTime(parts){
    if(!parts||!['am','pm'].includes(parts.period)||!Number.isInteger(parts.hour)||parts.hour<1||parts.hour>12||
       !Number.isInteger(parts.minute)||parts.minute<0||parts.minute>59)return null;
    const hour=parts.hour%12+(parts.period==='pm'?12:0);
    return String(hour).padStart(2,'0')+':'+String(parts.minute).padStart(2,'0');
  }
  function displayTime(value){
    const p=timeParts(value);if(!composeTime(p))return '시간을 선택해 줘';
    return `${p.period==='am'?'오전':'오후'} ${String(p.hour).padStart(2,'0')}시 ${String(p.minute).padStart(2,'0')}분`;
  }
  function mount(doc,win){
    if(!doc||!win||!win.PopoProfileDisplay||doc.getElementById('popo-profile-manager'))return false;
    const get=()=>win.PopoKakaoAuth&&typeof win.PopoKakaoAuth.getClient==='function' ?win.PopoKakaoAuth.getClient():null;
    const dialog=el(doc,'dialog','popo-profile-manager');dialog.id='popo-profile-manager';
    dialog.setAttribute('aria-labelledby','popo-profile-title');
    const sheet=el(doc,'div','popo-profile-sheet');
    const head=el(doc,'header','popo-profile-head');
    const headerCopy=el(doc,'div','popo-profile-head-copy');
    headerCopy.append(el(doc,'span','popo-profile-eyebrow','MY MOONLIGHT RECORDS'));
    const title=el(doc,'h2','','나의 사주 보관함');title.id='popo-profile-title';headerCopy.append(title);
    const close=el(doc,'button','popo-profile-close','×');close.type='button';close.setAttribute('aria-label','마이페이지로 돌아가기');
    head.append(headerCopy,close);
    const intro=el(doc,'p','popo-profile-intro','나와 소중한 사람의 출생정보를 모아두자. 다른 사람의 정보는 허락받은 내용만 입력해 줘.');
    const message=el(doc,'p','popo-profile-message');message.id='popo-profile-message';message.setAttribute('role','status');message.setAttribute('aria-live','polite');message.hidden=true;
    const listSection=el(doc,'section','popo-profile-list-section');
    const count=el(doc,'p','popo-profile-count','저장 목록 불러오는 중...');count.id='popo-profile-count';count.tabIndex=-1;
    const list=el(doc,'ul','popo-profile-list');list.id='popo-profile-list';
    const add=el(doc,'button','popo-profile-add','✦ 새 사주 등록하기');add.type='button';add.id='popo-profile-add';
    const listHint=el(doc,'p','popo-profile-hint','로그인한 계정에서만 사주 목록을 볼 수 있어. 한 계정당 우선 5명까지 등록할 수 있도록 화면을 구성했어.');
    // No routine refresh button. Recovery is offered only after a failed read.
    const retry=el(doc,'button','popo-profile-retry','다시 연결하기');retry.type='button';retry.hidden=true;
    const more=el(doc,'button','popo-profile-more','더 불러오기');more.type='button';more.hidden=true;
    listSection.append(count,list,retry,more,add,listHint);

    const form=el(doc,'form','popo-profile-form');form.id='popo-profile-form';form.hidden=true;form.noValidate=true;
    const formTitle=el(doc,'h3','popo-profile-form-title','새 사주 등록');
    const name=el(doc,'input');name.type='text';name.maxLength=40;name.required=true;name.autocomplete='off';name.placeholder='예: 별토끼';
    const relation=el(doc,'select');relation.required=true;
    for(const item of RELATIONS)relation.append(option(doc,item.value,item.label));
    const custom=el(doc,'input');custom.type='text';custom.maxLength=40;custom.placeholder='예: 동료, 지인';
    const customWrap=field(doc,'기타 관계 직접 입력','popo-profile-custom',custom);customWrap.hidden=true;
    const calendar=el(doc,'select');calendar.append(option(doc,'solar','양력'),option(doc,'lunar','음력'));
    const leapWrap=el(doc,'label','popo-profile-check');leapWrap.hidden=true;
    const leap=el(doc,'input');leap.type='checkbox';leapWrap.append(leap,el(doc,'span','','음력 윤달'));
    const date=el(doc,'input');date.type='date';date.min='1900-01-01';date.max='2100-12-31';date.required=true;
    const time=el(doc,'input');time.type='hidden';time.id='popo-profile-time';
    const timeTrigger=el(doc,'button','popo-profile-time-trigger','시간을 선택해 줘');timeTrigger.type='button';
    timeTrigger.setAttribute('aria-haspopup','dialog');timeTrigger.setAttribute('aria-controls','popo-time-picker');
    const unknownWrap=el(doc,'label','popo-profile-check');
    const unknown=el(doc,'input');unknown.type='checkbox';unknown.id='popo-profile-time-unknown';unknownWrap.append(unknown,el(doc,'span','','태어난 시간 모름'));
    const gender=el(doc,'select');
    gender.append(option(doc,'unknown','모름'),option(doc,'female','여성'),option(doc,'male','남성'));
    const region=el(doc,'select');region.required=true;region.append(option(doc,'','출생지역을 선택해 주세요'));
    // Match the existing 18 choice values in Stage 5B.1, regardless of their labels.
    const original=doc.getElementById('birthplace');
    if(original&&original.options){
      for(const item of Array.from(original.options))if(REGIONS.includes(item.value)&& !Array.from(region.options).some(o=>o.value===item.value))region.append(option(doc,item.value,item.textContent));
    }
    for(const value of REGIONS)if(!Array.from(region.options).some(o=>o.value===value))region.append(option(doc,value,value));
    const formNote=el(doc,'p','popo-profile-form-note','이 화면은 출생정보를 보관해. 시간·지역에 따른 실제 사주 계산과 AI 풀이는 아직 이 저장 단계에 연결되지 않았어.');
    const actions=el(doc,'div','popo-profile-actions');
    const cancel=el(doc,'button','popo-profile-cancel','취소');cancel.type='button';
    const save=el(doc,'button','popo-profile-save','이 정보 저장하기');save.type='submit';
    actions.append(cancel,save);
    form.append(formTitle,field(doc,'이름','popo-profile-name',name),
      field(doc,'나와의 관계','popo-profile-relationship',relation),customWrap,
      field(doc,'날짜 기준','popo-profile-calendar',calendar),leapWrap,
      field(doc,'생년월일','popo-profile-date',date),
      field(doc,'태어난 시간','popo-profile-time-trigger',timeTrigger),time,unknownWrap,
      field(doc,'성별','popo-profile-gender',gender),
      field(doc,'출생지역','popo-profile-region',region),formNote,actions);
    sheet.append(head,intro,message,listSection,form);dialog.append(sheet);doc.body.append(dialog);

    let currentUserId=null, rows=[], editId=null, pendingCreateId=null;
    let generation=0, readSerial=0, busy=false, loaded=false, hasMore=false, hookedClient=null;
    let returnFocus=null, returnAccount=false, returnNotice='', returnOwner=null;
    let formReturn='vault', vaultScrollTop=0, vaultFocusId=null, syncNotice='', retryAppend=false;
    // A native time input cannot reliably close its platform-specific popup.
    // Own the picker lifecycle, leaving the entire form inert while it is open.
    const picker=el(doc,'dialog','popo-time-picker');picker.id='popo-time-picker';
    picker.setAttribute('aria-labelledby','popo-time-title');picker.setAttribute('aria-describedby','popo-time-hint');
    const pickerSheet=el(doc,'div','popo-time-sheet');
    const pickerHead=el(doc,'header','popo-time-head');
    const pickerTitle=el(doc,'h2','','태어난 시간을 골라줘');pickerTitle.id='popo-time-title';
    const pickerClose=el(doc,'button','popo-time-close','×');pickerClose.type='button';pickerClose.setAttribute('aria-label','시간 선택 취소');
    pickerHead.append(pickerTitle,pickerClose);
    const pickerHint=el(doc,'p','popo-time-hint','오전·오후 → 시 → 분 순서로 골라줘. 분까지 고르면 자동으로 닫혀.');pickerHint.id='popo-time-hint';
    const pickerPreview=el(doc,'p','popo-time-preview');pickerPreview.setAttribute('aria-live','polite');
    const steps=el(doc,'div','popo-time-steps');steps.setAttribute('role','group');steps.setAttribute('aria-label','시간 선택 단계');
    const pickerChoices=el(doc,'div','popo-time-choices');
    const pickerActions=el(doc,'div','popo-time-actions');
    const pickerCancel=el(doc,'button','popo-time-cancel','취소');pickerCancel.type='button';
    const pickerConfirm=el(doc,'button','popo-time-confirm','선택 완료');pickerConfirm.type='button';
    pickerActions.append(pickerCancel,pickerConfirm);
    pickerSheet.append(pickerHead,pickerHint,pickerPreview,steps,pickerChoices,pickerActions);picker.append(pickerSheet);doc.body.append(picker);
    let draftTime=timeParts(''), step='period', pickerOwner=null;
    const stepButtons={};
    for(const [key,label] of [['period','1. 오전·오후'],['hour','2. 시'],['minute','3. 분']]){
      const b=el(doc,'button','popo-time-step',label);b.type='button';b.dataset.timeStep=key;
      b.addEventListener('click',()=>{step=key;renderPicker();focusPicker();});steps.append(b);stepButtons[key]=b;
    }
    function focusPicker(){
      const target=pickerChoices.querySelector('[aria-pressed="true"]')||pickerChoices.querySelector('button');
      if(target){target.focus({preventScroll:true});target.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});}
    }
    function renderPicker(){
      pickerPreview.textContent=composeTime(draftTime)?displayTime(composeTime(draftTime)):
        `${draftTime.period?(draftTime.period==='am'?'오전':'오후'):'오전·오후'}  ${draftTime.hour===null?'--':String(draftTime.hour).padStart(2,'0')}시  ${draftTime.minute===null?'--':String(draftTime.minute).padStart(2,'0')}분`;
      pickerConfirm.disabled=!composeTime(draftTime);
      for(const key of Object.keys(stepButtons)){
        stepButtons[key].setAttribute('aria-pressed',String(key===step));
        stepButtons[key].disabled=key==='hour'&&!draftTime.period||key==='minute'&&(!draftTime.period||draftTime.hour===null);
      }
      pickerChoices.replaceChildren();pickerChoices.dataset.step=step;
      pickerChoices.setAttribute('role','group');pickerChoices.setAttribute('aria-label',step==='period'?'오전 또는 오후':step==='hour'?'시 선택':'분 선택');
      const values=step==='period'?['am','pm']:step==='hour'?Array.from({length:12},(_,i)=>i+1):Array.from({length:60},(_,i)=>i);
      for(const value of values){
        const label=step==='period'?(value==='am'?'오전':'오후'):String(value).padStart(2,'0')+(step==='hour'?'시':'분');
        const b=el(doc,'button','popo-time-choice',label);b.type='button';b.dataset.value=String(value);
        b.setAttribute('aria-pressed',String(draftTime[step]===value));
        b.addEventListener('click',event=>{
          event.preventDefault();event.stopPropagation();
          if(!dialog.open||!picker.open||busy||currentUserId!==pickerOwner)return;
          draftTime[step]=value;
          if(step==='minute'){commitTime();return;}
          step=step==='period'?'hour':'minute';renderPicker();focusPicker();
        });pickerChoices.append(b);
      }
      pickerChoices.scrollTop=0;
    }
    function commitTime(){
      const value=composeTime(draftTime);
      if(!value||!dialog.open||!picker.open||busy||pickerOwner!==currentUserId)return;
      time.value=value;unknown.checked=false;toggleDependencies();picker.close('applied');
    }
    timeTrigger.addEventListener('click',()=>{
      if(busy||unknown.checked||!dialog.open||picker.open)return;
      draftTime=timeParts(time.value);step='period';pickerOwner=currentUserId;
      renderPicker();picker.showModal();focusPicker();
    });
    pickerConfirm.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();commitTime();});
    for(const b of [pickerCancel,pickerClose])b.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();picker.close('cancel');});
    picker.addEventListener('cancel',event=>{event.preventDefault();event.stopPropagation();picker.close('cancel');});
    picker.addEventListener('close',()=>{
      draftTime=timeParts('');pickerOwner=null;
      if(dialog.open&&!timeTrigger.disabled)timeTrigger.focus({preventScroll:true});
    });
    const controls=Array.from(form.querySelectorAll('input,select,button'));
    const current=ticket=>dialog.open && ticket===generation;
    const quietFailure=()=>new Error('POPO_STALE_SESSION');
    const tell=(s,error=false)=>{message.hidden=false;message.textContent=s;message.classList.toggle('is-error',error);};
    const silence=()=>{message.hidden=true;message.textContent='';message.classList.remove('is-error');};
    const toggleForm=visible=>{
      form.hidden=!visible;listSection.hidden=visible;
      close.setAttribute('aria-label',visible&&formReturn==='vault'?'사주 보관함으로 돌아가기':'마이페이지로 돌아가기');
    };
    const focusList=(ticket,id=null,position=0)=>{
      win.requestAnimationFrame(()=>{
        if(!current(ticket)||!form.hidden||busy)return;
        dialog.scrollTop=position;
        const row=id?Array.from(list.children).find(item=>item.dataset.profileId===id):null;
        const target=row&&row.querySelector('.popo-profile-item-actions button');
        (target&&!target.disabled?target:count).focus({preventScroll:true});
      });
    };
    const toggleDependencies=()=>{
      customWrap.hidden=relation.value!=='other';custom.required=relation.value==='other';
      leapWrap.hidden=calendar.value!=='lunar';
      if(calendar.value!=='lunar')leap.checked=false;
      time.disabled=busy||unknown.checked;
      timeTrigger.disabled=busy||unknown.checked;
      if(unknown.checked){time.value='';if(picker.open)picker.close('unknown');}
      timeTrigger.textContent=unknown.checked?'시간 모름':displayTime(time.value);
      timeTrigger.classList.toggle('has-value',!!time.value&&!unknown.checked);
      formNote.textContent=calendar.value==='lunar'
        ?'입력한 음력 날짜를 변환하지 않고 보관해. 현재 음력 2월 30일은 저장 형식 확장 전이라 지원하지 않아. 실제 계산과 풀이는 다음 단계에서 연결할게.'
        :'지금은 출생정보만 저장해. 실제 만세력·오행 계산과 사주 풀이는 다음 단계에서 연결할게.';
    };
    const lock=value=>{
      busy=value;for(const c of controls)c.disabled=value;
      close.disabled=value;retry.disabled=value;more.disabled=value||!loaded;
      for(const b of list.querySelectorAll('button'))b.disabled=value||!loaded;
      add.disabled=value||!loaded||rows.length>=MAX_PROFILES;
      form.setAttribute('aria-busy',String(value));toggleDependencies();
    };
    const clearPersonal=()=>{
      if(picker.open)picker.close('session-cleared');
      generation++;readSerial++;currentUserId=null;rows=[];editId=null;pendingCreateId=null;
      loaded=false;hasMore=false;list.replaceChildren();form.reset();
      name.value='';date.value='';time.value='';custom.value='';region.value='';
      // Cleared below before any account can open the sheet again.
      count.textContent='저장 목록 확인 전';more.hidden=true;retry.hidden=true;
      formReturn='vault';vaultScrollTop=0;vaultFocusId=null;syncNotice='';retryAppend=false;
      listSection.setAttribute('aria-busy','false');toggleDependencies();
    };
    const hook=client=>{
      if(hookedClient===client||!client.auth.onAuthStateChange)return;
      hookedClient=client;
      client.auth.onAuthStateChange((event,session)=>{
        const incoming=session&&session.user&&session.user.id;
        if(event==='SIGNED_OUT'||event==='USER_DELETED'||
            (currentUserId&&incoming&&incoming!==currentUserId)){
          returnAccount=false;returnNotice='';returnOwner=null;
          clearPersonal();if(dialog.open)dialog.close();
        }
      });
    };
    async function deadline(promise){
      let timer;
      try{return await Promise.race([promise,new Promise((_,reject)=>{
        timer=win.setTimeout(()=>reject(new Error('POPO_REQUEST_TIMEOUT')),REQUEST_TIMEOUT_MS);
      })]);}finally{win.clearTimeout(timer);}
    }
    async function access(ticket,expectedOwner){
      if(!current(ticket))throw quietFailure();
      const client=get();
      if(!client)throw new Error('카카오 로그인이 필요해. 다시 로그인해 줘.');
      hook(client);
      const user=await deadline(verifiedUser(client));
      if(!current(ticket))throw quietFailure();
      if(expectedOwner && user.id!==expectedOwner){
        returnAccount=false;returnNotice='';returnOwner=null;
        clearPersonal();if(dialog.open)dialog.close();throw quietFailure();
      }
      currentUserId=user.id;
      return {client,user};
    }
    const fromForm=()=>normalizeProfile({
      display_name:name.value,relationship:relation.value,relationship_custom:custom.value,
      calendar_type:calendar.value,leap_month:leap.checked,birth_date:date.value,
      birth_time:time.value,birth_time_unknown:unknown.checked,birth_region:region.value,gender:gender.value
    });
    const resetForm=(row,origin='vault')=>{
      if(!loaded||busy)return;
      formReturn=origin==='account'?'account':'vault';
      if(formReturn==='vault'){vaultScrollTop=dialog.scrollTop;vaultFocusId=row?row.id:null;}
      syncNotice='';retry.hidden=true;
      editId=row?row.id:null;pendingCreateId=null;
      formTitle.textContent=row?'사주 정보 수정':'새 사주 등록';
      save.textContent=row?'수정 내용 저장하기':'이 정보 저장하기';
      name.value=row?row.display_name:'';
      relation.value=row?row.relationship:'self';custom.value=row?row.relationship_custom||'':'';
      calendar.value=row?row.calendar_type:'solar';leap.checked=!!(row&&row.leap_month);
      date.value=row?row.birth_date:'';unknown.checked=row?!!row.birth_time_unknown:false;
      time.value=row&&row.birth_time?String(row.birth_time).slice(0,5):'';
      gender.value=row?row.gender:'unknown';region.value=row?row.birth_region||'':'';
      toggleDependencies();toggleForm(true);silence();name.focus();
    };
    const render=()=>{
      list.replaceChildren();
      count.textContent=`저장한 사주 ${rows.length}개${hasMore?' 이상':''}`;
      for(const row of rows){
        const li=el(doc,'li','popo-profile-item');li.dataset.profileId=row.id;
        const info=win.PopoProfileDisplay.createInfo(doc,row);
        const tools=el(doc,'div','popo-profile-item-actions');
        const edit=el(doc,'button','','수정');edit.type='button';edit.setAttribute('aria-label',`${row.display_name} 사주 수정`);
        edit.disabled=busy;edit.addEventListener('click',()=>{if(!busy)resetForm(row);});
        const del=el(doc,'button','popo-profile-remove','삭제');del.type='button';del.setAttribute('aria-label',`${row.display_name} 사주 삭제`);
        del.disabled=busy;del.addEventListener('click',()=>{if(!busy)void removeRow(row);});
        tools.append(edit,del);li.append(info,tools);list.append(li);
      }
      if(!rows.length)list.append(el(doc,'li','popo-profile-empty','아직 저장한 사주가 없어. 첫 사주를 등록해 봐!'));
      more.hidden=!hasMore;add.disabled=busy||!loaded||rows.length>=MAX_PROFILES;
      listHint.textContent=rows.length>=MAX_PROFILES
        ?'현재 화면에서는 새 사주를 5명까지 등록할 수 있어. 이미 저장된 정보는 계속 수정·삭제할 수 있어.'
        :'저장된 사주를 수정하거나 삭제할 수 있어. 삭제하면 연결된 사주·궁합 결과도 함께 삭제될 수 있어.';
    };
    async function reload(ticket=generation,append=false){
      const serial=++readSerial;
      const expectedOwner=currentUserId;
      loaded=false;add.disabled=true;retry.disabled=true;retry.hidden=true;more.disabled=true;
      retryAppend=append;listSection.setAttribute('aria-busy','true');
      if(!append){list.replaceChildren(el(doc,'li','popo-profile-empty','사주 목록을 불러오는 중...'));count.textContent='저장 목록 확인 중';}
      try{
        const {client,user}=await access(ticket,expectedOwner);
        const start=append?rows.length:0;
        const {data,error}=await deadline(client.from('popo_profiles').select(SELECT_COLUMNS)
          .eq('user_id',user.id).order('created_at',{ascending:false}).order('id',{ascending:false})
          .range(start,start+PAGE_SIZE));
        if(!current(ticket)||serial!==readSerial)return false;
        if(error)throw error;
        if(!Array.isArray(data)||data.some(row=>!row||row.user_id!==user.id||!UUID.test(String(row.id))))
          throw new Error('POPO_INVALID_OWNER_ROWS');
        hasMore=data.length>PAGE_SIZE;
        rows=append?rows.concat(data.slice(0,PAGE_SIZE)):data.slice(0,PAGE_SIZE);
        loaded=true;retry.hidden=true;render();return true;
      }catch(err){
        if(!current(ticket)||serial!==readSerial)return false;
        if(!append){rows=[];list.replaceChildren();count.textContent='목록을 불러오지 못했어.';}
        retry.hidden=false;
        tell((syncNotice?syncNotice+' ':'')+'사주 목록을 읽지 못했어. 연결 상태를 확인한 뒤 다시 연결해 줘.',true);
        return false;
      }finally{
        if(current(ticket)&&serial===readSerial){retry.disabled=busy;more.disabled=busy||!loaded;listSection.setAttribute('aria-busy','false');}
      }
    }
    async function openManager(mode='list'){
      if(dialog.open)return;
      const client=get();
      if(!client){
        const feedback=doc.getElementById('popo-auth-feedback');
        if(feedback){feedback.hidden=false;feedback.textContent='로그인 연결을 확인할 수 없어. 다시 로그인해 줘.';}
        return;
      }
      returnFocus=doc.activeElement;returnAccount=false;returnNotice='';returnOwner=null;
      const acct=doc.getElementById('popo-account-dialog');if(acct&&acct.open)acct.close();
      clearPersonal();dialog.showModal();toggleForm(false);silence();lock(false);
      const ticket=generation;
      const ok=await reload(ticket);
      if(ok&&current(ticket)&&mode==='new'&&rows.length<MAX_PROFILES)resetForm(null,'account');
    }
    // After a confirmed write, refresh only the vault. Never reopen My Page here.
    async function refreshAfterWrite(ticket,notice,id=null,position=0){
      syncNotice=notice;
      toggleForm(false);
      const refreshed=await reload(ticket);
      if(current(ticket)){
        if(refreshed)tell(notice);
        focusList(ticket,id,position);
      }
      return refreshed;
    }
    async function returnToVault(){
      if(busy||!dialog.open)return;
      const ticket=generation,focusId=vaultFocusId,position=vaultScrollTop;
      editId=null;pendingCreateId=null;formReturn='vault';syncNotice='';
      form.reset();name.value='';custom.value='';date.value='';time.value='';region.value='';
      toggleDependencies();toggleForm(false);silence();
      await reload(ticket);focusList(ticket,focusId,position);
    }
    async function removeRow(row){
      if(!row||!UUID.test(row.id)||busy||!loaded)return;
      if(!win.confirm(`${row.display_name}님의 출생정보를 삭제할까? 연결된 사주·궁합 결과도 함께 삭제돼. 이 작업은 되돌릴 수 없어.`))return;
      const ticket=generation,expectedOwner=currentUserId,position=dialog.scrollTop;
      const index=rows.findIndex(item=>item.id===row.id);
      const next=rows[index+1]||rows[index-1];
      lock(true);silence();syncNotice='';
      try{
        const {client,user}=await access(ticket,expectedOwner);
        if(row.user_id!==user.id)throw quietFailure();
        const {data,error}=await deadline(client.from('popo_profiles').delete().eq('user_id',user.id)
          .eq('id',row.id).select('id').single());
        if(!current(ticket))return;
        if(error||!data||data.id!==row.id)throw error||new Error('POPO_DELETE_UNCONFIRMED');
        await refreshAfterWrite(ticket,'사주 정보를 삭제했어.',next?next.id:null,position);
      }catch(err){
        if(current(ticket)){
          // A lost reply is not proof of failure. Read again before another delete.
          syncNotice='삭제 완료 여부는 확인하지 못했어.';
          const refreshed=await reload(ticket);
          if(refreshed&&current(ticket))tell(syncNotice+' 최신 목록에서 확인해 줘.',true);
        }
      }finally{if(current(ticket))lock(false);}
    }
    form.addEventListener('submit',async event=>{
      event.preventDefault();if(busy||!loaded||!currentUserId)return;
      let payload;
      try{payload=fromForm();}catch(err){tell(err.message,true);return;}
      const ticket=generation,expectedOwner=currentUserId,targetId=editId;
      if(!targetId&&rows.length>=MAX_PROFILES){tell('현재 화면에서는 5명까지 등록할 수 있어.',true);return;}
      if(!targetId&&!pendingCreateId){
        if(!win.crypto||typeof win.crypto.randomUUID!=='function'){
          tell('이 브라우저에서는 안전한 저장 식별자를 만들 수 없어. HTTPS 또는 로컬 주소에서 다시 열어 줘.',true);return;
        }
        pendingCreateId=win.crypto.randomUUID();
      }
      const createId=pendingCreateId;
      lock(true);silence();save.textContent='저장하고 있어...';
      try{
        const {client,user}=await access(ticket,expectedOwner);
        let response=targetId
          ?await deadline(client.from('popo_profiles').update(payload).eq('user_id',user.id).eq('id',targetId).select('id').single())
          :await deadline(client.from('popo_profiles').insert({...payload,id:createId,user_id:user.id}).select('id').single());
        if(!current(ticket))return;
        // Retrying an uncertain INSERT reuses the same random id. Never create a duplicate.
        if(!targetId && response.error && response.error.code==='23505'){
          const existing=await deadline(client.from('popo_profiles').select(SELECT_COLUMNS)
            .eq('user_id',user.id).eq('id',createId).single());
          if(!current(ticket))return;
          if(existing.error||!existing.data||existing.data.user_id!==user.id)throw new Error('POPO_SAVE_UNCONFIRMED');
          const previous=normalizeProfile({...existing.data,birth_time:existing.data.birth_time?String(existing.data.birth_time).slice(0,5):null});
          if(JSON.stringify(previous)!==JSON.stringify(payload)){
            toggleForm(false);await reload(ticket);
            if(current(ticket))tell('이전 요청에서 이미 저장된 항목이 있어. 목록의 수정 버튼으로 변경해 줘.',true);
            return;
          }
          response={data:{id:createId},error:null};
        }
        const expectedId=targetId||createId;
        if(response.error||!response.data||response.data.id!==expectedId)throw response.error||new Error('POPO_SAVE_UNCONFIRMED');
        pendingCreateId=null;editId=null;
        const notice=targetId?'사주 정보를 수정했어.':'출생정보를 저장했어! 같은 계정에서 다시 볼 수 있어.';
        if(formReturn==='vault'){
          form.reset();name.value='';custom.value='';date.value='';time.value='';region.value='';toggleDependencies();
          await refreshAfterWrite(ticket,notice,expectedId,vaultScrollTop);
        }else{
          // Preserve the original direct My Page -> new profile -> My Page flow.
          returnAccount=true;returnOwner=user.id;returnNotice=notice;
          dialog.close('saved');
        }
      }catch(err){
        if(current(ticket))tell('저장 여부를 확인하지 못했어. 입력 내용은 유지했어. 다시 시도하거나 목록에서 저장 여부를 확인해 줘.',true);
      }finally{
        if(current(ticket)){lock(false);save.textContent=editId?'수정 내용 저장하기':'이 정보 저장하기';}
      }
    });
    relation.addEventListener('change',toggleDependencies);calendar.addEventListener('change',toggleDependencies);
    unknown.addEventListener('change',toggleDependencies);
    const backToAccount=()=>{
      if(busy||!dialog.open)return;
      if(!form.hidden&&formReturn==='vault'){void returnToVault();return;}
      returnAccount=true;returnOwner=currentUserId;returnNotice='';dialog.close('back');
    };
    close.addEventListener('click',backToAccount);
    dialog.addEventListener('cancel',event=>{event.preventDefault();event.stopPropagation();backToAccount();});
    dialog.addEventListener('click',event=>{
      if(event.target!==dialog||busy)return;
      const r=dialog.getBoundingClientRect();
      if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)backToAccount();
    });
    dialog.addEventListener('close',()=>{
      const shouldReturn=returnAccount, notice=returnNotice, owner=returnOwner;
      returnAccount=false;returnNotice='';returnOwner=null;
      clearPersonal();toggleForm(false);silence();lock(false);
      if(shouldReturn&&win.PopoKakaoAuth&&typeof win.PopoKakaoAuth.openAccount==='function'){
        void win.PopoKakaoAuth.openAccount({message:notice,expectedUserId:owner});
        return;
      }
      const trigger=doc.getElementById('popo-account-trigger');
      const target=returnFocus&&returnFocus.isConnected&&!returnFocus.closest('dialog')?returnFocus:trigger;
      if(target)target.focus();
    });
    add.addEventListener('click',()=>{if(!busy&&loaded&&rows.length<MAX_PROFILES)resetForm(null);});
    cancel.addEventListener('click',backToAccount);
    retry.addEventListener('click',async()=>{
      if(busy||!dialog.open||retry.disabled)return;
      const ticket=generation;
      silence();
      const refreshed=await reload(ticket,retryAppend);
      if(current(ticket)&&refreshed){if(syncNotice)tell(syncNotice);focusList(ticket);}
    });
    more.addEventListener('click',()=>{if(!busy&&hasMore)void reload(generation,true);});
    // Capturing clicks preempts Stage 5B's old example-birth-dialog handler.
    doc.addEventListener('click',(e)=>{
      const b=e.target&&e.target.closest&&e.target.closest('.popo-auth-add-profile');
      if(!b)return;
      e.preventDefault();e.stopImmediatePropagation();
      void openManager('new');
    },true);
    const enhanceAccount=()=>{
      const box=doc.querySelector('.popo-auth-profile-box');
      if(!box||box.querySelector('.popo-profile-manage-from-account'))return false;
      const btn=el(doc,'button','popo-profile-manage-from-account','저장된 사주 관리하기');btn.type='button';
      btn.addEventListener('click',()=>void openManager('list'));
      const item=box.querySelector('.popo-auth-add-profile');
      if(item)box.insertBefore(btn,item);else box.append(btn);
      return true;
    };
    if(!enhanceAccount()){
      const observer=new win.MutationObserver(()=>{if(enhanceAccount())observer.disconnect();});
      observer.observe(doc.body,{childList:true,subtree:true});
    }
    return Object.freeze({openManager,normalizeProfile});
  }
  return {MAX_PROFILES,PAGE_SIZE,RELATIONS,REGIONS,SELECT_COLUMNS,validDate,normalizeProfile,displayRelation,verifiedUser,timeParts,composeTime,displayTime,mount};
});
