# POPO Stage 4E.2 — 메인 통합 씬 적용

**상태:** 새 코드/이미지/오프라인 QA 제작 완료. 사용자 Windows 실제 화면 검증 및 GitHub 배포 전.

## 배경

- 이전 Stage 4E의 오른쪽 토끼 크롭 + 왼쪽 덩굴 크롭을 별개 레이어로 합성하면 서로 다른 화질과 경계선이 나타남.
- Stage 4E.1 배경 이미지 보정은 토끼 표시를 복구했으나 오른쪽 아트와 왼쪽 장식이 서로 다른 원본이어서 시각적 통일성이 떨어졌음.
- 사용자는 "무조건 고퀄", "시안 최대한 비슷하게", "복붙한 듯 보이지 않게" 요구함.

## 구현

- 사용자가 승인한 8컷 시안의 **01 메인 랜딩을 비주얼 기준**으로, 토끼·달·구름·꽃·밤하늘이 하나로 이어진 **새 일러스트**를 제작함.
- Desktop 1672×941, mobile 941×1672. 각각 독립적인 고해상도 WebP 1개만 히어로 배경으로 사용.
- 기존 사진 조각(`popo-approved-landing-scene.webp`, `popo-approved-left-flowers.webp`)을 HTML에 삽입하던 JS 호출 제거.
- `::before` 이미지와 페이드 마스크 등 이중 배경을 비활성화하고, 각 화면별 한 장의 통합 이미지를 `background-image`로 사용.
- 배경은 텍스트 **없는 일러스트**, 제목/설명/CTA는 실제 HTML. 로고 Sabrina, UI 부크크명조 설정, FastAPI, AI Agent, 사주 계산, 기존 다른 화면 전부 보존.
- 두 통합 이미지는 **첨부 시안의 구도와 분위기를 새롭게 재현한 장면**이며, 원본 레이어 그대로 또는 픽셀 단위 복제는 아님.

## 변경 파일

- 수정 `prototype/landing-board-sync.css` — 기존 Stage 4E.1 끝에 통합 이미지 스타일 추가.
- 수정 `prototype/landing-board-sync.js` — 기존 텍스트·버튼 구성 유지, 낱개 아트 삽입 코드 제거.
- 신규 `prototype/assets/popo-unified-hero-desktop.webp`, `prototype/assets/popo-unified-hero-mobile.webp`.
- 수정 `tests/landing-board-sync.test.cjs` — 기존 단위 검사와 통합 씬 구조 검사.
- 신규 문서/QA 기록.

**사용자 데이터 주의:** 시안과 무관한 72% 로딩 숫자, 사주 계산 결과, AI 도구 상태는 이 작업에서 새로 추가하지 않음.

## 검증

- Node.js 코드 문법 및 구조 테스트, 데스크톱·모바일 Playwright 레이아웃/CTA를 오프라인으로 점검.
- Windows Chrome 5501에서 실제 레이아웃/폰트 및 이미지 다운로드 확인 필요.
- 사용자 검토 전 자동 Git 커밋·푸시하지 않음. 스크린샷 공개에도 실제 사주가 검증됐다고 표현하지 않음.
