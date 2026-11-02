# POPO Stage 2B QA — 시주 규칙 자동 검증

- 상태: 검증 패치 준비 / GitHub Pages 실사용 실행 전
- 전제: Stage 2의 12개 날짜 연·월·일주 fixture, `prototype/calc-core.js`, `prototype/vendor/lunar.min.js` 파일 버전 유지
- 검사 항목: 12개 날짜 × 11개 시각 = 132건 + 2개 날짜 × 12개 시각 경계 = 24건, 합계 156건
- 1차 통과 기준: `시주 검증 156건 · PASS 156 · FAIL 0`
- 확인 방법: 브라우저 `https://momoorr.github.io/POPO/qa/hour-pillar-check.html`
- 제출 증거: 화면 캡처 및 실패 목록, 테스트 날짜와 시간 확인
- 범위 제한: KST 무보정 가정, 시두법 규칙. 지역별 경도, 자시, 절입 순간, 공식 한국 역법 전체 검증 아님

## 실제 실행 결과

아직 기록 없음. 사용자 브라우저 스크린샷 확인 후 PASS/FAIL을 기록한다.

## 후속 개발

- 실패 시 해당 날짜/시간과 사주 엔진 값 및 독립 규칙 기대값을 비교한다.
- 통과 시 정책 선정과 KASI 공식 날짜 자료 대조를 이어간다.
- 최종 검증 전 `backend/chart_service.py`의 unavailable 상태를 해제하지 않는다.
