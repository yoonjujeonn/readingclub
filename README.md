## 팀페이지 주소
[2026년 84조 캡스톤 깃허브](https://github.com/kookmin-sw/2026-capstone-84)

[프로젝트 소개 페이지](https://kookmin-sw.github.io/2026-capstone-84/)


## 1. 프로젝트 소개

같은 책을 읽는 사람들을 연결하고, 독서 과정에서의 기록을 바탕으로 자연스럽게 사람들과 책 이야기를 나눌 수 있도록 돕는 커뮤니티 ***buzzy pages***입니다.

'**독서 모임 참여자**는 **모임 참여, 독서 준비, 토론 진행, 이후 정리**의 각 과정에서 서로 다른 어려움을 겪어, **독서 토론에 적극적으로 참여하고 의미 있는 대화를 나누기** 어렵다.'라는 문제 의식에서 시작하여 시공간의 제약 없이 책 이야기를 나누고, 책에 대한 정보를 찾아볼 수 있는 공간으로 만들어가고 있습니다.


### 주요 기능

| 카테고리 | 기능 | 설명 |
|---------|------|------|
| 📚 독서 모임 | 모임 생성/참여 | 책 검색(카카오/네이버 API) 후 독서 모임 생성, 공개/비공개(비밀번호) 설정 지원 |
| | 초대 링크 | 방장이 30분 만료 초대 코드를 생성하여 링크로 멤버 초대 |
| | 모임 관리 | 방장 대시보드에서 멤버 강퇴, 모임 수정/삭제, 공지사항 관리 |
| 📝 메모 | 독서 메모 작성 | 페이지 범위 지정 후 메모 작성, 읽은 페이지 진행률 연동 |
| | 공개 설정 | 비공개 / 공개 / 스포일러(해당 페이지까지 읽은 사람만 열람) 3단계 |
| | 정렬/필터 | 최신순, 오래된순, 페이지순 정렬 및 공개 상태별 필터링 |
| 💬 토론 | 토론 주제 생성 | 직접 작성 또는 메모 연결하여 토론 스레드 개설 |
| | 의견/댓글 | 토론 주제에 의견 작성, 의견에 대한 답글(대댓글) 지원 |
| | 추천 주제 | 공개 메모 키워드 분석 기반 자동 토론 주제 추천 |
| 🤖 AI | AI 토론 주제 제안 | Gemini API로 책 정보 + 메모 기반 토론 주제 3개 자동 생성 |
| | 토론 요약 | 토론 스레드의 핵심 논점·주요 의견·결론을 마크다운으로 정리 |
| | 독서 회고 인사이트 | 내 메모와 모임 토론 내용을 분석하여 개인화된 독서 인사이트 생성 |
| 📅 일정 | 토론 일정 관리 | 캘린더 뷰에서 독서 기간, 토론일, 커스텀 일정 시각화 |
| 👤 마이페이지 | 프로필 관리 | 닉네임 변경(중복 확인), 프로필 이미지, 비밀번호 변경, 회원 탈퇴 |
| | 활동 내역 | 참여 모임·작성 메모·참여 토론 한눈에 조회 |
| | 추천 모임 | 참여 모임의 책 정보 기반 유사 모임 추천 |

## 2. 소개 영상

영상은 추후 추가될 예정입니다.

## 3. 팀 소개

| Profile | Name | Role |
|--------|-------|------|
| <img src="https://github.com/cho2-0923.png" width="100px"> | [조연지](https://github.com/cho2-0923) | PM / Project Lead |
| <img src="https://github.com/qnfdudemr.png" width="100px"> | [양병규](https://github.com/qnfdudemr) | AI 관련 기능 개발 |
| <img src="https://github.com/williamjeon7.png" width="100px"> | [전석환](https://github.com/williamjeon73) | Infra |
| <img src="https://github.com/yoonjujeonn.png" width="100px"> | [전윤주](https://github.com/yoonjujeonn) | API 데이터 페칭, 풀스택 개발 |
| <img src="https://github.com/Choiyeonw00.png" width="100px"> | [최연우](https://github.com/Choiyeonw00) | AI 기반 추천 |

## 4. 시스템 구조
## 5. 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React 18, TypeScript, Vite, Zustand, React Router v6 |
| Backend | Node.js, Express, TypeScript |
| ORM | Prisma |
| Database | MySQL 8.0 |
| AI | Google Gemini API |
| 외부 API | 카카오 책 검색 API, 네이버 책 검색 API |
| 인증 | JWT (Access Token + Refresh Token), bcrypt |
| 테스트 | Vitest, Supertest, fast-check (PBT) |
| 배포 | AWS EC2, Nginx, PM2 |
| DevOps & 협업도구 | GitHub, Notion, Slack |
## 6. 실행 방법

#### 사전 요구사항

- Node.js v18 이상
- npm v9 이상
- MySQL 8.0 이상

---

#### 설치 및 실행

**1. 저장소 클론**

```bash
git clone https://github.com/kookmin-sw/2026-capstone-84.git
cd 2026-capstone-84
```

**2. 서버(Backend) 설정**

```bash
cd server
npm install
```

환경변수 파일 생성:

```bash
cp .env.example .env
```

`.env` 파일을 열어 아래 항목을 본인 환경에 맞게 수정합니다:

| 변수명 | 설명 |
|--------|------|
| `DATABASE_URL` | MySQL 접속 URL (예: `mysql://root:password@localhost:3306/readingclub`) |
| `JWT_SECRET` | JWT 토큰 서명용 시크릿 키 |
| `JWT_REFRESH_SECRET` | JWT 리프레시 토큰 시크릿 키 |
| `KAKAO_API_KEY` | 카카오 책 검색 API 키 |
| `GEMINI_API_KEY` | Google Gemini AI API 키 |

데이터베이스 마이그레이션:

```bash
npx prisma migrate dev
```

서버 실행:

```bash
# 개발 모드
npm run dev

# 또는 프로덕션 빌드 후 실행
npm run build
npm start
```

서버는 기본적으로 `http://localhost:3000`에서 실행됩니다.

**3. 클라이언트(Frontend) 설정**

```bash
cd client
npm install
```

개발 서버 실행:

```bash
npm run dev
```

클라이언트는 기본적으로 `http://localhost:5173`에서 실행됩니다.

프로덕션 빌드:

```bash
npm run build
```

빌드 결과물은 `client/dist` 폴더에 생성됩니다.

---

#### 테스트 실행

```bash
cd server
npm run test
```

---

#### 주요 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React 18, TypeScript, Vite, Zustand, React Router |
| Backend | Express, TypeScript, Prisma ORM |
| Database | MySQL |
| AI | Google Gemini API |
| 외부 API | 카카오 책 검색 API |

## 7. 디렉토리 구조

