# Stage 5C.2 — 사주 프로필 UX 수정 기록

## 사용자 문제와 변경
- 기본 `<input type="time">`의 시간 선택창이 닫히지 않아 ‘시간 모름’을 잘못 누름 → 폼을 비활성화하는 전용 modal, 단계 선택 후 자동 적용, 취소/확인 제공.
- 보관함 X가 바탕 화면으로 닫힘 → 저장 성공·보관함 X·완료·Esc 후 My Page로 돌아가며 서버 인증 및 목록 갱신.
- My Page가 이름만 조회 → 같은 owner의 날짜/시간/관계/지역을 읽어 재사용 카드로 표시.

## 데이터 신뢰 경계
프로필 저장은 기존 `popo_profiles` 및 RLS를 사용합니다. 카드 출력이 회원 권한을 대신하지 않습니다. 상태 변경 후 뒤늦은 응답은 serial과 owner로 폐기합니다. 이름/관계는 HTML이 아닌 textContent로 출력합니다. 새 SQL, 새 관리자 키, 새 개인정보 저장소는 만들지 않습니다.

## 동물/오행
12종 후보군은 앱의 디자인 분류안이며 명리 사실이 아닙니다. 배정 함수를 추가했지만 실제 오행 계산과 자산이 미연결이라 UI는 기본 POPO 얼굴입니다. 일간 오행 사용을 제안하며 결과 검증 완료 후 연결해야 합니다. 새로고침마다 다시 뽑지 않도록 UUID 기반 결정적 선택을 사용합니다. DB에 가짜 오행이나 avatar 값을 저장하지 않습니다.

## 공개 자료
- HTML time 입력 UI는 브라우저와 운영체제에 따라 달라집니다: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/time
- modal dialog: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog
- Supabase select 및 getUser: https://supabase.com/docs/reference/javascript/select , https://supabase.com/docs/reference/javascript/auth-getuser

## 범위 밖
실제 명식 계산, 새로운 동물 12종 이미지 제작, 실제 DB 인증/회원 간 격리 감사, 공개 배포. 이번 검증은 실행 가능한 코드 및 모의 브라우저 검사입니다.
