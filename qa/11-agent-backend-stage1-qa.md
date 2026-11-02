# POPO Agent 백엔드 Stage 1 QA 기록

- 범위: 오프라인 구조 검증. 실제 유료 OpenAI 호출/한국 역법/프런트 연결/공개 배포 검증이 아님.
- 테스트 명령: `cd backend; python -m unittest discover -s tests -v`
- 시나리오 10개: 상태 조회, 키 누락 차단, 빈 질문, 위조 chart 거부, 일반 답변, 함수 도구 호출·결과 재전달, 대화 문맥, 비용 소프트 가드, API 예외 처리, 미검증 계산 차단.
- 2026-11-02: 오프라인 계약 테스트 **10/10 PASS** (Python 3.13, FastAPI 0.128.2, TestClient, OpenAI SDK는 모의 대체).
- Python AST 검사 PASS. 라이브 OpenAI SDK 설치와 실제 API 호출은 테스트하지 않았다.

## 남은 검증

- OpenAI 실제 계정/과금 한도에서 API 1회 호출 확인
- 독립 만세력 기준의 정상·경계·음력·시간미상 시험값 승인
- `/api/chart`와 `chart_id` 신뢰 경계 구현
- 기존 UI 핸들러 연동, Playwright/사용자 화면 테스트
- 별도 HTTPS 백엔드 및 GitHub Pages 간 CORS 검증
- 사용자 입력 최소 수집·삭제/보존 정책, 인증·레이트 제한
