# 측정 설계 (실측 이전)

## 이벤트

| Event | 발생 시점 | 권장 파라미터(비식별) |
|---|---|---|
| `birth_start` | 출생정보 입력 시작 | entry_point, ui_version |
| `birth_submit_valid` | 유효한 정보 제출 | unknown_time_boolean |
| `chart_view` | 정상 명식 결과 노출 | engine_version, policy_version |
| `topic_open` | 주제별 카드 진입 | topic_id |
| `deep_view` | 전문가 심화 펼침 | topic_id |
| `ask_ai` | AI 첫 질문 | topic_id, input_method |
| `ai_followup` | 동일 세션 후속 질문 | turn_index |
| `tojeong_entry` | 새해 특집 진입 | selected_year |
| `character_open` | 캐릭터 카드 노출 | character_id(필요시 범주만) |
| `calculation_error` | 계산 실패 | public_error_code |

## 퍼널

`입력 시작 → 유효 입력 제출 → 명식 결과 → 풀이 조회 → AI 질문 → 후속 질문`

## 정의

- `입력 완료율 = 유효 제출 세션 / 시작 세션`
- `AI 전환율 = AI 시작 세션 / 명식 조회 세션`
- `후속 질문률 = 두 번째 질문 이상이 발생한 상담 세션 / 상담 시작 세션`

**데이터 수집은 미실시**: 달성률·개선율·통계 유의성 모두 주장하지 않는다.

## 보안

이벤트에 **생년월일, 출생 시간, 출생 지역 원문, 상담 질문 내용, 개인식별자**를 수집하지 않는다. User ID 등도 필요성과 보관 정책 확정 후 사용.
