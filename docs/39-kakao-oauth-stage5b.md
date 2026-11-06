# POPO Stage 5B — 카카오 로그인 UI와 세션 연결

- 로컬 기준 커밋: `1cd340945a38e9d8aa21138f7363b1a465ec9eb3`
- 목표: Stage4G 달 계정 버튼을 카카오 OAuth + Supabase Auth 클라이언트와 연결한다.
- 기존의 UI, 화면 라우터, FastAPI/AI 연결 코드는 변경하지 않는다.
- 추가: `prototype/popo-kakao-auth.{js,css}`, 로컬 공개 설정 `prototype/popo-supabase-config.js`, 단위 테스트.
- 실제 로그인 성공은 카카오/수파베이스 양쪽 설정과 외부 네트워크, 브라우저 OAuth 흐름에 달려 있으며 패키지 설치만으로 보장되지 않는다.
- Supabase OAuth `getUser()`의 서버 확인 결과가 있는 경우에만 마이페이지 라벨을 표시한다.
- 브라우저에는 Publishable key만 포함; Kakao secret, Supabase secret/service_role 절대 포함 금지.
- 개인 프로필 조회는 로그인 이후 `popo_profiles`에만 실행한다. 쓰기/생성/수정은 후속 Stage5C에서 담당한다.
- 기존 두 Auth 사용자와 notes/vault_* 테이블은 변경하지 않는다.
- 회원별 소유권은 Stage5A RLS 정책으로 시행되며 크로스유저 접근 거부는 아직 실사용 QA 전이다.
