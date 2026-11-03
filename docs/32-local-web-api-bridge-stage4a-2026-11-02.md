# POPO Stage 4A — 출생 정보 → 로컬 FastAPI 후보 API 연결

- 날짜: 2026-11-02
- 기반 GitHub: `momoorr/POPO` 커밋 `31ac3af0f95755b3fcc9df9d945c886f5305fd73`
- 사용자 실측: 2000-01-01 12:00 서울 → FastAPI `/api/chart/probe` 가 `己卯/丙子/戊午/戊午`, 오행 `1/3/3/0/1` 반환, Windows PowerShell 인코딩 문제 해결.
- 배포 범위: **로컬 HTML + 로컬 FastAPI 연결 시험**. 공개 서비스/개인 명식/실제 AI 연결 아님.

## 변경 이유 및 범위

기존 `prototype/index.html`에는 `calc-beta-trigger` (브라우저 안의 후보 엔진)와 `preview-chart` (가상 명식 예시)가 공존한다. 기존 명식 시연과 오행 풍경을 보존하며 FastAPI 연결을 독립적으로 확인하기 위해 **로컬 QA 전용 버튼**을 출생 정보 dialog 하단에 추가한다.

- 수정: `prototype/index.html` — 기존 출생정보 UI 아래 로컬 QA section, CSS/JS 링크 추가.
- 추가: `prototype/calc-server-preview.js` — 서버 API 호출, 필드명 `unknown_time`, 결과 검증, 오류·변경시 초기화.
- 추가: `prototype/calc-server-preview.css` — 기존 화면과 분리된 소규모 스타일.
- 추가: `tests/local-fastapi-preview.test.cjs` — 네트워크 없는 브라우저 계약 테스트.
- 추가: `qa/17-local-web-api-bridge-stage4a.md` — 사용자가 직접 검증할 기준.
- 변경하지 않음: `prototype/app.js`, `calc-preview.js`, `calc-core.js`, 캐릭터·일러스트, `backend/*`, 기존 Figma 파일.

## 데이터 흐름

`출생 정보 dialog` → `로컬 QA 전용 버튼` → `POST http://127.0.0.1:8000/api/chart/probe` → 서버의 `candidate_only / verified:false / can_personalize:false` → 같은 dialog 안의 **시험 결과**.

`http://localhost:5500` 또는 `http://127.0.0.1:5500`에서 열린 프런트엔드에서만 기능을 표시한다. **GitHub Pages에서는 로컬 버튼을 표시하거나 fetch하지 않는다.** 기존 AI 상담에는 결과를 전달하지 않는다. 사용자 검증과 API 서버를 공개 서비스로 배포하기 전에는 실제 생년월일을 시험 입력에 사용하지 않는다.

## 필수 제약

1. **실제 개인 계산 승인 금지**. 사용 조건과 한국 기준 경계·시주·지역 경도 정책 미검증.
2. 클라이언트 응답에 `verified:true`나 `chart_id`가 들어오면 UI에서 결과를 거절함.
3. 현재 서버의 필드명은 `unknown_time`이며 Node 계산 브리지 내부로 변환되는 `unknownTime`과 다름.
4. 로컬 브라우저 주소는 **`http://localhost:5500/prototype/index.html`**을 권장. FastAPI CORS 기본 허용 origin이 `http://localhost:5500`이기 때문.
5. 브라우저 입력을 변경하면 이전 시험값과 대기중 요청을 무효화함. 서버가 꺼져 있으면 에러를 노출하고 가상 데이터로 대체하지 않음.
6. GitHub Pages는 정적 호스팅이다. P0 실서비스에서는 HTTPS FastAPI 배포, 인증/레이트리밋/비용 제한, 별도 `/api/chart` 신뢰 경계 구현이 필요하다.

## 다음 연결 전 필요

1. 로컬 GUI 사용자 QA: 홈→입력창→로컬 서버 후보 표시 + 미지원 날짜 + 서버 꺼짐 + 수정 초기화.
2. 이 단계 통과 후 패치만 GitHub에 커밋 (아직 커밋/푸시 안 함).
3. 서버 계산 검증 후 `/api/chart` 정식 계약·chart_id 관리. AI Agent에는 검증 완료 chart_id만 허용.
4. 공개 배포 준비·실제 AI 1회 테스트·기획 문서 상태 동기화.
