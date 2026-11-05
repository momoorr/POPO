/* POPO Stage 4F: mobile-first chart overview + five-element exploration.
 * Enhances only the existing #chart and #elements views; keeps app.js routing,
 * element scene assets, calculation services and AI Agent unchanged.
 * IMPORTANT: figures below are an explicitly fictional 8-character fixture.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) {
    const start = () => api.mount(root.document, root.location);
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start, {once:true});
    else start();
  }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const ELEMENTS = Object.freeze([
    {key:'wood', han:'木', ko:'목', icon:'🌱', color:'#83bd99',text:'새싹처럼 자라고 뻗어가는 모습',desc:'목(木)은 전통적으로 봄, 새싹, 성장과 확장을 나타내는 이미지야.'},
    {key:'fire', han:'火', ko:'화', icon:'✦', color:'#f49c9f',text:'따뜻한 불빛처럼 퍼지는 온기',desc:'화(火)는 여름, 빛, 열기, 바깥으로 퍼지는 움직임을 상징해.'},
    {key:'earth',han:'土', ko:'토', icon:'✿', color:'#e9be83',text:'온기를 품어 주는 포근한 땅',desc:'토(土)는 땅, 바탕, 변화를 받아주는 이미지를 떠올리게 해.'},
    {key:'metal',han:'金',ko:'금', icon:'✧', color:'#abb1dc',text:'맑고 단단한 은빛 결정',desc:'금(金)은 맑은 금속과 가을의 단단함 같은 이미지를 나타내.'},
    {key:'water',han:'水',ko:'수',icon:'≈',color:'#83c6e6',text:'잔잔하게 이어지는 물결',desc:'수(水)는 겨울과 물, 깊이와 흐름을 나타내는 전통적인 상징이야.'}
  ]);
  const ORDER=Object.freeze(['year','month','day','hour']);
  const NAMES=Object.freeze({year:'연주',month:'월주',day:'일주',hour:'시주'});
  const LABELS=Object.freeze({year:'년주',month:'월주',day:'일주',hour:'시주'});
  const GANJI=/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/u;
  const DEMO=Object.freeze({
    source:'demo', status:'demo_only', verified:false,
    pillars:{year:'己卯',month:'丙子',day:'戊午',hour:'戊午'},
    counts:{wood:1,fire:3,earth:3,metal:0,water:1}
  });
  function validChart(x) {
    if(!x || x.verified!==false || (x.source!=='demo' && x.source!=='candidate')) return false;
    if(!x.pillars || !ORDER.every(k=>typeof x.pillars[k]==='string' && GANJI.test(x.pillars[k]))) return false;
    if(!x.counts || !ELEMENTS.every(e=>Number.isInteger(x.counts[e.key]) && x.counts[e.key]>=0 && x.counts[e.key]<=8)) return false;
    return ELEMENTS.reduce((a,e)=>a+x.counts[e.key],0)===8;
  }
  function maxElements(counts) {
    const highest=Math.max(...ELEMENTS.map(e=>counts[e.key]));
    return ELEMENTS.filter(e=>counts[e.key]===highest).map(e=>e.ko);
  }
  function donutBackground(counts) {
    let start=0;
    const stops=[];
    for(const e of ELEMENTS){
      const pct=counts[e.key]*12.5;
      if(pct>0){stops.push(`${e.color} ${start}% ${start+pct}%`);start+=pct;}
    }
    return `conic-gradient(${stops.join(', ')})`;
  }
  function localAddress(loc) {return !!loc && loc.protocol==='http:' && ['127.0.0.1','localhost'].includes(loc.hostname);}
  function readCandidate(output){
    if(!output || output.dataset.state!=='success') return null;
    const pillarLabels={'년주':'year','월주':'month','일주':'day','시주':'hour'};
    const countLabels={'목':'wood','화':'fire','토':'earth','금':'metal','수':'water'};
    const pillars={},counts={};
    for(const node of output.querySelectorAll('ul li')) {
      const match=String(node.textContent||'').trim().match(/^(년주|월주|일주|시주)\s+([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])$/u);
      if(match)pillars[pillarLabels[match[1]]]=match[2];
    }
    for(const node of output.querySelectorAll('.calc-element-chip')) {
      const match=String(node.textContent||'').trim().match(/^(목|화|토|금|수)\s+(\d+)개$/u);
      if(match)counts[countLabels[match[1]]]=Number(match[2]);
    }
    const candidate={source:'candidate',status:'candidate_only',verified:false,pillars,counts};
    return validChart(candidate)?candidate:null;
  }
  function tag(doc,name,cls,text){const n=doc.createElement(name);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
  function button(doc,cls,text,cb){const b=tag(doc,'button',cls,text);b.type='button';b.addEventListener('click',cb);return b;}
  function switchView(doc,view){
    const target=Array.from(doc.querySelectorAll('[data-view]')).find(el=>el.dataset.view===view && !el.closest('.popo-saju-dashboard'));
    if(target)target.click();
    else if(typeof window!=='undefined' && typeof window.showView==='function')window.showView(view);
  }
  function createDialog(doc) {
    const dlg=tag(doc,'dialog','popo-saju-dialog');dlg.id='popo-saju-dialog';dlg.setAttribute('aria-labelledby','popo-dialog-title');
    const frame=tag(doc,'div','popo-saju-dialog-inner');
    const head=tag(doc,'div','popo-saju-dialog-header');
    const title=tag(doc,'h2','', '');title.id='popo-dialog-title';
    const x=button(doc,'popo-close','×',()=>dlg.close());x.setAttribute('aria-label','상세 창 닫기');
    const content=tag(doc,'div','popo-dialog-body');
    head.append(title,x);frame.append(head,content);dlg.append(frame);doc.body.append(dlg);
    dlg.addEventListener('click',ev=>{if(ev.target===dlg)dlg.close();});
    return {dlg,title,content};
  }
  function mount(doc,loc) {
    const view=doc.querySelector('.view[data-panel="chart"]');
    const scene=doc.querySelector('.view[data-panel="elements"]');
    if(!view || !scene || view.classList.contains('popo-saju-mounted'))return false;
    let data=DEMO;
    const modal=createDialog(doc);
    const openDialog=(title,contentBuilder)=>{
      modal.title.textContent=title;modal.content.replaceChildren();contentBuilder(modal.content);
      if(typeof modal.dlg.showModal==='function')modal.dlg.showModal();
      else modal.dlg.setAttribute('open','');
    };
    const info=tag(doc,'div','popo-saju-dashboard');
    info.innerHTML=`
      <header class="popo-saju-hero">
        <div class="popo-saju-hero-copy"><p class="popo-saju-eyebrow">✦ POPO · MY SAJU</p>
          <h1 id="popo-saju-title">포포가 들려주는<br><span>나의 사주 이야기</span></h1>
          <p>네 기둥의 글자부터 오행의 모습까지, 포포와 함께 한눈에 살펴보자.</p>
          <span id="popo-saju-source" class="popo-saju-source">예시 데이터 · 실제 개인 사주 아님</span>
        </div>
        <img class="popo-saju-hero-rabbit" src="assets/popo-moonlight-rabbit-avatar.webp" width="380" height="380" alt="별을 품은 달토끼 포포" decoding="async">
        <span class="popo-saju-glow" aria-hidden="true">✦　✧</span>
      </header>
      <div class="popo-saju-main">
        <section class="popo-saju-overview" aria-labelledby="popo-summary-heading">
          <div class="popo-saju-summary-rabbit" aria-hidden="true">✿</div>
          <div><p class="popo-saju-kicker">한눈에 보는 나의 사주</p>
            <h2 id="popo-summary-heading">사주 한 장 요약 <span aria-hidden="true">✧</span></h2>
            <p id="popo-summary-copy">네 기둥과 다섯 오행을 한곳에 모았어. 먼저 구조를 살펴보고, 궁금한 내용은 눌러서 자세히 볼 수 있어.</p>
          </div>
          <span class="popo-saju-status">전통 명리 체험 · 검증 전</span>
        </section>
        <div class="popo-saju-grid">
          <section class="popo-saju-card popo-saju-pillars-card" aria-labelledby="popo-pillar-heading">
            <div class="popo-saju-card-head"><span class="popo-card-icon">✿</span><h2 id="popo-pillar-heading">사주 만세력</h2><span class="popo-saju-tiny">네 기둥 · 여덟 글자</span></div>
            <div class="popo-pillar-table" id="popo-pillar-table" role="table" aria-label="네 기둥의 천간과 지지"></div>
            <p class="popo-saju-card-note">연·월·일·시주를 구분해 보여줘. 이 표는 검증된 개인 명식이 아니야.</p>
            <button class="popo-saju-more" id="popo-more-pillars" type="button">만세력 자세히 보기 <span aria-hidden="true">↗</span></button>
          </section>
          <section class="popo-saju-card popo-saju-elements-card" aria-labelledby="popo-element-heading">
            <div class="popo-saju-card-head"><span class="popo-card-icon popo-card-leaf">❀</span><h2 id="popo-element-heading">오행 분포</h2><span class="popo-saju-tiny">8글자 간단 집계</span></div>
            <div class="popo-element-chart">
              <div class="popo-saju-donut" id="popo-saju-donut" role="img" aria-label="오행 집계 도넛 차트"><div class="popo-saju-hole"><span>가장 많은 오행</span><strong id="popo-most-elements">—</strong></div></div>
              <div class="popo-saju-element-grid" id="popo-saju-element-grid" aria-label="오행별 개수"></div>
            </div>
            <p class="popo-saju-card-note">개수만 비교한 그림이야. 오행의 강약이나 용신을 판단한 결과는 아니야.</p>
            <button class="popo-saju-more" id="popo-more-elements" type="button">오행 분포 자세히 보기 <span aria-hidden="true">↗</span></button>
          </section>
        </div>
        <section class="popo-saju-reading" aria-labelledby="popo-reading-heading">
          <div class="popo-saju-reading-top"><span class="popo-card-icon">✧</span><div><p class="popo-saju-kicker">OVERALL READING · SAMPLE</p><h2 id="popo-reading-heading">종합 해석 한눈에 보기</h2></div></div>
          <p id="popo-reading-copy">만세력의 네 기둥은 태어난 연·월·일·시를 천간과 지지로 표현한 거야. 오행의 개수는 그 구성의 한 측면일 뿐, 성격이나 앞으로 일어날 일을 확정해 주지는 않아.</p>
          <div class="popo-saju-reading-tags"><span>✿ 명식의 구조</span><span>✧ 오행의 관계</span><span>☾ 해석의 한계</span></div>
          <button class="popo-saju-more" id="popo-more-reading" type="button">해석 더 자세히 읽기 <span aria-hidden="true">↗</span></button>
        </section>
        <p class="popo-saju-legal" id="popo-saju-legal">이 화면은 서비스 UX 시안과 검증 전 계산 후보를 보여주는 체험용 화면이야. 실제 미래를 예측하거나 개인을 진단하지 않아.</p>
        <div class="popo-saju-cta"><button type="button" id="popo-go-elements">포포와 오행 풍경 보러 가기 ↗</button><button type="button" class="outline" id="popo-open-birth">가상 정보 다시 입력하기</button></div>
      </div>`;
    // DOM is replaced only after the new subtree exists.
    view.append(info);view.classList.add('popo-saju-mounted');
    function drawChart() {
      const candidate=data.source==='candidate';
      info.querySelector('#popo-saju-source').textContent=candidate?'로컬 계산 후보 · 검증 전 · AI 개인화 불가':'가상 예시 명식 · 실제 개인 결과 아님';
      info.querySelector('#popo-summary-copy').textContent=candidate
        ?'로컬 서버가 반환한 네 기둥과 오행 개수를 한눈에 정리했어. 아직 한국 역법 검증 전이라 개인 풀이에는 사용하지 않아.'
        :'가상의 8글자 예시를 통해 만세력과 오행 분포를 살펴보자. 실제 생년월일에 대한 해석은 아니야.';
      const table=info.querySelector('#popo-pillar-table');table.replaceChildren();
      const header=tag(doc,'div','popo-pillar-row');header.setAttribute('role','row');
      for(const k of ORDER){const cell=tag(doc,'span','popo-pillar-colhead',NAMES[k]);cell.setAttribute('role','columnheader');header.append(cell);}table.append(header);
      for(const [i,tagName] of [[0,'천간'],[1,'지지']]){
        const row=tag(doc,'div','popo-pillar-row popo-pillar-values');row.setAttribute('role','row');
        for(const k of ORDER){const cell=tag(doc,'div','popo-pillar-cell');cell.setAttribute('role','cell');
          cell.setAttribute('aria-label',`${LABELS[k]} ${tagName} ${data.pillars[k][i]}`);
          cell.append(tag(doc,'strong','',data.pillars[k][i]));row.append(cell);
        }table.append(row);
      }
      const most=maxElements(data.counts);
      info.querySelector('#popo-most-elements').textContent=most.join(' · ');
      const donut=info.querySelector('#popo-saju-donut');donut.style.background=donutBackground(data.counts);
      donut.setAttribute('aria-label',ELEMENTS.map(e=>`${e.ko} ${data.counts[e.key]}개`).join(', '));
      const grid=info.querySelector('#popo-saju-element-grid');grid.replaceChildren();
      for(const e of ELEMENTS){
        const el=button(doc,'popo-element-stat',`${e.icon} ${e.ko} ${data.counts[e.key]}개`,()=>showElement(e));
        el.style.setProperty('--stat-color',e.color);
        el.setAttribute('aria-label',`${e.ko} ${data.counts[e.key]}개 · 상세 설명 열기`);
        grid.append(el);
      }
      info.querySelector('#popo-reading-copy').textContent=candidate
        ?'이 표는 로컬 계산 엔진의 시험값을 정리한 거야. 오행 개수의 차이만으로 성격·적성·미래를 판단할 수는 없어. 현재는 개인화 해석 대신 명식 구조를 알려줄게.'
        :'만세력은 태어난 연·월·일·시를 천간과 지지로 표현한 거야. 오행의 개수는 그 구성의 한 면일 뿐, 성격이나 앞으로 일어날 일을 확정하지는 않아.';
      info.querySelector('#popo-saju-legal').textContent=candidate
        ?'로컬 계산 후보 · verified=false. 일주·시주 경계와 지역별 보정 검증 전이라 정식 개인 명식이나 AI 풀이에 사용하지 않아.'
        :'표시된 데이터는 가상 예시야. 실제 개인의 사주 분석이나 미래 예측 결과가 아니야.';
    }
    function showElement(e) {
      openDialog(`${e.icon} ${e.ko}(${e.han})의 이야기`,body=>{
        body.append(tag(doc,'p','popo-dialog-lead',e.text));
        body.append(tag(doc,'p','',e.desc));
        body.append(tag(doc,'p','popo-dialog-note',`현재 분포의 ${e.ko} ${data.counts[e.key]}개는 네 기둥에 표시된 여덟 글자를 단순 분류한 값이야. 실제 오행의 강약이나 개인 운세를 뜻하지 않아.`));
        body.append(button(doc,'popo-dialog-cta','오행 풍경 보러 가기 →',()=>{modal.dlg.close();switchView(doc,'elements');const btn=scene.querySelector(`[data-element="${e.key}"]`);if(btn)btn.click();}));
      });
    }
    info.querySelector('#popo-more-pillars').addEventListener('click',()=>openDialog('만세력은 어떻게 읽을까?',body=>{
      body.append(tag(doc,'p','popo-dialog-lead','천간과 지지가 짝을 이룬 네 기둥을 사주팔자라고 불러.'));
      for(const k of ORDER)body.append(tag(doc,'p','',`${NAMES[k]} ${data.pillars[k]} · ${k==='year'?'해':k==='month'?'달':k==='day'?'날':'시간'}에 해당하는 기둥이야.`));
      body.append(tag(doc,'p','popo-dialog-note','현재 수치는 가상 예시 또는 미검증 시험값으로, 정식 만세력으로 확정한 결과가 아니야.'));
    }));
    info.querySelector('#popo-more-elements').addEventListener('click',()=>openDialog('오행 분포 자세히 보기',body=>{
      body.append(tag(doc,'p','popo-dialog-lead','다섯 가지 오행의 숫자를 살펴보자.'));
      for(const e of ELEMENTS){body.append(button(doc,'popo-dialog-element',`${e.icon} ${e.ko}(${e.han}) · ${data.counts[e.key]}개 — ${e.text}`,()=>showElement(e)));}
      body.append(tag(doc,'p','popo-dialog-note','가장 많은 오행이 곧 강한 오행이나 좋은 오행을 뜻하지는 않아. 지장간·계절·상호작용 등은 여기서 계산하지 않았어.'));
    }));
    info.querySelector('#popo-more-reading').addEventListener('click',()=>openDialog('종합 해석 자세히 보기',body=>{
      body.append(tag(doc,'p','popo-dialog-lead','결과를 읽기 전에, 무엇을 확인한 값인지 살펴보자.'));
      body.append(tag(doc,'p','',`현재 네 기둥은 ${ORDER.map(k=>data.pillars[k]).join(' · ')}야. ${data.source==='demo'?'가상 예시':'검증 전 계산 후보'}로 제공한 값이야.`));
      body.append(tag(doc,'p','',`오행은 ${ELEMENTS.map(e=>`${e.ko} ${data.counts[e.key]}개`).join(', ')}로 분류돼. 숫자만으로 누군가의 성격이나 인생 흐름을 판단할 수는 없어.`));
      body.append(tag(doc,'p','popo-dialog-note','개인 사주 해석에는 추가로 검증된 계산 규칙과 해석 근거가 필요해. 지금은 읽는 방법을 익히는 용도로 사용해 줘.'));
    }));
    info.querySelector('#popo-go-elements').addEventListener('click',()=>switchView(doc,'elements'));
    info.querySelector('#popo-open-birth').addEventListener('click',()=>{const dialog=doc.getElementById('birth-dialog');if(dialog && typeof dialog.showModal==='function' && !dialog.open)dialog.showModal();});
    drawChart();

    // Existing five-element scene: retain original character artwork, tab state,
    // keyboard navigation and app.js updates; add polish and supplementary tabs.
    scene.classList.add('popo-elements-mounted');
    const tabs=tag(doc,'nav','popo-elements-subtabs');tabs.setAttribute('aria-label','오행 둘러보기 메뉴');
    const options=[['scene','오행 분석'],['ratio','나의 오행 비율'],['facts','오행별 특징'],['guide','생활 가이드']];
    const extra=tag(doc,'section','popo-elements-extra');extra.hidden=true;
    const original=scene.querySelector('.elements-shell');
    const ratio=tag(doc,'div','popo-elements-extra-ratio');
    function setMode(mode){
      for(const b of tabs.querySelectorAll('button')){const active=b.dataset.mode===mode;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));}
      if(original)original.hidden=mode!=='scene';
      extra.hidden=mode==='scene';extra.replaceChildren();
      if(mode==='ratio'){
        extra.append(tag(doc,'h2','', '다섯 오행의 분포'));
        extra.append(tag(doc,'p','popo-elements-muted',data.source==='demo'?'가상 8글자 예시의 오행 개수야. 실제 내 사주 결과는 아니야.':'로컬 계산 후보의 8글자 집계야. 아직 개인 명식으로 검증된 결과는 아니야.'));
        const wrap=tag(doc,'div','popo-elements-ratio-list');
        for(const e of ELEMENTS){const row=tag(doc,'div','popo-ratio-row');const label=tag(doc,'span','',`${e.icon} ${e.ko}(${e.han}) · ${data.counts[e.key]}개`);
          const bar=tag(doc,'div','popo-ratio-track');const fill=tag(doc,'div','popo-ratio-fill');fill.style.width=`${data.counts[e.key]*12.5}%`;fill.style.background=e.color;bar.append(fill);row.append(label,bar);wrap.append(row);}extra.append(wrap);
        extra.append(button(doc,'popo-dialog-cta','만세력과 종합 해석 보러 가기 →',()=>switchView(doc,'chart')));
      }else if(mode==='facts'){
        extra.append(tag(doc,'h2','','오행별로 어떤 상징이 있을까?'));
        const cards=tag(doc,'div','popo-fact-grid');
        for(const e of ELEMENTS){cards.append(button(doc,'popo-fact-card',`${e.icon} ${e.ko}(${e.han}) · ${e.text}`,()=>{setMode('scene');scene.querySelector(`[data-element="${e.key}"]`)?.click();}));}extra.append(cards);
      }else if(mode==='guide'){
        extra.append(tag(doc,'h2','','오행과 함께하는 작은 산책'));
        extra.append(tag(doc,'p','', '각 풍경은 전통적 상징을 더 쉽게 이해하도록 만든 이야기야. 오행은 좋고 나쁜 순위를 매기는 수치가 아니야.'));
        extra.append(tag(doc,'p','', '개인의 사주 계산이 검증되기 전에는 특정한 성향이나 건강·미래를 오행만으로 단정하지 않아.'));
        extra.append(button(doc,'popo-dialog-cta','포포의 오행 풍경 보기 →',()=>setMode('scene')));
      }
    }
    for(const [mode,label] of options){const b=button(doc,'popo-elements-subtab',label,()=>setMode(mode));b.dataset.mode=mode;b.setAttribute('aria-pressed',String(mode==='scene'));tabs.append(b);}setMode('scene');
    const header=scene.querySelector('.elements-intro');if(header)header.insertAdjacentElement('afterend',tabs);
    if(original)original.insertAdjacentElement('afterend',extra);
    const stage=scene.querySelector('#element-stage');
    if(stage){
      const controls=tag(doc,'div','popo-scene-arrows');
      for(const [delta,label,symbol] of [[-1,'이전 오행','‹'],[1,'다음 오행','›']]){
        controls.append(button(doc,'popo-scene-arrow',symbol,()=>{
          const selected=scene.querySelector('[data-element].is-active');
          const index=Math.max(0,ELEMENTS.findIndex(e=>e.key===(selected && selected.dataset.element)));
          scene.querySelector(`[data-element="${ELEMENTS[(index+delta+ELEMENTS.length)%ELEMENTS.length].key}"]`)?.click();
        }));controls.lastChild.setAttribute('aria-label',label);
      }stage.append(controls);
    }
    const copy=scene.querySelector('.element-copy');if(copy){
      copy.append(button(doc,'popo-scene-detail','오행 이야기 더 자세히 ↗',()=>{
        const id=scene.querySelector('[data-element].is-active')?.dataset.element||'wood';
        showElement(ELEMENTS.find(e=>e.key===id)||ELEMENTS[0]);
      }));
    }
    // Only a user-confirmed local candidate may replace the fictional sample.
    // Never infer a personal chart from the public mockup or a birth date field.
    if(localAddress(loc)){
      const output=doc.getElementById('calc-server-output');
      if(output){
        const use=button(doc,'popo-candidate-use','이 시험 명식으로 한 페이지 보기 →',()=>{
          const found=readCandidate(output);if(!found)return;
          data=found;drawChart();if(!extra.hidden)setMode('ratio');
          const dialog=doc.getElementById('birth-dialog');if(dialog && dialog.open)dialog.close();
          switchView(doc,'chart');
        });
        use.id='popo-candidate-use';use.hidden=true;output.append(use);
        const update=()=>{use.hidden=!readCandidate(output);};
        // Don't observe the button's own `hidden` attribute: no feedback loop.
        const target=output.querySelector('#calc-server-pillars') || output;
        const observer=new MutationObserver(update);
        observer.observe(target,{subtree:true,childList:true,characterData:true});
        const inputIds=['calendar-type','birthday','birthtime','unknown-time','birthplace','leap-month'];
        for(const id of inputIds){const f=doc.getElementById(id);if(f)for(const ev of ['input','change'])f.addEventListener(ev,()=>{
          if(data.source==='candidate'){data=DEMO;drawChart();if(!extra.hidden)setMode('ratio');}
          use.hidden=true;
        });}
        output.addEventListener('click',update);update();
      }
    }
    return true;
  }
  return {mount,validChart,readCandidate,maxElements,donutBackground,DEMO,ELEMENTS,localAddress};
});
