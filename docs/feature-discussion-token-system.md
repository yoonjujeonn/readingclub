# 스레드 내부 발언권 시스템

관련 이슈: #55
브랜치: `55-feature-discussion-token-system`

## 개요

스레드(책수다) 내에서 참여자별 발언권을 관리하여, 과도한 발언 독점을 방지하고 신중한 토론 참여를 유도합니다.

## 핵심 규칙

- 스레드 참여 시 기본 발언권 **10개** 지급
- 의견 또는 댓글 작성 시 **1개 차감**
- 발언권 0이면 해당 스레드에서 작성 불가
- **삭제해도 발언권 미환불**
- **모임장은 발언권 제한 없음** (차감 안 됨, UI에도 표시 안 됨)

## 기능

### 참여자
- 스레드 상세 페이지에서 "🎫 내 발언권: N개" 확인
- `?` 버튼 hover 시 커스텀 툴팁으로 규칙 설명
- 발언권 0일 때 "추가 요청" 버튼 → 모임장에게 요청
- 요청 후 "(요청됨)" 표시

### 모임장
- 대시보드 "책수다 관리" 탭에서 각 스레드의 "🎫 발언권" 버튼 클릭
- 발언권 요청 목록 확인 (요청한 참여자 닉네임, 남은 발언권)
- "+5 지급" 버튼으로 발언권 추가 지급 → 요청 상태 해제

## DB 스키마

```
model DiscussionToken {
  id           String   @id @default(uuid())
  discussionId String   @map("discussion_id")
  userId       String   @map("user_id")
  remaining    Int      @default(10)
  requested    Boolean  @default(false)
  createdAt    DateTime @default(now()) @map("created_at")

  @@unique([discussionId, userId])
  @@map("discussion_tokens")
}
```

## API 엔드포인트

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/discussions/:id/tokens` | 내 발언권 조회 | 로그인 |
| POST | `/api/discussions/:id/tokens/request` | 발언권 추가 요청 | 로그인 |
| GET | `/api/discussions/:id/tokens/requests` | 요청 목록 조회 | 방장 |
| POST | `/api/discussions/:id/tokens/grant` | 발언권 지급 | 방장 |

## 변경된 파일

### 백엔드
- `server/prisma/schema.prisma` — DiscussionToken 모델 추가
- `server/src/services/token.service.ts` (신규) — 발언권 조회/차감/요청/지급
- `server/src/routes/token.routes.ts` (신규) — 발언권 API 엔드포인트
- `server/src/services/discussion.service.ts` — addComment/addReply에서 발언권 차감 연동
- `server/src/index.ts` — tokenRouter 등록

### 프론트엔드
- `client/src/api/discussions.ts` — getTokens, requestTokens, getTokenRequests, grantTokens 추가
- `client/src/pages/DiscussionThreadPage.tsx` — 발언권 UI (표시, 툴팁, 요청, 부족 시 차단)
- `client/src/pages/DashboardPage.tsx` — 책수다 관리 탭에 발언권 요청 확인/지급 기능
