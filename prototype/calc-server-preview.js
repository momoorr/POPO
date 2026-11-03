/* POPO local FastAPI candidate preview (Stage 4A).
 * Only mounts on HTTP localhost/127.0.0.1, never on public GitHub Pages.
 * Does not change the static sample chart, AI Agent, local candidate, or element scenes.
 * Never promotes unverified values into verified personal charts.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) {
    const begin = () => api.mount(root.document, root.location, root.fetch.bind(root));
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', begin, {once:true});
    else begin();
  }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const API_URL = 'http://127.0.0.1:8000/api/chart/probe';
  const KEYS = ['year','month','day','hour'];
  const ELEMENTS = ['wood','fire','earth','metal','water'];
  const ELEMENT_NAMES = {wood:'목',fire:'화',earth:'토',metal:'금',water:'수'};
  const GANJI = /^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/u;

  function isLocalPage(location) {
    return !!location && location.protocol === 'http:' &&
      (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  }
  function getPayload(doc) {
    const get = id => doc.getElementById(id);
    const selected = get('birthplace').selectedOptions[0];
    const label = selected ? selected.textContent.trim() : '';
    const place = ['서울','부산','대전'].find(city => label.startsWith(city));
    if (!place) throw new Error('이번 로컬 시험에서는 서울·부산·대전만 선택할 수 있어요.');
    return {
      calendar: get('calendar-type').value,
      date: get('birthday').value,
      time: get('birthtime').value,
      place,
      unknown_time: get('unknown-time').checked === true
    };
  }
  function checkResult(data) {
    if (!data || data.status !== 'candidate_only' || data.verified !== false ||
        data.can_personalize !== false || data.engine !== 'lunar-javascript@1.7.7' ||
        Object.prototype.hasOwnProperty.call(data,'chart_id')) {
      throw new Error('서버의 검증 상태를 확인할 수 없어 결과 표시를 중단했어요.');
    }
    if (!data.pillars || !KEYS.every(key => typeof data.pillars[key] === 'string' && GANJI.test(data.pillars[key]))) {
      throw new Error('서버에서 받은 명식 형식이 올바르지 않아요.');
    }
    if (!data.counts || !ELEMENTS.every(key => Number.isInteger(data.counts[key]) && data.counts[key]>=0 && data.counts[key]<=8) ||
        ELEMENTS.reduce((sum,key) => sum+data.counts[key],0)!==8) {
      throw new Error('서버에서 받은 오행 집계가 올바르지 않아요.');
    }
    return data;
  }
  function mount(doc, location, doFetch) {
    if (!isLocalPage(location)) return false;
    const get = id => doc.getElementById(id);
    const section = get('calc-server-local');
    const button = get('calc-server-trigger');
    const output = get('calc-server-output');
    const message = get('calc-server-message');
    const pillars = get('calc-server-pillars');
    const counts = get('calc-server-counts');
    if (![section,button,output,message,pillars,counts].every(Boolean)) return false;
    section.hidden = false;
    let generation = 0;
    let controller = null;
    const clearData = () => {pillars.replaceChildren();counts.replaceChildren();};
    const reset = () => {
      generation += 1;
      if (controller) controller.abort();
      controller = null;
      button.disabled = false;
      output.hidden = true;
      output.dataset.state = '';
      message.textContent = '';
      clearData();
    };
    for (const id of ['calendar-type','birthday','birthtime','unknown-time','birthplace','leap-month']) {
      const node = get(id);
      if (node) {
        node.addEventListener('change',reset);
        node.addEventListener('input',reset);
      }
    }
    const showError = msg => {
      output.hidden = false;
      output.dataset.state = 'error';
      message.textContent = msg;
      clearData();
    };
    const render = value => {
      output.hidden = false;
      output.dataset.state = 'success';
      message.textContent = 'FastAPI 서버 계산 후보 · 아직 검증 전 · AI 상담 연결 불가';
      clearData();
      for (const [key,label] of [['year','년주'],['month','월주'],['day','일주'],['hour','시주']]) {
        const li = doc.createElement('li');
        li.textContent = `${label}  ${value.pillars[key]}`;
        pillars.appendChild(li);
      }
      for (const key of ELEMENTS) {
        const span = doc.createElement('span');
        span.className = 'calc-element-chip';
        span.textContent = `${ELEMENT_NAMES[key]} ${value.counts[key]}개`;
        counts.appendChild(span);
      }
    };
    button.addEventListener('click', async () => {
      if (button.disabled) return;
      const serial = ++generation;
      let payload;
      try {payload = getPayload(doc);}
      catch (err) {showError(err.message); return;}
      controller = new AbortController();
      const currentController = controller;
      button.disabled = true;
      output.hidden = false;
      output.dataset.state = 'loading';
      message.textContent = '로컬 FastAPI 계산 요청 중…';
      clearData();
      const timeout = setTimeout(() => currentController.abort(), 8000);
      try {
        const response = await doFetch(API_URL, {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify(payload),
          signal:currentController.signal,
          cache:'no-store'
        });
        if (serial!==generation) return;
        if (!response.ok) {
          if (response.status===422) throw new Error('지원하지 않는 날짜·시간·지역 또는 입력 형식이에요. 양력 2000-01-01, 12:00, 서울로 시험해 봐.');
          throw new Error('FastAPI가 계산을 처리하지 못했어요. 로컬 서버 실행 상태를 확인해 줘.');
        }
        const value = checkResult(await response.json());
        if (serial!==generation) return;
        render(value);
      } catch (err) {
        if (serial!==generation) return;
        if (err && err.name==='AbortError') showError('계산 요청이 시간 초과되었어요. 로컬 서버를 확인해 줘.');
        else if (err && (err instanceof TypeError || /fetch|network/i.test(err.message))) showError('로컬 API 연결에 실패했어. FastAPI가 127.0.0.1:8000에서 실행 중인지 확인해 줘.');
        else showError(err && err.message ? err.message : '로컬 계산에 실패했어요.');
      } finally {
        clearTimeout(timeout);
        if (serial===generation) {controller=null;button.disabled=false;}
      }
    });
    return true;
  }
  return {API_URL, isLocalPage, getPayload, checkResult, mount};
});
