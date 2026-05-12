# 책수다(토론) 페이지 리뉴얼

브랜치: `feature-thread-renewal`

## 개요

기존 "토론" 페이지를 "책수다"로 리브랜딩하고, 스레드 종료일/상태 관리 및 대표 수다 고정 기능을 추가했습니다.

## 변경 내용

### 1. 이름 변경
- "토론" → "📚 책수다"
- "토론 페이지" → "📚 책수다" (모임 상세 페이지 링크)
- "토론 주제 만들기" → "책수다 만들기"
- "진행중 스레드" → "진행중인 수다"
- "종료된 스레드" → "종료된 수다"

### 2. 스레드 종료일 및 상태 관리
- Discussion 모델에 `status`(active/closed), `endDate` 필드 추가
- 책수다 만들기 시 종료일 필수 입력 (date picker)
- 종료일이 지난 스레드는 목록 조회 시 자동으로 `closed` 처리
- 종료된 스레드에는 의견/댓글 작성 불가 (403 에러)
- 스레드 상세 페이지에서 종료 상태 시 "종료되었습니다" 메시지 표시

### 3. 대표 수다 (고정)
- Discussion 모델에 `isPinned` 필드 추가
- 모임장이 대시보드에서 최대 3개까지 대표 수다 설정/해제
- 책수다 페이지 상단에 "📌 대표 수다" 섹션으로 고정 표시

### 4. 모임장 대시보드 — 책수다 관리 탭
- 모든 스레드 목록 표시 (대표/종료 뱃지)
- 종료일 수정: 인라인 date picker로 변경 → 미래 날짜 설정 시 자동으로 진행중 복원
- 대표 설정/해제 버튼
- 기존 "토론 생성" 탭 삭제

### 5. 책수다 페이지 구조
- 📌 대표 수다 (고정, 상단)
- 🟢 진행중인 수다
- 🔴 종료된 수다

## DB 스키마 변경

Discussion 모델:
```
status    String    @default("active") @db.VarChar(20)
endDate   DateTime? @db.Date
isPinned  Boolean   @default(false)
```

## API 엔드포인트

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/groups/:groupId/discussions?status=active` | 상태별 필터 조회 | 로그인 |
| PATCH | `/api/discussions/:id/end-date` | 종료일 수정 | 방장 |
| POST | `/api/discussions/:id/pin` | 대표 수다 설정 | 방장 |
| DELETE | `/api/discussions/:id/pin` | 대표 수다 해제 | 방장 |

## 변경된 파일

### 백엔드
- `server/prisma/schema.prisma` — Discussion에 status, endDate, isPinned 추가
- `server/src/services/discussion.service.ts` — 자동 종료, 종료 차단, 종료일 수정, 핀 설정/해제
- `server/src/routes/discussion.routes.ts` — 새 엔드포인트 추가, status 필터 지원
- `server/src/validators/index.ts` — CreateDiscussionSchema에 endDate 추가

### 프론트엔드
- `client/src/pages/DiscussionsPage.tsx` — "책수다" 리브랜딩, 대표/진행중/종료 분류, 종료일 필수
- `client/src/pages/DiscussionThreadPage.tsx` — 종료 상태 시 의견 작성 폼 숨김
- `client/src/pages/GroupDetailPage.tsx` — "토론 페이지" → "📚 책수다"
- `client/src/pages/DashboardPage.tsx` — "책수다 관리" 탭 추가, "토론 생성" 탭 삭제
- `client/src/api/discussions.ts` — updateEndDate, pinThread, unpinThread 추가
- `client/src/types/index.ts` — CreateDiscussionRequest에 endDate 추가
