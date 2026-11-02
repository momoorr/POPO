# POPO Stage 2 — 실제 브라우저 검증 결과 (2026-11-02)

- 실행 URL: https://momoorr.github.io/POPO/qa/calendar-reference-check.html
- 브라우저 결과: **검증 26건 · PASS 26 · FAIL 0**
- 증거: [브라우저 결과 캡처](../evidence/stage2-calendar-browser-pass-2026-11-02.png)
- 캡처 출처: 사용자가 실제 GitHub Pages 실행 화면을 제공함

## 결과의 의미

1. 공개 날짜 자료의 12개 날짜에 대한 **연주·월주·일주 3주** 대조가 통과했다.
2. 현행 코드의 미지원 입력 차단과 오류 경로가 통과했다.
3. 기존 시험값의 단순 오행 8글자 집계 회귀가 통과했다.
4. 시주는 **형식만** 확인했다. 한국 시각 보정, 자시 날짜 경계, 절입 분 단위 및 공식 한국 만세력 전체 검증은 미완료다.

## 다음 단계

시두법을 별도 규칙으로 구현해 `qa/hour-pillar-check.html`에서 시주 156건을 검사한다. 통과하더라도 백엔드 `chart_service.py`의 `verified=false`를 유지한다.
