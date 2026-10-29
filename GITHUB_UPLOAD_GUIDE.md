# 포포(POPO) GitHub 게시 가이드

## 0. 계정 확인
현재 ChatGPT에 연결된 GitHub 계정은 `rlatmdgus4141`이고, 과거에 공유한 프로젝트 저장소는 `momoorr` 계정이었습니다. 원하는 계정으로 로그인한 뒤 생성하세요. **실제 업로드는 아직 수행하지 않았습니다.**

## 1. 저장소 만들기
1. GitHub 로그인 → 우측 상단 `+` → **New repository**
2. 저장소명 추천: `popo-product-portfolio`
3. 공개 목적이라면 **Public** 선택 (실제 개인 출생정보 및 API 키는 절대 넣지 마세요)
4. **Add a README file** 체크 해제 → **Create repository**

## 2. 파일 올리기
1. 제공한 ZIP을 압축 해제합니다.
2. 생성한 저장소의 **uploading an existing file** 또는 **Add file → Upload files** 진입.
3. `popo-product-portfolio` 폴더 **안에 있는** `README.md`, `docs/`, `prototype/`, `assets/`, `portfolio/`, `.github/` 등 모든 항목을 업로드합니다. 저장소 최상위에 `README.md`가 와야 합니다. 브라우저에서 폴더 업로드가 제대로 되지 않으면 Git CLI를 권장합니다.
4. 커밋 메시지 `docs: publish POPO planning portfolio v0.6` → **Commit changes**.
5. README와 `prototype/index.html`이 보이는지 확인합니다.

## 3. Git CLI 방식(폴더 구조와 숨김 폴더 보존에 더 안전)
```bash
cd popo-product-portfolio
git init
git add .
git commit -m "docs: publish POPO planning portfolio v0.6"
git branch -M main
git remote add origin https://github.com/<본인계정>/popo-product-portfolio.git
git push -u origin main
```
`<본인계정>`은 실제 로그인 ID로 바꾸세요. 인증은 GitHub 로그인 또는 자격 증명 관리자를 이용하세요.

## 4. GitHub Pages 공개
1. 저장소 **Settings → Pages → Build and deployment → Source: GitHub Actions**
2. **Actions** 탭에서 Pages 워크플로 성공 여부를 확인합니다.
3. 성공 후 Settings → Pages에 표시된 실배포 URL을 README와 지원서에 기재합니다. URL을 추측해 쓰지 마세요.

## 5. 제출 전 확인
- PPT/PDF 표지: `포포 | 나를 읽는 AI 사주 상담`
- README: 현재 **기획·목업** 단계 명확히 표기
- 개인 실사용자 정보·비밀번호·API 키 없음
- QA 계획과 실제 수행 증거 구분
- HTML 목업에서 실제 명식 계산과 AI 상담을 한 것처럼 표시하지 않음
- 별도 기업 캡스톤 첨부 PDF 원본을 포함하지 않음
