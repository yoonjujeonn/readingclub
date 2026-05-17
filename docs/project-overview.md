# buzzy pages — 프로젝트 기획 및 구조 정리

> 같은 책을 읽는 사람들을 연결하고, 독서 과정의 기록을 바탕으로 자연스럽게 책 이야기를 나눌 수 있도록 돕는 AI 독서 토론 커뮤니티

- 저장소: [kookmin-sw/2026-capstone-84](https://github.com/kookmin-sw/2026-capstone-84)
- 소개 페이지: <https://kookmin-sw.github.io/2026-capstone-84/>
- 팀: 국민대학교 2026 캡스톤디자인 84조

---

## 1. 한눈에 보기

| 항목 | 내용 |
|---|---|
| 서비스명 | **버지 페이지** |
| 한 줄 소개 | 함께 읽고, 함께 기록하고, 함께 토론하는 AI 독서 모임 플랫폼 |
| 핵심 가치 | 진도 기반 메모 공개 · AI 토론 주제 추천 · 스레드형 토론 · 개인화 인사이트 |
| 사용자 | 온/오프라인 독서 모임 참여자, 혼자 읽기 어려운 독자 |
| 배포 형태 | AWS EC2 단일 서버 + S3 (이미지 스토리지) |

---

## 2. 문제 정의

### 2.1 사용자 Pain Point

독서 모임 참여자는 모임 참여 → 독서 준비 → 토론 진행 → 사후 정리의 각 단계에서 서로 다른 어려움을 겪는다.

| 단계 | 어려움 |
|---|---|
| 모임 참여 | 진도 격차로 대화가 한쪽으로 치우침, 일정 조율의 부담 |
| 독서 준비 | 무엇을 메모하고 무엇을 이야깃거리로 가져갈지 모호함 |
| 토론 진행 | 매번 토론 주제를 새로 만들어야 하는 부담, 스포일러 우려 |
| 사후 정리 | 카톡·메모 앱·노션 등에 흩어져 결국 휘발됨 |

### 2.2 기존 도구의 한계

- **카카오톡**: 시간 흐름에 따라 대화가 묻히고 주제별로 정리되지 않음
- **노션·구글 닥스**: 기록은 가능하지만 토론 흐름과 진도 정보를 다루지 못함
- **기존 독서 앱**: 개인 기록 위주이고, 같은 책을 읽는 동료와의 연결이 약함

### 2.3 핵심 질문

> 어떻게 하면 시공간 제약 없이도 깊이 있는 독서 토론과 지속적인 참여를 만들 수 있을까?

---

## 3. 서비스 컨셉

### 3.1 핵심 사용자 흐름

```
책 검색 → 모임 생성/참여 → 메모 작성 → 진도 기반 메모 열람
       → AI 토론 주제 추천 → 스레드 토론 → 개인화 독서 인사이트
```

### 3.2 차별화 포인트

1. **진도 기반 메모 공개**: 메모를 비공개 / 공개 / 스포일러(해당 페이지까지 읽은 사람만 열람) 3단계로 구분해, 같은 진도의 독자끼리 자연스럽게 공감대를 형성한다.
2. **AI 토론 주제 추천**: 책 정보와 공개 메모 키워드를 분석해 토론 주제 후보를 자동 제안한다.
3. **스레드형 토론**: 흩어지는 대화 대신 주제별 스레드 + 의견 + 답글로 구조화되어 축적된다.
4. **개인화 독서 인사이트**: 내 메모와 모임 토론을 종합해 회고형 인사이트를 생성한다.

---

## 4. 주요 기능

| 카테고리 | 기능 | 설명 |
|---|---|---|
| 📚 독서 모임 | 모임 생성/참여 | 카카오/네이버 책 검색 API 연동, 공개·비공개(비밀번호) 설정 |
| | 초대 링크 | 방장이 30분 만료 초대 코드를 발급해 멤버 초대 |
| | 모임 관리 | 방장 대시보드에서 멤버 강퇴, 모임 수정/삭제, 공지 관리 |
| 📝 메모 | 페이지 범위 메모 | 페이지 구간 지정, 진행률과 자동 연동 |
| | 공개 설정 | 비공개 / 공개 / 스포일러(진도 도달자만) 3단계 |
| | 정렬·필터 | 최신순·오래된순·페이지순 + 공개 상태별 필터 |
| 💬 토론 | 스레드 생성 | 직접 작성 또는 메모와 연결해 스레드 개설 |
| | 의견·답글 | 의견과 대댓글, 종료일 설정, 핀 고정 |
| | 추천 주제 | 공개 메모 키워드 분석 기반 자동 추천 |
| 🤖 AI | 토론 주제 제안 | Gemini API로 책 정보 + 메모 기반 주제 3개 자동 생성 |
| | 토론 요약 | 스레드의 핵심 논점·주요 의견·결론을 마크다운으로 정리 |
| | 독서 회고 인사이트 | 개인 메모와 모임 토론을 분석해 개인화 인사이트 생성 |
| 📅 일정 | 캘린더 뷰 | 독서 기간, 토론일, 커스텀 일정을 한 화면에 시각화 |
| 👤 마이페이지 | 프로필 관리 | 닉네임 중복 확인, 프로필 이미지, 비밀번호 변경, 탈퇴 |
| | 활동 내역 | 참여 모임 · 작성 메모 · 참여 토론 통합 조회 |
| | 추천 모임 | 참여 모임의 책 정보 기반 유사 모임 추천 |
| 🔔 알림 | 알림 센터 | 댓글, 공지, 일정 등 주요 이벤트 알림 |
| 🚨 신고 | 신고 처리 | 부적절한 콘텐츠 신고 + AI 보조 검토 |

---

## 5. 시스템 구조

### 5.1 배포 아키텍처

```
사용자
  │
  ▼
Nginx ── React 정적 파일(client/dist)
  │
  ▼
EC2 (1대)
  ├─ Express + TypeScript API (PM2)
  ├─ MySQL 8.0
  └─ S3 SDK
        │
        ▼
S3
  ├─ profile-images/
  ├─ thread-images/
  ├─ comment-images/
  └─ db-backups/
```

선택 근거 요약 (자세한 내용은 [docs/deployment-cost-optimization.md](./deployment-cost-optimization.md)):

- 서비스 규모와 비용을 고려해 CloudFront, ALB, RDS 같은 추가 인프라는 도입하지 않는다.
- EC2 한 대로 웹·API·DB를 운영하고, 휘발되면 안 되는 업로드 이미지만 S3로 분리한다.
- `FILE_STORAGE_DRIVER=local|s3` 환경변수로 로컬과 운영을 동일 코드로 전환한다.

### 5.2 컴포넌트 구성

| 영역 | 구성 |
|---|---|
| Frontend (SPA) | React 18, TypeScript, Vite, React Router v6, Zustand, marked |
| Backend (API) | Node.js, Express, TypeScript, Zod, Prisma |
| Database | MySQL 8.0 (Prisma ORM, 마이그레이션 관리) |
| AI | Google Gemini API (주제 제안 / 요약 / 인사이트), AWS Bedrock 점검 스크립트 포함 |
| 외부 API | 카카오 책 검색, 네이버 책 검색 |
| 인증 | JWT (Access + Refresh), bcrypt |
| 파일 저장 | 로컬 디스크(`server/uploads`) 또는 AWS S3 (드라이버 분리) |
| 테스트 | Vitest, Supertest, fast-check (속성 기반 테스트) |
| 운영 | AWS EC2, Nginx, PM2 |

### 5.3 데이터 모델 핵심

`server/prisma/schema.prisma` 기준 주요 도메인은 다음과 같다.

- **User**: 이메일/카카오 로그인, `activityScore`로 활동 점수 누적, soft delete 지원
- **Book / Group / GroupMember**: 책-모임-멤버 N:M 구조, 모임에는 `readingStartDate`·`readingEndDate`·`discussionDate`·`isPrivate`·`inviteCode`(만료시각 포함)·`maxMembers` 등 모임 운영 필드 포함
- **GroupTag**: 모임 태그(15자 제한), 검색·추천 활용
- **Memo**: `pageStart`/`pageEnd`로 페이지 구간 메모, `visibility`(`private`/`public`/`spoiler`)로 진도 기반 공개 제어
- **Discussion / Comment / Reply**: 스레드형 토론 구조, `isRecommended`(AI 추천 주제), `isPinned`, `endDate`(자동 종료)
- **DiscussionToken**: 사용자별 의견 작성 토큰(스팸·과도한 글 방지 추정)
- **DiscussionInsight**: 모임-사용자별 종합 인사이트(키워드, 참여 통계, 메모/토론/댓글 수)
- **Announcement / Notification**: 공지와 사용자 알림(중복 방지용 `dedupeKey` 유니크)
- **DiscussionSchedule**: 캘린더 뷰에 들어가는 커스텀 일정
- **GroupBan / Report**: 운영 안전망 (강퇴, 신고 + AI 검토 결과)

### 5.4 라우팅 구성

서버 진입점은 `server/src/index.ts`이며 다음 라우터로 분리된다.

```
/api/auth            인증 (회원가입, 로그인, 토큰 갱신, 카카오)
/api/books           책 검색
/api/groups          모임 CRUD / 참여 / 초대
/api/groups/.../dashboard  방장 대시보드
/api/...             메모 / 토론 / 인사이트 / 토론 토큰
/api/me              마이페이지
/api/me/notifications 알림
/api                 AI 기능 (주제 제안, 요약, 인사이트)
/api/reports         신고
/api                 랭킹
```

프론트 라우팅은 `client/src/App.tsx`에서 단일 진입으로 모든 페이지를 매핑한다(로그인/회원가입/홈/모임 상세/메모/토론/스레드/마이페이지/설정/대시보드/초대/알림/랭킹).

---

## 6. 디렉토리 구조

```
2026-capstone-84/
├─ client/                        # React + Vite 프론트엔드
│  ├─ src/
│  │  ├─ api/                    # axios 기반 API 클라이언트
│  │  ├─ components/             # 공용 UI 컴포넌트
│  │  ├─ pages/                  # 라우트 단위 페이지
│  │  ├─ stores/                 # Zustand 전역 상태(authStore 등)
│  │  ├─ types/                  # 공용 타입
│  │  └─ utils/                  # 날짜·시간 유틸 등
│  ├─ public/                    # 정적 자산(파비콘, 이미지)
│  └─ vite.config.ts
│
├─ server/                        # Express + TypeScript 백엔드
│  ├─ src/
│  │  ├─ index.ts                # 앱 엔트리, 라우터 등록, 정적 서빙
│  │  ├─ middleware/             # auth, errorHandler 등
│  │  ├─ routes/                 # 도메인별 라우터
│  │  ├─ services/               # 비즈니스 로직 (ai, group, memo, discussion 등)
│  │  └─ validators/             # Zod 스키마
│  ├─ prisma/                    # schema.prisma, migrations
│  ├─ scripts/
│  │  ├─ seed-api-automation.mjs # 테스트 데이터 자동 생성
│  │  └─ check-bedrock.mjs       # Bedrock 연결 점검
│  └─ uploads/                   # 로컬 저장 모드일 때만 사용
│
├─ docs/                          # 발표·기획 문서
│  ├─ project-overview.md         # (본 문서)
│  ├─ evaluation.md               # 평가 기준 정리
│  ├─ ppt.md / ppt-prompt.md      # 발표 PPT 가이드
│  ├─ poster-prompt.md            # 포스터 프롬프트
│  ├─ deployment-cost-optimization.md
│  └─ api-seed-automation.md
│
├─ nginx/book-discussion.conf     # 운영용 Nginx 설정
├─ ecosystem.config.js            # PM2 설정
├─ README.md / index.md / changes.md
└─ package.json
```

---

## 7. 기술 의사결정 요약

| 해결할 문제 | 선택한 기술 | 선택 근거 |
|---|---|---|
| 한국어 친화적인 토론 주제·요약 생성 | Google Gemini API | 한국어 품질, 빠른 응답, 제공자 추상화(`ai-provider.service.ts`)로 교체 용이 |
| 책 검색 다양성 확보 | 카카오 + 네이버 책 검색 API 병행 | 단일 출처 결손 보완 |
| 빠른 풀스택 개발 | Express + TypeScript, React + Vite | 학습 곡선 대비 생산성 우수, 단일 언어(TS)로 도메인 공유 |
| 관계형 데이터 + 마이그레이션 | MySQL + Prisma | 모임/멤버/메모/토론 등 관계가 깊고, Prisma로 타입 안전한 ORM |
| 인증 | JWT (Access + Refresh) + bcrypt | SPA 친화적이며 카카오 OAuth와 결합 |
| 파일 업로드 | 로컬 / S3 드라이버 분리 | 개발은 로컬, 운영은 S3로 무중단 전환 |
| 운영 비용 최소화 | EC2 단일 + Nginx + PM2 | 캡스톤 규모에 적합, CloudFront/RDS는 추후 검토 |
| 품질 보증 | Vitest + Supertest + fast-check | 단위/통합/속성 기반 테스트 병행 |

---

## 8. 운영·자동화

- **PM2** (`ecosystem.config.js`)로 백엔드 프로세스 관리
- **Nginx** (`nginx/book-discussion.conf`)에서 정적 파일 서빙 + `/api` 프록시
- **알림 스케줄러**: 서버 부팅 시 `notificationService.startDateNotificationScheduler()`가 일정 기반 알림을 주기적으로 발송
- **테스트 데이터 자동화**: `npm run seed:api` (계정 6 / 모임 2 / 메모 8 / 스레드 6 / 댓글·답글 6) — 자세한 내용은 [docs/api-seed-automation.md](./api-seed-automation.md)
- **Bedrock 점검**: `npm run bedrock:check`로 AWS Bedrock 연결 상태 확인

---

## 9. 실행 방법 요약

사전 요구사항: Node.js 18+, npm 9+, MySQL 8.0+

```bash
# 1) 클론
git clone https://github.com/kookmin-sw/2026-capstone-84.git
cd 2026-capstone-84

# 2) 서버
cd server
npm install
cp .env.example .env   # DATABASE_URL / JWT_SECRET / KAKAO_API_KEY / GEMINI_API_KEY 등 채우기
npx prisma migrate dev
npm run dev            # http://localhost:3000

# 3) 클라이언트 (다른 터미널)
cd client
npm install
npm run dev            # http://localhost:5173
```

테스트 실행:

```bash
cd server
npm run test           # Vitest 단발 실행
npm run test:pbt       # 속성 기반(Property) 테스트만
```

---

## 10. 향후 발전 방향

- AI 추천 개인화 고도화 (사용자 독서 이력·관심 키워드 반영)
- 독서 통계·리포트 (월/분기 단위 회고)
- 오프라인 모임 연동 (위치 기반 모임, 일정 시뮬레이션)
- 다른 콘텐츠 도메인으로 확장 (영화·강의 모임)
- 트래픽 증가 시 CloudFront/RDS 도입 재검토

---

## 11. 팀 구성

| 이름 | 역할 |
|---|---|
| 조연지 | PM / Project Lead |
| 양병규 | FE |
| 전석환 | Infra |
| 전윤주 | API 데이터 페칭 / 풀스택 |
| 최연우 | AI |

---

## 12. 참고 문서

- 평가 기준: [docs/evaluation.md](./evaluation.md)
- 발표 PPT 구성: [docs/ppt.md](./ppt.md)
- 포스터 프롬프트: [docs/poster-prompt.md](./poster-prompt.md)
- 배포 구조: [docs/deployment-cost-optimization.md](./deployment-cost-optimization.md)
- API 시드 자동화: [docs/api-seed-automation.md](./api-seed-automation.md)
