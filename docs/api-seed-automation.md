# API 테스트 데이터 자동화 사용법

## 목적

`server/scripts/seed-api-automation.mjs`는 사람이 브라우저에서 직접 하던 테스트 데이터 준비 과정을 API 호출로 자동화하는 스크립트입니다.

자동화로 생성되는 데이터는 다음과 같습니다.

- 테스트 계정 6개
- 모임 2개
- 모임 멤버 참여
- 독서 진행률 업데이트
- 메모 8개
- 토론 스레드 6개
- 댓글 6개
- 답글 6개

## 테스트 계정

자동화 실행 후 아래 계정으로 로그인할 수 있습니다.

```text
auto1@test.com / 12341234
auto2@test.com / 12341234
auto3@test.com / 12341234
auto4@test.com / 12341234
auto5@test.com / 12341234
auto6@test.com / 12341234
```

계정이 이미 있으면 새로 만들지 않고 기존 계정으로 로그인해서 이후 자동화를 진행합니다.

## 중요한 주의점

`npm run seed:api`는 DB에 직접 데이터를 넣는 스크립트가 아닙니다. 실행 중인 백엔드 서버의 API를 호출합니다.

```text
npm run seed:api
-> http://127.0.0.1:3000/api 호출
-> 현재 서버가 연결된 DB에 데이터 생성
```

따라서 자동화를 실행하기 전에 반드시 서버가 어떤 DB를 바라보고 있는지 확인해야 합니다.

예를 들어 직접 테스트 데이터와 자동화 데이터를 섞고 싶지 않다면 다음처럼 DB를 분리하는 것을 권장합니다.

```text
server/.env.local -> buzzy_pages_local  # 직접 테스트용 DB
server/.env       -> buzzy_pages_auto   # 자동화 테스트용 DB
```

자동화 실행 전에 `server/.env`의 `DATABASE_URL`이 자동화용 DB를 가리키는지 확인하세요.

```env
DATABASE_URL="mysql://root:password@localhost:3306/buzzy_pages_auto"
```

서버를 이미 켜둔 상태에서 `.env`를 수정했다면 서버를 재시작해야 변경된 DB 설정이 반영됩니다.

## 최초 준비

다른 사용자가 이 기능을 pull 받은 뒤 처음 실행한다면, 각자 로컬 환경에 `.env`를 준비해야 합니다. `.env` 파일은 git에 포함되지 않습니다.

```powershell
cd server
npm install
```

자동화용 DB가 없다면 MySQL에서 먼저 DB를 생성합니다.

```sql
CREATE DATABASE IF NOT EXISTS buzzy_pages_auto
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

그 다음 Prisma schema를 적용합니다.

```powershell
cd server
npx prisma db push
```

Windows PowerShell에서 `npx` 실행 정책 오류가 나면 아래처럼 실행할 수 있습니다.

```powershell
npx.cmd prisma db push
```

## 실행 방법

1. 백엔드 서버를 실행합니다.

```powershell
cd server
npm run dev
```

2. 다른 터미널에서 자동화를 실행합니다.

```powershell
cd server
npm run seed:api
```

3. 브라우저에서 테스트 계정으로 로그인합니다.

```text
auto1@test.com / 12341234
```

## 다른 API 서버에 실행하기

기본 API 주소는 `http://127.0.0.1:3000/api`입니다.

다른 주소의 서버에 자동화를 실행하고 싶다면 `API_BASE_URL`을 지정할 수 있습니다.

```powershell
$env:API_BASE_URL="http://127.0.0.1:3000/api"
npm run seed:api
```

## 반복 실행 시 동작

반복 실행하면 계정은 기존 계정을 재사용하고, 모임/메모/스레드/댓글은 새 실행마다 추가로 생성됩니다.

자동화 데이터가 너무 많아졌다면 자동화용 DB를 비우거나 새 DB를 만들어 다시 실행하세요. 직접 테스트용 DB와 섞이지 않도록 자동화 전용 DB 사용을 권장합니다.

## AI 에이전트에게 요청할 때

다른 사용자가 자기 AI 에이전트에게 요청할 때는 아래처럼 말하면 됩니다.

```text
이 프로젝트에는 API 테스트 데이터 자동화 스크립트가 있어.

server/.env가 자동화용 테스트 DB를 바라보는지 확인하고,
DB가 없으면 생성한 뒤 Prisma schema를 적용해줘.
그 다음 백엔드 서버를 실행하고 `npm run seed:api`를 실행해서
테스트 계정, 모임, 메모, 토론 스레드, 댓글/답글 데이터를 생성해줘.

테스트 계정은 auto1@test.com ~ auto6@test.com이고,
비밀번호는 12341234야.

기존 직접 테스트 DB와 데이터가 섞이지 않도록 가능하면
buzzy_pages_auto 같은 별도 DB를 사용해줘.
```

