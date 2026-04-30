# DashboardPage (#5) 구현 계획서

> 기준: Step-1 코드베이스 분석 결과 (2026-04-30)
> 현재 상태: KPI 4카드 골격(값 '---'), placeholder-card 1개, 27줄
> 목표: 실시간 KPI + 차트 + 최근 티켓 + 액션 큐 완성

---

## 1. 컴포넌트 계층도

```
DashboardPage (src/pages/DashboardPage.tsx)
|
|-- [Section A] KPI 4-Card Row
|   |-- KpiCard          x4    (src/components/common/KpiCard.tsx)
|   |   |-- KpiSkeleton         (로딩 시 pulse 스켈레톤)
|   |   |-- DeltaBadge           (MoM 증감 뱃지)
|   |   '-- value / label / accent
|   '-- useDashboardKpi()        (src/hooks/useDashboardKpi.ts)
|
|-- [Section B] Trend LineChart
|   |-- DashboardTrendChart      (src/components/dashboard/DashboardTrendChart.tsx)
|   |   |-- recharts: ResponsiveContainer > LineChart
|   |   |   |-- Line "접수" (solid, #3B82F6)
|   |   |   '-- Line "완료" (dashed, #10B981)
|   |   '-- XAxis / YAxis / Tooltip / Legend
|   '-- useDashboardTrend()      (src/hooks/useDashboardTrend.ts)
|
|-- [Section C] Recent Tickets Table
|   |-- DashboardRecentTickets   (src/components/dashboard/DashboardRecentTickets.tsx)
|   |   |-- 5-row mini table (접수일시 / 고객명 / 제품 / 상태뱃지)
|   |   '-- "전체 보기" 링크 -> /tickets
|   '-- useDashboardRecent()     (src/hooks/useDashboardRecent.ts)
|
|-- [Section D] Action Queue
|   |-- DashboardActionQueue     (src/components/dashboard/DashboardActionQueue.tsx)
|   |   |-- ActionQueueItem      x N (severity dot + label + count + 클릭 -> /tickets?filter=)
|   |   '-- severity 색상: critical=red, high=amber, medium=blue
|   '-- useDashboardActions()    (src/hooks/useDashboardActions.ts)
|
'-- [Infra]
    |-- apiClient.ts             (src/api/apiClient.ts)       -- axios + JWT interceptor
    |-- QueryClientProvider      (src/App.tsx)                 -- react-query wrapper
    '-- MSW mock handlers        (src/mocks/handlers/dashboard.ts)
```

---

## 2. useDashboardKpi Hook 설계

### 2.1 타입 정의

```typescript
// src/types/dashboard.ts

/** KPI API 응답 */
export interface DashboardKpiResponse {
  pendingCount: number;         // 접수 대기 (status=RECEIVED)
  pendingDelta: number;         // MoM 변화율 (%, 음수=감소)
  inProgressCount: number;      // 진행중 (ASSIGNED + IN_PROGRESS + COST_ENTERED)
  inProgressDelta: number;
  closedTodayCount: number;     // 금일 완료 (closedAt = today)
  closedTodayDelta: number;
  slaExceededCount: number;     // SLA 초과 (경과일 > 5영업일, 미종료)
  slaExceededDelta: number;
  updatedAt: string;            // ISO 8601, 서버 시각
}

/** 최근 티켓 */
export interface DashboardRecentTicket {
  ticketId: number;
  ticketNo: string;
  customerName: string;
  productModel: string;
  status: string;
  createdAt: string;
}

/** 월별 트렌드 */
export interface DashboardTrendPoint {
  month: string;        // "2026-04"
  received: number;
  completed: number;
}

/** 액션 큐 아이템 */
export interface DashboardActionItem {
  key: string;          // "zombie" | "unassigned" | ...
  label: string;
  count: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
}
```

### 2.2 Hook 구현

```typescript
// src/hooks/useDashboardKpi.ts

import { useQuery } from '@tanstack/react-query';
import type { DashboardKpiResponse } from '@/types/dashboard.ts';
import { apiClient } from '@/api/apiClient.ts';

export function useDashboardKpi() {
  return useQuery<DashboardKpiResponse>({
    queryKey: ['dashboard', 'kpi'],
    queryFn: async () => {
      const { data } = await apiClient.get<DashboardKpiResponse>(
        '/dashboard/kpi'
      );
      return data;
    },

    // --- 30초 자동 갱신 핵심 설정 ---
    staleTime: 30_000,           // 30초간 데이터를 fresh로 간주
    refetchInterval: 30_000,     // 30초마다 자동 재요청
    refetchIntervalInBackground: false,  // 탭 비활성 시 polling 중지
    refetchOnWindowFocus: false, // 탭 포커스 시 중복 요청 방지

    retry: 1,                    // 실패 시 1회만 재시도
    placeholderData: (prev) => prev,  // 이전 데이터 유지 (깜빡임 방지)
  });
}
```

### 2.3 추가 Hooks (동일 패턴)

```typescript
// src/hooks/useDashboardTrend.ts
export function useDashboardTrend() {
  return useQuery<DashboardTrendPoint[]>({
    queryKey: ['dashboard', 'trend'],
    queryFn: () => apiClient.get('/dashboard/trend?months=6').then(r => r.data),
    staleTime: 60_000,            // 트렌드는 1분 캐시 (변동 적음)
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  });
}

// src/hooks/useDashboardRecent.ts
export function useDashboardRecent() {
  return useQuery<DashboardRecentTicket[]>({
    queryKey: ['dashboard', 'recent'],
    queryFn: () => apiClient.get('/dashboard/recent-tickets?limit=5').then(r => r.data),
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
  });
}

// src/hooks/useDashboardActions.ts
export function useDashboardActions() {
  return useQuery<DashboardActionItem[]>({
    queryKey: ['dashboard', 'actions'],
    queryFn: () => apiClient.get('/dashboard/action-queue').then(r => r.data),
    staleTime: 60_000,            // 액션 큐는 1분 캐시
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  });
}
```

---

## 3. KPI 4-Card 컴포넌트

### 3.1 KpiCard 공통 컴포넌트

```typescript
// src/components/common/KpiCard.tsx

interface KpiCardProps {
  label: string;
  value: number | string;
  delta: number;              // MoM 변화율 (%)
  accent: string;             // Tailwind border-t 색상 클래스
  valueColor: string;         // Tailwind text 색상 클래스
  isLoading?: boolean;
  invertDelta?: boolean;      // true면 음수=좋음 (SLA 초과 등)
}
```

**렌더링 구조:**

```
+-------------------------------------------+
| border-t-[3px] accent color               |
|                                           |
|  접수 대기          (11px, secondary)      |
|  24                 (2xl, extrabold)       |
|  ▲ +12% 전월 대비   (10px, green/red)     |
+-------------------------------------------+
```

### 3.2 DeltaBadge 로직

```typescript
// delta > 0 : 증가
//   - 일반 KPI (접수대기, 진행중): 빨강 (안 좋음)
//   - 금일 완료: 초록 (좋음)
//   - SLA 초과: invertDelta=true -> 양수=빨강

// delta < 0 : 감소
//   - 일반 KPI: 초록
//   - SLA 초과: invertDelta=true -> 음수=초록

// delta === 0 : 회색 "—"

function getDeltaStyle(delta: number, invert: boolean) {
  if (delta === 0) return { arrow: '—', color: 'text-gray-400' };
  const isPositive = delta > 0;
  const isGood = invert ? !isPositive : isPositive;
  // "금일 완료"는 isGood 반전 불필요 -> 페이지에서 개별 처리
  return {
    arrow: isPositive ? '▲' : '▼',
    color: isGood ? 'text-emerald-600' : 'text-red-500',
  };
}
```

### 3.3 4카드 구성 (DashboardPage 내)

```typescript
const KPI_CARDS = [
  {
    key: 'pending',
    label: '접수 대기',
    valueKey: 'pendingCount',
    deltaKey: 'pendingDelta',
    accent: 'border-t-amber-400',
    valueColor: 'text-amber-500',
    invertDelta: true,       // 접수 대기 감소 = 좋음
  },
  {
    key: 'inProgress',
    label: '진행중',
    valueKey: 'inProgressCount',
    deltaKey: 'inProgressDelta',
    accent: 'border-t-blue-500',
    valueColor: 'text-blue-600',
    invertDelta: false,
  },
  {
    key: 'closedToday',
    label: '금일 완료',
    valueKey: 'closedTodayCount',
    deltaKey: 'closedTodayDelta',
    accent: 'border-t-green-500',
    valueColor: 'text-green-600',
    invertDelta: false,      // 완료 증가 = 좋음
  },
  {
    key: 'slaExceeded',
    label: 'SLA 초과',
    valueKey: 'slaExceededCount',
    deltaKey: 'slaExceededDelta',
    accent: 'border-t-red-500',
    valueColor: 'text-red-500',
    invertDelta: true,       // SLA 초과 감소 = 좋음
  },
] as const;
```

---

## 4. Skeleton 로딩 UI

### 4.1 KpiCard 스켈레톤

```tsx
// KpiCard 내부 isLoading=true 분기

{isLoading ? (
  <div className="animate-pulse">
    <div className="mb-2 h-3 w-16 rounded bg-gray-200" />    {/* label */}
    <div className="mb-1 h-7 w-12 rounded bg-gray-200" />    {/* value */}
    <div className="h-3 w-20 rounded bg-gray-200" />          {/* delta */}
  </div>
) : (
  // 실제 데이터 렌더링
)}
```

### 4.2 차트 스켈레톤

```tsx
// DashboardTrendChart isLoading 분기

{isLoading ? (
  <div className="animate-pulse rounded-xl border border-[var(--color-border)] bg-white p-5">
    <div className="mb-4 h-4 w-40 rounded bg-gray-200" />  {/* 타이틀 */}
    <div className="h-[200px] rounded bg-gray-100" />       {/* 차트 영역 */}
  </div>
) : (
  <ResponsiveContainer width="100%" height={200}>
    <LineChart data={data}>...</LineChart>
  </ResponsiveContainer>
)}
```

### 4.3 테이블 스켈레톤

```tsx
// DashboardRecentTickets isLoading 분기
// 5행 x 4열 pulse 블록
{Array.from({ length: 5 }).map((_, i) => (
  <tr key={i} className="animate-pulse">
    <td><div className="h-3 w-24 rounded bg-gray-200" /></td>
    <td><div className="h-3 w-16 rounded bg-gray-200" /></td>
    <td><div className="h-3 w-20 rounded bg-gray-200" /></td>
    <td><div className="h-3 w-12 rounded bg-gray-200" /></td>
  </tr>
))}
```

---

## 5. 최근 접수 5건 테이블

### 5.1 컴포넌트 구조

```tsx
// src/components/dashboard/DashboardRecentTickets.tsx

<div className="rounded-xl border border-[var(--color-border)] bg-white">
  {/* 헤더 */}
  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
    <h2 className="text-sm font-semibold text-gray-800">최근 A/S 접수</h2>
    <Link to="/tickets" className="text-xs text-blue-600 hover:underline">
      전체 보기
    </Link>
  </div>

  {/* 테이블 */}
  <table className="w-full text-sm">
    <thead>
      <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
        <th className="px-4 py-2">접수일시</th>
        <th className="px-4 py-2">고객명</th>
        <th className="px-4 py-2">제품</th>
        <th className="px-4 py-2">상태</th>
      </tr>
    </thead>
    <tbody>
      {tickets.map((t) => (
        <tr key={t.ticketId}
            className="cursor-pointer border-b border-gray-50 hover:bg-blue-50"
            onClick={() => navigate(`/tickets/${t.ticketId}`)}>
          <td className="px-4 py-2.5 text-xs text-gray-500">
            {dayjs(t.createdAt).format('MM-DD HH:mm')}
          </td>
          <td className="px-4 py-2.5 font-medium">{t.customerName}</td>
          <td className="px-4 py-2.5 text-gray-600">{t.productModel}</td>
          <td className="px-4 py-2.5">
            <StatusBadge status={t.status} />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### 5.2 모바일 대응

520px 이하에서는 테이블 대신 **카드형 레이아웃**으로 전환:

```tsx
{/* 모바일: 카드형 */}
<div className="space-y-2 desktop:hidden">
  {tickets.map((t) => (
    <div key={t.ticketId} className="rounded-lg border bg-white p-3">
      <div className="flex justify-between">
        <span className="font-medium">{t.customerName}</span>
        <StatusBadge status={t.status} />
      </div>
      <div className="mt-1 text-xs text-gray-500">
        {t.productModel} | {dayjs(t.createdAt).format('MM-DD HH:mm')}
      </div>
    </div>
  ))}
</div>

{/* 데스크톱: 테이블 */}
<table className="hidden w-full text-sm desktop:table">
  ...
</table>
```

---

## 6. 월별 트렌드 LineChart (Recharts)

### 6.1 컴포넌트

```tsx
// src/components/dashboard/DashboardTrendChart.tsx

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

interface Props {
  data: DashboardTrendPoint[];
  isLoading: boolean;
}

export default function DashboardTrendChart({ data, isLoading }: Props) {
  if (isLoading) return <ChartSkeleton />;

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 desktop:p-5">
      <h2 className="mb-4 text-sm font-semibold text-gray-800">
        월별 접수 vs 완료 트렌드
      </h2>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11 }}
            tickFormatter={(v: string) => v.slice(5)}   // "2026-04" -> "04"
          />
          <YAxis tick={{ fontSize: 11 }} width={35} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            labelFormatter={(v: string) => `${v}월`}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          />
          <Line
            type="monotone"
            dataKey="received"
            name="접수"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="completed"
            name="완료"
            stroke="#10B981"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### 6.2 데이터 형식

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

### 6.3 반응형 처리

- `ResponsiveContainer width="100%"` -- 부모 너비 자동 추적
- 모바일(<=520px): height={180}, X축 라벨 간소화 (월 숫자만)
- 데스크톱(>520px): height={220}, X축 전체 라벨

---

## 7. 액션 필요 큐

### 7.1 컴포넌트

```tsx
// src/components/dashboard/DashboardActionQueue.tsx

const SEVERITY_STYLES = {
  critical: { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700' },
  high:     { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
  medium:   { dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
  low:      { dot: 'bg-gray-400', bg: 'bg-gray-50', text: 'text-gray-600' },
} as const;

export default function DashboardActionQueue({ items, isLoading }: Props) {
  const navigate = useNavigate();

  if (isLoading) return <ActionQueueSkeleton />;
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center text-sm text-green-700">
        이상 패턴이 감지되지 않았습니다
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white">
      <div className="border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-800">
          액션 필요 ({items.reduce((s, i) => s + i.count, 0)}건)
        </h2>
      </div>
      <div className="divide-y divide-gray-50">
        {items.filter(i => i.count > 0).map((item) => {
          const style = SEVERITY_STYLES[item.severity];
          return (
            <div
              key={item.key}
              className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:${style.bg}`}
              onClick={() => navigate(`/tickets?filter=${item.key}`)}
            >
              <span className={`h-2 w-2 rounded-full ${style.dot}`} />
              <span className="flex-1 text-sm text-gray-700">{item.label}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${style.bg} ${style.text}`}>
                {item.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 7.2 주요 패턴 (설계 문서 기반)

| key | label | severity | 정의 |
|-----|-------|----------|------|
| zombie | 좀비 티켓 | critical | IN_PROGRESS + 14일 이상 이벤트 없음 |
| no_response | 응대 누락 | critical | 48h 이내 FIRST_RESPONSE 없음 |
| unassigned | 미배정 4h+ | high | RECEIVED 상태 4시간 이상 |
| fake_close | 가짜 완료 | high | CLOSED이나 출고/회수 없음 |
| cost_mismatch | 비용 불일치 | medium | 비용 항목 존재하나 합산 불일치 |

---

## 8. 모바일 520px 반응형 레이아웃

### 8.1 전체 그리드 브레이크포인트

```
모바일 (<=520px)              데스크톱 (>520px)
+-------------------+        +--------+--------+--------+--------+
| [KPI 1] | [KPI 2] |        | KPI 1  | KPI 2  | KPI 3  | KPI 4  |
+-------------------+        +--------+--------+--------+--------+
| [KPI 3] | [KPI 4] |
+-------------------+        +------------------+------------------+
|   [트렌드 차트]    |        | 트렌드 차트       | 최근 접수 테이블  |
+-------------------+        |                  |                  |
|  [최근 접수 카드]   |        +------------------+------------------+
+-------------------+
|   [액션 큐]        |        +-----------------------------------+
+-------------------+        |          액션 필요 큐               |
                              +-----------------------------------+
```

### 8.2 Tailwind 클래스 매핑

```tsx
// DashboardPage 레이아웃

<section>
  {/* KPI 카드 — 모바일 2열, 데스크톱 4열 */}
  <div className="grid grid-cols-2 gap-3 desktop:grid-cols-4">
    {kpiCards}
  </div>

  {/* 차트 + 최근 티켓 — 모바일 1열 스택, 데스크톱 2열 */}
  <div className="mt-4 grid grid-cols-1 gap-4 desktop:grid-cols-2">
    <DashboardTrendChart ... />
    <DashboardRecentTickets ... />
  </div>

  {/* 액션 큐 — 항상 풀너비 */}
  <div className="mt-4">
    <DashboardActionQueue ... />
  </div>
</section>
```

### 8.3 브레이크포인트 정의 (기존 프로젝트)

```css
/* index.css L124 — 이미 정의됨 */
@custom-variant desktop {
  @media (min-width: 521px) {
    @slot;
  }
}
```

- `grid-cols-2` = 모바일 기본 (KPI)
- `grid-cols-1` = 모바일 기본 (차트/테이블)
- `desktop:grid-cols-4` = 521px+ (KPI)
- `desktop:grid-cols-2` = 521px+ (차트+테이블 나란히)

---

## 9. API 엔드포인트 명세

### 9.1 KPI

```
GET /api/dashboard/kpi

Response 200:
{
  "pendingCount": 24,
  "pendingDelta": -8.3,
  "inProgressCount": 31,
  "inProgressDelta": 12.5,
  "closedTodayCount": 7,
  "closedTodayDelta": 16.7,
  "slaExceededCount": 3,
  "slaExceededDelta": -25.0,
  "updatedAt": "2026-04-30T14:30:00+09:00"
}

RBAC: ALL roles
Cache: Spring @Cacheable(30s)
```

### 9.2 트렌드

```
GET /api/dashboard/trend?months=6

Response 200:
[
  { "month": "2025-11", "received": 38, "completed": 31 },
  ...
]

RBAC: ALL roles
Cache: Spring @Cacheable(60s)
```

### 9.3 최근 티켓

```
GET /api/dashboard/recent-tickets?limit=5

Response 200:
[
  {
    "ticketId": 2641,
    "ticketNo": "AS-2641",
    "customerName": "김민수",
    "productModel": "WE-300",
    "status": "IN_PROGRESS",
    "createdAt": "2026-04-30T11:22:00+09:00"
  },
  ...
]

RBAC: ALL roles (AS_ENGINEER: 본인 담당만, ADMIN: 전체)
```

### 9.4 액션 큐

```
GET /api/dashboard/action-queue

Response 200:
[
  { "key": "zombie",      "label": "좀비 티켓",   "count": 2, "severity": "critical" },
  { "key": "unassigned",  "label": "미배정 4h+",  "count": 5, "severity": "high" },
  { "key": "no_response", "label": "응대 누락",   "count": 1, "severity": "critical" },
  ...
]

RBAC: TEAM_LEAD, ADMIN only (AS_ENGINEER/CS_CX에게는 빈 배열)
```

---

## 10. 상태 관리 구조

### 10.1 결정: zustand vs Context

| 기준 | zustand | Context | react-query |
|------|---------|---------|-------------|
| 서버 데이터 (KPI/차트/티켓) | -- | -- | **사용** |
| 인증 (user/token) | **사용** | -- | -- |
| UI 일시 상태 (sidebar open) | **사용** | -- | -- |
| Dashboard 필터/기간 | -- | -- | queryKey에 포함 |

**결정:**
- **서버 데이터**: `@tanstack/react-query` 단독 관리 (useQuery + refetchInterval)
- **클라이언트 상태**: `zustand` — authStore(user, token), uiStore(sidebar)
- **Context 사용 안 함**: 12명 규모에서 Context 리렌더 이슈 불필요, zustand가 더 경량

### 10.2 데이터 흐름

```
[Spring API]
    |
    | HTTP GET (30초 polling)
    v
[react-query cache] ---- queryKey: ['dashboard', 'kpi']
    |                     staleTime: 30s
    |                     refetchInterval: 30s
    v
[useDashboardKpi()] ---- { data, isLoading, isError }
    |
    v
[DashboardPage]
    |-- KpiCard x4 (data.pendingCount, ...)
    |-- DashboardTrendChart (별도 queryKey)
    |-- DashboardRecentTickets (별도 queryKey)
    '-- DashboardActionQueue (별도 queryKey)
```

### 10.3 QueryClient 설정 (App.tsx)

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

---

## 11. MSW Mock Handler (개발용)

```typescript
// src/mocks/handlers/dashboard.ts

import { http, HttpResponse } from 'msw';

export const dashboardHandlers = [
  // KPI
  http.get('/api/dashboard/kpi', () => {
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

  // 트렌드
  http.get('/api/dashboard/trend', () => {
    return HttpResponse.json([
      { month: '2025-11', received: 38, completed: 31 },
      { month: '2025-12', received: 42, completed: 36 },
      { month: '2026-01', received: 35, completed: 33 },
      { month: '2026-02', received: 48, completed: 40 },
      { month: '2026-03', received: 51, completed: 44 },
      { month: '2026-04', received: 24, completed: 18 },
    ]);
  }),

  // 최근 티켓
  http.get('/api/dashboard/recent-tickets', () => {
    return HttpResponse.json([
      { ticketId: 2641, ticketNo: 'AS-2641', customerName: '김민수',
        productModel: 'WE-300', status: 'IN_PROGRESS',
        createdAt: '2026-04-30T11:22:00+09:00' },
      { ticketId: 2640, ticketNo: 'AS-2640', customerName: '이영희',
        productModel: 'BS-200', status: 'RECEIVED',
        createdAt: '2026-04-30T10:15:00+09:00' },
      { ticketId: 2639, ticketNo: 'AS-2639', customerName: '박서준',
        productModel: 'NC-100', status: 'ASSIGNED',
        createdAt: '2026-04-30T09:48:00+09:00' },
      { ticketId: 2638, ticketNo: 'AS-2638', customerName: '최유진',
        productModel: 'WE-300', status: 'CLOSED',
        createdAt: '2026-04-29T16:30:00+09:00' },
      { ticketId: 2637, ticketNo: 'AS-2637', customerName: '정하늘',
        productModel: 'GT-500', status: 'COST_ENTERED',
        createdAt: '2026-04-29T14:22:00+09:00' },
    ]);
  }),

  // 액션 큐
  http.get('/api/dashboard/action-queue', () => {
    return HttpResponse.json([
      { key: 'zombie', label: '좀비 티켓', count: 2, severity: 'critical' },
      { key: 'no_response', label: '응대 누락', count: 1, severity: 'critical' },
      { key: 'unassigned', label: '미배정 4h+', count: 5, severity: 'high' },
      { key: 'fake_close', label: '가짜 완료', count: 0, severity: 'high' },
      { key: 'cost_mismatch', label: '비용 불일치', count: 3, severity: 'medium' },
    ]);
  }),
];
```

---

## 12. 파일 생성 목록 (구현 시)

| # | 파일 경로 | 역할 | 신규/수정 |
|---|----------|------|:---------:|
| 1 | `src/types/dashboard.ts` | 대시보드 타입 정의 | 신규 |
| 2 | `src/hooks/useDashboardKpi.ts` | KPI react-query hook | 신규 |
| 3 | `src/hooks/useDashboardTrend.ts` | 트렌드 hook | 신규 |
| 4 | `src/hooks/useDashboardRecent.ts` | 최근 티켓 hook | 신규 |
| 5 | `src/hooks/useDashboardActions.ts` | 액션 큐 hook | 신규 |
| 6 | `src/components/common/KpiCard.tsx` | 재사용 KPI 카드 | 신규 |
| 7 | `src/components/dashboard/DashboardTrendChart.tsx` | 트렌드 차트 | 신규 |
| 8 | `src/components/dashboard/DashboardRecentTickets.tsx` | 최근 티켓 | 신규 |
| 9 | `src/components/dashboard/DashboardActionQueue.tsx` | 액션 큐 | 신규 |
| 10 | `src/pages/DashboardPage.tsx` | 페이지 리라이트 | **수정** |
| 11 | `src/mocks/handlers/dashboard.ts` | MSW mock | 신규 |

---

## 13. 선행 의존 (DashboardPage 구현 전 필수)

| # | 선행 작업 | 이유 |
|---|----------|------|
| 1 | `npm install axios @tanstack/react-query zustand recharts dayjs` | 핵심 의존성 |
| 2 | `npm install -D msw` | API 모킹 |
| 3 | `src/api/apiClient.ts` 생성 | useQuery의 queryFn에서 사용 |
| 4 | `App.tsx`에 `QueryClientProvider` 래핑 | useQuery 동작 전제 |
| 5 | `main.tsx`에 MSW 조건부 활성화 | dev 모드 mock 데이터 |
| 6 | `createHashRouter` 전환 | Electron 호환 (CRITICAL) |

---

## 14. QA 검증 체크리스트

- [ ] KPI 4카드에 실제 값(mock) 표시, '---' 아닌 숫자
- [ ] MoM 델타 화살표+퍼센트 정상 표시 (양수=초록/빨강 분기)
- [ ] 30초 후 Network 탭에 `/api/dashboard/kpi` 재요청 확인
- [ ] 탭 비활성 시 polling 중지 확인
- [ ] 로딩 중 pulse 스켈레톤 표시 확인
- [ ] 트렌드 LineChart: 접수(파랑실선) / 완료(초록점선) 2개 라인
- [ ] 최근 접수 5건: 접수일시/고객명/제품/상태뱃지 표시
- [ ] 행 클릭 시 해당 티켓 상세로 이동
- [ ] 액션 큐: count=0인 항목 미표시, severity별 색상 분리
- [ ] 520px 이하: KPI 2열, 차트+테이블 1열 스택, 테이블->카드형
- [ ] 1440px: KPI 4열, 차트+테이블 2열 나란히
- [ ] TypeScript 에러 0건 (`tsc -b --noEmit`)
- [ ] Vite 빌드 성공
