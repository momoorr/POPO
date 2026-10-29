const $$=(s)=>Array.from(document.querySelectorAll(s));
const $=(s)=>document.querySelector(s);
const viewNames=new Set(['home','chart','reading','fortune','character','chat']);
let lastTopic='life';
function showView(view){
  if(!viewNames.has(view))return;
  $$('.view').forEach(p=>{let yes=p.dataset.panel===view;p.classList.toggle('active',yes);p.hidden=!yes;});
  $$('[data-view]').forEach(btn=>{const yes=btn.dataset.view===view;btn.classList.toggle('active',yes);if(btn.classList.contains('nav-btn'))btn.setAttribute('aria-current',yes?'page':'false');});
  document.title='포포 · '+({home:'홈',chart:'내 사주',reading:'상세 해석',fortune:'운세',character:'일주 캐릭터',chat:'AI 상담'}[view]);
  try{history.replaceState(null,'','#'+view)}catch(e){}
  window.scrollTo({top:0,behavior:'instant'});
}
$$('[data-view]').forEach(btn=>btn.addEventListener('click',(e)=>{e.preventDefault();showView(btn.dataset.view)}));
if(viewNames.has(location.hash.slice(1))) showView(location.hash.slice(1));
const dialog=$('#birth-dialog');
$('#open-birth').addEventListener('click',()=>dialog.showModal());
$('#close-birth').addEventListener('click',()=>dialog.close());
$('#unknown-time').addEventListener('change',e=>{$('#birthtime').disabled=e.target.checked;$('#birthtime').style.opacity=e.target.checked?'0.4':'1'});
$('#calendar-type').addEventListener('change',e=>{$('#leap-month').disabled=e.target.value!=='음력';if(e.target.value!=='음력')$('#leap-month').checked=false});
$('#leap-month').disabled=true;
$('#preview-chart').addEventListener('click',()=>{dialog.close();showView('chart')});
const inf=$('#info-dialog');$('#open-privacy').addEventListener('click',()=>inf.showModal());$('#close-info').addEventListener('click',()=>inf.close());$('#info-confirm').addEventListener('click',()=>inf.close());
const topics={
 life:['인생 총운','긴 운세 보고서보다 ‘나를 알아가는 질문’으로 시작해 보세요.','계산된 명식에서 어떤 요소를 보았는지 연결하고, 전문 용어를 일상적인 문장으로 설명하는 자리예요.'],
 work:['직업·진로','‘어떤 직업이 정답인가?’보다 ‘나에게 어떤 방식의 일과 성장이 중요한가?’를 탐색해요.','직업 해석의 출처가 되는 명리 요소를 표시하고, 실제 직무 선택에서는 역량·흥미·근무 조건을 함께 검토하도록 돕는 구성입니다.'],
 love:['연애·관계','관계를 확정적으로 예언하기보다 나의 관계 고민을 차분히 돌아보는 시간.','전통적 사주 해석과 실제 관계 속 의사소통은 별개의 정보임을 구분해 보여줍니다.'],
 money:['금전·재물','돈에 관한 해석을 살펴보되 실제 재무 결정은 현실적 자료와 함께 해요.','재물 관련 해석 근거를 표시하고 투자 수익이나 손실을 확정적으로 예언하지 않도록 설계합니다.'],
 people:['인간관계','사람들 사이에서 내가 중요하게 여기는 가치가 무엇인지 질문해 봐요.','다른 사람의 속마음을 알아맞힌다고 표현하지 않고, 자기 성찰을 돕는 해석 경험을 기획합니다.'],
 study:['학업·학습','학습에 관한 주제를 읽고 나에게 맞는 공부 방법을 함께 생각해 봐요.','시험 점수나 합격 시점을 점술로 보장하지 않습니다. 이 카테고리는 P1 추가 제안입니다.'],
 reunion:['재회·관계의 선택','과거의 관계를 돌아보는 질문을 할 수 있어요.','상대방의 마음·행동·재회 날짜를 예언하지 않습니다. 감정과 선택에 도움이 되는 성찰 질문으로 제한하는 제안입니다.'],
 health:['건강·생활 리듬','나를 돌보는 생활 습관을 돌아보는 가벼운 콘텐츠예요.','의학적 진단·질병 위험·수명·치료 방법을 사주로 판단하지 않습니다. 건강 콘텐츠는 안전 정책 검토 후 범위를 결정합니다.']
};
function chooseTopic(topic){if(!topics[topic])return;lastTopic=topic;$$('[data-topic]').forEach(b=>b.classList.toggle('active',b.dataset.topic===topic));$('#topic-title').textContent=topics[topic][0];$('#topic-lead').textContent=topics[topic][1];$('#topic-body').textContent=topics[topic][2];$('#deep-detail').hidden=true;$('#deep-toggle').setAttribute('aria-expanded','false')}
$$('[data-topic]').forEach(b=>b.addEventListener('click',()=>chooseTopic(b.dataset.topic)));
$('#deep-toggle').addEventListener('click',()=>{const d=$('#deep-detail');d.hidden=!d.hidden;$('#deep-toggle').setAttribute('aria-expanded',String(!d.hidden))});
const fortunes={
 today:['☀','오늘의 운세','오늘이라는 기준 날짜와 해석 근거를 분명하게 보여주는 카드로 구성해요.','실제 계산 정책과 엔진이 검증되면, 날짜·지역 기준을 함께 표시하고 AI 상담으로 이어집니다.','P1 계획 · 일진·일운 계산 정책 검증 전'],
 year:['✦','올해 총운 · 세운','올해 총운은 ‘세운’ 데이터를 쉽게 설명하는 요약이에요.','전문 명리학 용어로 해석한 세운과 친근한 문장의 올해 총운은 같은 계산 결과를 참조하도록 설계합니다.','P1~P2 제안 · 동일한 annual_data_id 참조'],
 daeun:['◷','대운','인생의 장기 흐름을 시기별로 보여주는 심화 기능이에요.','대운의 시작 시점·순역·계산 규칙 등은 아직 결정되지 않았어요. 검증 전에는 실제 대운 결과를 제공하지 않습니다.','P2 제안 · 계산 정책 미확정'],
 tojeong:['☾','새해의 토정비결','사주와는 다른 전통 계산법으로 한 해와 음력 열두 달을 읽어요.','토정비결은 괘수를 산출하고 원문·현대어 풀이를 연결하는 독립 콘텐츠예요. 원문 판본/저작권/윤달 규칙을 검증한 후 출시합니다.','P1 화면 시안 / P2 계산 구현 제안 · 실제 괘 계산 없음']
};
$$('[data-fortune]').forEach(btn=>btn.addEventListener('click',()=>{const f=fortunes[btn.dataset.fortune];$$('[data-fortune]').forEach(b=>b.classList.toggle('active',b===btn));$('#fortune-mark').textContent=f[0];$('#fortune-title').textContent=f[1];$('#fortune-lead').textContent=f[2];$('#fortune-description').textContent=f[3];$('#fortune-footnote').textContent=f[4]}));
$$('[data-color]').forEach(btn=>btn.addEventListener('click',()=>{const cl=$('#character-sprite');cl.className='character-sprite '+btn.dataset.color;$$('[data-color]').forEach(b=>b.classList.toggle('active',b===btn))}));
function appendMessage(text,who){const div=document.createElement('div');div.className='chat-bubble '+who;div.textContent=text;$('#chat-list').append(div);$('#chat-list').scrollTop=$('#chat-list').scrollHeight}
$('#chat-form').addEventListener('submit',e=>{e.preventDefault();const input=$('#chat-text');const q=input.value.trim();if(!q)return;appendMessage(q,'user');appendMessage('시안 안내: 실제 AI와 연동되지 않아 입력 문장을 분석하거나 사주를 풀이하지 않습니다. 완성 서비스에서는 선택한 주제(현재: '+(topics[lastTopic]?.[0]||'미선택')+')와 검증된 명식 데이터를 연결하고, 해석 근거와 불확실성을 분리해 답변할 예정입니다.','assistant');input.value='';});
$$('[data-prompt]').forEach(b=>b.addEventListener('click',()=>{$('#chat-text').value=b.dataset.prompt;$('#chat-text').focus()}));
$('#ask-from-reading').addEventListener('click',()=>{$('#chat-text').placeholder='선택한 '+topics[lastTopic][0]+'에 대해 질문해 보세요 (시안)'});
