# Buzzy Pages 발표 PPT Prompt

아래 프롬프트를 Claude PPT 에이전트에 붙여넣기하세요.

---

```
Create a 10-slide presentation PPT. Theme: modern, clean, minimal. Primary color: orange(#F97316), accent: dark navy(#1E293B), background: white/light gray. Font: modern sans-serif (Pretendard or similar). All content MUST be in Korean. Use image placeholders as rounded dashed gray boxes with "[이미지: 설명]" text.

---

## Slide 1: 표지

- Title: "buzzy pages"
- Subtitle: "함께 읽고, 함께 기록하고, 함께 토론하는 AI 독서 모임 플랫폼"
- Bottom: Team 84 — 국민대학교 다학제간캡스톤디자인
- Team: 조연지(PM) / 양병규(FE) / 전석환(Infra) / 전윤주(풀스택) / 최연우(AI)
- Right side: [이미지: 메인 대시보드 화면 목업]

---

## Slide 2: 문제 정의 + 기존 방식의 한계

Header: "온라인 독서 모임, 왜 지속이 어려울까?"

Left section — Pain Points (icon + keyword cards):
| # | 문제 | 설명 |
|---|---|---|
| 1 | 참여도 격차 | 읽는 속도가 달라 대화가 한쪽으로 치우침 |
| 2 | 토론거리 부족 | 매번 주제를 준비하는 게 부담 |
| 3 | 기록 휘발 | 시간이 지나면 대화와 메모가 흩어짐 |
| 4 | 스포일러 | 진도 차이로 핵심 내용이 미리 노출됨 |

Right section — 기존 도구의 한계 (비교 표):
| 도구 | 한계 |
|---|---|
| 카카오톡 | 대화 흐름에 기록이 묻힘 |
| 노션 | 토론 구조 없음, 수동 관리 |
| 독서앱 | 개인 기록만, 모임 기능 없음 |

Bottom: 핵심 질문 — "어떻게 하면 온라인 독서모임에서도 깊이 있는 토론과 지속적인 참여를 만들 수 있을까?"

---

## Slide 3: 서비스 소개 + 사용자 흐름

Header: "buzzy pages — 서비스 개요"

Top section — 핵심 기능 4개 (아이콘 카드, 가로 배치):
- 📝 독서 메모: 읽으면서 자유롭게 기록
- 🔒 진도 기반 공개: 같은 구간 도달 시 메모 열람
- 🤖 AI 인사이트: 토론 주제 자동 추천
- 💬 스레드 토론: 주제별 구조화된 대화

Bottom section — User Flow (화살표 흐름도, 가로):
책 선택 → 모임 참여 → 메모 작성 → 진도 기반 열람 → AI 토론 추천 → 스레드 토론 참여

---

## Slide 4: 핵심 기능 — 진도 기반 메모 공개

Header: "같은 곳까지 읽은 사람끼리, 안전하게 공유"

Left: [이미지: 메모 작성 + 진도 설정 화면]

Right — 핵심 가치:
- ✅ 스포일러 완전 방지: 같은 구간 도달 전까지 메모 비공개
- ✅ 공감 형성: 같은 장면을 읽은 사람의 생각을 바로 확인
- ✅ 몰입 유지: 앞서 나간 사람의 내용에 방해받지 않음

Bottom quote: "진도가 같은 사람끼리 자연스럽게 대화가 시작됩니다"

---

## Slide 5: 핵심 기능 — AI 인사이트 + 스레드 토론

Header: "AI가 대화를 시작하고, 구조가 대화를 축적합니다"

Left section — AI 인사이트:
- 공개된 메모 분석 → 토론 주제 3개 자동 생성
- 키워드 요약 / 감정 분석 / 핵심 의견 정리
- [이미지: AI 인사이트 카드 화면]
- Caption: "토론거리 부족 문제 → AI가 해결"

Right section — 스레드 토론:
- 주제별 독립 스레드 + 대댓글
- 종료 기간 설정 → 자동 인사이트 저장
- 스레드 연장 기능
- [이미지: 스레드 토론 화면]
- Caption: "흩어지는 대화 → 축적되는 토론"

---

## Slide 6: 기술 설계

Header: "왜 이 기술을 선택했는가"

Left — 아키텍처 다이어그램:
[이미지: 아키텍처 다이어그램]
Flow: Client(React) → Nginx → Express API → PostgreSQL(RDS) / Amazon Bedrock(Claude)

Right — 기술 선택 근거 테이블:

| 해결 문제 | 기술 | 선택 근거 |
|---|---|---|
| AI 요약·토론 추천 | Amazon Bedrock (Claude) | 한국어 성능 우수, AWS 생태계 통합 |
| 데이터 저장 | AWS RDS (PostgreSQL) | 관계형 구조, Prisma ORM 연동 |
| 프론트엔드 | React + Vite + TypeScript | 빠른 빌드, SPA에 적합 |
| 백엔드 API | Express + TypeScript | 타입 안정성, 빠른 프로토타이핑 |
| 배포 | AWS EC2 + Nginx + PM2 | 비용 효율, 단일 서버 운영 |
| 인증 | JWT (Access + Refresh) | Stateless, 확장 용이 |

---

## Slide 7: 구현 완성도 + 데모

Header: "실제 동작하는 서비스"

Left — 구현 완료 체크리스트:
- ✅ 회원가입 / 로그인 (JWT)
- ✅ 독서 모임 생성 / 참여 / 초대
- ✅ 도서 검색 (알라딘 API)
- ✅ 독서 메모 CRUD + 진도 기반 공개
- ✅ AI 인사이트 생성 (Bedrock)
- ✅ 스레드 토론 + 대댓글
- ✅ 알림 시스템
- ✅ 마이페이지 / 대시보드
- ✅ AWS EC2 배포 완료

Right — 데모 시나리오:
1. 로그인 → 대시보드 확인
2. 모임 생성 + 책 선택
3. 메모 작성 → 진도 기반 공개 확인
4. AI 인사이트 생성 확인
5. 스레드 토론 참여

Bottom: 배포 URL — [이미지: QR코드 + URL]

---

## Slide 8: 실용성 + 기대 효과

Header: "실제 사용 가능한 서비스, 확장 가능한 구조"

Left — 실용성:
- 실제 독서 모임에서 바로 사용 가능
- 모바일 반응형 지원
- 직관적 UI/UX

Center — 확장 가능성:
- 다른 콘텐츠(영화, 강의, 논문) 모임으로 확장 가능
- AI Provider 패턴으로 모델 교체 용이
- 그룹 규모 확장에 유연한 구조

Right — 기대 효과 (큰 키워드):
- 📈 독서 참여 지속성 증가
- 💡 깊이 있는 토론 활성화
- 📚 기록 축적 → 독서 습관 형성

---

## Slide 9: 향후 발전 방향

Header: "Next Steps"

3개 카드 (가로 배치):
- 🎯 AI 개인화 추천: 사용자 독서 패턴 기반 맞춤 추천
- 📊 독서 통계/리포트: 월간 독서량, 토론 참여도 시각화
- 🤝 오프라인 연동: 오프라인 모임 일정 관리 + 온라인 기록 연결

---

## Slide 10: 마무리

Center (large text):
> "독서 기록을 넘어, 함께 읽는 경험을 만드는 플랫폼"

Service name: buzzy pages
Team 84 — 감사합니다

Bottom: Q&A

---

## Design Rules (apply to all slides):
- Max 3 colors: #F97316 (orange), #1E293B (navy), #FFFFFF (white)
- Generous whitespace, no clutter
- Large text for key messages (min 24pt for body, 36pt+ for headers)
- Image placeholders: rounded corners, dashed gray border, "[이미지: 설명]" centered
- Icons: simple line icons or emoji
- No excessive animations or transitions
- Consistent layout grid across all slides
- Korean text throughout
```

---

## 이미지 교체 가이드

| Placeholder | 교체할 이미지 |
|---|---|
| 메인 대시보드 화면 목업 | 실제 대시보드 스크린샷 |
| 메모 작성 + 진도 설정 화면 | 메모 페이지 스크린샷 |
| AI 인사이트 카드 화면 | 인사이트 생성 결과 스크린샷 |
| 스레드 토론 화면 | 토론 스레드 스크린샷 |
| 아키텍처 다이어그램 | draw.io 등으로 제작한 구조도 |
| QR코드 + URL | 배포 URL QR 코드 |

## 발표 시간 배분 (10분)

| 슬라이드 | 시간 | 비고 |
|---|---|---|
| 1. 표지 | 30초 | 서비스 한 줄 소개 |
| 2. 문제 정의 | 1분 | 공감 유도 |
| 3. 서비스 소개 | 1분 | 전체 구조 파악 |
| 4. 진도 기반 메모 | 1분 | 차별점 강조 |
| 5. AI + 토론 | 1분 30초 | 핵심 기능 |
| 6. 기술 설계 | 1분 30초 | 선택 근거 중심 |
| 7. 데모 | 2분 | 실제 시연 |
| 8. 실용성/기대효과 | 30초 | 간결하게 |
| 9. 향후 방향 | 20초 | 짧게 |
| 10. 마무리 | 10초 | 핵심 메시지 |

## 슬로건 대안

1. "함께 읽고, 함께 기록하고, 함께 토론하는 AI 독서 모임 플랫폼"
2. "메모에서 시작되는 대화, AI가 만드는 인사이트"
3. "같은 책, 다른 생각 — AI가 이어주는 독서 토론"
4. "독서 기록을 넘어, 함께 읽는 경험을 만드는 플랫폼"
