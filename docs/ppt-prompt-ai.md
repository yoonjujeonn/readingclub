---

```
Create a 10-slide presentation PPT. Theme: modern, clean, minimal with a bee(🐝) motif. Primary color: honey yellow(#F59E0B), accent: dark navy(#1E293B), background: white/light gray. Font: Pretendard. All content MUST be in Korean. Use image placeholders as rounded dashed gray boxes with "[이미지: 설명]" text.

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

Bottom: 핵심 질문 — "어떻게 하면 온라인 독서모임에서도 시공간의 제약 없이 깊이 있는 토론과 지속적인 참여를 만들 수 있을까?"

---

## Slide 3: 서비스 소개 + 사용자 흐름

Header: "buzzy pages — 서비스 개요"

Top section — 핵심 기능 4개 (아이콘 카드, 가로 배치):
- 📝 독서 메모: 읽으면서 자유롭게 기록
- � 스레드 대화: 주제별로 책에 대한 이야기를 나누는 공간
- 🤖 AI 인사이트: 토론 주제 자동 추천 + 대화 요약
- 🎫 발언권 시스템: 등급별 토큰으로 균형 잡힌 참여

Bottom section — User Flow (화살표 흐름도, 가로):
책 선택 → 모임 참여 → 메모 작성 → AI 주제 추천 → 스레드에서 이야기 → 인사이트 축적

---

## Slide 4: 핵심 기능 — 스레드 기반 대화

Header: "주제별 스레드로, 책에 대한 이야기를 나누다"

Left: [이미지: 스레드 토론 화면]

Right — 핵심 가치:
- ✅ 주제별 독립 스레드: 하나의 주제에 집중해서 이야기
- ✅ 대댓글 구조: 의견에 대한 의견을 이어가며 깊이 있는 대화
- ✅ 기간 설정 + 연장: 스레드별 마감 기한으로 집중도 유지
- ✅ 종료 시 AI 요약: 대화가 끝나면 핵심 내용 자동 정리·보존

Bottom quote: "흩어지는 채팅이 아닌, 축적되는 대화를 만듭니다"

---

## Slide 5: 핵심 기능 — 깊은 대화 + AI 인사이트 회고

Header: "대화는 깊어지고, 기록은 남습니다"

Left section — 스레드에서 깊은 대화:
- 💬 주제별 스레드에서 책에 대한 생각을 자유롭게 나눔
- 🤖 AI가 메모를 분석해 대화 주제 3개 자동 추천 → 대화 시작의 부담 제거
- � 유사 스레드 감지: 중복 주제 방지, 기존 대화에 합류 유도
- [이미지: 스레드 대화 + AI 주제 추천 화면]
- Caption: "AI가 대화를 시작하고, 스레드가 대화를 깊게 만듭니다"

Right section — AI 인사이트 회고 (독서 종료 후):
- 📋 스레드 종료 시 AI가 자동으로 인사이트 생성
- 요약 / 핵심 키워드 / 인상 깊은 포인트 / 한 줄 메시지 정리
- 마이페이지에서 모임별 회고 카드 열람
- 📷 인사이트 카드를 이미지로 저장 / 카카오톡·디스코드 공유
- [이미지: 인사이트 카드 화면 (다크 그라데이션 카드)]
- Caption: "휘발되는 대화가 아닌, 남는 독서 기록"

Bottom quote: "토론이 끝나도 기록은 사라지지 않습니다 — AI가 정리하고, 공유할 수 있는 카드로 남깁니다"

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
- Max 3 colors: #F59E0B (honey yellow), #1E293B (navy), #FFFFFF (white)
- Generous whitespace, no clutter
- Large text for key messages (min 24pt for body, 36pt+ for headers)
- Image placeholders: rounded corners, dashed gray border, "[이미지: 설명]" centered
- Icons: simple line icons or emoji
- No excessive animations or transitions
- Consistent layout grid across all slides
- Korean text throughout
```
