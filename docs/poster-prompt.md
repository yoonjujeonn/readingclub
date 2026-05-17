# Buzzy Pages Poster PPT Prompt

Paste the prompt below into Claude PPT agent.

---

```
Create a vertical academic poster PPT (1 slide). Color: orange(#F97316) + white + dark navy(#1E293B). Modern sans-serif font. Image placeholders: rounded dashed gray boxes with "[이미지: 설명]" text only. All poster content MUST be in Korean.

## Layout

### 1. Title (top)
- Service name: buzzy pages
- Slogan: "혼자가 아닌 함께 읽는 독서 경험, AI가 연결하는 대화"
- Subtitle: 독서 기록 기반 AI 토론 커뮤니티
- Right side: [이미지: 대표 화면 목업]

### 2. Problem (3 cards, horizontal)
Header: "독서 모임, 이런 어려움 없었나요?"

| # | Title | Desc |
|---|---|---|
| 1 | 참여도 격차 | 읽는 속도가 달라 대화가 한쪽으로 치우침 |
| 2 | 토론 준비 부담 | 매번 주제를 준비하는 게 부담 |
| 3 | 기록이 남지 않는 독서 | 시간이 지나면 내용이 흩어짐 |

Icon placeholder on top of each card.

### 3. Solution (3 cards, horizontal)
Header: "buzzy pages가 해결합니다"

Card1 — 📚 함께 읽는 기록
- 페이지 기반 진행률 공유
- 구간 도달 시 메모 공개 (스포일러 방지)
- [이미지: 메모 화면]

Card2 — 🤖 AI 인사이트
- 메모 키워드 → 토론 주제 자동 추천
- 스레드 요약 / 개인 독서 회고
- [이미지: 인사이트 화면]

Card3 — 💬 스레드 토론
- 주제별 스레드 + 대댓글
- 종료 시 자동 인사이트 저장
- [이미지: 토론 화면]

### 4. AI Pipeline (flow diagram)
Header: "AI는 어떻게 동작하나요?"

Flow: 메모 수집 → 키워드 추출 → 주제 분석(Gemini) → 토론 주제 3개 생성 → 개인화 인사이트

Small text: Gemini 2.5 Flash / 공개 메모만 분석 / 토론 종료 시 자동 생성

### 5. Tech Stack
Header: "Tech Stack"

Left: [이미지: 아키텍처 다이어그램]

Right grid:
- Frontend: React 18, TypeScript, Vite, Zustand
- Backend: Node.js, Express, TypeScript
- DB: MySQL 8.0, Prisma ORM
- AI: Google Gemini API
- Auth: JWT (Access + Refresh)
- Deploy: AWS EC2, Nginx, PM2

Include tech logo icon placeholders.

### 6. Team & QR (bottom)
"Team 84 — 국민대학교 캡스톤디자인"

조연지(PM) / 양병규(AI) / 전석환(Infra) / 전윤주(풀스택) / 최연우(AI추천)

Right: [QR: github.com/kookmin-sw/2026-capstone-84]
```

---

## Placeholder Replacement Guide

| Placeholder | Replace with |
|---|---|
| 대표 화면 목업 | Figma main dashboard mockup |
| 메모 화면 | Memo page screenshot |
| 인사이트 화면 | AI insight card screenshot |
| 토론 화면 | Discussion thread screenshot |
| 아키텍처 다이어그램 | Architecture diagram (draw.io) |
| QR | GitHub repo URL QR code |

## Slogan Alternatives

1. "혼자가 아닌 함께 읽는 독서 경험, AI가 연결하는 대화"
2. "메모에서 시작되는 대화, AI가 만드는 인사이트"
3. "같은 책, 다른 생각 — AI가 이어주는 독서 토론"
