# 모임장 대시보드 및 관리 기능 추가

관련 이슈: #16
브랜치: `16-feature-모임장-대시보드-관리기능`

## 개요

모임장(방장) 전용 대시보드 페이지(`/groups/:id/dashboard`)를 추가하고, 모임 운영에 필요한 관리 기능을 구현했습니다.

## 추가된 기능

### 1. 토론 일정 관리 (캘린더뷰)
- 월별 캘린더에서 독서 기간, 토론일, 등록된 토론 일정을 시각적으로 확인
- 토론 일정 추가 (제목, 시작일, 종료일)
- 등록된 일정 삭제
- 색상 구분: 독서 기간(하늘색), 토론 일정(초록), 토론일(파란)

### 2. 모임 공지사항
- 방장이 공지사항 작성/삭제
- 모임 상세 페이지에서 모든 참여자가 공지사항 확인 가능 (최신 3개 표시)
- 주황색 왼쪽 테두리로 시각적 강조

### 3. 멤버 초대 (초대 링크 방식)
- 고유 초대 코드 생성 및 링크 복사
- 초대 링크(`/invite/:code`)로 접속하면 자동 참여 처리
- 로그인 안 된 상태면 로그인 후 자동 리다이렉트
- 초대 링크 재생성 가능
- 초대 링크 30분 만료 (만료 시간 표시, 만료 후 참여 불가)

### 4. 멤버 강제 퇴장 + 차단
- 방장이 부적절한 멤버를 모임에서 삭제
- 강퇴된 사용자는 차단 목록(`group_bans`)에 등록
- 차단된 사용자는 일반 참여, 초대 링크 모두 재참여 불가
- "이 모임에서 강제 퇴장되어 참여할 수 없습니다" 메시지 표시

### 5. AI 키워드 기반 토론 주제 선정
- 기존 추천 엔진을 대시보드에서 활용
- 추천된 주제를 선택하면 토론 스레드 자동 생성

### 6. 부적절한 댓글/답글 삭제
- 토론 스레드 페이지에서 방장 또는 작성자 본인이 의견/답글 삭제 가능
- 의견 삭제 시 하위 답글도 함께 제거
- 빨간색 "삭제" 버튼으로 표시

## UI 구조

대시보드는 탭 형태로 구성되어 각 기능을 개별 탭에서 확인할 수 있습니다:
- 📅 토론 일정 — 캘린더 + 일정 추가/삭제
- 🔗 초대 링크 — 생성/복사/만료 표시
- 📢 공지사항 — 작성/삭제
- 👥 멤버 관리 — 강제 퇴장
- 💡 추천 주제 — AI 추천 토론 주제 선정

## 변경된 파일

### DB 스키마
- `server/prisma/schema.prisma`
  - `Group` 모델에 `inviteCode`, `inviteCodeExpiresAt` 필드 추가
  - `Announcement` 모델 추가
  - `GroupBan` 모델 추가
  - `DiscussionSchedule` 모델 추가

### 백엔드
- `server/src/services/dashboard.service.ts` (신규) — 대시보드 관련 비즈니스 로직
- `server/src/routes/dashboard.routes.ts` (신규) — 대시보드 API 엔드포인트
- `server/src/index.ts` — 라우터 등록
- `server/src/services/group.service.ts` — join 시 차단 여부 확인, 공지사항 조회 추가

### 프론트엔드
- `client/src/api/dashboard.ts` (신규) — 대시보드 API 클라이언트
- `client/src/pages/DashboardPage.tsx` (신규) — 방장 전용 대시보드 페이지
- `client/src/pages/InvitePage.tsx` (신규) — 초대 링크 참여 처리 페이지
- `client/src/pages/GroupDetailPage.tsx` — 대시보드 링크 추가, 공지사항 표시
- `client/src/pages/DiscussionThreadPage.tsx` — 댓글/답글 삭제 버튼 추가
- `client/src/pages/LoginPage.tsx` — redirect 파라미터 지원
- `client/src/stores/authStore.ts` — localStorage persist 추가
- `client/src/App.tsx` — 라우팅 추가 (`/groups/:id/dashboard`, `/invite/:code`)

## API 엔드포인트

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| POST | `/api/groups/:id/invite` | 초대 코드 생성/재생성 | 방장 |
| GET | `/api/groups/:id/invite` | 초대 코드 조회 | 방장 |
| POST | `/api/groups/invite/:code/join` | 초대 코드로 참여 | 로그인 |
| DELETE | `/api/groups/:id/members/:userId` | 멤버 강제 퇴장 | 방장 |
| GET | `/api/groups/:id/announcements` | 공지사항 목록 | 로그인 |
| POST | `/api/groups/:id/announcements` | 공지사항 작성 | 방장 |
| PUT | `/api/groups/:id/announcements/:annId` | 공지사항 수정 | 방장 |
| DELETE | `/api/groups/:id/announcements/:annId` | 공지사항 삭제 | 방장 |
| GET | `/api/groups/:id/schedules` | 토론 일정 목록 | 로그인 |
| POST | `/api/groups/:id/schedules` | 토론 일정 추가 | 방장 |
| PUT | `/api/groups/:id/schedules/:scheduleId` | 토론 일정 수정 | 방장 |
| DELETE | `/api/groups/:id/schedules/:scheduleId` | 토론 일정 삭제 | 방장 |
| DELETE | `/api/comments/:id` | 의견 삭제 | 방장/작성자 |
| DELETE | `/api/replies/:id` | 답글 삭제 | 방장/작성자 |

## DB 마이그레이션

```bash
cd server
npx prisma db push
```
