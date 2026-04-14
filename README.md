# 📚 Reading Club — 독서 토론 웹사이트

독서 모임을 만들고, 메모를 공유하고, 토론할 수 있는 웹 애플리케이션입니다.

## 기술 스택

- **Frontend**: React 18, TypeScript, Vite, Zustand, React Router
- **Backend**: Express, TypeScript, Prisma ORM, Zod
- **Database**: MySQL

## 주요 기능

- 회원가입 / 로그인 (JWT 인증)
- 책 검색 (카카오/네이버 API)
- 독서 모임 생성 및 참여
- 메모 작성 (비공개 / 공개 / 스포일러 보호)
- 토론 주제 생성 및 댓글/답글
- 독서 진행률 관리
- 마이페이지

## 시작하기

### 사전 요구사항

- Node.js 18+
- MySQL 8.0+

### 서버 설정

```bash
cd server
npm install
cp .env.example .env
# .env 파일을 본인 환경에 맞게 수정

npx prisma generate
npx prisma db push
npm run dev
```

서버: http://127.0.0.1:3000

### 클라이언트 설정

```bash
cd client
npm install
npm run dev
```

클라이언트: http://localhost:5173

### 테스트

```bash
cd server
npm test
```

## 프로젝트 구조

```
readingclub/
├── client/          # React 프론트엔드
│   └── src/
│       ├── api/     # API 클라이언트
│       ├── pages/   # 페이지 컴포넌트
│       ├── stores/  # Zustand 상태 관리
│       └── types/   # TypeScript 타입
└── server/          # Express 백엔드
    ├── prisma/      # Prisma 스키마
    └── src/
        ├── middleware/  # 인증, 에러 핸들링
        ├── routes/      # API 라우트
        ├── services/    # 비즈니스 로직
        └── validators/  # Zod 스키마
```

## 환경 변수

| 변수 | 설명 |
|------|------|
| `DATABASE_URL` | MySQL 연결 문자열 |
| `JWT_SECRET` | JWT 서명 키 |
| `PORT` | 서버 포트 (기본: 3000) |
| `KAKAO_API_KEY` | 카카오 REST API 키 (선택) |
| `NAVER_CLIENT_ID` | 네이버 클라이언트 ID (선택) |
| `NAVER_CLIENT_SECRET` | 네이버 클라이언트 시크릿 (선택) |
