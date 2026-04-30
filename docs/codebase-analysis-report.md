# 프로젝트 로컬 코드베이스 분석 보고서

> 분석일: 2026-04-30
> 대상: C:\workspace\as-cs-unified-platform

---

## 1. ReportPage, StatisticsPage, DashboardPage 현재 구현 상태

### 1.1 DashboardPage (`src/pages/DashboardPage.tsx`, 27줄)

| 항목 | 상태 |
|------|------|
| 내보내기 방식 | `export function` (named export) — 다른 모든 페이지는 `export default function` |
| API 연동 | **없음** — 데이터 없이 하드코딩된 `'—'` 값만 표시 |
| KPI 카드 | 4장 구현됨 (접수 대기 / 진행중 / 금일 완료 / SLA 초과). 정적 value `'—'` |
| 반응형 | `grid-cols-2 desktop:grid-cols-4` 적용 — 520px 기준 작동 |
| 실시간 갱신 | 미구현 (설계: 30초 polling via react-query refetchInterval) |
| 하단 영역 | `placeholder-card` 1개 ("API 연동 후 실시간 데이터가 표시됩니다") |
| 차트 | 없음 |
| 최근 티켓 목록 | 없음 |
| 액션 큐 | 없음 |

**구현 완성도: ~15%** — KPI 카드 골격만 존재. 데이터 바인딩, 차트, 최근 티켓, 액션 큐 모두 미구현.

### 1.2 StatisticsPage (`src/pages/StatisticsPage.tsx`, 10줄)

| 항목 | 상태 |
|------|------|
| 내보내기 | `export default function` |
| 전체 내용 | placeholder-card 1개 ("Phase 3 에서 구현 예정") |
| KPI | 없음 |
| 차트 | 없음 |
| 담당자 성과 | 없음 |
| SLA 준수율 | 없음 |
| 액션 큐 | 없음 |
| 비용 월별 추이 | 없음 |

**구현 완성도: 0%** — 순수 placeholder. 설계 문서(statistics-report-csv-design.json)에서 9개 섹션이 정의되어 있으나 코드 반영 전무.

### 1.3 ReportPage (`src/pages/ReportPage.tsx`, 10줄)

| 항목 | 상태 |
|------|------|
| 내보내기 | `export default function` |
| 전체 내용 | placeholder-card 1개 ("리포트 모듈은 아직 설계 중입니다") |
| 리포트 생성 | 없음 |
| 미리보기 | 없음 |
| CSV/Excel 다운로드 | 없음 |
| 기간 필터 | 없음 |
| 리포트 유형 선택 | 없음 |

**구현 완성도: 0%** — 순수 placeholder. 설계 문서에서 4가지 리포트 유형(월간/분기/본사보상/커스텀)이 정의되어 있으나 코드 반영 전무.

---

## 2. API 연동 구조 및 데이터 페칭 방식

### 2.1 현재 설치된 의존성 (package.json)

| 패키지 | 용도 | 설치 여부 |
|--------|------|:---------:|
| `react-router-dom` 7.6.1 | 라우팅 | **설치됨** |
| `axios` | HTTP 클라이언트 | **미설치** |
| `@tanstack/react-query` | 서버 상태 관리 | **미설치** |
| `zustand` | 클라이언트 상태 | **미설치** |
| `msw` | API 모킹 | **미설치** |

### 2.2 API 클라이언트 (src/api/)

**디렉토리 자체가 존재하지 않음.** apiClient.ts, 도메인별 서비스 모듈 모두 부재.

### 2.3 상태 관리 (src/stores/)

**디렉토리 자체가 존재하지 않음.** authStore, uiStore 모두 부재.

### 2.4 데이터 페칭 Hooks (src/hooks/)

**디렉토리 자체가 존재하지 않음.** useCustomers, useTickets, useDashboard 모두 부재.

### 2.5 MSW 모킹 (src/mocks/)

**디렉토리 자체가 존재하지 않음.** handlers.ts, browser.ts 모두 부재.

### 2.6 실시간 갱신 주기

- 소스 코드에서 `refetchInterval`, `useQuery`, `useMutation`, `react-query`, `tanstack` 키워드 **전부 매칭 0건**
- 현재 어떠한 자동 갱신도 구현되어 있지 않음
- 설계 문서에서의 정의:
  - DashboardPage: 30초 polling
  - StatisticsPage: 30초 polling (react-query refetchInterval)
  - Sidebar 뱃지: API 폴링 (주기 미확정)

### 2.7 환경 변수

```
# .env (존재)
VITE_API_BASE_URL=/api
VITE_ENABLE_MSW=true
```

MSW 활성화 플래그가 있으나, MSW가 미설치이고 main.tsx에서 참조하지 않으므로 사실상 미사용.

---

## 3. 엑셀 다운로드 관련 라이브러리/로직

### 3.1 설치된 라이브러리

| 패키지 | 설치 여부 |
|--------|:---------:|
| `xlsx` (SheetJS) | **미설치** |
| `exceljs` | **미설치** |
| `file-saver` | **미설치** |

### 3.2 코드 내 관련 로직

- `src/` 전체에서 `xlsx`, `exceljs`, `sheetjs`, `csv`, `download`, `export` 키워드 매칭: **소스코드 내 0건** (export는 JS 모듈 export 구문만 매칭)
- 다운로드 트리거, Blob 생성, CSV 변환 로직 등 전무

### 3.3 설계 문서의 정의

- `statistics-report-csv-design.json`에서 5가지 CSV 타입 정의:
  - TICKET_LIST, COST_DETAIL, COMPENSATION_CLAIM, MAIL_LOG, MONTHLY_SUMMARY
- 서버 측 StreamingResponseBody + UTF-8 BOM 방식 설계됨
- SXSSFWorkbook(Apache POI) XLSX 패턴 설계됨
- **프론트엔드에는 서버 응답 blob을 다운로드하는 코드만 필요**하나 현재 미구현

---

## 4. 차트 시각화 라이브러리 사용 현황

### 4.1 설치된 라이브러리

| 패키지 | 설치 여부 |
|--------|:---------:|
| `recharts` | **미설치** |
| `chart.js` | **미설치** |
| `@nivo/*` | **미설치** |
| `victory` | **미설치** |
| `apexcharts` | **미설치** |
| `d3` | **미설치** |

### 4.2 코드 내 관련 로직

- 소스 코드에서 chart 관련 import 또는 사용: **0건**
- Canvas, SVG 기반 시각화 컴포넌트: **0건**

### 4.3 설계 문서의 차트 사양

| 차트 유형 | 페이지 | 라이브러리(설계) | 데이터 소스 |
|----------|--------|:---------------:|------------|
| LineChart | 통계 #14 | Recharts | GET /api/stats/trend?months=6 |
| HorizontalBarChart | 통계 #14 | Recharts | GET /api/stats/product-frequency |
| DonutChart | 통계 #14 | Recharts | GET /api/stats/symptom-distribution |
| StackedBarChart | 통계 #14 | Recharts | GET /api/stats/cost-trend |

- 설계에서 **Recharts** 사용이 명시되어 있으나 미설치

---

## 5. 모바일 반응형 CSS 설정 (520px 이하 대응)

### 5.1 브레이크포인트 정의

```css
/* index.css L124-128 */
@custom-variant desktop {
  @media (min-width: 521px) {
    @slot;
  }
}
```

- Tailwind v4 `@custom-variant` 사용: `desktop:` 접두사로 521px 이상 스타일 적용
- **기본이 모바일(<=520px)**, 데스크톱이 확장 — **Mobile-first 방식**

### 5.2 레이아웃 그리드 반응형

| 요소 | 모바일 (<=520px) | 데스크톱 (>520px) |
|------|-----------------|------------------|
| app-shell | 1열 (1fr) | 2열 (sidebar 240px + 1fr) |
| Sidebar | fixed overlay + transform | static grid (row 2-3, col 1) |
| Header 햄버거 | 표시 (desktop:hidden) | 숨김 |
| 검색바 | 숨김 (hidden desktop:block) | 표시 |
| Titlebar 텍스트 | 축소 (v0.2.0만) | 풀 타이틀 |
| Statusbar | 핵심 정보만 | 모든 정보 |
| DashboardPage KPI | 2열 (grid-cols-2) | 4열 (desktop:grid-cols-4) |

### 5.3 모바일 유틸리티

```css
.mobile-only { display: block; }
@media (min-width: 521px) { .mobile-only { display: none !important; } }
```

### 5.4 페이지별 반응형 현황

| 페이지 | 반응형 구현 | 비고 |
|--------|:----------:|------|
| DashboardPage | **부분** | KPI grid-cols-2/4 적용. 나머지 미구현 |
| 나머지 16개 | **없음** | 모두 placeholder-card만 표시 (반응형 불필요) |

---

## 6. Electron 빌드 설정 및 현재 빌드 상태

### 6.1 Electron 주요 설정

| 파일 | 내용 |
|------|------|
| `electron/main.cjs` (84줄) | BrowserWindow(1440x900, min 1024x680) + 커스텀 titlebar + IPC get-version |
| `electron/preload.cjs` (20줄) | contextBridge: getVersion, platform |
| `electron-builder.yml` (49줄) | Win(NSIS x64) + Mac(DMG x64/arm64) + Linux(AppImage x64) |

### 6.2 핵심 문제: createBrowserRouter

```tsx
// router.tsx L60
export const router = createBrowserRouter([...]);
```

**CRITICAL:** `createBrowserRouter` 사용 중. Electron prod 빌드에서 `file://` 프로토콜은 History API pushState를 지원하지 않으므로, `createHashRouter`로 전환이 필수. (설계에서 이미 결정되었으나 코드 미반영)

### 6.3 인증 가드 미적용

- router에 `RequireAuth` 등 인증 래퍼 없음
- 모든 페이지가 공개 접근 가능 (로그인 우회)
- LoginPage 자체도 존재하지 않음

### 6.4 Vite 빌드 상태

```
✓ built in 374ms
dist/index.html                   0.50 kB
dist/assets/index-DnGgJyD5.css  27.98 kB │ gzip:  6.19 kB
dist/assets/index-DG12Cxvm.js  301.40 kB │ gzip: 94.81 kB
```

- **TypeScript 에러 0건** — `tsc -b --noEmit` 통과
- **Vite 프로덕션 빌드 성공** — 47 modules, 374ms
- JS 번들 301KB (gzip 95KB) — react + react-router-dom 포함
- **Electron 빌드 (`electron-builder`)는 미검증** — `npm run build` 스크립트에서 `electron-builder --config electron-builder.yml` 포함되나 실행 미확인

### 6.5 vite.config.ts 특이사항

- `base: './'` — Electron file:// 상대 경로 대응 적용됨
- `server.proxy` 미설정 — Spring API CORS 우회 없음
- `define: { VITE_DEV_SERVER_URL: ... }` — 사용처 없음

---

## 7. 각 페이지의 미완성 부분, 에러 로그, TODO 마크

### 7.1 TODO/FIXME 마크

소스 코드 전체에서 `TODO`, `FIXME`, `HACK`, `XXX`, `TEMP` 키워드 검색 결과: **0건**

### 7.2 Placeholder 페이지 현황 (17개 중 17개가 placeholder)

| 페이지 | placeholder 메시지 | Phase |
|--------|--------------------|:-----:|
| DashboardPage | "API 연동 후 실시간 데이터가 표시됩니다" | 2 |
| CustomerPage | "Phase 3 에서 구현 예정" | 2 |
| ConsultationPage | "Phase 3 에서 구현 예정" | 3 |
| TicketListPage | "Phase 3 에서 구현 예정" | 3 |
| TicketDetailPage | "Phase 3 에서 구현 예정" | 3 |
| CostTrackingPage | "Phase 3 에서 구현 예정" | 3 |
| TicketAssignPage | "Phase 3 에서 구현 예정" | 3 |
| StatisticsPage | "Phase 3 에서 구현 예정" | 3 |
| SettingsPage | "Phase 3 에서 구현 예정" | 3 |
| ShipmentPage | "Phase 4 에서 구현 예정" | 4 |
| RecallPage | "Phase 4 에서 구현 예정" | 4 |
| ExchangeReturnPage | "Phase 4 에서 구현 예정" | 4 |
| ProductRegistrationPage | "Phase 4 에서 구현 예정" | 4 |
| ZendeskPage | "Phase 5 에서 구현 예정" | 5 |
| MailLogPage | "Phase 5 에서 구현 예정" | 5 |
| AiSupportPage | "Phase 5 에서 구현 예정" | 5 |
| ReportPage | "리포트 모듈은 아직 설계 중입니다" | 3 |

### 7.3 코드 불일치 / 잠재 이슈

| # | 이슈 | 심각도 |
|---|------|:------:|
| 1 | **createBrowserRouter** 사용 중 — Electron prod 빌드 라우팅 실패 | CRITICAL |
| 2 | **DashboardPage export 불일치** — named export vs 다른 16개 default export | LOW |
| 3 | **Sidebar navGroups ↔ router routesMeta 데이터 중복** — 동기화 실패 가능 | MEDIUM |
| 4 | **TicketDetailPage 고정 경로 `/4`** — 동적 라우트 `/tickets/:ticketId` 미구현 | HIGH |
| 5 | **인증 가드 부재** — 모든 페이지 공개 접근 | HIGH |
| 6 | **API 인프라 전무** — axios, react-query, zustand, MSW 모두 미설치 | HIGH |
| 7 | **Sidebar 뱃지 하드코딩** — `42`, `82`, `12`, `14`, `5` 등 정적 값 | MEDIUM |
| 8 | **Header 사용자 정보 하드코딩** — "관리자 / 총괄" 정적 표시 | MEDIUM |
| 9 | **vite.config.ts에 server.proxy 미설정** — dev 모드 CORS 우회 불가 | MEDIUM |

### 7.4 에러/경고

- TypeScript: **0 error, 0 warning**
- Vite build: **성공**
- ESLint: 미실행 (eslint 설정은 존재)

---

## 8. 기존 KPI 위젯 구조 및 모의 데이터 현황

### 8.1 DashboardPage KPI 위젯 구조

```tsx
// DashboardPage.tsx L10-22
<div className="mt-5 grid grid-cols-2 gap-3 desktop:grid-cols-4">
  {([
    { label: '접수 대기', value: '—', accent: 'border-t-amber-400', color: 'text-amber-500' },
    { label: '진행중',    value: '—', accent: 'border-t-blue-500',  color: 'text-blue-600' },
    { label: '금일 완료', value: '—', accent: 'border-t-green-500', color: 'text-green-600' },
    { label: 'SLA 초과',  value: '—', accent: 'border-t-red-500',   color: 'text-red-500' },
  ] as const).map((kpi) => (
    <div key={kpi.label} className={`rounded-[10px] border border-t-[3px] bg-white p-3.5 ${kpi.accent}`}>
      <div className="text-[11px] text-secondary">{kpi.label}</div>
      <div className={`text-2xl font-extrabold ${kpi.color}`}>{kpi.value}</div>
    </div>
  ))}
</div>
```

**KPI 카드 스타일 패턴:**
- `rounded-[10px]` + `border` + `border-t-[3px]` 컬러 악센트
- 레이블: 11px, secondary color
- 값: 2xl, extrabold, 색상별 분리
- 4개 카드 inline 배열 → `.map()` 렌더링

### 8.2 모의 데이터 현황

| 위치 | 데이터 | 상태 |
|------|--------|------|
| DashboardPage KPI | `value: '—'` (em dash) | **전부 빈 값** |
| Sidebar 뱃지 | 상담 42, 티켓 82, 출고 12, 회수 14, 배분 5 | **하드코딩** |
| Header 사용자 | "관리자 / 총괄" | **하드코딩** |
| Statusbar | "🟢 API", "● Live", "v0.2.0" | **하드코딩** |
| Sidebar footer | "Spring API ●", "AI 서포트 ●", "자동 배정 ON" | **하드코딩** |

- **MSW mock handlers**: 미생성 (src/mocks/ 디렉토리 부재)
- **설계 문서의 모의 데이터**: docs/statistics-report-csv-design.json에 value_example이 정의됨
  - totalTickets: 247, completionRate: 84.4%, avgResolutionDays: 3.2일, totalCostNet: -890K
  - 이 값들은 아직 코드에 반영되지 않음

### 8.3 설계 vs 현재 코드 갭 (Statistics/Report 관련)

| 설계 항목 | 현재 코드 | 갭 |
|----------|----------|:---:|
| KPI 4카드 + MoM 델타 | KPI 4카드(빈 값), 델타 없음 | 70% |
| 트렌드 LineChart | 없음 | 100% |
| 제품별 빈도 BarChart | 없음 | 100% |
| 증상 분포 DonutChart | 없음 | 100% |
| 비용 추이 StackedBarChart | 없음 | 100% |
| 액션 큐 (8 패턴) | 없음 | 100% |
| SLA 준수율 | 없음 | 100% |
| 담당자 성과 테이블 | 없음 | 100% |
| 발송 통계 | 없음 | 100% |
| 리포트 4유형 생성 | 없음 | 100% |
| CSV/Excel 다운로드 | 없음 | 100% |
| 30초 자동 갱신 | 없음 | 100% |

---

## 요약: 전체 파일 인벤토리

```
src/ (28 files)
├── App.tsx                    (6L)   — RouterProvider only, QueryClient 없음
├── main.tsx                   (10L)  — StrictMode + render, MSW 미연결
├── router.tsx                 (117L) — createBrowserRouter(!) + 17 routes + routesMeta
├── index.css                  (182L) — Tailwind v4 + 520px 반응형 + 커스텀 변수
├── vite-env.d.ts              (1L)
│
├── types/
│   ├── index.ts               (35L)  — UserRole, NavItem, NavGroup, PageMeta
│   └── electron.d.ts          (12L)  — window.electronAPI
│
├── layouts/
│   └── AppLayout.tsx           (52L)  — 4-row Grid shell + sidebarOpen state
│
├── components/
│   ├── Header.tsx              (95L)  — breadcrumb + search + user (하드코딩)
│   ├── Sidebar.tsx             (170L) — 6 groups, 17 NavLinks (하드코딩 뱃지)
│   ├── Titlebar.tsx            (31L)  — 커스텀 titlebar
│   └── Statusbar.tsx           (18L)  — 하단 상태바
│
└── pages/ (17 files, 모두 placeholder)
    ├── DashboardPage.tsx       (27L)  — KPI 4 cards ('—'), named export
    └── 나머지 16개              (10L)  — placeholder-card만

없는 디렉토리: api/, stores/, hooks/, mocks/, components/common/, components/guards/
없는 핵심 파일: apiClient, authStore, LoginPage, 도메인 타입 6종, 공통 UI 8종, MSW handlers
```

**결론**: 프로젝트는 **레이아웃 셸(Grid + Sidebar + Header + Statusbar) + 17개 placeholder 페이지** 단계에 있다. API 인프라(axios/react-query/zustand/MSW), 인증(JWT/RBAC), 도메인 타입, 공통 UI 컴포넌트, 차트/엑셀 라이브러리가 모두 부재하며, DashboardPage의 KPI 카드 골격만이 유일한 실질 UI이다. createBrowserRouter → createHashRouter 전환이 가장 시급한 기술 이슈이다.
