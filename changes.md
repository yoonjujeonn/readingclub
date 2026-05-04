# 변경사항: 독서 모임 참여 모달 UI

## 개요
홈페이지에서 독서 모임 카드 클릭 시 바로 상세 페이지로 이동하던 동작을 모달로 변경.
모임 소개를 확인한 후 참여 여부를 선택할 수 있도록 개선.
이미 참여 중이거나 본인이 생성한 모임은 모달 없이 바로 상세 페이지로 이동.

## 변경된 파일

### 프론트엔드
- `client/src/components/GroupJoinModal.tsx` — **신규 생성**. 모임 참여 모달 컴포넌트
  - 모임 소개 (책 정보, 모임명, 설명, 일정, 인원) 표시
  - 공개 모임: "참여하기" 버튼
  - 비공개 모임: 비밀번호 입력 필드 + "참여하기" 버튼
  - ✕ 버튼 / 오버레이 클릭 / ESC 키로 닫기
- `client/src/pages/HomePage.tsx` — 카드 클릭 로직 변경
  - `isMember` 또는 본인 생성 모임 → 바로 상세 페이지 이동
  - 그 외 → 모달 표시, 참여 성공 시 상세 페이지로 이동
- `client/src/types/index.ts` — `GroupCard` 타입에 `isPrivate`, `ownerId`, `isMember` 필드 추가
- `client/src/api/groups.ts` — `join()` 메서드에 `password` 파라미터 추가

### 백엔드
- `server/src/services/group.service.ts` — `list()` 메서드에 `userId` 파라미터 추가, 응답에 `ownerId`와 `isMember` 포함
- `server/src/routes/group.routes.ts` — 그룹 리스트 API에서 `req.user?.userId`를 서비스에 전달

## DB 마이그레이션
없음
