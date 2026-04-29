# 상세 구현 계획서

> A/S & CS 통합 관리 플랫폼 — Phase 2~5 전체 구현

---

## 1. 기술 스택 및 아키텍처

### 1.1 현재 스택 (설치됨)

| 레이어 | 기술 | 버전 | 상태 |
|--------|------|:----:|:----:|
| 빌드 | Vite | 8.0.10 | ✅ |
| UI | React | 19.2.5 | ✅ |
| 타입 | TypeScript | 6.0.2 | ✅ |
| 스타일 | Tailwind CSS | 4.1.7 | ✅ |
| 라우팅 | react-router-dom | 7.6.1 | ✅ |
| 데스크톱 | Electron | 41.3.0 | ✅ |
| 빌드 도구 | electron-builder | 26.8.1 | ✅ |

### 1.2 추가 필요 스택 (미설치)

| 레이어 | 기술 | 용도 |
|--------|------|------|
| HTTP | **axios** | JWT 인터셉터, 401 자동 refresh, 에러 표준화 |
| 서버 상태 | **@tanstack/react-query** | API 캐싱, 자동 재조회, mutation invalidation |
| 클라이언트 상태 | **zustand** | 인증(user/token), UI(sidebar/toast) |
| 폼 | **react-hook-form** | 비제어 기반 폼, zod 연동 |
| 검증 | **zod** | API 응답 + 폼 입력 양쪽 검증 |
| 날짜 | **dayjs** | 경과일, 포맷, 영업일 계산 |
| 테스트 | **vitest + @testing-library/react** | 단위/통합 테스트 |

### 1.3 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Shell                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              React App (Vite)                         │   │
│  │                                                       │   │
│  │  ┌─────────┐  ┌──────────┐  ┌────────────────────┐  │   │
│  │  │ zustand  │  │  react-  │  │  React Components  │  │   │
│  │  │ auth/ui  │  │  query   │  │  (pages + common)  │  │   │
│  │  └────┬─────┘  └────┬─────┘  └────────────────────┘  │   │
│  │       │              │                                │   │
│  │       └──────┬───────┘                                │   │
│  │              │                                        │   │
│  │         ┌────▼────┐                                   │   │
│  │         │  axios   │ ← JWT interceptor                │   │
│  │         │  client  │ ← 401 auto-refresh               │   │
│  │         └────┬────┘                                   │   │
│  └──────────────┼────────────────────────────────────────┘   │
│                 │ HTTP/REST                                   │
│  IPC ──────── preload.cjs (safeStorage)                      │
└─────────────────┼────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Spring Boot API Server                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Controllers   │  │ Services     │  │ Event Listeners  │  │
│  │ (45+ endpoints│  │ (business    │  │ (auto-log,       │  │
│  │  REST)        │  │  logic)      │  │  auto-assign)    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────┘  │
│         │                  │                                 │
│         └──────────────────┘                                 │
│                  │                                           │
│         ┌───────▼────────┐                                  │
│         │  MySQL 8.0+    │ ← 기존 통합 DB, 스키마 추가만     │
│         │  (InnoDB)      │                                   │
│         └────────────────┘                                   │
└─────────────────────────────────────────────────────────────┘
```

### 1.4 핵심 아키텍처 결정

| 결정 | 선택 | 이유 |
|------|------|------|
| 라우터 | **createHashRouter** (Electron file:// 호환) | createBrowserRouter는 file:// 프로토콜에서 pushState 불가 |
| 상태관리 | **zustand + react-query** (NOT Redux) | 12명 사용자 규모. Redux 과도. Context 리렌더 이슈 |
| API 프록시 | **vite server.proxy** (dev) | CORS 우회. prod Electron은 hash router로 직접 호출 |
| 토큰 저장 | **인메모리 + zustand persist** | localStorage XSS 취약 → 인메모리 기본 + persist는 새로고침 대응 |
| enum | **union type + as const** | TS 6.x erasableSyntaxOnly 제약으로 enum 사용 불가 |

---

## 2. 페이지별 구현 순서 및 의존성

### 2.1 Sprint 구조 (6 Sprints, 9.5주)

```
Sprint 0 ──────── Sprint 1 ──────── Sprint 2 ────────
(Foundation)      (Ticket CRUD)     (Cost + Assign)
  1.5주             2주               1.5주
    │                 │                 │
    ▼                 ▼                 ▼
Sprint 3 ──────── Sprint 4 ──────── Sprint 5
(Logistics)       (Communication)   (Integration)
  1.5주             2주               1.5주
```

### 2.2 Sprint 0 — Foundation (1.5주)

**목표**: Phase 2 DoD 달성을 위한 전체 기반 인프라

| # | 태스크 | 산출물 | 시간 |
|---|--------|--------|:----:|
| 0-1 | npm install 6개 deps | package.json | 0.5h |
| 0-2 | .env.development / .env.production | 환경변수 | 0.5h |
| 0-3 | vite.config.ts server.proxy 추가 | CORS 우회 | 0.5h |
| 0-4 | **createHashRouter 전환** | Electron 호환 | 2h |
| 0-5 | router.tsx 리팩터링 (/login, /tickets/:id, /tickets/new) | 동적 라우트 | 2h |
| 0-6 | src/api/apiClient.ts (axios + interceptor) | HTTP 클라이언트 | 4h |
| 0-7 | src/stores/authStore.ts (zustand + persist) | 인증 상태 | 4h |
| 0-8 | src/stores/uiStore.ts (sidebar, toast) | UI 상태 | 2h |
| 0-9 | src/types/ 도메인 타입 6개 파일 | Ticket, Customer, Cost, Shipment, MailLog, Product | 4h |
| 0-10 | src/components/guards/ (RequireAuth + Can) | RBAC 가드 | 3h |
| 0-11 | LoginPage + AuthLayout + /login 라우트 | 로그인 | 4h |
| 0-12 | main.tsx QueryClientProvider + DevTools | react-query 설정 | 1h |
| 0-13 | 공통 UI 8종 (Button, Badge, Card, KpiCard, Table, Tabs, Modal, Toast) | 재사용 컴포넌트 | 12h |
| 0-14 | Electron IPC secure-store 핸들러 | 토큰 보안 저장 | 2h |
| 0-15 | Sidebar RBAC 필터 + navigation config 통합 | navGroups 단일 소스 | 2h |
| 0-16 | CustomerPage 구현 (검색 + 프로필 + 5탭) | Phase 2 DoD | 12h |
| 0-17 | MSW 목 핸들러 20 endpoints (고객 + 인증) | 백엔드 독립 | 4h |

**Exit**: 로그인 → 대시보드 → 고객 검색 → 5탭 표시 (Electron + 모바일 웹)

### 2.3 Sprint 1 — Ticket CRUD + Stepper (2주)

| # | 태스크 | 시간 | 의존 |
|---|--------|:----:|------|
| 1-1 | [Spring] as_tickets + as_ticket_events DDL | 4h | — |
| 1-2 | [Spring] TicketController CRUD + state machine | 12h | 1-1 |
| 1-3 | [Spring] Auto event logging | 4h | 1-1 |
| 1-4 | [Spring] /tickets/summary, /tickets/{id}/timeline | 4h | 1-2 |
| 1-5 | src/api/tickets.ts + hooks/useTickets.ts | 2h | 0-6 |
| 1-6 | MSW 목 핸들러 (티켓 15 endpoints) | 4h | — |
| 1-7 | Stepper + Timeline 공통 컴포넌트 | 6h | 0-13 |
| 1-8 | TicketListPage (ScopeToggle + KPI + Filter + Table) | 8h | 1-5 |
| 1-9 | TicketCreatePage (8필드 폼 + 고객 auto-lookup) | 6h | 1-5 |
| 1-10 | TicketDetailPage (header + stepper + 5탭 + 우측 패널) | 16h | 1-7 |
| 1-11 | ConsultationPage (KPI + 필터 + 테이블/타임라인 뷰 + SidePanel) | 8h | 1-5 |

**Exit**: 티켓 목록 → 생성 → 상세(6단계 스텝퍼) → 타임라인 이벤트 표시

### 2.4 Sprint 2 — Cost + Assignment (1.5주)

| # | 태스크 | 시간 | 의존 |
|---|--------|:----:|------|
| 2-1 | [Spring] as_cost_entries + approval workflow | 8h | 1-1 |
| 2-2 | [Spring] as_assignment_rules + round-robin | 8h | 1-1 |
| 2-3 | CostTrackingPage (KPI + 월별 + 승인 플로우) | 10h | 2-1 |
| 2-4 | CostEntryForm (3축 radio + 동적 카테고리) | 4h | 2-3 |
| 2-5 | TicketAssignPage (3-col: 큐 + 부하 + 설정) | 10h | 2-2 |
| 2-6 | AutoAssignBanner + CrewPoolPanel | 4h | 2-5 |
| 2-7 | MailLog 기본 발송 (SMS) — Phase 4 선행 | 4h | 0-6 |

**Exit**: 비용 3축 입력 → 승인 → 집계. 자동 배정 ON → 신규 티켓 자동 배정.

### 2.5 Sprint 3 — Logistics (1.5주)

| # | 태스크 | 시간 | 의존 |
|---|--------|:----:|------|
| 3-1 | [Spring] as_shipments + as_recalls + as_drivers | 4h | 1-1 |
| 3-2 | [Spring] Shipment/Recall CRUD + state machines | 8h | 3-1 |
| 3-3 | ShipmentPage (4탭 + 생성 + 추적 + CX 인계) | 8h | 3-2 |
| 3-4 | RecallPage (KPI + 4탭 + 기사 배정 + 수거 완료) | 8h | 3-2 |
| 3-5 | ExchangeReturnPage (접수 + 검수 + 3분기 + 교환 출고) | 12h | 3-2 |
| 3-6 | ProductRegistrationPage (검증 + 등록 + 쿠폰 + 블랙리스트) | 8h | — |
| 3-7 | TicketDetail step 5 탭 연동 (shipment + recall) | 2h | 3-3, 3-4 |

**Exit**: 출고 → CX 인계. 회수 → 미회수 필터. 교환/반품 → 재고 분기.

### 2.6 Sprint 4 — Communication + Reports (2주)

| # | 태스크 | 시간 | 의존 |
|---|--------|:----:|------|
| 4-1 | [Spring] as_mail_logs + MessageService + 3 adapters | 8h | — |
| 4-2 | [Spring] System auto-triggers (6 event listeners) | 4h | 4-1 |
| 4-3 | [Spring] AI suggestion proxy + as_ai_logs | 8h | — |
| 4-4 | [Spring] Statistics APIs (7 endpoints) + CSV export | 8h | — |
| 4-5 | MailLogPage (5탭 + 재발송 + 통계) | 6h | 4-1 |
| 4-6 | AiSupportPage (4 카드 + 이력 + KPI) | 6h | 4-3 |
| 4-7 | AiSuggestionPanel (TicketDetail 우측) | 6h | 4-3 |
| 4-8 | StatisticsPage (9 섹션 + 30초 자동 갱신) | 8h | 4-4 |
| 4-9 | ReportPage (생성 + 미리보기 + Excel/CSV 다운로드) | 6h | 4-4 |
| 4-10 | SettingsPage (4탭: 사용자/시스템/LLM/기본값) | 8h | — |

**Exit**: 이메일 발송 → MailLog 자동 기록. AI 제안 표시. 대시보드 라이브.

### 2.7 Sprint 5 — Integration + QA (1.5주)

| # | 태스크 | 시간 | 의존 |
|---|--------|:----:|------|
| 5-1 | Dashboard KPI API 연동 | 2h | 4-4 |
| 5-2 | Sidebar 동적 뱃지 (API 폴링) | 2h | — |
| 5-3 | TicketDetail step 6 종료 모달 + 고객 알림 | 2h | 4-1 |
| 5-4 | 반응형 QA (520px 전 페이지) | 6h | — |
| 5-5 | Electron 빌드 + 데스크톱 QA | 4h | — |
| 5-6 | 단위 테스트 (apiClient, authStore, permissions) | 4h | — |
| 5-7 | API 통합 테스트 (MSW: CRUD, 상태 전이, 권한) | 6h | — |
| 5-8 | E2E 테스트 (login → list → create → detail → close) | 6h | — |
| 5-9 | 버그 수정 + 폴리시 | 8h | — |

**Exit**: 전체 DoD 통과. Electron + 모바일 웹 양쪽 QA 완료.

---

## 3. API 엔드포인트 설계 및 DB 스키마

### 3.1 DB 스키마 — 신규 테이블 10개

```sql
-- 1. 핵심: 티켓 (가장 먼저 생성 — 모든 FK의 참조 대상)
CREATE TABLE as_tickets (
  ticket_id       BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ticket_no       VARCHAR(20) NOT NULL UNIQUE,
  customer_id     BIGINT UNSIGNED NOT NULL,
  customer_phone  VARCHAR(20) NOT NULL,
  product_model   VARCHAR(100) NOT NULL,
  serial_number   VARCHAR(100) NULL,
  symptom         TEXT NOT NULL,
  ticket_type     ENUM('REPAIR','EXCHANGE','RETURN') NOT NULL,
  priority        ENUM('NORMAL','URGENT','VIP') NOT NULL DEFAULT 'NORMAL',
  channel         ENUM('PHONE','KAKAO','EMAIL','SMS','VISIT') NOT NULL,
  status          ENUM('RECEIVED','ASSIGNED','IN_PROGRESS','COST_ENTERED',
                       'SHIPPING','CLOSED','CANCELLED','ON_HOLD') NOT NULL DEFAULT 'RECEIVED',
  previous_status VARCHAR(20) NULL,
  assignee_id     BIGINT UNSIGNED NULL,
  diagnosis_result TEXT NULL,
  resolution_plan VARCHAR(100) NULL,
  resolution_type VARCHAR(100) NULL,
  closure_summary TEXT NULL,
  notes           TEXT NULL,
  sla_percent     INT NOT NULL DEFAULT 0,
  created_by      BIGINT UNSIGNED NOT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  closed_at       DATETIME NULL,
  INDEX idx_ticket_status (status, created_at),
  INDEX idx_ticket_assignee (assignee_id, status),
  INDEX idx_ticket_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2~10: 이벤트, 비용, 출고, 회수, 교환반품, 기사, 배정규칙, 배정풀, 설정
-- (각 DDL은 기존 설계 문서 참조: backend-api-and-schema.json, as-operations-milestone-spec.json)
```

### 3.2 API 엔드포인트 전체 목록 — 70+ endpoints

| 도메인 | 경로 패턴 | 수 | Phase |
|--------|----------|:---:|:-----:|
| Auth | /api/auth/* | 4 | 2 |
| Customers | /api/customers/* | 9 | 2 |
| Tickets | /api/tickets/* | 16 | 3 |
| Events | /api/tickets/{id}/events, /timeline | 3 | 3 |
| Costs | /api/tickets/{id}/costs, /api/costs/* | 6 | 3 |
| Assignments | /api/assignment-rules, /assignees/* | 4 | 3 |
| Consultations | /api/consults/* | 6 | 3 |
| Shipments | /api/shipments/* | 5 | 4 |
| Recalls | /api/recalls/*, /api/drivers/* | 7 | 4 |
| Exchange/Return | /api/exchanges/* | 8 | 4 |
| Registrations | /api/registrations/*, /serials/*, /coupons/* | 9 | 4 |
| Mail | /api/messages/send, /api/mail-logs/* | 8 | 5 |
| AI | /api/ai/* | 4 | 5 |
| Statistics | /api/stats/*, /api/reports/* | 7 | 5 |
| Settings | /api/settings/*, /api/users/* | 6 | 5 |
| **합계** | | **~102** | |

---

## 4. 컴포넌트 구조 및 상태 관리 전략

### 4.1 디렉토리 구조 (목표)

```
src/
├── api/                    # axios 서비스 모듈 (도메인별)
│   ├── apiClient.ts        # axios 인스턴스 + interceptor
│   ├── tickets.ts          # ticket CRUD
│   ├── customers.ts        # customer lookup
│   ├── costs.ts            # cost 3-axis
│   ├── shipments.ts        # shipment CRUD
│   ├── recalls.ts          # recall CRUD
│   └── ...
├── stores/                 # zustand (클라이언트 상태만)
│   ├── authStore.ts        # user, token, login/logout
│   └── uiStore.ts          # sidebar, toast, confirm
├── hooks/queries/          # react-query hooks
│   ├── useTickets.ts       # useTicketList, useTicketDetail
│   ├── useCustomers.ts     # useCustomerByPhone
│   └── ...
├── types/                  # TypeScript 타입 (도메인별)
│   ├── ticket.ts
│   ├── customer.ts
│   └── ...
├── components/
│   ├── common/             # 재사용 UI (14종)
│   ├── guards/             # RequireAuth, Can
│   └── layout/             # Header, Sidebar, Titlebar, Statusbar
├── layouts/                # AppLayout, AuthLayout
├── pages/                  # 17 페이지 (lazy-loaded)
├── config/                 # navigation.ts (navGroups + routesMeta 통합)
└── router.tsx              # createHashRouter
```

### 4.2 상태 관리 전략

```
┌────────────────────────────────────────────────┐
│                  State Layers                   │
├────────────────┬───────────────────────────────┤
│  zustand       │  authStore: user, token       │
│  (client only) │  uiStore: sidebar, toast      │
├────────────────┼───────────────────────────────┤
│  react-query   │  ALL server data              │
│  (server state)│  tickets, customers, costs,   │
│                │  shipments, recalls, etc.      │
│                │  staleTime: 30s default        │
│                │  refetchInterval: 30s (KPI)    │
├────────────────┼───────────────────────────────┤
│  URL params    │  navigation state             │
│  (searchParams)│  ?phone=, ?status=, etc.      │
├────────────────┼───────────────────────────────┤
│  component     │  form state (react-hook-form)  │
│  local state   │  tab active, modal open       │
└────────────────┴───────────────────────────────┘
```

---

## 5. 테스트 전략

### 5.1 단위 테스트 (vitest)

| 대상 | 테스트 수 | 내용 |
|------|:---:|------|
| apiClient interceptor | 6 | 토큰 주입, 401 refresh, 에러 파싱 |
| authStore | 8 | login/logout/checkAuth, hasPermission, hasRole |
| Can/RequireAuth | 6 | 역할별 렌더/숨김/리다이렉트 |
| 도메인 타입 | 4 | 타입 컴파일 + label 상수 검증 |
| **합계** | **~24** | |

### 5.2 API 통합 테스트 (vitest + MSW)

| 대상 | 테스트 수 | 내용 |
|------|:---:|------|
| Ticket CRUD | 8 | 생성/조회/수정/목록/KPI |
| 상태 전이 | 9 | 12개 전이 중 핵심 + 가드 실패 |
| RBAC | 6 | 401/403 역할별 |
| 비용 승인 | 6 | 3축 + approve/reject + summary |
| 출고/회수 | 6 | 상태 전이 + CX handover |
| **합계** | **~35** | |

### 5.3 E2E 테스트 (Playwright)

| 시나리오 | 우선순위 | 내용 |
|---------|:---:|------|
| Login → Dashboard → Ticket List | P0 | 인증 + 라우팅 + 목록 |
| Ticket Create → Detail → Close | P0 | 전체 E2E 플로우 |
| Cost Entry → Approval | P1 | 3축 + 승인 워크플로 |
| Shipment → CX Handover | P1 | 출고 + CX 인계 |
| RBAC Access Control | P0 | 4역할별 접근 제어 |
| **합계** | **6** | |

---

## 6. 예상 구현 일정 및 리스크

### 6.1 일정 요약

| Sprint | 기간 | 핵심 산출물 | Phase |
|:------:|:----:|-----------|:-----:|
| 0 | 1.5주 | 기반 인프라 + 로그인 + 고객 조회 | 2 |
| 1 | 2주 | 티켓 CRUD + 스텝퍼 + 타임라인 + 상담 | 3 |
| 2 | 1.5주 | 비용 3축 + 자동 배정 + MailLog 기본 | 3 |
| 3 | 1.5주 | 출고 + 회수 + 교환반품 + 정품등록 | 4 |
| 4 | 2주 | 메일로그 + AI + 통계 + 리포트 + 설정 | 5 |
| 5 | 1.5주 | 통합 + 반응형 QA + Electron + 테스트 | 전체 |
| **합계** | **~10주** | | |

### 6.2 리스크 매트릭스

| 리스크 | 확률 | 영향 | 완화 |
|--------|:---:|:---:|------|
| Spring 백엔드 미준비 | HIGH | Sprint 1~4 차단 | MSW 목 핸들러 (8h) |
| 재고 시스템 API 미확인 | HIGH | DoD-4 불확실 | Spring 팀 확인 + Mock |
| TS 6 + 라이브러리 호환 | MEDIUM | Sprint 0 지연 | 설치 즉시 tsc 검증 |
| Electron file:// + 라우터 | CERTAIN | 라우팅 실패 | **createHashRouter** (결정됨) |
| CORS Electron → Spring | HIGH | API 차단 | Spring CORS origin 'null' 허용 |
| MailLog Phase 불일치 | MEDIUM | CLAUDE.md 위반 | Sprint 2에서 기본 발송 선행 |
| 설계 vs 코드 극심한 갭 | CERTAIN | 변환 지연 | 설계=참조, 코드=실용 우선 |

### 6.3 핵심 마일스톤

```
Week 0-1.5:  Sprint 0 완료 → Phase 2 DoD 달성 ★
Week 1.5-3.5: Sprint 1 완료 → 티켓 E2E 동작
Week 3.5-5:  Sprint 2 완료 → Phase 3 DoD 달성 ★
Week 5-6.5:  Sprint 3 완료 → Phase 4 DoD 달성 ★
Week 6.5-8.5: Sprint 4 완료 → Phase 5 DoD 달성 ★
Week 8.5-10: Sprint 5 완료 → 전체 QA + E2E 통과
```

### 6.4 Critical Path

```
npm install (0-1) → apiClient (0-6) → authStore (0-7) → LoginPage (0-11)
→ CustomerPage (0-16) → [Phase 2 DoD]
→ as_tickets DDL (1-1) → TicketController (1-2) → TicketListPage (1-8)
→ TicketDetailPage (1-10) → CostEntryForm (2-4) → [Phase 3 DoD]
→ ShipmentPage (3-3) → RecallPage (3-4) → ExchangeReturnPage (3-5)
→ [Phase 4 DoD]
→ MailLogPage (4-5) → AiSuggestionPanel (4-7) → [Phase 5 DoD]
→ E2E Tests (5-8) → [전체 완료]
```
