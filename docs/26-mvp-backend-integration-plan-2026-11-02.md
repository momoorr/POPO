# POPO MVP 인계·통합 판단 기록 — 2026-11-02

## 1. 기준

- GitHub 확인 기준: `momoorr/POPO`, main `23f77deca36836b27040c6ac8cc0923189ae941a` (2026-10-30)
- 첨부 패치: `POPO_paid_agent_starter.zip` (적용 전, Python 구문 검사 보고됨)
- 마감: 2026-11-10, P0: 검증된 명식 계산 + 실제 AI Agent 상담 + 모바일 기본 흐름
- Figma 시안은 UI 디자인 기준이다. 프런트엔드를 전면 교체하거나 기존 기능을 삭제하지 않는다.

## 2. 현재 기능별 근거

| 기능 | 실제 확인한 상태 | P0 작업 |
|---|---|---|
| 홈·메뉴 이동 | `prototype/app.js`의 `showView`, `data-view` 구현 | 회귀 테스트 |
| 출생정보 | `prototype/index.html`의 dialog 입력, `calc-core.js`의 후보 입력 검증 | 명식 계산·실패 동작의 단일 진입점으로 통합 |
| 원국 계산 | `lunar-javascript@1.7.7` 브라우저 후보 (양력 1990-2040, 특정 일·시간만 시험 가능) | 한국 기준 독립 테스트 벡터 검증 후 서버 단일 소스로 승격 |
| 결과 페이지 | `data-panel=chart`의 가상 명식 고정 | 서버 계산 데이터로 치환, 미검증 시 결과 차단 |
| 오행 | 캐릭터 풍경 시연, v1.4 그래프 미반영 | 검증된 8글자 대표 오행만 그래프 표시, 신강·용신 단정 금지 |
| AI 상담 | `app.js` `chat-form` 고정 시안 안내 | 검증된 계산 도구 + Responses API 연동 |
| 궁합·토정비결 | 시연/정보 구조 | Coming Soon 명시, P0 개발 제외 |
| Figma | POPO 폴더/디자인 파일과 플러그인 등록 과정 진행 중 | 시안 원본을 디자인 레퍼런스로 관리, 코드와 기능 분리 |

## 3. 첨부 패치 평가

### 재사용 가능
- FastAPI 경로 `/health`·`/api/chat`, OpenAI Responses Function Calling 도구 호출 구조
- 환경변수 `OPENAI_API_KEY`, 제한된 문맥, 비용 추산과 soft guard 개념
- `store=False`, API 키를 서버에만 보관한다는 원칙

### 그대로 적용하지 않는 이유
- `tool_chart`는 항상 unavailable을 반환, P0 개인화 연결이 아님
- `prototype/popo-agent-adapter.js`는 ES module `export`를 쓰는데 현행 `app.js`는 일반 스크립트로 로딩하며, 기존 submit handler 연결이 없음
- 기존 `#preview-chart`는 가상 명식으로 이동, `#chat-form`은 고정 안내를 출력
- 클라이언트에서 보내는 `chart`를 검증값으로 취급하면 안 됨. 1차 단계에서 입력 자체를 거부
- 소프트 비용 DB는 동시성/다중 인스턴스/영속성/공개 API 남용을 막지 못함
- 실제 결제·CORS·오류·상담 UI·모바일 E2E 테스트가 없음

## 4. P0 데이터 흐름 계약

```
출생 입력
  -> 서버 /api/chart (아직 미구현)
  -> 한국 역법 독립 테스트 벡터 대조
  -> verified=true인 서버 생성 chart_id + 표준화된 pillars + version
  -> 프런트엔드 명식·오행 렌더링 (예시값 제거)
  -> /api/chat (서버의 chart_id를 조회, 클라이언트 주입 chart 불신)
  -> Responses API의 get_saju_chart Function Calling
  -> 동일 chart_id의 검증 데이터 + 최근 대화 문맥
  -> 개인화 답변 (해석/사실/한계 구분)
```

검증 전에는 `/api/chart`와 verified chart_id를 만들지 않는다. 이 단계의 도구는 명확히 unavailable을 반환한다.

## 5. 개발 순서

1. Stage 1 (이번 파일): 백엔드 경계·오류·Function Calling 오프라인 계약 테스트. **기존 UI 미변경**.
2. Stage 2: 한국 만세력 계산 정책과 테스트 벡터 교차 검증 → `/api/chart` 구현.
3. Stage 3: `app.js`의 `#preview-chart`·`#chat-form` 핸들러를 실제 서비스로 점진 교체. UI 디자인 보존.
4. Stage 4: 서버 배포, CORS·인증 또는 데모 제한·공용 비용 한도, 실제 OpenAI 호출 검증.
5. Stage 5: 모바일·오류·네트워크 실패·Coming Soon·실제 사용자 시나리오 QA.

## 6. 디자인과 포트폴리오

시안과 구현 상태를 혼동하지 않는다. Figma는 레이아웃/컴포넌트/사용자 흐름 산출물이며, 백엔드 QA는 계산/Agent 검증 증거다. 둘은 같은 기능 ID로 매핑하되 별도 완료 기준을 둔다.

## 7. 위험과 검증 우선순위

- R1 (차단): 절기 경계, 자시(23:00~00:59), 한국 표준시/역사 시각 정책, 음력 윤달, 일주 교차 검증.
- R2 (차단): 검증되지 않은 사주 데이터가 개인 해석에 들어가는 데이터 오염.
- R3 (차단): 공개 AI API의 무인증 호출 및 사용료 위험. 프로젝트 단위 **hard spend limit** + 서버 요청 제한 필요.
- R4 (높음): GitHub Pages는 정적 웹. FastAPI 별도 호스팅/HTTPS/CORS 필요.
- R5 (중간): 기존 시안 문구를 기능 완성 표시로 오해하게 만드는 UX.

**기록 원칙:** 확인 가능한 GitHub/테스트 로그만 성과로 기재한다. 라이브 API·한국 역법·실사용 배포는 아직 검증 전이다.
