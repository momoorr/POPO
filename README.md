# 포포 (POPO) ✦

> **나를 읽는 AI 사주 상담**

> **나를 읽는 AI 사주 상담**  
> 출생정보 → 검증된 명식 → 쉬운 풀이/심화 보기 → AI 후속 질문까지 이어지는 B2C 명리 상담 서비스 **기획 포트폴리오**.


> **현재 단계: 제품기획 + 클릭형 UX 목업 (실제 역법 계산·AI 모델 연결 및 사용자 테스트 미완료).**  
> GitHub Pages 공개 설정: [GITHUB_UPLOAD_GUIDE.md](GITHUB_UPLOAD_GUIDE.md) · 현재 상태: [PROGRESS.md](PROGRESS.md)

**데모 진입:** [`index.html`](index.html) → [`prototype/index.html`](prototype/index.html) (업로드 후 GitHub Pages에서 웹 시안으로 이용 가능)

**UI 미리보기:** [브라우저에서 인터랙티브 목업 확인](../prototype/index.html)

## 프로젝트 상태 (2026-10-29)

**기획·인터랙티브 목업 단계. 실제 서비스 출시/실제 사주 계산/실제 AI 연결/사용자 인터뷰 수행을 주장하지 않습니다.**
- **확정 기준선:** PRD v0.3 (사용자가 공유한 프로젝트 컨텍스트에 기반)
- **변경 제안:** v0.4 (운세 카테고리 재편, 토정비결, 60갑자 캐릭터, UI 컨셉)
- **이번 공개물:** 제품 개요, 기능 우선순위, 정보구조, 사용자 흐름, 인터랙티브 프런트 목업, QA·검증 계획, 취업용 PPT
- **계산 상태:** 미연결. `prototype/`에 표시된 모든 명식/운세/AI 문구는 **목업 데이터**입니다.

## 이 프로젝트로 검증하고 싶은 문제

1. 일반 사용자는 전문 용어가 가득한 명식을 처음 봤을 때 풀이를 이해하기 어렵다. **[사용자 가설]**
2. 사용자는 연애·직업·재물 등 자신이 원하는 주제로 빠르게 이동하고 후속 질문을 하고 싶어 한다. **[사용자 가설]**
3. 긴 운세 보고서보다 ‘한눈에 보기 → 자세히 → AI에게 질문’ 경로가 탐색을 돕는다. **[사용자 가설]**

> 핵심은 **운세 카테고리를 많이 만드는 것**이 아니라, **검증 가능한 계산 + 정보 구조 + 설명 가능한 AI + 사용 편의성**을 결합하는 것입니다.

## 주요 기획 의사결정

| ID | 결정 / 제안 | 상태 |
|---|---|---|
| D-01 | 기본 풀이 + 전문가 심화 보기 | v0.3 확정 |
| D-02 | 출생정보 입력 직후 명식 결과 우선 노출 | v0.3 확정 |
| D-03 | 비회원 기본 체험 | v0.3 확정 |
| D-04 | 차분하고 따뜻한 AI 상담 말투 | v0.3 확정 |
| V04-01 | 운세를 `기본 성향/시간의 흐름/관심 주제/별도 전통 콘텐츠`로 분류 | v0.4 제안 |
| V04-02 | 60갑자 일주를 기본 키로 하는 자체 캐릭터 시스템 | v0.4 제안 |
| V04-03 | 토정비결은 사주 계산과 다른 **독립 계산·해석 콘텐츠**로 운영 | v0.4 제안 |
| V04-04 | 아이보리 카드+미드나잇 네이비+절제된 반짝임 디자인 | v0.4 제안 |

## 사용자가 볼 수 있는 콘텐츠 구조

- **내 사주:** 원국, 인생 총운(기본적인 명식 해석), 오행, 십성, 쉬운 풀이/심화 보기
- **시간의 흐름:** 대운(10년 단위 해석은 계산 정책 확정 후), 세운(연별), 올해 총운(세운에 대한 쉬운 요약), 오늘의 운세
- **관심 주제:** 연애, 금전, 인간관계, 직업, 학업, 재회, 건강 관련 웰빙 안내
- **새해 특집:** 토정비결(괘 산출/원문 판본/월별 풀이 검증 후 제공)
- **캐릭터:** 검증된 일주에 매핑된 60개 캐릭터 ID + 선택적 장식
- **AI 상담:** 현재 명식과 풀이 카테고리 문맥 유지, 근거/한계 제시
- **보조 콘텐츠:** 타로(본래 v0.3의 P1)

**주의:** `재회운`은 상대의 감정·행동을 예언하지 않으며, `건강운`은 질병·수명·치료를 예언하거나 의학적 조언을 대체하지 않습니다.

## 핵심 경험

```text
홈
 └─ 출생정보 입력 ── 유효성 검사/계산 엔진(별도)
      └─ 명식 결과 ── 쉬운 해석 → 심화 해석
           ├─ 관심 주제 선택 → 해석 근거 → AI에게 질문
           ├─ 일주 캐릭터 (P1)
           └─ 올해/오늘/토정비결 (정책 검증 후 순차 공개)
```

## 데모 실행

```bash
# 별도 설치가 필요 없는 정적 시안
open prototype/index.html   # macOS
# 또는 prototype/index.html을 브라우저에서 직접 열기
# GitHub Pages 사용 시 저장소 루트 /index.html에서 자동으로 시안으로 이동
```

입력 폼, 보기 전환, 카테고리, 토정비결 미리보기, 캐릭터, 상담 응답이 클릭 가능합니다. 이 인터랙션은 **가상 시나리오**이며 실제 명리 계산이나 AI 호출은 수행하지 않습니다.

## 제출용 자료

- [`portfolio/포포_기업제출용_서비스기획_포트폴리오_v0.6.pdf`](portfolio/포포_기업제출용_서비스기획_포트폴리오_v0.6.pdf) — 채용 제출용 고정 레이아웃 PDF
- [`portfolio/포포_기업제출용_서비스기획_포트폴리오_v0.6.pptx`](portfolio/포포_기업제출용_서비스기획_포트폴리오_v0.6.pptx) — 기업 제출·면접용 편집 가능 발표 자료 (v0.5: 요구사항·QA 추적성 슬라이드 추가)
- [`docs/01-product-brief.md`](docs/01-product-brief.md) — 문제·타깃·차별화
- [`docs/02a-prd-v0.3-baseline-summary.md`](docs/02a-prd-v0.3-baseline-summary.md) — 확정 기준선 요약(원본 PRD v0.2 미포함)
- [`docs/02-prd-v0.4-proposal.md`](docs/02-prd-v0.4-proposal.md) — 추가 요구사항·우선순위·예외
- [`docs/03-feature-catalog.csv`](docs/03-feature-catalog.csv) — 요청한 운세 기능 전부의 범위·근거
- [`docs/04-ia-and-flows.md`](docs/04-ia-and-flows.md) — IA / 핵심 플로우
- [`docs/09-competitive-benchmark.md`](docs/09-competitive-benchmark.md) — 경쟁사의 공개 확인 기능/차별화 가설
- [`docs/10-screen-spec-addendum.md`](docs/10-screen-spec-addendum.md) — SCR-12 토정비결, SCR-13 운세 허브
- [`data/60-day-pillar-character-map.csv`](data/60-day-pillar-character-map.csv) — 60갑자 유효 ID 전체(이미지·해석 미제작)
- [`docs/05-character-system.md`](docs/05-character-system.md) — 60갑자와 캐릭터 체계
- [`docs/06-design-system.md`](docs/06-design-system.md) — 신비롭지만 사용하기 쉬운 UI 원칙
- [`docs/07-calculation-content-policy.md`](docs/07-calculation-content-policy.md) — 계산·해석·토정비결의 책임 분리
- [`research/`](research/) — 인터뷰·테스트 시나리오·이벤트 설계(미실시)
- [`docs/08-decision-log.md`](docs/08-decision-log.md) — 결정 근거/유지할 사항/검증 필요사항

## 현재 증거 수준

| 항목 | 근거 상태 |
|---|---|
| 경쟁 서비스가 캐릭터·심화 풀이·오늘의 운세 등을 제공 | 공식 공개 자료로 확인 |
| 사용자에게 복잡한 명식이 어렵다는 문제 | **가설**; 인터뷰 필요 |
| 포포 시안이 이탈률을 줄임 | **미검증** |
| 실제 사주 계산과 AI 응답 | **미구현** |
| 인터랙티브 목업 및 기획 산출물 | **이번 산출물에서 제작** |

## 다음 실행 순서

1. 고객 인터뷰 5~8명(계획값, 아직 수행하지 않음)으로 사용자 문제 확인
2. 출생정보 입력→명식 이해→주제별 풀이→AI 질문 UX 테스트
3. 사주 역법/토정비결 정책·저작권 및 계산 엔진 검증
4. P0 구현 및 실제 QA, 성과 데이터 수집
5. P1 확장과 디자인·콘텐츠 고도화

## 참고 자료

- [삐삐사주 공식 회사 소개](https://ppippi.me/about)
- [포스텔러 공식 홈페이지](https://app.forceteller.com/)
- [한국민족문화대백과 — 토정비결](https://encykorea.aks.ac.kr/Article/E0059207)
- [잡코리아 PM 면접 가이드](https://www.jobkorea.co.kr/recruit/careers/articles/pm-interview-question-guide)

**면책:** 본 기획은 전통 문화·엔터테인먼트 콘텐츠이며 사주·타로의 미래 예측 능력이 과학적으로 입증된 것은 아닙니다. 실제 중요한 결정은 현실적 정보와 전문가의 도움을 함께 고려해야 합니다.


## 검증·증거 중심 포트폴리오 자료 (v0.5 추가)

- [기업 제출용 1페이지 프로젝트 요약](portfolio/PROJECT_SUMMARY.md)
- [기업 제출용 1페이지 프로젝트 요약](portfolio/PROJECT_SUMMARY.md)
- [진행 상태표](PROGRESS.md) — 기획/목업/미구현/미검증 상태 구분
- [요구사항·테스트·증거 추적표](docs/11-requirement-test-evidence-matrix.csv) — FR/정책/화면/QA 연결
- [QA 테스트 시나리오](qa/01-test-cases.csv) · [실행 기록 양식](qa/02-execution-template.md) — **실제 실행 전**
- [AI 상담 평가 계획](docs/12-ai-evaluation-plan.md) — 정확성/근거/실패/안전성 테스트 설계
- [캡스톤 가이드의 방법론 참고 범위](docs/13-capstone-method-reuse.md) — 별개의 보안 인프라 프로젝트로부터 기록 기준만 차용
- [공개 자료 점검표](docs/14-public-release-checklist.md) — 개인정보·API 키·저작권 확인
- [테스트 증거 인덱스](evidence/README.md) — **현재 증거 미수집**

GitHub Actions는 정적 파일 구조 검증과 정적 목업 게시에만 사용합니다. CI PASS는 실제 사주 계산, AI 응답 또는 사용자 검증 완료를 뜻하지 않습니다.
