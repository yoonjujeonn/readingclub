# 닉네임 변경 및 중복확인 기능 추가

**날짜:** 2026-05-04

## 변경 요약

마이페이지에서 닉네임 변경 기능과 닉네임 중복확인 기능을 추가하고,
DB 레벨에서 닉네임 유니크 제약을 적용하여 데이터 정합성을 보장하도록 변경.

---

## 1. DB 변경

### users 테이블 — nickname 컬럼에 UNIQUE 인덱스 추가

```sql
ALTER TABLE users ADD UNIQUE INDEX idx_users_nickname (nickname);
```

- Prisma 스키마: `nickname String @unique @db.VarChar(50)`
- **이유:** 애플리케이션 레벨 중복 체크만으로는 동시 요청(레이스 컨디션) 시 중복 닉네임이 생길 수 있음. DB 레벨에서 확실하게 방지.

> ⚠️ 기존 DB에 드리프트가 있어 `prisma migrate dev` 대신 `prisma db execute`로 직접 SQL 실행함.

---

## 2. 서버 API 변경

### 새 엔드포인트

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/auth/check-nickname?nickname=xxx` | 불필요 | 회원가입 시 닉네임 중복 확인 |
| GET | `/api/me/check-nickname?nickname=xxx` | 필요 | 마이페이지 닉네임 변경 시 중복 확인 |
| PATCH | `/api/me/nickname` | 필요 | 닉네임 변경. body: `{ nickname: "새닉네임" }` |

- 두 엔드포인트 모두 인증 필요 (Bearer 토큰)
- 닉네임 변경 시 중복이면 409 `DUPLICATE_NICKNAME` 에러 반환

### 변경된 파일

- `server/src/validators/index.ts` — `UpdateNicknameSchema` 추가
- `server/src/services/mypage.service.ts` — `checkNickname()`, `updateNickname()` 메서드 추가
- `server/src/services/auth.service.ts` — `signup()` 에 닉네임 중복 체크 추가
- `server/src/routes/mypage.routes.ts` — 두 엔드포인트 라우트 추가
- `server/src/routes/auth.routes.ts` — 비인증 닉네임 중복확인 엔드포인트 추가
- `server/prisma/schema.prisma` — nickname에 `@unique` 추가

---

## 3. 클라이언트 UI 변경

### 마이페이지 닉네임 수정 UI

- 프로필 닉네임 옆에 "수정" 버튼 추가
- 클릭 시 입력창 + "중복확인" / "저장" / "취소" 버튼 표시
- 중복확인 통과 시 "사용 가능한 닉네임입니다" 메시지, 저장 버튼 활성화
- 중복 시 "이미 사용 중인 닉네임입니다" 에러 메시지 표시

### 변경된 파일

- `client/src/api/mypage.ts` — `checkNickname()`, `updateNickname()` API 함수 추가
- `client/src/api/auth.ts` — `checkNickname()` API 함수 추가 (비인증용)
- `client/src/pages/MyPage.tsx` — 닉네임 수정 UI 및 상태 관리 추가
- `client/src/pages/SignupPage.tsx` — 닉네임 중복확인 버튼 및 상태 관리 추가
