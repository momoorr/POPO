# POPO Stage5B — 실제 브라우저 확인 항목

1. Supabase Authentication → URL Configuration → Redirect URLs에 로컬 테스트 페이지 `http://127.0.0.1:5501/prototype/index.html` 추가. (기존 허용 URL은 삭제하지 않음)
2. Kakao Developers 플랫폼 키의 카카오 로그인 Redirect URI는 `https://<Supabase-ref>.supabase.co/auth/v1/callback`인지 확인. (로컬 주소를 카카오에 넣지 않음)
3. 웹 로컬 페이지의 달 버튼 → 카카오로 시작하기 → 카카오 동의 → 원래 웹 페이지로 귀환.
4. 상단 버튼이 ‘마이페이지’로 변경되는지, 새로고침해도 유지되는지, 모달에 사용자 저장한 사주 0개 또는 실제 이름 목록이 표시되는지.
5. 로그아웃 후 버튼 ‘로그인’으로 돌아오는지.
6. 게스트로 둘러보기는 닫기만 하며 로그인 상태를 조작하지 않는지.
7. 인터넷 차단·설정 오류시 조용히 가짜 로그인으로 넘어가지 않고 에러 안내를 표시하는지.
8. 로그인 A로 B의 사주 레코드를 조회·변경할 수 없는지(두 시험 계정 준비 후 별도 QA).
9. 로컬 OAuth 성공만으로 실배포 성공이라고 판단하지 않는다. GitHub Pages 배포 후 URL 추가·API HTTPS/비밀키/레이트리밋 준비 필요.
