# Phase 3 선행 인프라 준비 상태 분석 보고서

> 분석일: 2026-04-30
> 대상: C:\workspace\as-cs-unified-platform
> 목적: Phase 3 "A/S 핵심 플로우" 구현을 위한 선행 인프라 준비도 평가

---

## 1. 핵심 의존성 설치 현황

### 1.1 package.json dependencies 분석

**현재 설치된 런타임 의존성 (3개만):**

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `react` | ^19.2.5 | UI 프레임워크 |
| `react-dom` | ^19.2.5 | DOM 렌더러 |
| `react-router-dom` | ^7.6.1 | 라우팅 |

### 1.2 Phase 3 필수 의존성 설치 여부

| 패키지 | 필요 여부 | 설치 상태 | 용도 | 비고 |
|--------|:---------:|:---------:|------|------|
| `axios` | **필수** | **미설치** | HTTP 클라이언트 + JWT interceptor + 401 auto-refresh | apiClient.ts의 기반 |
| `@tanstack/react-query` | **필수** | **미설치** | 서버 상태 관리, 30초 polling (refetchInterval), cache invalidation | 모든 데이터 페칭의 기반 |
| `zustand` | **필수** | **미설치** | 클라이언트 상태 (auth, UI), sessionStorage persist | authStore, uiStore |
| `recharts` | **필수** | **미설치** | 차트 4종 (Line, Bar, Pie, StackedBar) | StatisticsPage, DashboardPage |
| `dayjs` | **권장** | **미설치** | 날짜 포맷, 경과일, MoM 델타 계산 | KPI 카드, 리포트 기간 |
| `msw` | **필수(dev)** | **미설치** | API 모킹 (Spring 백엔드 미준비 대응) | devDependencies |

**결론: 6개 필수 패키지 모두 미설치. npm install 선행 필수.**

---

## 2. src/router.tsx 현재 상태

### 2.1 라우터 방식

```tsx
// router.tsx L1, L60
import { createBrowserRouter } from 'react-router-dom';
export const router = createBrowserRouter([...]);
```

| 항목 | 현재 | 필요 | 상태 |
|------|------|------|:----:|
| 라우터 유형 | `createBrowserRouter` | `createHashRouter` | **CRITICAL 미전환** |
| 인증 가드 | 없음 | `RequireAuth` 래퍼 | **미구현** |
| LoginPage 라우트 | 없음 | `{ path: '/login', element: <LoginPage /> }` | **미구현** |
| 동적 라우트 | `/4` (고정) | `/tickets/:ticketId` + `/tickets/new` | **미구현** |

### 2.2 DashboardPage import 방식

```tsx
// router.tsx L9 — named import (다른 16개는 default import)
import { DashboardPage } from '@/pages/DashboardPage';
```

**불일치**: DashboardPage만 `export function` (named export). 나머지 16개 페이지는 모두 `export default function`.

### 2.3 라우트 구조

- 17개 라우트가 `AppLayout` children으로 flat 배치
- 인증 래퍼 없이 모든 페이지 공개 접근 가능
- TicketDetailPage가 고정 경로 `/4` — 개별 티켓 ID 라우팅 불가

---

## 3. src/api/apiClient.ts — JWT interceptor 구현 여부

| 항목 | 상태 |
|------|:----:|
| 파일 존재 | **파일 없음** |
| `src/api/` 디렉토리 | **디렉토리 없음** |
| axios 인스턴스 | 미생성 |
| Request interceptor (Authorization 헤더) | 미구현 |
| Response interceptor (401 auto-refresh) | 미구현 |
| 토큰 in-memory 저장 | 미구현 |
| refresh subscriber queue | 미구현 |
| VITE_API_BASE_URL 활용 | .env에 정의만 됨 (`/api`), 코드에서 미참조 |

**결론: API 통신 레이어가 완전히 부재. Phase 3의 모든 데이터 페칭이 불가능한 상태.**

---

## 4. src/stores/authStore.ts — zustand persist 구현 여부

| 항목 | 상태 |
|------|:----:|
| 파일 존재 | **파일 없음** |
| `src/stores/` 디렉토리 | **디렉토리 없음** |
| zustand store | 미생성 |
| user / token 상태 | 미구현 |
| login / logout 액션 | 미구현 |
| sessionStorage persist | 미구현 |
| checkAuth (토큰 유효성) | 미구현 |

**결론: 인증 상태 관리가 완전히 부재. RBAC 기반 페이지 접근 제어, 사용자별 데이터 필터링이 불가능.**

---

## 5. MSW mock handlers 설정 상태

| 항목 | 상태 |
|------|:----:|
| `src/mocks/` 디렉토리 | **디렉토리 없음** |
| `src/mocks/handlers.ts` | **파일 없음** |
| `src/mocks/browser.ts` | **파일 없음** |
| `public/mockServiceWorker.js` | **파일 없음** (`npx msw init public` 미실행) |
| main.tsx MSW 연결 | **미연결** (MSW import/start 코드 없음) |
| .env `VITE_ENABLE_MSW=true` | 플래그만 존재, 실제 동작 안 함 |

**main.tsx 현재:**
```tsx
// MSW 관련 코드 전무
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

**결론: API 모킹 인프라가 완전히 부재. Spring 백엔드 없이 개발 불가.**

---

## 6. package.json 의존성 버전 상세

### 6.1 런타임 (dependencies) — 3개

```json
{
  "react": "^19.2.5",
  "react-dom": "^19.2.5",
  "react-router-dom": "^7.6.1"
}
```

### 6.2 개발 (devDependencies) — 13개

```json
{
  "@eslint/js": "^10.0.1",
  "@tailwindcss/vite": "^4.1.7",
  "@types/node": "^24.12.2",
  "@types/react": "^19.2.14",
  "@types/react-dom": "^19.2.3",
  "@vitejs/plugin-react": "^6.0.1",
  "concurrently": "^9.2.1",
  "electron": "^41.3.0",
  "electron-builder": "^26.8.1",
  "eslint": "^10.2.1",
  "eslint-plugin-react-hooks": "^7.1.1",
  "eslint-plugin-react-refresh": "^0.5.2",
  "globals": "^17.5.0",
  "tailwindcss": "^4.1.7",
  "typescript": "~6.0.2",
  "typescript-eslint": "^8.58.2",
  "vite": "^8.0.10",
  "wait-on": "^9.0.5"
}
```

### 6.3 스택 버전 호환성 판정

| 스택 | 버전 | 호환 리스크 |
|------|------|:----------:|
| TypeScript 6.0.2 | `erasableSyntaxOnly: true` — enum 사용 불가, union + `as const` 필수 | **LOW** (이미 대응 설계됨) |
| React 19.2.5 | 최신 안정 | **NONE** |
| Vite 8.0.10 | 최신 메이저 | **LOW** |
| Tailwind 4.1.7 | v4 — `@custom-variant desktop` 사용 중 | **NONE** (이미 적용됨) |
| Electron 41.3.0 | 최신 | **LOW** |

---

## 7. 추가 확인 항목

### 7.1 vite.config.ts

| 항목 | 현재 | 필요 |
|------|------|------|
| `base` | `'./'` (Electron file:// 대응) | 유지 |
| `server.proxy` | **미설정** | `/api` → Spring 서버 프록시 필요 |
| `server.port` | 5173 | 유지 |

### 7.2 App.tsx

| 항목 | 현재 | 필요 |
|------|------|------|
| QueryClientProvider | **없음** | `@tanstack/react-query` QueryClient 래핑 필수 |
| ReactQueryDevtools | **없음** | dev 모드에서 디버깅용 권장 |

### 7.3 현재 TypeScript 상태

```
tsc -b --noEmit → 에러 0건 (통과)
```

### 7.4 파일 구조 현황 (28개 파일)

```
src/
├── App.tsx                    (6L)   RouterProvider only
├── main.tsx                   (10L)  StrictMode + render
├── router.tsx                 (117L) createBrowserRouter + 17 routes
├── index.css                  (182L) Tailwind v4 + 520px 반응형
├── vite-env.d.ts              (1L)
│
├── types/
│   ├── index.ts               (35L)  UserRole, NavItem, NavGroup, PageMeta
│   └── electron.d.ts          (12L)  window.electronAPI
│
├── layouts/
│   └── AppLayout.tsx           (52L)  4-row Grid shell
│
├── components/
│   ├── Header.tsx              (95L)  breadcrumb + search (하드코딩)
│   ├── Sidebar.tsx             (170L) 17 NavLinks (하드코딩 뱃지)
│   ├── Titlebar.tsx            (31L)  커스텀 titlebar
│   └── Statusbar.tsx           (18L)  하단 상태바
│
└── pages/ (17 files, 모두 placeholder)
    ├── DashboardPage.tsx       (27L)  KPI 4 cards ('—'), named export
    └── 나머지 16개              (10L)  placeholder-card만

없는 디렉토리: api/ stores/ hooks/ mocks/ components/common/ components/guards/
```

---

## 8. 종합 판정: Phase 3 준비도

### 전체 점수: 12/100 (F — Phase 3 착수 불가)

| 영역 | 점수 | 판정 |
|------|:----:|:----:|
| 의존성 설치 | 0/20 | 6개 필수 패키지 모두 미설치 |
| API 클라이언트 | 0/20 | 파일/디렉토리 부재 |
| 인증 스토어 | 0/15 | 파일/디렉토리 부재 |
| MSW 모킹 | 0/15 | 파일/디렉토리 부재 |
| 라우터 (hashRouter) | 5/10 | 라우트 정의는 있으나 createBrowserRouter (Electron 비호환) |
| 타입 시스템 | 3/10 | UserRole만 존재, 도메인 타입 6종 부재 |
| 공통 컴포넌트 | 2/5 | 레이아웃 셸만 존재, 재사용 UI 부재 |
| 빌드 검증 | 2/5 | tsc 통과, Vite 빌드 성공 |

---

## 9. 선행 작업 목록 (Phase 3 착수 전 필수)

### MUST (미완료 시 Phase 3 착수 불가)

| # | 작업 | 산출물 | 예상 공수 |
|---|------|--------|:---------:|
| **P-1** | npm install 6종: `axios`, `@tanstack/react-query`, `zustand`, `recharts`, `dayjs`, `msw` (dev) | package.json 갱신 | 0.5h |
| **P-2** | `createBrowserRouter` → `createHashRouter` 전환 | router.tsx 수정 | 0.5h |
| **P-3** | `src/api/apiClient.ts` 생성 — axios 인스턴스 + JWT request/response interceptor + 401 auto-refresh + in-memory 토큰 | apiClient.ts | 2h |
| **P-4** | `src/stores/authStore.ts` 생성 — zustand + sessionStorage persist (user, token, login, logout, checkAuth) | authStore.ts | 1.5h |
| **P-5** | `App.tsx` → `QueryClientProvider` 래핑 (staleTime 30s, retry 1, refetchOnWindowFocus false) | App.tsx 수정 | 0.5h |
| **P-6** | `main.tsx` → MSW 조건부 활성화 (`VITE_ENABLE_MSW=true` → import('./mocks/browser').then(start)`) | main.tsx 수정 | 0.5h |
| **P-7** | `src/mocks/browser.ts` + `src/mocks/handlers.ts` 생성 — MSW setupWorker + 기본 핸들러 (auth 3종 + dashboard KPI) | 2 파일 | 2h |
| **P-8** | `npx msw init public` — mockServiceWorker.js 생성 | public/ | 0.1h |
| **P-9** | `vite.config.ts` → `server.proxy` 추가 (`/api → http://localhost:8080`) | vite.config.ts 수정 | 0.3h |
| **P-10** | 도메인 타입 6종 생성 — `src/types/{ticket,customer,product,shipment,costEntry,mailLog,auth,common}.ts` | 8 파일 | 2h |
| **P-11** | 인증 가드 생성 — `src/components/guards/{RequireAuth,Can}.tsx` | 2 파일 | 1h |
| **P-12** | LoginPage 생성 + router에 /login 라우트 추가 + RequireAuth 래핑 | 3 파일 수정 | 1.5h |
| **P-13** | 공통 UI 6종 — `src/components/common/{KpiCard,DataTable,StatusBadge,Button,Input,Pagination}.tsx` | 6 파일 | 3h |
| **P-14** | DashboardPage export 일관성 수정 (`export function` → `export default function`) | DashboardPage.tsx | 0.1h |

### SHOULD (Phase 3 품질 향상)

| # | 작업 | 산출물 | 예상 공수 |
|---|------|--------|:---------:|
| S-1 | `src/hooks/useDashboardKpi.ts` — react-query hook (refetchInterval 30s) | 1 파일 | 0.5h |
| S-2 | `src/hooks/useTickets.ts` — 티켓 CRUD hooks | 1 파일 | 1h |
| S-3 | Sidebar navGroups → `src/config/navigation.ts`로 분리 (router routesMeta 통합) | 1 파일 + 2 수정 | 1h |
| S-4 | TicketDetailPage 동적 라우트 (`/tickets/:ticketId`, `/tickets/new`) | router.tsx 수정 | 0.5h |

### 선행 작업 총 공수

| 카테고리 | 항목 수 | 예상 공수 |
|---------|:-------:|:---------:|
| MUST | 14 | **15.5h (~2 영업일)** |
| SHOULD | 4 | **3h** |
| **합계** | **18** | **18.5h (~2.5 영업일)** |

---

## 10. 선행 작업 의존성 그래프

```
P-1 (npm install)
 ├── P-2 (hashRouter)
 ├── P-3 (apiClient) ──── P-4 (authStore) ──── P-12 (LoginPage)
 │                                               └── P-11 (Guards)
 ├── P-5 (QueryClientProvider)
 ├── P-6 (main.tsx MSW) ─── P-7 (handlers) ─── P-8 (msw init)
 ├── P-9 (vite proxy)
 ├── P-10 (도메인 타입) ─── P-3, P-4, P-7 에서 import
 └── P-13 (공통 UI) ──── Phase 3 페이지 구현에서 사용

P-14 (DashboardPage export) ── 독립, 즉시 가능

Critical Path: P-1 → P-10 → P-3 → P-4 → P-11 → P-12 → Phase 3 착수
```

---

## 11. 현재 동작하는 것 vs 동작하지 않는 것

### 동작하는 것 (3건)

1. `tsc -b --noEmit` — TypeScript 컴파일 에러 0건
2. `npx vite build` — Vite 프로덕션 빌드 성공 (301KB JS, gzip 95KB)
3. 레이아웃 셸 — Sidebar + Header + Titlebar + Statusbar + 17개 placeholder 페이지 라우팅

### 동작하지 않는 것 (11건)

1. API 호출 — apiClient 부재 (axios 미설치)
2. 인증 — authStore 부재 (zustand 미설치)
3. 데이터 페칭 — react-query 미설치 (hooks 부재)
4. API 모킹 — MSW 미설치/미설정
5. 차트 — recharts 미설치
6. Electron prod 라우팅 — createBrowserRouter (file:// 비호환)
7. RBAC 가드 — RequireAuth/Can 부재
8. 로그인 — LoginPage 부재
9. KPI 데이터 바인딩 — DashboardPage 값 모두 '—'
10. 30초 자동 갱신 — polling 미구현
11. dev CORS 우회 — vite server.proxy 미설정
