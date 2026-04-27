# 변경사항: 카카오 소셜 로그인 추가

커밋: `e01c335`
이전 커밋: `e0e2264` (초기 커밋: 독서 토론 웹사이트 MVP)

## 변경된 파일 (7개, +143줄)

### 백엔드
- `server/prisma/schema.prisma` — User 모델에 `kakaoId`, `provider` 필드 추가, `passwordHash` nullable로 변경
- `server/src/services/auth.service.ts` — `kakaoLogin()` 메서드 추가 (카카오 사용자 정보 조회, 계정 생성/연동, JWT 발급)
- `server/src/routes/auth.routes.ts` — `GET /api/auth/kakao` (카카오 로그인 리다이렉트), `GET /api/auth/kakao/callback` (콜백 처리, 토큰 교환) 엔드포인트 추가

### 프론트엔드
- `client/src/pages/LoginPage.tsx` — "카카오로 시작하기" 버튼 추가, URL 파라미터로 전달된 토큰 자동 처리
- `client/src/pages/HomePage.tsx` — 사이트명 클릭 시 검색 초기화
- `client/src/pages/MyPage.tsx` — 로그아웃 시 메인페이지로 이동
- `client/src/api/groups.ts` — memberCount → currentMembers 매핑 추가

## 환경변수 추가 (.env)
```
KAKAO_CLIENT_ID="카카오 REST API 키"
KAKAO_CLIENT_SECRET="카카오 클라이언트 시크릿"
KAKAO_REDIRECT_URI="http://localhost:3000/api/auth/kakao/callback"
```

## DB 마이그레이션 필요
```
cd server
npx prisma migrate dev --name add-kakao-login
```
