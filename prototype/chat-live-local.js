/* POPO Stage 4B: local-only live AI chat adapter.
 * Uses the existing FastAPI /api/chat; no API key or natal chart data in the browser.
 * Public GitHub Pages stays in the original non-network demo mode.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) {
    const start = () => api.mount(root.document, root.location, root.fetch.bind(root));
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start, {once: true});
    else start();
  }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const URL = 'http://127.0.0.1:8000/api/chat';
  const HISTORY_MAX = 6;
  const QUESTION_MAX = 600;
  const ANSWER_MAX = 16000;
  const HISTORY_TURN_MAX = 800;

  function isLocalPage(loc) {
    return Boolean(loc && loc.protocol === 'http:' &&
      (loc.hostname === '127.0.0.1' || loc.hostname === 'localhost'));
  }
  function validateResponse(data) {
    if (!data || typeof data.answer !== 'string' || !data.answer.trim() ||
        data.answer.length > ANSWER_MAX || data.chart_verified !== false ||
        !Array.isArray(data.tools_used) || !data.tools_used.every(t => t === 'get_saju_chart') ||
        typeof data.estimated_cost_usd !== 'number' || !Number.isFinite(data.estimated_cost_usd) ||
        data.estimated_cost_usd < 0) {
      throw new Error('AI 응답의 검증 상태가 올바르지 않아 표시를 중단했어.');
    }
    return data;
  }
  function statusText(httpStatus) {
    if (httpStatus === 422) return '질문을 확인해 줘. 최대 600자까지 보낼 수 있어.';
    if (httpStatus === 429) return '이번 로컬 데모의 API 예산 제한에 도달했어. 더 이상 호출하지 않을게.';
    if (httpStatus === 503) return '포포가 AI 서버에 연결하지 못했어. API 키나 로컬 서버 설정을 확인해 줘.';
    if (httpStatus === 502 || httpStatus >= 500) return '지금은 포포가 답을 가져오지 못했어. 잠시 후 다시 물어봐 줄래?';
    return 'AI 요청을 처리하지 못했어. 네트워크 연결을 확인해 줘.';
  }
  function mount(doc, loc, doFetch) {
    if (!isLocalPage(loc)) return false;
    const form = doc.getElementById('chat-form');
    const input = doc.getElementById('chat-text');
    const list = doc.getElementById('chat-list');
    const send = form && form.querySelector('button[type="submit"]');
    const disclaimer = doc.querySelector('.chat-disclaimer');
    const headLabel = doc.querySelector('.chat-head .small-tag');
    if (!form || !input || !list || !send || !disclaimer || !headLabel) return false;

    const appendBubble = (message, who, extraClass) => {
      const bubble = doc.createElement('div');
      bubble.className = 'chat-bubble ' + who + (extraClass ? ' ' + extraClass : '');
      bubble.textContent = message; // NEVER insert AI output as HTML.
      list.appendChild(bubble);
      list.scrollTop = list.scrollHeight;
      return bubble;
    };
    let history = [];
    let busy = false;
    list.replaceChildren();
    appendBubble('안녕! 난 포포야. ✦ 오늘은 어떤 게 궁금해? 명리 용어는 편하게 물어봐. 다만 개인 사주 풀이는 아직 검증 중이라 준비되지 않았어.', 'assistant');
    input.placeholder = '포포에게 궁금한 걸 물어봐 (로컬 시험)';
    input.maxLength = 600;
    send.textContent = '포포에게 보내기 →';
    headLabel.textContent = '포포와 이야기 중 · 개인 사주 준비 중';
    disclaimer.textContent = '지금은 내 컴퓨터에서 시험하는 AI 상담이야. 질문과 최근 대화 6개 메시지는 OpenAI API로 전달돼. 실제 개인정보는 적지 말아 줘. 소액의 사용료가 발생할 수 있고, 새로고침하면 대화 내용은 사라져.';
    form.dataset.liveMode = 'local-only';

    // Capture before the existing app.js bubble-phase demo handler. This keeps
    // every public-view interaction intact without editing app.js.
    form.addEventListener('submit', async event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (busy) return;
      const question = String(input.value || '').trim();
      if (!question) return;
      if (question.length > QUESTION_MAX) {
        appendBubble('질문은 600자 이내로 작성해 줘.', 'assistant', 'chat-local-error');
        return;
      }
      busy = true;
      send.disabled = true;
      input.disabled = true;
      appendBubble(question, 'user');
      input.value = '';
      const pending = appendBubble('포포가 생각하고 있어… ✦', 'assistant', 'chat-local-pending');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 70000);
      try {
        const response = await doFetch(URL, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({question, history: history.slice(-HISTORY_MAX)}),
          signal: controller.signal,
          cache: 'no-store'
        });
        if (!response.ok) throw new Error(statusText(response.status));
        const result = validateResponse(await response.json());
        pending.className = 'chat-bubble assistant';
        pending.textContent = result.answer;
        if (result.tools_used.length) {
          const indicator = doc.createElement('small');
          indicator.className = 'chat-local-tool-note';
          indicator.textContent = '계산 도구에 물어봤어. 하지만 개인 명식은 아직 검증 전이야.';
          pending.appendChild(indicator);
        }
        history = history.concat([{role:'user', content:question},{role:'assistant', content:result.answer.slice(0, HISTORY_TURN_MAX)}]).slice(-HISTORY_MAX);
      } catch (error) {
        pending.className = 'chat-bubble assistant chat-local-error';
        pending.textContent = error && error.name === 'AbortError'
          ? 'AI 요청 시간이 초과됐어. 서버 상태를 확인하고 다시 시도해 줘.'
          : error instanceof TypeError
            ? '로컬 FastAPI에 연결할 수 없어. 127.0.0.1:8000 서버를 확인해 줘.'
            : (error && [statusText(422), statusText(429), statusText(502), statusText(503), statusText(400), 'AI 응답의 검증 상태가 올바르지 않아 표시를 중단했어.'].includes(error.message)
              ? error.message : 'AI 요청을 완료하지 못했어. 다시 시도해 줘.');
        // Failed interactions are deliberately not added to the next request history.
      } finally {
        clearTimeout(timer);
        busy = false;
        input.disabled = false;
        send.disabled = false;
        list.scrollTop = list.scrollHeight;
        input.focus();
      }
    }, true);
    return true;
  }
  return {URL, HISTORY_MAX, HISTORY_TURN_MAX, isLocalPage, validateResponse, statusText, mount};
});
