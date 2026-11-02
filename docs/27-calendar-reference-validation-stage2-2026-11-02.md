# POPO MVP Stage 2-1 — 사주 원국 후보의 외부 날짜 대조 (2026-11-02)

## 상태와 목적

- 상태: **검증 자동화 작성 / 실제 GitHub Pages 브라우저 실행 전**.
- 적용 범위: **새로운 QA 파일과 문서만 추가**. 기존 POPO 화면/계산 라이브러리/API/AI 상담 미수정.
- 목표: `prototype/calc-core.js`의 `lunar-javascript@1.7.7` 산출값 중 연주/월주/일주가 외부 달력 자료와 일치하는지 12건 대조. 입력 차단·8글자 오행 집계 회귀 테스트 포함.
- 핵심 원칙: **달력 일부의 일치 = 한국 기준 사주 원국 검증 완료가 아님**.

## 기존 코드 확인

- `prototype/calc-core.js`: 양력만 허용, 출생시각 필수, 1990~2040, 서울/부산/대전, 3~9일과 23~00시 차단. `calculateCandidate(input, {Solar})` 반환.
- `prototype/vendor/lunar.min.js`: `lunar-javascript@1.7.7`, 클라이언트 번들(커밋 c5ae99b 확인).
- `backend/chart_service.py`: 검증 전 `unavailable`, `verified: false`를 반환하는 의도적 차단 경계.
- `backend/main.py`: `/api/chat`의 `get_saju_chart` 도구는 위 차단 경계를 사용. 입력한 클라이언트 명식을 신뢰하지 않음.

## 외부 자료와 적용 범위

### 한국천문연구원 1차 검증 후보

- [한국천문연구원 음양력 정보 API](https://www.data.go.kr/data/15012679/openapi.do)는 연·월·일 음양력과 간지(세차, 일진) 확인용 공공 API임.
- API 신청/키 발급 및 **실제 응답 대조는 아직 수행하지 않음**. 이 API만으로 한국 출생지 시주, 절기 순간, 역사 표준시를 전부 검증할 수는 없음.

### 현재 읽은 외부 날짜 자료

- [DateDB 2000-01-01](https://datedb.net/tool/conversion/solar_to_lunar/20000101/): 2000-01-01 `己卯 / 丙子 / 戊午`, 월간 달력에 2000-01-02, 01-10, 01-22 등 기록.
- [DateDB 2000-02-10](https://datedb.net/tool/conversion/solar_to_lunar/20000210/): 2000-02-10 `庚辰 / 戊寅 / 戊戌`, 월간 달력에 02-01, 02-02, 02-20 등 기록.
- [DateDB 2000-03-10](https://datedb.net/tool/conversion/solar_to_lunar/20000310/): 2000-03-10 `庚辰 / 己卯 / 丁卯`, 월간 달력에 03-01, 03-02, 03-20 등 기록.
- `qa/calendar-reference-fixtures.js`에 위 출처별 **연/월/일주** 12건을 고정함. 샘플 입력은 `양력 / 12:00 / 서울`이며, 시주는 비교 기준에 포함하지 않음.
- 같은 공개 사이트의 날짜 비교이므로 **독립 구현과 공식 한국 역서 검증을 완료했다고 말할 수 없음**.

## 자동화 검증 방법

1. GitHub Pages의 `/POPO/qa/calendar-reference-check.html`을 열면 스크립트가 실제 `prototype/vendor/lunar.min.js` 및 `prototype/calc-core.js`를 읽는다.
2. 각 날짜의 **연주·월주·일주 3항목**을 DateDB에 대조하고, 시주 형식 및 오행 개수 합계 8을 점검한다.
3. 후보 엔진의 기존 차단 조건 11개와 엔진/비정상 간지 차단 2개를 시험한다.
4. `2000-01-01 12:00`에 대한 오행 개수 `목1 화3 토3 금0 수1`을 **POPO 기존 시험값과의 회귀 검증**으로만 확인한다.
5. Node.js가 설치된 환경에서는 저장소 루트에서 `node tests/calendar-reference.test.cjs` 실행 가능.

## 남은 검증 (명식의 정식 노출 전 필수)

- [ ] 실제 번들에 대한 26건의 브라우저/Node 검증 실행 및 결과 기록 (12 날짜 + 11 정책 + 2 오류 + 1 회귀).
- [ ] 한국천문연구원 음양력 API 실제 응답과 연·일주 교차 비교. 기준 간지 용어·월주 정책이 다른 경우 별도 설명.
- [ ] 한국 기준 절입(입춘·경칩·소한 등) 시각과 월주/연주 전환을 **경계 전후 분 단위**로 검증.
- [ ] 시주 결정 정책 확정: KST 그대로 vs 지역 경도/균시차 보정, 자시의 날짜 처리, 역사적 UTC 오프셋·서머타임.
- [ ] 일주/시주에 대해 서로 독립된 한국 만세력 또는 검증 가능한 표준 예제를 여러 연도/시간대에 걸쳐 대조.
- [ ] 시간 미상, 음력·윤달·출생지 범위, 지원/미지원 사용자 가이드 정책 확정.
- [ ] 서버 전용 신뢰 경계 구현 및 `chart_id` 연결. `backend/chart_service.py`의 `verified: false`는 승인 전 변경 금지.

## 구현 의사결정과 포트폴리오 기록

1. 모델이 사주팔자를 계산하는 설계는 배제하고 별도 엔진에서 산출한다.
2. 후보 계산 결과는 신뢰가 아니라 **검증 대상**이다. 실제 사용자가 자신의 명식으로 받아들이지 않게 분리한다.
3. 자동화 결과가 모두 PASS여도 공개 명식 계산을 곧바로 승인하지 않고 한국 시간 정책과 독립 비교를 먼저 요구한다.
4. 사용자 행동 흐름, Figma 화면, 비공개 생년월일 입력은 이번 단계에서 변경하지 않는다.

### 참고

- KASI 공공데이터 API: https://www.data.go.kr/data/15012679/openapi.do
- DateDB 자료: https://datedb.net/tool/conversion/solar_to_lunar/20000101/
- DateDB 자료: https://datedb.net/tool/conversion/solar_to_lunar/20000210/
- DateDB 자료: https://datedb.net/tool/conversion/solar_to_lunar/20000310/
