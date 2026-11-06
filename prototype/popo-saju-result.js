/* POPO Stage 5D.1 r3 — mobile-first local four-pillars candidate result.
 * Backend probe is NOT a verified personal chart and is never persisted/used by AI.
 * The signed-in profile is re-read under the user's own RLS session before probing.
 */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&root.document){root.PopoSajuResult=api;
    const start=()=>{
      try{api.mount(root.document,root);}
      catch(error){
        if(root.console&&typeof root.console.warn==='function')
          root.console.warn('POPO chart initial mount incomplete; retry on click:',error&&error.name||'Error');
      }
    };
    if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',start,{once:true});
    else start();
  }
})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  let installed=null;
  let openingPromise=null;
  function showPublicError(doc){
    if(!doc)return;
    const message='사주 결과창을 열지 못했어. 페이지를 새로고침하고 다시 눌러 줘.';
    const acct=doc.getElementById('popo-account-dialog');
    const feedback=doc.getElementById('popo-auth-feedback');
    if(acct&&acct.open&&feedback){
      feedback.hidden=false;feedback.textContent=message;
      return;
    }
    let alert=doc.getElementById('popo-saju-open-alert');
    if(!alert){
      alert=doc.createElement('p');alert.id='popo-saju-open-alert';
      alert.setAttribute('role','alert');alert.setAttribute('aria-live','assertive');
      Object.assign(alert.style,{position:'fixed',bottom:'18px',left:'12px',right:'12px',
        maxWidth:'440px',margin:'0 auto',padding:'15px',borderRadius:'14px',
        color:'#86415c',background:'#fff2f7',border:'1px solid #f1cfdf',
        zIndex:'2147483646',fontSize:'14px',boxShadow:'0 8px 26px #281a4a25'});
      doc.body.append(alert);
    }
    alert.textContent=message;
  }
  function openPublic(profileId){
    if(openingPromise)return openingPromise;
    // A single in-flight attempt prevents duplicate profile requests when users
    // double-tap the read button during the modal handoff.
    const operation=(async()=>{
      const win=typeof window==='object'?window:null;
      const doc=win&&win.document;
      if(!doc)return false;
      try{
        // This path is independent of document CustomEvent listeners.
        // If an earlier mount stopped after creating a dialog, mount() removes
        // the inert orphan and binds a working instance before opening.
        const instance=mount(doc,win);
        if(!instance||typeof instance.open!=='function')throw new Error('ModuleNotMounted');
        return await instance.open(profileId);
      }catch(error){
        showPublicError(doc);
        if(win.console&&typeof win.console.warn==='function')
          win.console.warn('POPO chart opener failed:',error&&error.name||'Error');
        return false;
      }
    })();
    openingPromise=operation.finally(()=>{openingPromise=null;});
    return openingPromise;
  }
  const API='http://127.0.0.1:8000/api/chart/probe';
  const ORDER=['wood','fire','earth','metal','water'];
  const NAMES={wood:'목',fire:'화',earth:'토',metal:'금',water:'수'};
  const GAN_NAME={甲:'갑',乙:'을',丙:'병',丁:'정',戊:'무',己:'기',庚:'경',辛:'신',壬:'임',癸:'계'};
  const ZHI_NAME={子:'자',丑:'축',寅:'인',卯:'묘',辰:'진',巳:'사',午:'오',未:'미',申:'신',酉:'유',戌:'술',亥:'해'};
  const GAN_ELEMENT={甲:'wood',乙:'wood',丙:'fire',丁:'fire',戊:'earth',己:'earth',庚:'metal',辛:'metal',壬:'water',癸:'water'};
  const SYMBOLS={wood:'🌱',fire:'☀',earth:'✿',metal:'✦',water:'💧'};
  const THEME={wood:'성장과 확장',fire:'따뜻함과 표현',earth:'안정과 중심',metal:'정돈과 결실',water:'흐름과 유연함'};
  const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const PILLAR=/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/u;
  const KEYS=['year','month','day','hour'];
  const labels={year:'년주',month:'월주',day:'일주',hour:'시주'};
  function node(doc,tag,cls,text){const n=doc.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
  function readableGanji(value){const [a,b]=Array.from(value||'');return GAN_NAME[a]&&ZHI_NAME[b]?GAN_NAME[a]+ZHI_NAME[b]:null;}
  function assertCandidate(raw){
    if(!raw||raw.status!=='candidate_only'||raw.verified!==false||raw.can_personalize!==false||
       raw.engine!=='lunar-javascript@1.7.7'||!raw.pillars||!raw.counts||
       !KEYS.every(k=>typeof raw.pillars[k]==='string'&&PILLAR.test(raw.pillars[k]))||
       !ORDER.every(k=>Number.isInteger(raw.counts[k])&&raw.counts[k]>=0&&raw.counts[k]<=8)||
       ORDER.reduce((sum,k)=>sum+raw.counts[k],0)!==8)
      throw new Error('계산 결과의 검증 전 표시 조건이 일치하지 않아 결과를 표시하지 않았어.');
    return raw;
  }
  function canProbe(profile){
    if(!profile||profile.calendar_type!=='solar')return '현재 계산 연결은 양력 출생정보만 지원해. 음력 변환은 다음 단계에서 연결할게.';
    if(profile.birth_time_unknown||!profile.birth_time)return '출생 시간이 확인되지 않아 시주를 임의로 만들지 않았어. 시간 미상 지원은 준비 중이야.';
    const region=String(profile.birth_region||'');
    if(!/^(서울특별시|부산광역시|대전광역시)$/.test(region))return '현재 계산 연결은 서울·부산·대전만 시험 지원해. 다른 출생지역은 저장되어 있으며 계산 지원을 확대할 예정이야.';
    const date=String(profile.birth_date||'');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return '출생 날짜를 확인할 수 없어.';
    const year=Number(date.slice(0,4)),day=Number(date.slice(8));
    if(year<1990||year>2040)return '현재 계산 후보는 1990~2040년 출생정보만 시험 지원해.';
    if(day>=3&&day<=9)return '매월 3~9일은 절기 경계 검증을 위해 계산을 보류했어.';
    const hh=Number(String(profile.birth_time).slice(0,2));
    if(hh===0||hh===23)return '23:00~00:59의 자시 날짜 경계는 아직 검증 중이야.';
    return null;
  }
  function payload(profile){
    const blocker=canProbe(profile);if(blocker)throw new Error(blocker);
    const region=String(profile.birth_region).slice(0,2);
    return {calendar:'양력',date:String(profile.birth_date),time:String(profile.birth_time).slice(0,5),place:region,unknown_time:false};
  }
  function summaries(chart){
    const gan=Array.from(chart.pillars.day)[0];
    const stemLabel=GAN_NAME[gan]||'일';const element=GAN_ELEMENT[gan];
    const pairs=ORDER.map(k=>({key:k,count:chart.counts[k]})).sort((a,b)=>b.count-a.count);
    const peak=pairs[0];const tied=pairs.filter(p=>p.count===peak.count).length;
    const zero=ORDER.filter(k=>chart.counts[k]===0);
    return [
      {title:`나를 상징하는 글자, ${stemLabel}(${gan})`,summary:`일간은 ${NAMES[element]}의 상징과 연결돼.`,detail:`일간은 태어난 날 천간의 한 글자를 말해. 이 계산 후보의 일간은 ${gan}(${stemLabel})이고, 전통 명리에서는 ${NAMES[element]}을(를) '${THEME[element]}'의 이미지와 연결해 설명해. 이 한 글자로 성격이나 미래를 단정할 수는 없어.`},
      {title:tied>1?'여러 오행이 함께 눈에 띄어요':`${NAMES[peak.key]}의 상징이 가장 많이 보여요`,summary:`8글자를 세어보면 ${NAMES[peak.key]} ${peak.count}개${tied>1?'(공동 최다)':''}야.`,detail:`년·월·일·시 네 기둥의 천간과 지지를 하나씩 세어 총 8글자의 대표 오행을 합산했어. ${NAMES[peak.key]}은(는) 전통적으로 '${THEME[peak.key]}'의 상징과 연결돼. 이 개수만으로 오행의 실제 강약, 용신, 좋고 나쁨을 판단하지 않아.`},
      {title:zero.length?`${zero.map(k=>NAMES[k]).join('·')}의 상징은 이번 집계에 없어요`:'다섯 오행의 상징을 모두 만났어요',summary:zero.length?'없는 글자에도 너무 큰 의미를 붙이지 말자.':'개수와 강약은 같은 말이 아니야.',detail:zero.length?`이번 8글자 대표 분류에서는 ${zero.map(k=>NAMES[k]).join(', ')}이(가) 0개야. 지장간과 월령은 고려하지 않아 '이 기운이 없는 사람'이라는 뜻은 아니야. 전통의 다섯 이미지를 나를 돌아보는 질문으로만 가볍게 활용해 줘.`:'다섯 분류가 모두 나타나더라도 실제 강약이나 균형이 확정되는 건 아니야. 지장간·월령·합충 등 추가 정보가 필요해.'},
      {title:'오늘의 나에게 남기는 한 문장',summary:'정답보다 나를 이해하는 질문 하나를 챙겨보자.',detail:'명리의 상징은 정해진 미래를 예언하는 답이 아니라, 나를 돌아보는 하나의 이야기로 읽어줘. 지금 나에게 중요한 건 무엇인지, 어떤 선택을 직접 해보고 싶은지 적어보는 건 어때?'}
    ];
  }
  function isLocal(loc){return !!loc&&loc.protocol==='http:'&&['localhost','127.0.0.1'].includes(loc.hostname);}
  async function readJson(response){try{return await response.json();}catch(_){return null;}}
  function mount(doc,win){
    if(!doc||!win)return false;
    if(installed&&installed.dialog&&installed.dialog.isConnected)return installed;
    if(installed)installed=null;
    const leftover=doc.getElementById('popo-saju-dialog');
    if(leftover){
      // The previous initialization may have created this node but stopped
      // before registering click events. Never let a leftover ID make the
      // entire result feature silently return false.
      if(leftover.open)return false;
      leftover.remove();
    }
    const dlg=node(doc,'dialog','popo-saju-dialog');dlg.id='popo-saju-dialog';dlg.setAttribute('aria-labelledby','popo-saju-heading');
    const frame=node(doc,'div','popo-saju-frame');
    const head=node(doc,'header','popo-saju-head');
    const hcopy=node(doc,'div');hcopy.append(node(doc,'span','popo-saju-overline','✦ MY SAJU · LOCAL BETA'));
    const heading=node(doc,'h2','','포포의 사주 이야기');heading.id='popo-saju-heading';hcopy.append(heading);
    const close=node(doc,'button','popo-saju-close','×');close.type='button';close.setAttribute('aria-label','닫고 마이페이지로 돌아가기');
    head.append(hcopy,close);
    const notice=node(doc,'div','popo-saju-notice','계산 후보 · 한국 역법 검증 전 · 본인 풀이로 확정하지 마세요.');
    const status=node(doc,'p','popo-saju-status');status.id='popo-saju-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    const body=node(doc,'div','popo-saju-body');
    frame.append(head,notice,status,body);dlg.append(frame);doc.body.append(dlg);
    /* POPO_STAGE5D1_DIALOG_FIX_V2
     * The old capture-phase hotfix swallowed all other click handlers and put
     * showModal() before its try/catch. A failure was written into a CLOSED
     * dialog, so users saw no response at all. The button now emits a focused
     * custom event; we wait for the old modal to settle and handle open errors
     * visibly. This stage does not change any calculation or account data.
     */
    let serial=0,returnFocus=null,pending=null;
    const setStatus=(message,bad=false)=>{status.hidden=!message;status.textContent=message||'';status.classList.toggle('is-error',bad);};
    function cancel(){if(pending){pending.abort();pending=null;}serial++;}
    function visibleOpenError(){
      const message='풀이 화면을 열지 못했어. 마이페이지를 다시 열어 시도해 줘.';
      const account=doc.getElementById('popo-account-dialog');
      const feedback=doc.getElementById('popo-auth-feedback');
      if(account&&account.open&&feedback){feedback.hidden=false;feedback.textContent=message;return;}
      let alert=doc.getElementById('popo-saju-open-alert');
      if(!alert){
        alert=node(doc,'p','popo-saju-open-alert');alert.id='popo-saju-open-alert';
        alert.setAttribute('role','alert');alert.setAttribute('aria-live','assertive');
        Object.assign(alert.style,{position:'fixed',left:'12px',right:'12px',bottom:'16px',
          maxWidth:'440px',margin:'0 auto',zIndex:'2147483645',borderRadius:'14px',
          padding:'16px',background:'#fff2f7',border:'1px solid #e8bccc',
          color:'#85445f',fontSize:'14px',fontWeight:'700',lineHeight:'1.6',
          boxShadow:'0 10px 35px #281a4a30'});
        doc.body.append(alert);
      }
      alert.textContent=message;
    }
    function clearOpenError(){const alert=doc.getElementById('popo-saju-open-alert');if(alert)alert.remove();}
    async function returnToAccount(){if(!dlg.open)return;dlg.close();}
    close.addEventListener('click',()=>void returnToAccount());
    dlg.addEventListener('cancel',event=>{event.preventDefault();void returnToAccount();});
    dlg.addEventListener('close',()=>{
      cancel();body.replaceChildren();setStatus('');
      if(win.PopoKakaoAuth&&typeof win.PopoKakaoAuth.openAccount==='function'){
        void win.PopoKakaoAuth.openAccount();
      }else if(returnFocus&&returnFocus.isConnected)returnFocus.focus();
    });
    function render(profile,chart){
      body.replaceChildren();
      const hero=node(doc,'section','popo-saju-hero');
      hero.append(node(doc,'p','popo-saju-hero-spark','☾  ✦  ☾'));
      const name=node(doc,'h3','',`${profile.display_name}님은 ${readableGanji(chart.pillars.day)} 일주예요!`);
      hero.append(name,node(doc,'p','','태어난 날의 두 글자에서 이야기를 시작해 볼게요.'));
      body.append(hero);
      const pillars=node(doc,'section','popo-saju-card');
      pillars.append(node(doc,'h3','popo-saju-section-title','✿ 나의 사주 만세력'));
      const grid=node(doc,'div','popo-saju-pillars');
      for(const key of KEYS){
        const p=node(doc,'div','popo-saju-pillar'+(key==='day'?' is-day':''));
        p.append(node(doc,'span','',labels[key]),node(doc,'strong','',chart.pillars[key]),node(doc,'small','',readableGanji(chart.pillars[key])));
        grid.append(p);
      }
      pillars.append(grid,node(doc,'p','popo-saju-footnote','계산 모듈의 시험값이며 시주·절기·지역 보정은 아직 교차 검증 중이야.'));
      body.append(pillars);
      const elements=node(doc,'section','popo-saju-card');elements.append(node(doc,'h3','popo-saju-section-title','🌼 오행 분포'));
      const layout=node(doc,'div','popo-saju-element-layout');
      const colors=['#7abca5','#f5a7a3','#f4cd74','#a9a0d8','#88b7dc'];
      let acc=0;const slices=ORDER.map((k,i)=>{const start=acc;acc+=chart.counts[k]/8*100;return `${colors[i]} ${start}% ${acc}%`;});
      const donut=node(doc,'div','popo-saju-donut');donut.style.background=`conic-gradient(${slices.join(',')})`;
      const center=node(doc,'span','popo-saju-donut-center');center.append(node(doc,'strong','',String(ORDER.reduce((a,k)=>a+chart.counts[k],0))),node(doc,'small','','글자'));
      donut.append(center);const legend=node(doc,'div','popo-saju-legend');
      for(const [i,k] of ORDER.entries()){
        const item=node(doc,'div','popo-saju-element');const sym=node(doc,'span','popo-saju-element-symbol',SYMBOLS[k]);sym.style.background=colors[i]+'45';
        item.append(sym,node(doc,'span','',NAMES[k]),node(doc,'strong','',`${chart.counts[k]}개`));legend.append(item);
      }
      layout.append(donut,legend);elements.append(layout);
      const explain=node(doc,'button','popo-saju-about','오행 개수는 어떻게 세었을까? ⓘ');explain.type='button';explain.setAttribute('aria-expanded','false');
      const text=node(doc,'p','popo-saju-footnote','년·월·일·시주의 천간·지지 8글자에서 대표 오행을 하나씩 세었어. 지장간·월령·강약을 반영한 점수는 아니야.');text.hidden=true;
      explain.addEventListener('click',()=>{text.hidden=!text.hidden;explain.setAttribute('aria-expanded',String(!text.hidden));});
      elements.append(explain,text);body.append(elements);
      const flows=node(doc,'section','popo-saju-card');flows.append(node(doc,'h3','popo-saju-section-title','☾ 대운 · 세운 기본표'));
      flows.append(node(doc,'p','popo-saju-footnote','대운 시작 나이·간지와 세운의 절기 기준은 아직 계산 정책을 확인하고 있어. 없는 값을 만들어 보여주지 않을게. 표와 상세 해석은 다음 단계에서 연결할 예정이야.'));
      const soon=node(doc,'span','popo-saju-soon','COMING SOON · 데이터 검증 중');flows.append(soon);body.append(flows);
      const reading=node(doc,'section','popo-saju-card');reading.append(node(doc,'h3','popo-saju-section-title','✦ 포포가 들려주는 네 가지 이야기'));
      reading.append(node(doc,'p','popo-saju-footnote','전통적 상징을 쉽게 풀어본 참고 문장이야. 개인의 실제 성향이나 미래를 단정한 해석은 아니야.'));
      for(const story of summaries(chart)){
        const details=node(doc,'details','popo-saju-story');
        details.append(node(doc,'summary','',story.title+'  ﹀'));
        const copy=node(doc,'div','popo-saju-story-body');copy.append(node(doc,'strong','',story.summary),node(doc,'p','',story.detail));
        details.append(copy);reading.append(details);
      }
      body.append(reading);
      const end=node(doc,'p','popo-saju-footer','포포의 해석은 전통 문화 콘텐츠와 자기이해를 위한 읽을거리야. 중요한 결정을 확정하는 답은 아니야.');
      body.append(end);
    }
    async function open(profileId){
      if(!UUID.test(String(profileId))){visibleOpenError();return false;}
      if(dlg.open)return true;
      clearOpenError();
      returnFocus=doc.activeElement;
      const previousVault=doc.getElementById('popo-profile-manager');
      const previousAccount=doc.getElementById('popo-account-dialog');
      try{
        if(previousVault&&previousVault.open)previousVault.close();
        if(previousAccount&&previousAccount.open)previousAccount.close();
        // Let old modal close callbacks finish before opening another modal.
        await new Promise(resolve=>win.setTimeout(resolve,0));
        // Vault close handlers can reopen My Page; close it again if necessary.
        if(previousVault&&previousVault.open)previousVault.close();
        if(previousAccount&&previousAccount.open)previousAccount.close();
        dlg.showModal();
        if(!dlg.open)throw new Error('DialogNotOpen');
        body.replaceChildren();setStatus('저장된 출생정보를 확인하는 중이야…');
      }catch(error){
        visibleOpenError();
        if(win.console&&typeof win.console.warn==='function')
          win.console.warn('POPO result modal open failed:',error&&error.name||'Error');
        return false;
      }
      const ticket=++serial;
      try{
        const client=win.PopoKakaoAuth&&win.PopoKakaoAuth.getClient&&win.PopoKakaoAuth.getClient();
        if(!client||!client.auth||typeof client.auth.getUser!=='function')throw new Error('카카오 로그인 연결이 필요해.');
        const auth=await client.auth.getUser();if(ticket!==serial)return false;
        const user=auth&&auth.data&&auth.data.user;
        if(auth.error||!user||user.is_anonymous===true||!UUID.test(user.id))throw new Error('로그인 회원만 사주 결과를 볼 수 있어.');
        const result=await client.from('popo_profiles').select('id,user_id,display_name,calendar_type,birth_date,birth_time,birth_time_unknown,birth_region').eq('user_id',user.id).eq('id',profileId).single();
        if(ticket!==serial)return false;
        if(result.error||!result.data||result.data.user_id!==user.id||result.data.id!==profileId)throw new Error('내 계정에서 해당 프로필을 찾지 못했어.');
        const profile=result.data;
        const blocker=canProbe(profile);
        if(blocker){setStatus(blocker,true);return false;}
        if(!isLocal(win.location)){setStatus('현재 개인 계산은 로컬 개발 환경에서만 시험할 수 있어. 공개 웹 연결은 추후 진행할게.',true);return false;}
        const data=payload(profile);
        setStatus('포포가 네 명식의 계산 후보를 살펴보고 있어요. ✦ 페이지를 닫지 말아줘.');
        pending=new AbortController();const own=pending;
        const timeout=win.setTimeout(()=>own.abort(),10000);
        let response;
        try{response=await win.fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:own.signal,cache:'no-store'});}
        finally{win.clearTimeout(timeout);if(pending===own)pending=null;}
        if(ticket!==serial)return false;
        const raw=await readJson(response);
        if(!response.ok){
          const detail=raw&&typeof raw.detail==='string'?raw.detail:'';
          throw new Error(response.status===422?'아직 지원하지 않는 입력이야. '+detail:'계산 서버 연결을 확인해 줘. FastAPI가 실행 중인지 살펴봐.');
        }
        const chart=assertCandidate(raw);
        if(ticket!==serial)return false;
        setStatus('');render(profile,chart);
        return true;
      }catch(err){
        if(ticket===serial){const message=err&&err.name==='AbortError'?'계산 시간이 초과됐어. 로컬 FastAPI 실행을 확인해 줘.':err&&err.message||'계산 후보를 읽지 못했어.';setStatus(message,true);}
        return false;
      }
    }
    let opening=false;
    function handleRead(profileId){
      if(opening||dlg.open)return;
      opening=true;
      void open(profileId).then(opened=>{
        if(!opened&&!dlg.open&&!(doc.getElementById('popo-saju-open-alert'))){
          visibleOpenError();
        }
      }).catch(error=>{
        visibleOpenError();
        if(win.console&&typeof win.console.warn==='function')
          win.console.warn('POPO result read failed:',error&&error.name||'Error');
      }).finally(()=>{opening=false;});
    }
    // The profile-rendered button emits this event from its own click handler.
    doc.addEventListener('popo:read-profile',e=>{
      const id=e.detail&&e.detail.profileId;
      handleRead(id);
    });
    // Compatibility fallback for a legacy read button not yet using that emitter.
    doc.addEventListener('click',e=>{
      const button=e.target&&e.target.closest&&e.target.closest('[data-popo-read-profile]');
      if(!button||button.disabled)return;
      e.preventDefault();handleRead(button.dataset.popoReadProfile);
    });
    installed=Object.freeze({open,dialog:dlg,assertCandidate,canProbe,payload,readableGanji,summaries,isLocal});
    return installed;
  }
  return {API,ORDER,NAMES,assertCandidate,canProbe,payload,readableGanji,summaries,isLocal,mount,
    open:openPublic,showOpenError:()=>showPublicError(typeof document==='object'?document:null)};
});
