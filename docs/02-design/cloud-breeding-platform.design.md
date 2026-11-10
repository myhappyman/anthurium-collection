# 안스리움 브리딩 플랫폼 클라우드 전환 설계

## 1. 목표

- 휴대폰과 PC에서 동일한 컬렉션 데이터에 접근한다.
- 외부 네트워크에서도 로그인하여 기록을 추가·수정한다.
- 공개 도감과 개인 브리딩 기록을 선택적으로 공유한다.
- 유성번식 자손과 영양번식 복제본을 구분한다.
- 구매·증식·교배·관찰·판매·고사 이력을 삭제하지 않고 추적한다.
- 기존 정적 도감과 계보 캔버스를 데이터 마이그레이션이 끝날 때까지 보존한다.

## 2. 아키텍처 결정

### 애플리케이션

- Next.js App Router
- TypeScript strict mode
- 반응형 웹과 설치 가능한 PWA
- 공개 페이지는 React Server Component 중심
- 계보 캔버스와 입력 폼만 Client Component로 제한

### 클라우드

- Supabase PostgreSQL: 관계형 데이터와 계보
- Supabase Auth: 소유자 인증
- Supabase Storage: 공개 사진과 비공개 증빙
- PostgreSQL Row Level Security: 공개/비공개 접근 제어
- Vercel: Next.js 배포

### 동기화 범위

- 1차 릴리스는 온라인 클라우드 동기화를 지원한다.
- PWA 앱 셸은 설치할 수 있지만 오프라인 쓰기와 충돌 병합은 후속 범위다.

## 3. 도메인 경계

### 공개 도감

`catalog_nodes`는 자연종·선별종·알려진 하이브리드처럼 커뮤니티에서 참조하는
지식 노드다. 기존 `data/taxa.json`을 이 영역으로 마이그레이션한다.

### 실제 유전 개체

`genotypes`는 실제 브리딩과 증식에서 동일성을 유지해야 하는 유전적 개체다.
실생 형제는 각각 다른 genotype이며, 줄기 절단·오프셋·분주·조직배양 복제본은
같은 genotype을 참조한다.

### 실제 화분

`specimens`는 현재 또는 과거에 존재한 물리적 식물 단위다. 판매·고사·분실 후에도
삭제하지 않고 상태를 변경한다.

## 4. 핵심 관계

```text
catalog_nodes
    └── genotypes
          ├── specimens
          │     ├── observations
          │     ├── events
          │     └── transactions
          ├── crosses
          │     └── progeny genotypes
          └── propagation_events
                └── cloned specimens
```

## 5. 데이터 규칙

1. 이름은 변경할 수 있지만 고유 ID와 공개 코드는 재사용하지 않는다.
2. 모르는 부모와 출처는 추정하지 않고 `unknown`으로 기록한다.
3. 유성번식 자손은 새로운 genotype을 만든다.
4. `stem_cut`, `offset`, `division`, `tissue_culture`는 같은 genotype 아래
   새로운 specimen을 만든다.
5. 줄기를 완전히 절단한 원본 specimen은 `consumed` 상태로 남긴다.
6. 판매·고사 데이터는 삭제하지 않고 archive 또는 상태 변경으로 보존한다.
7. 거래 가격·연락처·영수증·정확한 보관 위치는 공개 데이터와 분리한다.
8. 정정은 원본 이벤트를 삭제하지 않고 `corrected` 이벤트를 추가한다.

## 6. 공개 정책

`visibility`는 `private`, `unlisted`, `public`을 사용한다.

- 익명 사용자는 `public`이면서 `published_at`이 존재하는 데이터만 조회한다.
- 인증 사용자는 자신이 소유한 모든 데이터에 접근할 수 있다.
- 쓰기 작업은 `owner_id = auth.uid()`인 사용자만 수행한다.
- 거래 데이터와 비공개 증빙은 익명 읽기 정책을 만들지 않는다.
- Storage는 `public-media`, `private-evidence` 버킷을 분리한다.

## 7. 주요 화면

### 공개

- `/`: 공개 컬렉션 홈
- `/catalog`: 기존 도감
- `/catalog/[slug]`: 도감 상세
- `/lineage`: 공개 도감 계보
- `/collection/[handle]`: 공개 컬렉션
- `/genotypes/[code]`: 유전 개체 상세
- `/crosses/[code]`: 교배와 자손

### 관리

- `/dashboard`: 현황
- `/dashboard/genotypes`: 유전 개체
- `/dashboard/specimens`: 물리적 화분
- `/dashboard/crosses`: 교배
- `/dashboard/observations`: 관찰
- `/dashboard/propagations`: 영양번식
- `/dashboard/media`: 사진과 증빙
- `/dashboard/transactions`: 구매·판매

## 8. 마이그레이션 전략

1. 기존 `web/`과 `data/taxa.json`을 변경하지 않는다.
2. Next.js 기반과 Supabase 로컬 마이그레이션을 추가한다.
3. `scripts/import-catalog.ts`로 기존 JSON을 `catalog_nodes` 형식으로 변환한다.
4. 공개 도감과 검색을 Next.js로 먼저 재현한다.
5. 관리 기능과 실제 브리딩 계보를 추가한다.
6. 기존 SVG 계보 로직을 TypeScript 순수 함수와 Client Component로 이식한다.
7. 기능 동등성과 데이터 검증 후에만 레거시 정적 페이지 제거 여부를 결정한다.

## 9. 검증

- TypeScript strict 검사
- ESLint error/warning 0
- 단위 테스트: 코드 생성, 계보 인덱스, 증식 규칙
- 데이터베이스 테스트: FK, check constraint, RLS
- E2E 테스트: 로그인, 등록, 줄기 절단, 교배, 공개 전환
- 프로덕션 빌드 성공

## 10. 비범위

- 오프라인 상태에서 작성 후 자동 충돌 병합
- 다수 사용자의 공동 편집
- 결제와 판매 중개
- 조직배양 배치 품질 관리
- 식물 자동 식별
