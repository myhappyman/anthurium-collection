# 안스리움 컬렉션 데이터 모델

## 목표
안스리움(Anthurium, 천남성과 Araceae)의 자연종·선별종·하이브리드를
하나의 구조로 정리하고, **계보(부모 ↔ 자식)** 와 **약어**를 서로 연결한다.
입문자가 `FSxRL` 같은 약어를 만났을 때, 클릭 한 번으로
부모(Fort Sherman × Ralph Lynam)와 그 위 조상까지 추적할 수 있게 한다.

## 핵심 아이디어
- 모든 개체는 **같은 스키마를 공유하는 노드**다. (자연종도, 하이브리드도 동일 구조)
- 계보는 `parents` 배열(부모 id 참조)로만 **단방향** 저장한다.
  - 역방향("이 개체를 부모로 쓴 자식들")은 사이트가 계산으로 끌어낸다 → 데이터 중복 없음.
- 약어는 `abbreviations` 배열에 저장하고, 별도 인덱스로 빠르게 역검색한다.

## taxon (개체) 스키마

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `id` | string (slug) | ✅ | 안정적 고유 식별자. 예: `"warocqueanum"`, `"fsxrl"` |
| `displayName` | string | ✅ | 화면 표시명(한글). 예: `"퀸 안스리움"` |
| `scientificName` | string \| null | ✅ | 학명/품종명 영문. 자연종은 `"Anthurium warocqueanum"`, 하이브리드는 보통 `null` 또는 `"Anthurium 'Forget Sherman'"` |
| `type` | `"species"` \| `"selection"` \| `"hybrid"` | ✅ | 자연종 / 선별종 / 하이브리드 |
| `abbreviations` | string[] | ✅ | 커뮤니티 약어. 예: `["FS"]`, `["RL"]`, `["FSxRL"]`. 없으면 `[]` |
| `parents` | string[] | ✅ | 부모 개체의 `id` 목록(보통 2개). 자연종은 `[]` |
| `selectionOf` | string | ❌ | 이 개체가 어떤 종/그룹의 **선별 클론**인지(원종 `id`). 교배(parents)와 구분되는 관계. 예: besseae aff. 클론들 → `"besseae"`. 역방향(원종의 클론 목록)은 사이트가 계산 |
| `aka` | string[] | ❌ | 이명/별칭 |
| `descriptionKo` | string | ❌ | 한글 설명·해설 |
| `traits` | object | ❌ | `{ leaf, vein, size, texture, origin }` 등 특징(키-값 자유) |
| `tags` | string[] | ❌ | `["벨벳", "퀸", "펜던트"]` 같은 분류 태그 |
| `images` | string[] | ❌ | 이미지 경로/URL |
| `sources` | string[] | ❌ | 출처/참고 링크 |
| `verified` | boolean | ❌ | 사실 확인 완료 여부. `false`면 화면에 "검증 필요" 표시 |

## 약어 해석 규칙
- 정확히 일치하는 약어가 있으면(`FSxRL`) 그 개체로 바로 연결.
- `AxB` / `A x B` 패턴이면 양쪽을 각각 약어 인덱스로 해석해 부모로 연결.
- 대소문자 무시, 공백 무시.
- 해석 불가한 코드는 "알 수 없는 약어"로 표시(추측하지 않음).

## 디렉토리
```
data/taxa.json     # 개체 데이터(노드 목록)
web/index.html     # 정적 사이트
web/app.js         # 데이터 로드·렌더·검색·약어 해석
web/styles.css
```
