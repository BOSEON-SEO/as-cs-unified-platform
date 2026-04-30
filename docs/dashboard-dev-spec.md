# DashboardPage 상세 구현 요구사항

> 개발자용 -- 이 문서만으로 파일 생성 및 코드 작성이 가능해야 한다.
> TS 제약: `erasableSyntaxOnly: true` (enum 금지), `verbatimModuleSyntax: true` (`import type` 필수), `noUncheckedIndexedAccess: true`
> 반응형: `@custom-variant desktop { @media (min-width: 521px) }` -- Tailwind v4, `desktop:` 접두사

---

## 0. 생성할 파일 목록 (순서대로)

| # | 파일 경로 | 역할 | 신규 |
|---|----------|------|:----:|
| 1 | `src/api/apiClient.ts` | axios 인스턴스 | Y |
| 2 | `src/types/dashboard.ts` | 대시보드 전용 타입 | Y |
| 3 | `src/hooks/useDashboardKpi.ts` | KPI 30초 polling hook | Y |
| 4 | `src/hooks/useDashboardTrend.ts` | 트렌드 차트 hook | Y |
| 5 | `src/hooks/useDashboardRecent.ts` | 최근 티켓 hook | Y |
| 6 | `src/hooks/useDashboardActions.ts` | 액션 큐 hook | Y |
| 7 | `src/components/common/KpiCard.tsx` | 재사용 KPI 카드 | Y |
| 8 | `src/components/dashboard/DashboardTrendChart.tsx` | Recharts LineChart | Y |
| 9 | `src/components/dashboard/DashboardRecentTickets.tsx` | 최근 접수 테이블 | Y |
| 10 | `src/components/dashboard/DashboardActionQueue.tsx` | 액션 필요 큐 | Y |
| 11 | `src/mocks/handlers/dashboard.ts` | MSW mock | Y |
| 12 | `src/mocks/handlers.ts` | 핸들러 통합 re-export | Y |
| 13 | `src/mocks/browser.ts` | MSW setupWorker | Y |
| 14 | `src/App.tsx` | QueryClientProvider 추가 | 수정 |
| 15 | `src/main.tsx` | MSW 조건부 활성화 | 수정 |
| 16 | `src/pages/DashboardPage.tsx` | 페이지 전면 재작성 | 수정 |

---

## 1. src/api/apiClient.ts

### 목적
axios 인스턴스. 모든 API 호출의 단일 진입점.

### 코드

```typescript
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// JWT interceptor는 authStore 구현 시 추가 예정
// 현재는 MSW mock으로 동작하므로 인증 없이 사용
```

---

## 2. src/types/dashboard.ts

### 목적
DashboardPage 전용 타입. TS 6.x 제약 준수 (enum 금지 -> union + as const).

### Props/Interface 전체

```typescript
// ---------- KPI ----------

export interface DashboardKpiResponse {
  pendingCount: number;
  pendingDelta: number;       // MoM %. 예: -8.3
  inProgressCount: number;
  inProgressDelta: number;
  closedTodayCount: number;
  closedTodayDelta: number;
  slaExceededCount: number;
  slaExceededDelta: number;
  updatedAt: string;          // ISO 8601
}

// ---------- 트렌드 ----------

export interface TrendPoint {
  month: string;              // "2026-04"
  received: number;
  completed: number;
}

// ---------- 최근 티켓 ----------

export const TICKET_STATUSES = [
  'RECEIVED', 'ASSIGNED', 'IN_PROGRESS',
  'COST_ENTERED', 'SHIPPING', 'CLOSED',
  'CANCELLED', 'ON_HOLD',
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

export interface RecentTicket {
  ticketId: number;
  ticketNo: string;           // "AS-2641"
  customerName: string;
  productModel: string;
  status: TicketStatus;
  createdAt: string;          // ISO 8601
}

// ---------- 액션 큐 ----------

export const ACTION_SEVERITIES = ['critical', 'high', 'medium', 'low'] as const;
export type ActionSeverity = (typeof ACTION_SEVERITIES)[number];

export interface ActionItem {
  key: string;
  label: string;
  count: number;
  severity: ActionSeverity;
}

// ---------- KpiCard Props ----------

export interface KpiCardProps {
  label: string;
  value: number | string;
  delta: number;              // MoM %. 양수=증가, 음수=감소
  accent: string;             // Tailwind border-t 클래스. 예: "border-t-amber-400"
  valueColor: string;         // Tailwind text 클래스. 예: "text-amber-500"
  isLoading: boolean;
  invertDelta?: boolean;      // true: 감소=좋음(초록). 예: 접수대기, SLA초과
}
```

---

## 3. useDashboardKpi Hook

### 파일: `src/hooks/useDashboardKpi.ts`

### 쿼리 키, API URL, refetch 로직

| 항목 | 값 |
|------|-----|
| queryKey | `['dashboard', 'kpi']` |
| API URL | `GET /api/dashboard/kpi` |
| staleTime | `30_000` (30초) |
| refetchInterval | `30_000` (30초) |
| refetchIntervalInBackground | `false` (탭 비활성 시 중지) |
| refetchOnWindowFocus | `false` (포커스 복귀 시 중복 방지) |
| retry | `1` |
| placeholderData | `(previousData) => previousData` (깜빡임 방지) |

### 코드

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient.ts';
import type { DashboardKpiResponse } from '@/types/dashboard.ts';

export function useDashboardKpi() {
  return useQuery<DashboardKpiResponse>({
    queryKey: ['dashboard', 'kpi'],
    queryFn: async () => {
      const { data } = await apiClient.get<DashboardKpiResponse>('/dashboard/kpi');
      return data;
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    retry: 1,
    placeholderData: (prev) => prev,
  });
}
```

### 추가 hooks (동일 패턴)

**`src/hooks/useDashboardTrend.ts`**

| 항목 | 값 |
|------|-----|
| queryKey | `['dashboard', 'trend']` |
| API URL | `GET /api/dashboard/trend?months=6` |
| staleTime | `60_000` (1분 -- 트렌드 변동 적음) |
| refetchInterval | `60_000` |

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient.ts';
import type { TrendPoint } from '@/types/dashboard.ts';

export function useDashboardTrend() {
  return useQuery<TrendPoint[]>({
    queryKey: ['dashboard', 'trend'],
    queryFn: async () => {
      const { data } = await apiClient.get<TrendPoint[]>('/dashboard/trend', {
        params: { months: 6 },
      });
      return data;
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
```

**`src/hooks/useDashboardRecent.ts`**

| 항목 | 값 |
|------|-----|
| queryKey | `['dashboard', 'recent']` |
| API URL | `GET /api/dashboard/recent-tickets?limit=5` |
| staleTime / refetchInterval | `30_000` |

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient.ts';
import type { RecentTicket } from '@/types/dashboard.ts';

export function useDashboardRecent() {
  return useQuery<RecentTicket[]>({
    queryKey: ['dashboard', 'recent'],
    queryFn: async () => {
      const { data } = await apiClient.get<RecentTicket[]>('/dashboard/recent-tickets', {
        params: { limit: 5 },
      });
      return data;
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
```

**`src/hooks/useDashboardActions.ts`**

| 항목 | 값 |
|------|-----|
| queryKey | `['dashboard', 'actions']` |
| API URL | `GET /api/dashboard/action-queue` |
| staleTime / refetchInterval | `60_000` |

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient.ts';
import type { ActionItem } from '@/types/dashboard.ts';

export function useDashboardActions() {
  return useQuery<ActionItem[]>({
    queryKey: ['dashboard', 'actions'],
    queryFn: async () => {
      const { data } = await apiClient.get<ActionItem[]>('/dashboard/action-queue');
      return data;
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
```

---

## 4. Mock API 응답 (JSON 형식)

### 4.1 파일: `src/mocks/handlers/dashboard.ts`

```typescript
import { http, HttpResponse } from 'msw';

const BASE = '/api';

export const dashboardHandlers = [

  // ---- KPI ----
  http.get(`${BASE}/dashboard/kpi`, () => {
    return HttpResponse.json({
      pendingCount: 24,
      pendingDelta: -8.3,
      inProgressCount: 31,
      inProgressDelta: 12.5,
      closedTodayCount: 7,
      closedTodayDelta: 16.7,
      slaExceededCount: 3,
      slaExceededDelta: -25.0,
      updatedAt: new Date().toISOString(),
    });
  }),

  // ---- 트렌드 (6개월) ----
  http.get(`${BASE}/dashboard/trend`, () => {
    return HttpResponse.json([
      { month: '2025-11', received: 38, completed: 31 },
      { month: '2025-12', received: 42, completed: 36 },
      { month: '2026-01', received: 35, completed: 33 },
      { month: '2026-02', received: 48, completed: 40 },
      { month: '2026-03', received: 51, completed: 44 },
      { month: '2026-04', received: 24, completed: 18 },
    ]);
  }),

  // ---- 최근 티켓 5건 ----
  http.get(`${BASE}/dashboard/recent-tickets`, () => {
    return HttpResponse.json([
      {
        ticketId: 2641,
        ticketNo: 'AS-2641',
        customerName: '김민수',
        productModel: 'WE-300',
        status: 'IN_PROGRESS',
        createdAt: '2026-04-30T11:22:00+09:00',
      },
      {
        ticketId: 2640,
        ticketNo: 'AS-2640',
        customerName: '이영희',
        productModel: 'BS-200',
        status: 'RECEIVED',
        createdAt: '2026-04-30T10:15:00+09:00',
      },
      {
        ticketId: 2639,
        ticketNo: 'AS-2639',
        customerName: '박서준',
        productModel: 'NC-100',
        status: 'ASSIGNED',
        createdAt: '2026-04-30T09:48:00+09:00',
      },
      {
        ticketId: 2638,
        ticketNo: 'AS-2638',
        customerName: '최유진',
        productModel: 'WE-300',
        status: 'CLOSED',
        createdAt: '2026-04-29T16:30:00+09:00',
      },
      {
        ticketId: 2637,
        ticketNo: 'AS-2637',
        customerName: '정하늘',
        productModel: 'GT-500',
        status: 'COST_ENTERED',
        createdAt: '2026-04-29T14:22:00+09:00',
      },
    ]);
  }),

  // ---- 액션 큐 ----
  http.get(`${BASE}/dashboard/action-queue`, () => {
    return HttpResponse.json([
      { key: 'zombie',       label: '좀비 티켓',   count: 2, severity: 'critical' },
      { key: 'no_response',  label: '응대 누락',   count: 1, severity: 'critical' },
      { key: 'unassigned',   label: '미배정 4h+',  count: 5, severity: 'high' },
      { key: 'fake_close',   label: '가짜 완료',   count: 0, severity: 'high' },
      { key: 'cost_mismatch',label: '비용 불일치', count: 3, severity: 'medium' },
    ]);
  }),
];
```

### 4.2 파일: `src/mocks/handlers.ts`

```typescript
import { dashboardHandlers } from './handlers/dashboard.ts';

export const handlers = [
  ...dashboardHandlers,
  // 추후 다른 도메인 핸들러 추가
];
```

### 4.3 파일: `src/mocks/browser.ts`

```typescript
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers.ts';

export const worker = setupWorker(...handlers);
```

### 4.4 MSW 초기화 (npx)

```bash
npx msw init public --save
```

---

## 5. 수정 파일: src/App.tsx

### 변경 내용

```typescript
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from '@/router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
```

---

## 6. 수정 파일: src/main.tsx

### 변경 내용

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

async function prepare(): Promise<void> {
  if (import.meta.env.VITE_ENABLE_MSW === 'true') {
    const { worker } = await import('./mocks/browser.ts');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
}

prepare().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
```

---

## 7. src/components/common/KpiCard.tsx

### Props

```typescript
import type { KpiCardProps } from '@/types/dashboard.ts';
```

(KpiCardProps는 Section 2에서 정의됨)

### 렌더링 구조

```
+-------------------------------------------+
| border-t-[3px] {accent}                   |
|                                           |
|  {label}            11px, secondary       |
|  {value}            2xl, extrabold        |
|  {arrow} {delta}% 전월 대비  10px         |
+-------------------------------------------+
```

### 스켈레톤 (isLoading=true)

```tsx
// animate-pulse 블록 3개
<div className="animate-pulse">
  <div className="mb-2 h-3 w-16 rounded bg-gray-200" />   // label
  <div className="mb-1.5 h-7 w-12 rounded bg-gray-200" /> // value
  <div className="h-3 w-20 rounded bg-gray-200" />         // delta
</div>
```

### 델타 뱃지 로직

```typescript
function getDeltaDisplay(delta: number, invertDelta: boolean) {
  if (delta === 0) return { arrow: '--', color: 'text-gray-400', text: '0%' };
  const isPositive = delta > 0;
  // invertDelta=true: 감소가 좋음 (접수대기 감소, SLA초과 감소)
  const isGood = invertDelta ? !isPositive : isPositive;
  return {
    arrow: isPositive ? '\u25B2' : '\u25BC',  // ▲ ▼
    color: isGood ? 'text-emerald-600' : 'text-red-500',
    text: `${Math.abs(delta).toFixed(1)}%`,
  };
}
```

### 전체 코드

```tsx
export default function KpiCard({
  label, value, delta, accent, valueColor, isLoading, invertDelta = false,
}: KpiCardProps) {
  const d = getDeltaDisplay(delta, invertDelta);

  return (
    <div className={`rounded-[10px] border border-[var(--color-border)] border-t-[3px] bg-white p-3.5 ${accent}`}>
      {isLoading ? (
        <div className="animate-pulse">
          <div className="mb-2 h-3 w-16 rounded bg-gray-200" />
          <div className="mb-1.5 h-7 w-12 rounded bg-gray-200" />
          <div className="h-3 w-20 rounded bg-gray-200" />
        </div>
      ) : (
        <>
          <div className="mb-1 text-[11px] font-medium text-[var(--color-text-secondary)]">
            {label}
          </div>
          <div className={`text-2xl font-extrabold leading-tight ${valueColor}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          <div className={`mt-1 text-[10px] font-medium ${d.color}`}>
            {d.arrow} {d.text} 전월 대비
          </div>
        </>
      )}
    </div>
  );
}
```

---

## 8. src/components/dashboard/DashboardTrendChart.tsx

### Props

```typescript
interface DashboardTrendChartProps {
  data: TrendPoint[];    // from types/dashboard.ts
  isLoading: boolean;
}
```

### Recharts 구현

```tsx
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { TrendPoint } from '@/types/dashboard.ts';

interface Props {
  data: TrendPoint[];
  isLoading: boolean;
}

export default function DashboardTrendChart({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 desktop:p-5">
        <div className="animate-pulse">
          <div className="mb-4 h-4 w-40 rounded bg-gray-200" />
          <div className="h-[200px] rounded bg-gray-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 desktop:p-5">
      <h2 className="mb-4 text-sm font-semibold text-gray-800">
        월별 접수 vs 완료 트렌드
      </h2>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11 }}
            tickFormatter={(v: string) => v.slice(5)}
          />
          <YAxis tick={{ fontSize: 11 }} width={35} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
            labelFormatter={(v: string) => `${v}`}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Line
            type="monotone"
            dataKey="received"
            name="접수"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ r: 3, fill: '#3B82F6' }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="completed"
            name="완료"
            stroke="#10B981"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={{ r: 3, fill: '#10B981' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### 데이터 구조 (TrendPoint[])

```json
[
  { "month": "2025-11", "received": 38, "completed": 31 },
  { "month": "2025-12", "received": 42, "completed": 36 },
  { "month": "2026-01", "received": 35, "completed": 33 },
  { "month": "2026-02", "received": 48, "completed": 40 },
  { "month": "2026-03", "received": 51, "completed": 44 },
  { "month": "2026-04", "received": 24, "completed": 18 }
]
```

- X축: `month` -> `tickFormatter`로 "11", "12", ... 표시
- Y축: 건수 (자동 범위)
- 접수: 파란색 실선 (#3B82F6, strokeWidth=2)
- 완료: 초록색 점선 (#10B981, strokeDasharray="5 3")

---

## 9. src/components/dashboard/DashboardRecentTickets.tsx

### Props

```typescript
interface Props {
  tickets: RecentTicket[];   // from types/dashboard.ts
  isLoading: boolean;
}
```

### 상태 뱃지 색상 맵

```typescript
const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  RECEIVED:     { bg: 'bg-blue-100',   text: 'text-blue-700',   label: '접수' },
  ASSIGNED:     { bg: 'bg-indigo-100', text: 'text-indigo-700', label: '배정' },
  IN_PROGRESS:  { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '진행' },
  COST_ENTERED: { bg: 'bg-orange-100', text: 'text-orange-700', label: '비용' },
  SHIPPING:     { bg: 'bg-purple-100', text: 'text-purple-700', label: '출고' },
  CLOSED:       { bg: 'bg-green-100',  text: 'text-green-700',  label: '완료' },
  CANCELLED:    { bg: 'bg-gray-100',   text: 'text-gray-600',   label: '취소' },
  ON_HOLD:      { bg: 'bg-red-100',    text: 'text-red-700',    label: '보류' },
};
```

### 레이아웃

- 데스크톱: 4컬럼 테이블 (`hidden desktop:table`)
- 모바일: 카드형 (`desktop:hidden`)
- 헤더에 "전체 보기" 링크 -> `/tickets`
- 행 클릭 -> `/tickets/{ticketId}` (현재는 `/4`로 대체, 동적 라우트 미구현)

### 스켈레톤

```tsx
// 5행 x 4컬럼 pulse 블록
{Array.from({ length: 5 }, (_, i) => (
  <tr key={i} className="animate-pulse border-b border-gray-50">
    <td className="px-4 py-2.5"><div className="h-3 w-20 rounded bg-gray-200" /></td>
    <td className="px-4 py-2.5"><div className="h-3 w-14 rounded bg-gray-200" /></td>
    <td className="px-4 py-2.5"><div className="h-3 w-16 rounded bg-gray-200" /></td>
    <td className="px-4 py-2.5"><div className="h-3 w-10 rounded bg-gray-200" /></td>
  </tr>
))}
```

---

## 10. src/components/dashboard/DashboardActionQueue.tsx

### Props

```typescript
interface Props {
  items: ActionItem[];   // from types/dashboard.ts
  isLoading: boolean;
}
```

### severity 스타일 맵

```typescript
const SEV = {
  critical: { dot: 'bg-red-500',   badge: 'bg-red-50 text-red-700' },
  high:     { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700' },
  medium:   { dot: 'bg-blue-500',  badge: 'bg-blue-50 text-blue-700' },
  low:      { dot: 'bg-gray-400',  badge: 'bg-gray-50 text-gray-600' },
} as const;
```

### 동작

- `count === 0`인 항목은 표시하지 않음 (`.filter(i => i.count > 0)`)
- 모든 count가 0이면 "이상 패턴이 감지되지 않았습니다" 초록 배너
- 행 클릭 -> `navigate(/tickets?filter={item.key})` (현재는 console.log)

---

## 11. src/pages/DashboardPage.tsx (전면 재작성)

### 상태 관리

- 서버 데이터: react-query 4개 hook 사용 (zustand/Context 사용 안 함)
- 컴포넌트 로컬 상태: 없음 (pure render)

### 완성 코드

```tsx
import KpiCard from '@/components/common/KpiCard.tsx';
import DashboardTrendChart from '@/components/dashboard/DashboardTrendChart.tsx';
import DashboardRecentTickets from '@/components/dashboard/DashboardRecentTickets.tsx';
import DashboardActionQueue from '@/components/dashboard/DashboardActionQueue.tsx';
import { useDashboardKpi } from '@/hooks/useDashboardKpi.ts';
import { useDashboardTrend } from '@/hooks/useDashboardTrend.ts';
import { useDashboardRecent } from '@/hooks/useDashboardRecent.ts';
import { useDashboardActions } from '@/hooks/useDashboardActions.ts';

const KPI_CONFIG = [
  {
    label: '접수 대기',
    valueKey: 'pendingCount' as const,
    deltaKey: 'pendingDelta' as const,
    accent: 'border-t-amber-400',
    valueColor: 'text-amber-500',
    invertDelta: true,
  },
  {
    label: '진행중',
    valueKey: 'inProgressCount' as const,
    deltaKey: 'inProgressDelta' as const,
    accent: 'border-t-blue-500',
    valueColor: 'text-blue-600',
    invertDelta: false,
  },
  {
    label: '금일 완료',
    valueKey: 'closedTodayCount' as const,
    deltaKey: 'closedTodayDelta' as const,
    accent: 'border-t-green-500',
    valueColor: 'text-green-600',
    invertDelta: false,
  },
  {
    label: 'SLA 초과',
    valueKey: 'slaExceededCount' as const,
    deltaKey: 'slaExceededDelta' as const,
    accent: 'border-t-red-500',
    valueColor: 'text-red-500',
    invertDelta: true,
  },
] as const;

export default function DashboardPage() {
  const kpi = useDashboardKpi();
  const trend = useDashboardTrend();
  const recent = useDashboardRecent();
  const actions = useDashboardActions();

  return (
    <section>
      <h1 className="page-title">A/S 현황 대시보드</h1>
      <p className="page-desc">실시간 운영 현황판 -- 30초마다 자동 갱신</p>

      {/* Section A: KPI 4카드 -- 모바일 2열, 데스크톱 4열 */}
      <div className="mt-5 grid grid-cols-2 gap-3 desktop:grid-cols-4">
        {KPI_CONFIG.map((cfg) => (
          <KpiCard
            key={cfg.label}
            label={cfg.label}
            value={kpi.data?.[cfg.valueKey] ?? 0}
            delta={kpi.data?.[cfg.deltaKey] ?? 0}
            accent={cfg.accent}
            valueColor={cfg.valueColor}
            isLoading={kpi.isLoading}
            invertDelta={cfg.invertDelta}
          />
        ))}
      </div>

      {/* Section B+C: 차트 + 최근 티켓 -- 모바일 1열, 데스크톱 2열 */}
      <div className="mt-4 grid grid-cols-1 gap-4 desktop:grid-cols-2">
        <DashboardTrendChart
          data={trend.data ?? []}
          isLoading={trend.isLoading}
        />
        <DashboardRecentTickets
          tickets={recent.data ?? []}
          isLoading={recent.isLoading}
        />
      </div>

      {/* Section D: 액션 큐 -- 풀너비 */}
      <div className="mt-4">
        <DashboardActionQueue
          items={actions.data ?? []}
          isLoading={actions.isLoading}
        />
      </div>
    </section>
  );
}
```

### 주의: export 변경

- 기존: `export function DashboardPage()` (named export)
- 변경: `export default function DashboardPage()` (default export)
- router.tsx import 수정 필요: `import { DashboardPage }` -> `import DashboardPage`

---

## 12. Tailwind 반응형 클래스 가이드

### 프로젝트 브레이크포인트 체계

이 프로젝트는 Tailwind v4의 `@custom-variant`를 사용한다.
표준 Tailwind의 `sm:` `md:` `lg:` `xl:` 접두사 대신 **`desktop:` 단일 접두사**를 사용한다.

```
<=520px  : 모바일 (기본값, 접두사 없음)
>520px   : 데스크톱 (desktop: 접두사)
```

### DashboardPage에 적용하는 반응형 클래스

| 영역 | 모바일 (기본) | 데스크톱 (desktop:) |
|------|-------------|-------------------|
| KPI 카드 그리드 | `grid-cols-2` | `desktop:grid-cols-4` |
| 차트+테이블 그리드 | `grid-cols-1` | `desktop:grid-cols-2` |
| 차트 패딩 | `p-4` | `desktop:p-5` |
| 최근 티켓 테이블 | `hidden` (카드형 표시) | `desktop:table` |
| 최근 티켓 카드형 | 표시 | `desktop:hidden` |
| 액션 큐 | 풀너비 (변경 없음) | 풀너비 (변경 없음) |

### 실제 클래스 예시

```html
<!-- KPI 그리드 -->
<div class="grid grid-cols-2 gap-3 desktop:grid-cols-4">

<!-- 차트+테이블 그리드 -->
<div class="grid grid-cols-1 gap-4 desktop:grid-cols-2">

<!-- 데스크톱 전용 테이블 -->
<table class="hidden w-full desktop:table">

<!-- 모바일 전용 카드 -->
<div class="space-y-2 desktop:hidden">
```

### 주의사항

- `sm:` `md:` `lg:` `xl:` 사용 금지 -- 이 프로젝트에서는 동작하지 않음
- 반드시 `desktop:` 접두사만 사용
- 정의 위치: `src/index.css` L124-128

---

## 13. 테스트 체크리스트

### TC-1: DevTools Network에서 30초 간격 요청 확인

```
1. npm run dev (Vite dev server 시작)
2. 브라우저에서 http://localhost:5173 접속
3. DevTools > Network 탭 열기
4. 필터: "dashboard"
5. 확인:
   - 최초 로딩 시 4개 요청: /dashboard/kpi, /dashboard/trend,
     /dashboard/recent-tickets, /dashboard/action-queue
   - 30초 후 /dashboard/kpi 재요청 관찰 (Network 탭에 새 행 추가)
   - 60초 후 /dashboard/trend, /dashboard/action-queue 재요청 관찰
6. 다른 탭으로 이동 -> 30초 대기 -> 돌아오기
   - 탭 비활성 동안 새 요청이 없어야 함
PASS 기준: 30초 간격으로 /dashboard/kpi 재요청이 정확히 발생
```

### TC-2: KPI 숫자 mock 데이터 표시

```
1. DashboardPage (/) 접속
2. KPI 4카드 확인:
   - 접수 대기: 24, ▼ 8.3% 전월 대비 (초록색 -- 감소=좋음)
   - 진행중: 31, ▲ 12.5% 전월 대비 (빨간색)
   - 금일 완료: 7, ▲ 16.7% 전월 대비 (초록색)
   - SLA 초과: 3, ▼ 25.0% 전월 대비 (초록색 -- 감소=좋음)
3. 값이 '---'가 아닌 실제 숫자여야 함
4. 로딩 중 pulse 스켈레톤이 짧게 보여야 함 (Network throttle 3G에서 확인)
PASS 기준: 4카드 모두 mock 숫자 + MoM 델타 화살표 정상 표시
```

### TC-3: LineChart 선 2개 렌더링

```
1. DashboardPage 차트 영역 확인
2. 확인 항목:
   - 파란색 실선 (접수) 존재
   - 초록색 점선 (완료) 존재
   - X축: 11, 12, 01, 02, 03, 04 (6개월)
   - Y축: 숫자 (자동 범위)
   - 범례: "접수" (파란 원), "완료" (초록 원)
   - 마우스 호버 -> Tooltip에 월, 접수 건수, 완료 건수 표시
3. 로딩 중: 회색 스켈레톤 블록 표시
PASS 기준: 2개 라인이 구분 가능하게 렌더링, 호버 Tooltip 동작
```

### TC-4: 520px 화면에서 카드 1열 정렬 / 스크롤 이상 없음

```
1. Chrome DevTools > Toggle device toolbar (Ctrl+Shift+M)
2. 뷰포트: 375 x 812 (iPhone SE)
3. DashboardPage 확인:
   - KPI 카드: 2열 x 2행 그리드 (4카드)
   - 트렌드 차트: 풀너비 1열
   - 최근 접수: 카드형 (테이블 아닌 세로 카드 리스트)
   - 액션 큐: 풀너비 1열
   - 가로 스크롤바 없음
   - 세로 스크롤 정상 동작
4. 뷰포트: 520 x 800 (경계값)
   - 위와 동일
5. 뷰포트: 521 x 800 (desktop 전환점)
   - KPI 카드: 4열 1행
   - 트렌드 차트 + 최근 접수: 2열 나란히
   - 최근 접수: 테이블 형태
PASS 기준: 520px 이하에서 가로 스크롤 없음, 모든 섹션 풀너비 스택
```

### TC-5: 액션 큐 동작 확인

```
1. DashboardPage 하단 액션 큐 영역 확인:
   - "좀비 티켓" (빨간 dot, count 2)
   - "응대 누락" (빨간 dot, count 1)
   - "미배정 4h+" (주황 dot, count 5)
   - "가짜 완료" -> count 0이므로 표시되지 않아야 함
   - "비용 불일치" (파란 dot, count 3)
2. 총 건수: "액션 필요 (11건)" 헤더 표시
PASS 기준: count=0 항목 숨김, severity별 색상 구분 정상
```

### TC-6: TypeScript + Vite 빌드

```
1. npx tsc -b --noEmit
   PASS: 에러 0건
2. npx vite build
   PASS: 빌드 성공, dist/ 생성
```

---

## 14. 상태 관리 결정 요약

```
+-----------------------------------------------------------+
|                    State Architecture                      |
+--------------------+--------------------------------------+
| @tanstack/react-   | ALL server data                      |
| query              | dashboard KPI, trend, tickets, queue  |
|                    | staleTime=30s, refetchInterval=30s    |
|                    | queryKey: ['dashboard', 'kpi'] etc.   |
+--------------------+--------------------------------------+
| zustand            | Client-only state (향후)              |
| (미사용 -- 현단계) | authStore: user, token                |
|                    | uiStore: sidebar open/close           |
+--------------------+--------------------------------------+
| React Context      | 사용 안 함                            |
|                    | 12명 규모에서 불필요                   |
+--------------------+--------------------------------------+
| Component local    | 없음 (DashboardPage는 pure render)    |
| useState           |                                      |
+--------------------+--------------------------------------+
```

DashboardPage는 4개의 useQuery hook만 호출하고, 반환된 `{ data, isLoading }`을 자식 컴포넌트에 props로 전달한다. zustand와 Context는 사용하지 않는다.

---

## 15. 컴포넌트 계층도 (최종)

```
DashboardPage
|
+-- KpiCard x4                          (src/components/common/KpiCard.tsx)
|   +-- isLoading=true  -> pulse skeleton (3 bars)
|   +-- isLoading=false -> label + value + DeltaBadge
|       +-- getDeltaDisplay(delta, invertDelta)
|           +-- ▲/▼ arrow + emerald/red color + percentage
|
+-- DashboardTrendChart                 (src/components/dashboard/DashboardTrendChart.tsx)
|   +-- isLoading=true  -> skeleton (title bar + gray rect)
|   +-- isLoading=false -> recharts ResponsiveContainer > LineChart
|       +-- Line "접수" (solid blue #3B82F6)
|       +-- Line "완료" (dashed green #10B981)
|       +-- XAxis (month) + YAxis (count) + Tooltip + Legend
|
+-- DashboardRecentTickets              (src/components/dashboard/DashboardRecentTickets.tsx)
|   +-- header: "최근 A/S 접수" + "전체 보기" link
|   +-- isLoading=true  -> 5-row skeleton
|   +-- isLoading=false ->
|       +-- desktop: <table> 4 columns (접수일시/고객명/제품/상태)
|       +-- mobile:  <div> card list (desktop:hidden)
|   +-- row click -> navigate to ticket detail
|
+-- DashboardActionQueue               (src/components/dashboard/DashboardActionQueue.tsx)
    +-- header: "액션 필요 ({total}건)"
    +-- isLoading=true  -> skeleton
    +-- items.length=0  -> green "이상 없음" banner
    +-- items filtered (count>0) ->
        +-- severity dot + label + count badge
        +-- click -> navigate to /tickets?filter={key}

Infra layer (not rendered):
  +-- apiClient.ts              axios instance (baseURL=/api)
  +-- useDashboardKpi.ts        queryKey=['dashboard','kpi'], 30s poll
  +-- useDashboardTrend.ts      queryKey=['dashboard','trend'], 60s poll
  +-- useDashboardRecent.ts     queryKey=['dashboard','recent'], 30s poll
  +-- useDashboardActions.ts    queryKey=['dashboard','actions'], 60s poll
  +-- mocks/handlers/dashboard.ts   MSW mock responses
  +-- App.tsx                   QueryClientProvider wrapper
  +-- main.tsx                  MSW conditional start
```
