# Anthurium Archive

안스리움 공개 도감과 개인 브리딩 계보를 함께 관리하는 Next.js PWA입니다.

## 현재 구현 범위

- 기존 `data/taxa.json` 기반 공개 도감
- 팬·줌·검색·혈통 강조가 가능한 공개 계보 캔버스
- 이메일 매직링크 인증
- 유전 개체와 실제 화분 분리
- 줄기 절단·오프셋·분주·조직배양 복제 기록
- Self 및 교배와 자손 생성
- 성장 관찰
- 공개 사진과 비공개 증빙 Storage 분리
- 구매·판매·증여·교환 기록
- 공개 컬렉션과 유전 개체 상세 URL
- PWA manifest와 공개 페이지 서비스 워커
- 전체 개인 데이터 JSON 백업
- 인쇄용 화분 라벨

## 보유 개체 모음 (`/specimens`)

`docs/ref/` 폴더 하나가 보유 개체 하나입니다. 폴더 바로 아래 사진은 보유 사진,
`tracking/` 하위 폴더는 출처 증빙(판매자 대화·게시물·라벨 캡처)으로 취급합니다.

1. `docs/ref/<개체명>/` 에 사진을 넣는다. 증빙은 `tracking/` 안에 둔다.
2. `data/collection.json` 에 공개 정보(이름·분류·계통·메모)를 추가한다.
   `sourceDir` 는 폴더 이름과 같아야 한다. 계통은 라벨·판매자 자료에 적힌 내용만 쓴다.
3. `private/collection-private.json` 에 입수 기록(구매처·경로·소유 이력·가격·메모)을 추가한다.
4. 이미지를 웹용으로 변환한다. 원본은 그대로 둔다.

```bash
python3 scripts/build-collection-images.py
```

Pillow 가 필요합니다 (`python3 -m pip install pillow`).

### 공개 / 비공개 분리

| 종류 | 위치 | 공개 여부 |
|---|---|---|
| 보유 사진 | `public/collection/<slug>/` + `data/collection-images.json` | 항상 공개 |
| 입수 기록 | `private/collection-private.json` | 비공개 |
| 출처 증빙 | `private/collection/<slug>/tracking/` + `private/collection-tracking.json` | 비공개 |

`private/` 는 `public/` 밖에 있어 정적으로 서빙되지 않습니다. 서버는
`SHOW_PRIVATE_RECORDS=true` 일 때만 이 폴더를 읽어 입수 기록·증빙 섹션을
렌더링하고, 증빙 이미지는 같은 조건에서만 `/private-media/...` 로 응답합니다.

- 로컬: `.env.local` 에 `SHOW_PRIVATE_RECORDS=true`
- 배포(Vercel 등): 변수를 설정하지 않는다. 빌드도 배포 환경에서 한다.
  로컬에서 플래그를 켠 채 빌드한 결과물을 그대로 올리면 비공개 내용이 포함된다.
- `private/` 는 `.gitignore` 에 들어 있다. 저장소에 함께 보관하려면 그 줄을 지운다.
  나중에 Supabase 비공개 Storage 로 옮길 때는 이 폴더가 업로드 원본이 된다.

## 요구 환경

- Node.js 22 이상
- npm
- 로컬 Supabase 검증 시 Docker Desktop

프로젝트의 Node 버전은 `.nvmrc`에 고정되어 있습니다.

```bash
nvm use
npm install
```

## 로컬 실행

```bash
npm run dev
```

Supabase를 연결하지 않아도 공개 정적 도감과 계보를 확인할 수 있습니다.
관리 데이터 저장과 인증은 Supabase 연결 후 동작합니다.

## Supabase 로컬 실행

Docker Desktop을 먼저 실행한 뒤:

```bash
npx supabase start
npx supabase db reset
npx supabase test db
npm run db:types
```

`npm run db:types`는 `src/types/database.types.ts`를 실제 로컬 스키마에서 다시
생성합니다. 스키마가 바뀔 때마다 실행합니다.

## 환경 변수

`.env.example`을 `.env.local`로 복사합니다.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

기존 도감 데이터를 클라우드 데이터베이스로 가져올 때만 서비스 역할 키가
추가로 필요합니다.

```bash
export SUPABASE_SERVICE_ROLE_KEY="..."
npm run catalog:import
```

서비스 역할 키는 브라우저 변수나 Vercel의 `NEXT_PUBLIC_*` 변수로 등록하면
안 됩니다.

## 공개 URL

관리 화면의 `/dashboard/settings`에서 공개 핸들을 설정합니다.

```text
/collection/{handle}
/collection/{handle}/genotypes/{code}
```

`private` 데이터는 소유자만 조회합니다. `public` 데이터는 `published_at`이
설정된 경우에만 익명 조회가 가능합니다. `unlisted` 공유 토큰은 후속 범위이며,
현재는 익명에게 노출되지 않습니다.

## 데이터 규칙

- 실생 자손마다 새로운 genotype을 만듭니다.
- 줄기 절단 복제본은 같은 genotype 아래 새로운 specimen을 만듭니다.
- 판매·고사·분실 기록은 삭제하지 않고 상태를 변경합니다.
- 거래·가격·정확한 위치·증빙은 공개 데이터와 분리합니다.
- 이름이 바뀌어도 고유 코드와 ID는 재사용하지 않습니다.

## 검증

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Docker가 실행 중일 때는 Supabase 마이그레이션과 RLS 테스트도 함께 수행합니다.

## 배포

1. Supabase 프로젝트를 생성합니다.
2. `supabase db push`로 마이그레이션을 적용합니다.
3. Auth의 Site URL과 Redirect URL에 실제 도메인을 추가합니다.
4. Vercel 프로젝트에 공개 Supabase 환경 변수 두 개를 설정합니다.
5. Git 기반 프로덕션 배포를 수행합니다.
6. 배포 후 소유자 프로필을 만들고 `npm run catalog:import`를 한 번 실행합니다.

현재 `web/` 정적 프로토타입은 마이그레이션 검증이 끝날 때까지 보존합니다.
