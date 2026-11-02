# POPO Stage 3: 로컬 계산 API QA 로그 (2026-11-02)

- GitHub 업로드 전, 실제 `lunar-javascript@1.7.7` 번들은 로컬 실행 환경에서 확보되지 않음.
- Stage 1 기존 10건 + Stage 3 새 11건 = **오프라인 모의 테스트 21건 PASS**, 실제 JS 번들 통합 1건 SKIP.
- `backend/chart_bridge.cjs`는 임시 모의 Solar 어댑터에서 3개 기본 계약 검사 통과.
- `node --check` JavaScript 문법 검사 PASS, Python AST/compile 검사 PASS.
- 실제 컴파일/런타임/CI: GitHub 업로드 후 확인할 것.
- 실제 한국 만세력 계산 정확성/개인화 AI: 미검증·미연결.

## GitHub Actions 완료 후 점검

- [ ] `POPO stage 3 chart candidate checks` 워크플로가 최신 커밋에서 성공하는지 확인
- [ ] FastAPI 모의 API 계약 테스트 통과
- [ ] 실제 `lunar-javascript@1.7.7`로 2000-01-01 12:00 후보 계산 테스트 통과
- [ ] 결과에 `verified: false`, `can_personalize: false`, `chart_id` 없음 확인
- [ ] 잘못된 입력에 422, Node 오류에 503 반환 확인
- [ ] 기존 GitHub Pages 배포·디자인 불변 확인

### 향후 E2E

- [ ] 실사용자를 대상으로 한 개인정보 입력 전 안전 고지
- [ ] 정상 출생정보 → 서버 계산 → 명식 화면 데이터 표시 (검증 승인 후)
- [ ] 사용자 질문 → 서버 chart_id → 실제 AI Function Calling 도구 결과 연동
- [ ] AI 오류 및 네트워크 단절 안내
- [ ] 출생시각 경계, 시간 미상, 음력/윤달, 지역 범위
