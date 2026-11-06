/* POPO Stage 5C.2 shared, text-only profile card rendering.
 * Cosmetic animal pools are POPO branding, NOT a traditional animal/element rule.
 * No element is inferred from personal data. Until chart integration supplies a
 * computed representative element, all profiles use the approved default POPO.
 * No storage, credentials, network fetches, or authorization decisions here.
 */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.PopoProfileDisplay=api;
})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  const DEFAULT_AVATAR='assets/popo-profile-default.png';
  const RELATION_NAMES=Object.freeze({self:'본인',partner:'연인',family:'가족',friend:'친구',other:'기타'});
  const ELEMENT_NAMES=Object.freeze({wood:'목',fire:'화',earth:'토',metal:'금',water:'수'});
  const ANIMAL_POOLS=Object.freeze({
    wood:Object.freeze(['rabbit','tiger','squirrel']),
    fire:Object.freeze(['fox','pomeranian']),
    earth:Object.freeze(['bear','hamster','sheep']),
    metal:Object.freeze(['cat','maltese']),
    water:Object.freeze(['penguin','shiba'])
  });
  const ANIMAL_NAMES=Object.freeze({rabbit:'토끼',tiger:'호랑이',squirrel:'다람쥐',fox:'여우',
    pomeranian:'포메라니안',bear:'곰',hamster:'햄스터',sheep:'양',cat:'고양이',
    maltese:'말티즈',penguin:'펭귄',shiba:'시바견'});
  const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  function text(value,fallback=''){return typeof value==='string'&&value.trim()?value.trim():fallback;}
  function relationLabel(row){
    return row.relationship==='other'?text(row.relationship_custom,'기타'):(RELATION_NAMES[row.relationship]||'기타');
  }
  function summary(row){
    const date=text(row.birth_date,'생년월일 미입력');
    const calendar=row.calendar_type==='lunar'?(row.leap_month?'음력 · 윤달':'음력'):'양력';
    const time=row.birth_time_unknown?'시간 모름':(/^\d{2}:\d{2}/.test(text(row.birth_time))?row.birth_time.slice(0,5):'시간 미입력');
    return Object.freeze({name:text(row.display_name,'이름 미입력'),relation:relationLabel(row),
      birthLine:`${calendar} ${date.replace(/-/g,'.')} · ${time}`,
      regionLine:text(row.birth_region,'출생지역 미입력'),
      gender:{male:'남성',female:'여성',unknown:'성별 모름'}[row.gender]||'성별 모름'});
  }
  function stableHash(value){
    let h=2166136261;
    for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}
    return h>>>0;
  }
  function animalForProfile(profileId,computedElement){
    // Input is explicitly an already computed representative element. A missing
    // value must NOT silently assign an element or invent any personal chart.
    if(!UUID.test(String(profileId))||!Object.prototype.hasOwnProperty.call(ANIMAL_POOLS,computedElement))return null;
    const pool=ANIMAL_POOLS[computedElement];
    const id=pool[stableHash('POPO-AVATAR-V1|'+profileId.toLowerCase()+'|'+computedElement)%pool.length];
    return Object.freeze({id,name:ANIMAL_NAMES[id],element:computedElement,elementName:ELEMENT_NAMES[computedElement],version:'v1'});
  }
  function node(doc,tag,cls,content){
    const n=doc.createElement(tag);if(cls)n.className=cls;
    if(content!==undefined)n.textContent=content;
    return n;
  }
  function createInfo(doc,row){
    const s=summary(row||{});
    const info=node(doc,'div','popo-profile-info popo-profile-summary');
    const avatar=node(doc,'span','popo-profile-avatar');avatar.setAttribute('aria-hidden','true');
    const img=node(doc,'img');img.src=DEFAULT_AVATAR;img.alt='';img.width=52;img.height=52;
    img.decoding='async';img.draggable=false;
    // Existing files never receive a made-up animal or computed element. New
    // animal artwork and the real chart-result connection are a separate stage.
    img.addEventListener('error',()=>{img.hidden=true;avatar.classList.add('image-unavailable');});
    avatar.append(img);
    const copy=node(doc,'div','popo-profile-summary-copy');
    const nameLine=node(doc,'div','popo-profile-name-line');
    nameLine.append(node(doc,'strong','popo-profile-display-name',s.name),node(doc,'span','popo-profile-relation-badge',s.relation));
    // Stage 5D.1: each saved profile can open its independently queried chart.
    if(UUID.test(String(row.id||''))){
      const read=node(doc,'button','popo-profile-read','풀이 보기 ↗');
      read.type='button';read.dataset.popoReadProfile=row.id;
      read.setAttribute('aria-label',s.name+'의 사주 결과 보기');
      // Dispatch from the actual button, rather than relying on competing global
      // click handlers inside the My Page/vault modal stack.
      // The result module has a direct, exception-safe open() entry point.
      // Do not depend on a document-level custom listener: an interrupted
      // bootstrap can leave the dialog in the DOM without its listeners.
      read.addEventListener('click',event=>{
        event.preventDefault();event.stopPropagation();
        const view=doc.defaultView;
        if(!view)return;
        const result=view.PopoSajuResult;
        if(result&&typeof result.open==='function'){
          void Promise.resolve(result.open(row.id)).catch(()=>{
            if(typeof result.showOpenError==='function')result.showOpenError();
          });
          return;
        }
        if(typeof view.CustomEvent==='function'){
          doc.dispatchEvent(new view.CustomEvent('popo:read-profile',{detail:{profileId:row.id}}));
        }
      });
      nameLine.append(read);
    }
    const birth=node(doc,'p','popo-profile-meta popo-profile-meta-birth',s.birthLine);
    const region=node(doc,'p','popo-profile-meta popo-profile-meta-region',s.regionLine+' · '+s.gender);
    copy.append(nameLine,birth,region);info.append(avatar,copy);return info;
  }
  return {DEFAULT_AVATAR,RELATION_NAMES,ELEMENT_NAMES,ANIMAL_POOLS,ANIMAL_NAMES,relationLabel,summary,animalForProfile,createInfo};
});
