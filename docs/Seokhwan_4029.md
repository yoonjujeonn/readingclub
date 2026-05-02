# 변경사항 기록 — Seokhwan_4029

## 2026-04-29: 로컬 개발 환경 세팅 및 빌드 에러 수정

### 환경 설정
- PowerShell 실행 정책을 `Restricted` → `RemoteSigned`로 변경 (현재 사용자 범위)
- MySQL 8.0 설치 (MySQL Server만, Custom 설치)
- MySQL bin 경로를 사용자 PATH에 추가: `C:\Program Files\MySQL\MySQL Server 8.0\bin`
- `Buzzy_Pages` 데이터베이스 생성 (utf8mb4)
- `server/.env` 파일 생성 (`.env.example` 복사 후 수정)
  - `NODE_ENV=development`
  - `DATABASE_URL`에 root 계정 및 Buzzy_Pages DB 설정
- Prisma 마이그레이션 실행 (`npx prisma migrate dev --name init`)

### 코드 수정 (클라이언트 빌드 에러 수정)

**`client/src/api/groups.ts`**
- 사용하지 않는 타입 import 제거 (`GroupCard`, `PaginatedResult`)
```ts
// before
import type { CreateGroupRequest, GroupCard, GroupDetail, PaginatedResult } from '../types';
// after
import type { CreateGroupRequest, GroupDetail } from '../types';
```

**`client/src/pages/GroupDetailPage.tsx`**
- `memberCount`가 undefined일 수 있는 타입 에러 수정 (fallback 0 추가)
```ts
// before
const isFull = group ? (group.currentMembers || group.memberCount) >= group.maxMembers : false;
// after
const isFull = group ? (group.currentMembers || group.memberCount || 0) >= group.maxMembers : false;
```
