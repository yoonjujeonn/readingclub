# 회원가입 500 서버 오류 해결

- 날짜: 2026-04-29
- 증상: 사이트에서 회원가입 시도 시 "서버 오류가 발생했습니다" (HTTP 500) 응답

## 원인

`Buzzy_Pages` 데이터베이스에 테이블이 하나도 존재하지 않았음.
Prisma 스키마(`server/prisma/schema.prisma`)는 정의되어 있었지만, DB에 실제 테이블을 생성하는 `prisma db push` 또는 `prisma migrate`가 한 번도 실행되지 않은 상태였음.

회원가입 요청 → `auth.service.ts`의 `signup()` → `prisma.user.findUnique()` 호출 시 `users` 테이블이 없어 예외 발생 → `auth.routes.ts`의 catch 블록에서 500 응답 반환.

## 해결 방법

```bash
# 1. Prisma 스키마를 DB에 반영 (테이블 생성)
cd server
npx prisma db push

# 2. PM2 서버 재시작 (Prisma Client 재생성 반영)
pm2 restart book-discussion
```

생성된 테이블: `users`, `books`, `groups`, `group_members`, `memos`, `discussions`, `comments`, `replies`

## 코드 변경 사항

이번 이슈는 코드 변경 없이 해결됨. 인프라(DB) 설정 누락이 원인이었음.

- `server/src/routes/auth.routes.ts` — 변경 없음
- `server/src/services/auth.service.ts` — 변경 없음
- `server/prisma/schema.prisma` — 변경 없음 (이미 올바르게 정의되어 있었음)
- `server/.env` — 변경 없음 (`DATABASE_URL`은 정상)

## 디버깅 테스트 계정

해결 확인을 위해 아래 계정으로 회원가입 테스트 후 DB에서 삭제 완료.

| 항목 | 값 |
|------|-----|
| 이메일 | test_debug@test.com |
| 비밀번호 | Test1234! |
| 닉네임 | 테스트유저 |
| 상태 | **삭제됨** (DB에서 제거 완료) |

## 재발 방지

서버 초기 배포 시 아래 명령을 반드시 실행할 것:

```bash
cd server
npm install
npx prisma db push   # 또는 npx prisma migrate deploy
npm run build
pm2 start ecosystem.config.js
```
