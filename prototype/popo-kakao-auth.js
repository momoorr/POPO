/* POPO Stage 5B — actual Kakao OAuth + Supabase Auth session UI.
 * Never trusts UI labels for authorization; Supabase Auth getUser() verifies session.
 * No storage/report writes; reports remain server-only from Stage 5A.
 * Project URL + publishable key come from a client-visible configuration file.
 */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object' && module.exports)module.exports=api;
  if(root && root.document){
    root.PopoKakaoAuth=api;
    const boot=()=>{api.mount(root.document,root).catch(err=>{
      const msg=root.document.getElementById('popo-auth-feedback');
      if(msg){msg.hidden=false;msg.textContent='로그인 기능을 불러오지 못했어. 인터넷 연결을 확인하고 새로고침해 줘.';}
      if(root.console)root.console.error('POPO Kakao Auth bootstrap:',err && err.message ? err.message : err);
    });};
    if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',boot,{once:true});
    else boot();
  }
})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  const UMD_URL='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/dist/umd/supabase.js';
  const FALLBACK_URL='https://unpkg.com/@supabase/supabase-js@2.57.0/dist/umd/supabase.js';
  const SELECT_COLUMNS='id,user_id,display_name,relationship,relationship_custom,calendar_type,leap_month,birth_date,birth_time,birth_time_unknown,birth_region,gender,created_at';
  const safeName=value=>typeof value==='string' && value.trim() ? value.trim().slice(0,40) : '포포 회원';
  const isPublishableKey=value=>typeof value==='string' && /^sb_publishable_[A-Za-z0-9_-]{10,}$/.test(value);
  const isSafeConfig=conf=>!!conf && typeof conf.url==='string' &&
    /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(conf.url) && isPublishableKey(conf.publishableKey);
  const redirectFor=loc=>{
    if(!loc || !/^https?:$/.test(loc.protocol)||!loc.origin||!loc.pathname)throw new Error('HTTP 또는 HTTPS로 접속해야 해.');
    // Do not put any arbitrary "next" external destination or hash in OAuth redirects.
    return loc.origin+loc.pathname;
  };
  function elem(doc,tag,cls,text){
    const el=doc.createElement(tag);if(cls)el.className=cls;
    if(text!==undefined)el.textContent=text;
    return el;
  }
  function loadScript(doc,win,url){
    return new Promise((resolve,reject)=>{
      if(win.supabase && typeof win.supabase.createClient==='function')return resolve(win.supabase);
      const tag=doc.createElement('script');tag.async=true;tag.src=url;tag.crossOrigin='anonymous';
      tag.onload=()=>win.supabase&&typeof win.supabase.createClient==='function'
        ?resolve(win.supabase):reject(new Error('SDK loaded without createClient'));
      tag.onerror=()=>reject(new Error('SDK network error'));
      doc.head.append(tag);
    });
  }
  async function getSdk(doc,win){
    if(win.supabase && typeof win.supabase.createClient==='function')return win.supabase;
    try{return await loadScript(doc,win,UMD_URL)}catch(err){return loadScript(doc,win,FALLBACK_URL)}
  }
  let activeClient=null, activeAccount=null;
  async function mount(doc,win,dependency){
    const dialog=doc.getElementById('popo-account-dialog');
    const account=doc.getElementById('popo-account-trigger');
    const nav=win.PopoAccountNav;
    if(!dialog||!account||!nav||typeof nav.updateFromVerifiedSession!=='function')return false;
    if(dialog.dataset.popoOauthMounted==='true')return true;
    dialog.dataset.popoOauthMounted='true';

    const oldPrimary=dialog.querySelector('.popo-account-continue');
    if(oldPrimary)oldPrimary.style.display='none';
    const sheet=dialog.querySelector('.popo-account-sheet');
    const description=dialog.querySelector('.popo-account-description');
    const note=dialog.querySelector('.popo-account-status');
    const privacy=dialog.querySelector('.popo-account-privacy');
    const feedback=elem(doc,'p','popo-auth-feedback');feedback.id='popo-auth-feedback';
    feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');feedback.hidden=true;
    const kakao=elem(doc,'button','popo-auth-kakao','카카오로 시작하기');kakao.type='button';kakao.id='popo-auth-kakao';
    const guest=elem(doc,'button','popo-auth-guest','게스트로 둘러보기');guest.type='button';
    const profileBox=elem(doc,'section','popo-auth-profile-box');profileBox.hidden=true;
    const profileTitle=elem(doc,'h3','','저장한 사주');
    const profileList=elem(doc,'ul','popo-auth-profile-list');profileList.id='popo-auth-profile-list';
    const openChart=elem(doc,'button','popo-auth-add-profile','+ 내 사주 입력하기');openChart.type='button';
    profileBox.append(profileTitle,profileList,openChart);
    const signout=elem(doc,'button','popo-auth-signout','로그아웃');signout.type='button';signout.hidden=true;
    const busy=()=>{kakao.disabled=true;signout.disabled=true;};
    const idle=()=>{kakao.disabled=false;signout.disabled=false;};
    sheet.insertBefore(feedback,privacy);
    sheet.insertBefore(kakao,privacy);
    sheet.insertBefore(guest,privacy);
    sheet.insertBefore(profileBox,privacy);
    sheet.insertBefore(signout,privacy);

    let verified=null;let client=null;let serial=0;let profileSerial=0;
    const showMessage=(text,isError)=>{
      feedback.hidden=false;feedback.textContent=text;
      feedback.classList.toggle('is-error',!!isError);
    };
    const hideMessage=()=>{feedback.hidden=true;feedback.textContent='';};
    const updateUi=user=>{
      if(!user||!verified||verified.id!==user.id){profileSerial++;profileList.replaceChildren();}
      verified=user||null;
      const logged=!!user;
      nav.updateFromVerifiedSession(logged?{
        authenticated:true,serverVerified:true,userId:user.id
      }:null);
      // Stage 4G's presentation adapter sets its old placeholder copy; override it.
      description.textContent=logged
        ? `${safeName(user.user_metadata&&user.user_metadata.name || user.user_metadata&&user.user_metadata.full_name || user.user_metadata&&user.user_metadata.nickname)}님, 달빛 마이페이지에 오신 걸 환영해!`
        : '카카오 계정으로 로그인하면 나중에 다시 볼 사주 기록을 모아둘 수 있어. 로그인 없이 둘러봐도 괜찮아.';
      note.textContent=logged?'카카오 계정 인증됨':'게스트 이용 가능';
      kakao.hidden=logged;kakao.style.display=logged?'none':'';
      guest.hidden=logged;guest.style.display=logged?'none':'';
      signout.hidden=!logged;signout.style.display=logged?'':'none';
      profileBox.hidden=!logged;profileBox.style.display=logged?'':'none';
      if(!logged){profileList.replaceChildren();}
    };
    const refreshProfiles=async(user)=>{
      if(!user || !client)return;
      const listTicket=++profileSerial;
      profileList.replaceChildren(elem(doc,'li','popo-auth-profile-empty','저장한 사주 목록을 불러오고 있어...'));
      try{
        const {data,error}=await client.from('popo_profiles').select(SELECT_COLUMNS).eq('user_id',user.id).order('created_at',{ascending:false}).limit(5);
        if(error)throw error;
        // If an old request finishes after logout/switch, never show its private contents.
        if(listTicket!==profileSerial || !verified || verified.id!==user.id)return;
        profileList.replaceChildren();
        if(!Array.isArray(data)||data.some(row=>!row||row.user_id!==user.id))throw new Error('POPO_INVALID_OWNER_ROWS');
        if(!data.length){
          profileList.append(elem(doc,'li','popo-auth-profile-empty','아직 저장한 사주가 없어.'));
        }else{
          for(const row of data){
            const li=elem(doc,'li','popo-auth-profile');
            if(win.PopoProfileDisplay)li.append(win.PopoProfileDisplay.createInfo(doc,row));
            else li.append(elem(doc,'span','',safeName(row.display_name)));
            profileList.append(li);
          }
        }
      }catch(err){
        if(listTicket!==profileSerial || !verified || verified.id!==user.id)return;
        profileList.replaceChildren(elem(doc,'li','popo-auth-profile-empty','목록을 읽지 못했어. 다시 열어 확인해 줘.'));
      }
    };
    const refresh=async()=>{
      if(!client)return;
      const current=++serial;
      let result;
      try{result=await client.auth.getUser();}catch(err){
        if(current===serial){updateUi(null);showMessage('로그인 상태 확인에 실패했어. 인터넷 연결을 확인해 줘.',true);}
        return;
      }
      if(current!==serial)return;
      const user=result && result.data && result.data.user && !result.error && result.data.user.is_anonymous!==true ? result.data.user : null;
      updateUi(user);
      if(user){hideMessage();await refreshProfiles(user);}
      return current===serial&&verified&&verified.id===user?.id?user:null;
    };
    activeAccount=async(options={})=>{
      hideMessage();
      profileList.replaceChildren(elem(doc,'li','popo-auth-profile-empty','저장한 사주 목록을 확인하고 있어...'));
      if(!dialog.open)dialog.showModal();
      const user=await refresh();
      if(!dialog.open||!user||!verified||verified.id!==user.id)return false;
      if(options.expectedUserId&&options.expectedUserId!==user.id)return false;
      if(options.message)showMessage(options.message,false);
      const focus=doc.querySelector('.popo-profile-manage-from-account')||openChart;
      if(focus&&focus.isConnected)focus.focus({preventScroll:true});
      return true;
    };
    guest.addEventListener('click',()=>{hideMessage();dialog.close();});
    openChart.addEventListener('click',()=>{
      dialog.close();
      const birth=doc.getElementById('birth-dialog');
      // Existing flow is reused. Profile DB writes are a separate forthcoming stage.
      if(birth && typeof birth.showModal==='function'&&!birth.open)birth.showModal();
    });
    kakao.addEventListener('click',async()=>{
      if(!client){showMessage('로그인 준비가 완료되지 않았어. 설정을 확인해 줘.',true);return;}
      busy();hideMessage();
      try{
        const {error}=await client.auth.signInWithOAuth({
          provider:'kakao',options:{redirectTo:redirectFor(win.location)}
        });
        if(error)throw error;
        // Browser navigates to Kakao. If navigation is blocked, button stays usable.
      }catch(err){showMessage('카카오 로그인 시작에 실패했어. 잠시 뒤 다시 시도해 줘.',true);}
      finally{idle();}
    });
    signout.addEventListener('click',async()=>{
      if(!client)return;
      busy();hideMessage();
      try{
        const {error}=await client.auth.signOut();if(error)throw error;
        serial++;updateUi(null);showMessage('로그아웃했어. 게스트로 둘러볼 수 있어.');
      }catch(err){showMessage('로그아웃하지 못했어. 다시 시도해 줘.',true);}
      finally{idle();}
    });
    account.addEventListener('click',()=>void refresh());
    updateUi(null);
    const settings=win.POPO_SUPABASE_CONFIG;
    if(!isSafeConfig(settings)){
      showMessage('Supabase 설정을 확인할 수 없어. 설치 단계에서 프로젝트 URL과 Publishable key를 다시 확인해 줘.',true);
      kakao.disabled=true;
      return false;
    }
    const sdk=dependency || await getSdk(doc,win);
    client=sdk.createClient(settings.url.replace(/\/$/,''),settings.publishableKey,{
      auth:{flowType:'pkce',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}
    });
    activeClient=client;
    if(client.auth.onAuthStateChange){
      client.auth.onAuthStateChange((event,session)=>{
        const incoming=session&&session.user&&session.user.id;
        if(event==='SIGNED_OUT'||event==='USER_DELETED'||(verified&&incoming&&incoming!==verified.id)){
          serial++;updateUi(null);
        }
        // Leave the SDK auth callback before issuing network queries.
        win.setTimeout(()=>void refresh(),0);
      });
    }
    await refresh();
    return true;
  }
  return {mount,isPublishableKey,isSafeConfig,redirectFor,safeName,
    getClient:()=>activeClient,openAccount:options=>activeAccount?activeAccount(options):Promise.resolve(false)};
});
