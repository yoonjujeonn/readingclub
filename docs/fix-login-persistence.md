# 로그인 상태 유지 (새로고침 시 로그아웃 문제 수정)

**날짜:** 2026-05-04

## 문제

- 로그인 후 페이지를 새로고침하면 로그아웃되는 문제
- 원인: zustand 상태가 메모리에만 저장되어 새로고침 시 초기화됨

## 해결

`authStore.ts`에서 `localStorage`를 연동하여 토큰과 유저 정보를 브라우저에 저장.

### 변경 내용

- **앱 시작 시** — `localStorage`에서 accessToken, refreshToken, user 정보 복원
- **`setTokens()`** — 메모리 + `localStorage`에 동시 저장
- **`setUser()`** — 메모리 + `localStorage`에 동시 저장
- **`logout()`** — 메모리 + `localStorage` 모두 삭제

### 로그인 유지 기간

- accessToken: 15분 (만료 시 자동 갱신)
- refreshToken: 7일 (만료 시 로그인 페이지로 이동)
- 자동 갱신 로직은 `client/src/api/client.ts`의 response interceptor에 기존 구현되어 있음

### 변경된 파일

- `client/src/stores/authStore.ts`
