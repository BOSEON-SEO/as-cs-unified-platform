# StatisticsPage (#14) 구현 상세 계획

> 기준: 현재 코드베이스 분석 (2026-04-30)
> 현재 상태: placeholder 10줄 ("Phase 3 에서 구현 예정")
> 목표: KPI 4카드 + 차트 4종 + SLA + 담당자 성과 + 30초 자동 갱신

---

## 0. 현재 인프라 분석 및 재사용 가능 항목

### 0.1 재사용 가능 (그대로 사용)

| 항목 | 파일 | 재사용 방식 |
|------|------|-----------|
| KpiCard | `src/components/KpiCard.tsx` | StatisticsPage KPI 4카드에 동일 컴포넌트 사용. Props 호환 (label/value/delta/trend/accent/valueColor/isLoading/invertDelta) |
| apiClient | `src/api/apiClient.ts` | useQuery의 queryFn에서 동일 인스턴스 사용 |
| QueryClient | `src/App.tsx` | staleTime 30s, retry 1 -- 전역 설정 그대로 활용 |
| MSW handlers | `src/mocks/handlers.ts` | #9 stats/kpi, #10 stats/assignee-performance 이미 등록됨 |
| 타입 | `src/types/index.ts` | TrendPoint, ProductFrequency, SymptomSegment, CostTrendPoint, ChartData -- 이미 정의됨 |
| CSS 변수 | `src/index.css` | --color-border, --color-text-secondary, --color-text-muted 등 |
| 반응형 | `@custom-variant desktop` | `desktop:` 접두사 (521px+) |

### 0.2 확장 필요 (기존 코드 수정)

| 항목 | 변경 |
|------|------|
| `src/types/index.ts` | StatisticsKpiResponse, SlaItem, AssigneePerformance 인터페이스 추가 |
| `src/mocks/handlers.ts` | 5개 엔드포인트 추가 (trend, product-frequency, symptom-distribution, cost-trend, sla-summary) |

### 0.3 신규 생성

| 항목 | 파일 |
|------|------|
| hooks 7종 | `src/hooks/useStats*.ts` |
| 차트 4종 | `src/components/statistics/*.tsx` |
| SLA 뱃지 | `src/components/statistics/SlaSummary.tsx` |
| 담당자 테이블 | `src/components/statistics/AssigneeTable.tsx` |
| 월 필터 | `src/components/statistics/MonthPicker.tsx` |
| 페이지 | `src/pages/StatisticsPage.tsx` (재작성) |

---

## 1. useStatistics 7종 Hooks

### 공통 패턴

모든 hook이 동일한 구조를 따른다:
- `@tanstack/react-query` v5의 `useQuery` 사용
- `apiClient` (axios) 인스턴스를 queryFn 내에서 호출
- `period` 파라미터를 queryKey에 포함 (month-picker 필터 연동)
- 30초 자동 갱신: `refetchInterval: 30_000`

```
useQuery 공통 옵션:
  staleTime:                  30_000 (App.tsx 전역 기본값 상속)
  refetchInterval:            30_000 (각 hook에서 명시)
  refetchIntervalInBackground: false
  refetchOnWindowFocus:        false (App.tsx 전역 기본값 상속)
  retry:                       1     (App.tsx 전역 기본값 상속)
```

### 1.1 useStatsKpi

| 항목 | 값 |
|------|-----|
| 목적 | KPI 4카드 데이터 (총 접수, 완료율, 평균 처리일, 순비용 + 각 MoM 델타) |
| 파일 | `src/hooks/useStatsKpi.ts` |
| 시그니처 | `useStatsKpi(period: string)` -- period는 "2026-04" 형식 |
| queryKey | `['stats', 'kpi', period]` |
| API | `GET /api/stats/kpi?period={period}` |
| 반환 타입 | `UseQueryResult<StatisticsKpiResponse>` |
| 의존성 | apiClient, StatisticsKpiResponse (types/index.ts에 추가 필요) |
| refetchInterval | `30_000` |

```typescript
// src/hooks/useStatsKpi.ts
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/apiClient.ts';
import type { StatisticsKpiResponse } from '@/types/index.ts';

export function useStatsKpi(period: string) {
  return useQuery<StatisticsKpiResponse>({
    queryKey: ['stats', 'kpi', period],
    queryFn: async () => {
      const { data } = await apiClient.get<StatisticsKpiResponse>(
        '/stats/kpi', { params: { period } },
      );
      return data;
    },
    refetchInterval: 30_000,
  });
}
```

### 1.2 useStatsTrend

| 항목 | 값 |
|------|-----|
| 목적 | 월별 접수 vs 완료 LineChart 데이터 (6개월) |
| 파일 | `src/hooks/useStatsTrend.ts` |
| 시그니처 | `useStatsTrend(period: string)` |
| queryKey | `['stats', 'trend', period]` |
| API | `GET /api/stats/trend?months=6&period={period}` |
| 반환 타입 | `UseQueryResult<TrendPoint[]>` |
| 의존성 | apiClient, TrendPoint (이미 정의됨) |
| refetchInterval | `60_000` (트렌드 데이터는 느리게) |

### 1.3 useStatsProductFrequency

| 항목 | 값 |
|------|-----|
| 목적 | 제품별 A/S 빈도 Top 10 BarChart 데이터 |
| 파일 | `src/hooks/useStatsProductFrequency.ts` |
| 시그니처 | `useStatsProductFrequency(period: string)` |
| queryKey | `['stats', 'product-frequency', period]` |
| API | `GET /api/stats/product-frequency?limit=10&period={period}` |
| 반환 타입 | `UseQueryResult<ProductFrequency[]>` |
| 의존성 | apiClient, ProductFrequency (이미 정의됨) |
| refetchInterval | `60_000` |

### 1.4 useStatsSymptomDistribution

| 항목 | 값 |
|------|-----|
| 목적 | 증상 유형 분포 PieChart 데이터 |
| 파일 | `src/hooks/useStatsSymptomDistribution.ts` |
| 시그니처 | `useStatsSymptomDistribution(period: string)` |
| queryKey | `['stats', 'symptom-distribution', period]` |
| API | `GET /api/stats/symptom-distribution?period={period}` |
| 반환 타입 | `UseQueryResult<SymptomSegment[]>` |
| 의존성 | apiClient, SymptomSegment (이미 정의됨) |
| refetchInterval | `60_000` |

### 1.5 useStatsCostTrend

| 항목 | 값 |
|------|-----|
| 목적 | 비용 3축(지출/수납/보상) 월별 StackedBarChart 데이터 |
| 파일 | `src/hooks/useStatsCostTrend.ts` |
| 시그니처 | `useStatsCostTrend(period: string)` |
| queryKey | `['stats', 'cost-trend', period]` |
| API | `GET /api/stats/cost-trend?months=6&period={period}` |
| 반환 타입 | `UseQueryResult<CostTrendPoint[]>` |
| 의존성 | apiClient, CostTrendPoint (이미 정의됨) |
| refetchInterval | `60_000` |

### 1.6 useStatsSlaSummary

| 항목 | 값 |
|------|-----|
| 목적 | SLA 준수율 3종 뱃지 (접수->배정, 최초응답, 전체해결) |
| 파일 | `src/hooks/useStatsSlaSummary.ts` |
| 시그니처 | `useStatsSlaSummary(period: string)` |
| queryKey | `['stats', 'sla-summary', period]` |
| API | `GET /api/stats/sla-summary?period={period}` |
| 반환 타입 | `UseQueryResult<SlaItem[]>` |
| 의존성 | apiClient, SlaItem (types/index.ts에 추가 필요) |
| refetchInterval | `30_000` |

### 1.7 useStatsAssigneePerformance

| 항목 | 값 |
|------|-----|
| 목적 | 담당자별 성과 테이블 (이름, 총건수, 완료, 평균일, SLA율) |
| 파일 | `src/hooks/useStatsAssigneePerformance.ts` |
| 시그니처 | `useStatsAssigneePerformance(period: string)` |
| queryKey | `['stats', 'assignee-performance', period]` |
| API | `GET /api/stats/assignee-performance?period={period}` |
| 반환 타입 | `UseQueryResult<AssigneePerformance[]>` |
| 의존성 | apiClient, AssigneePerformance (types/index.ts에 추가 필요) |
| refetchInterval | `60_000` |
| 참고 | MSW mock 이미 존재 (#10) |

---

## 2. 차트 4종 컴포넌트

### 라이브러리 선택: Recharts (v3.8.1, 이미 설치됨)

선택 근거:
- React 전용 선언적 API -- JSX에서 `<LineChart><Line dataKey="..."/></LineChart>` 패턴
- `<ResponsiveContainer>` 내장 -- 부모 너비 자동 추적 (520px 반응형 대응)
- tree-shaking 지원 -- named import만 사용하여 번들 최소화
- DashboardPage에서도 동일 라이브러리 사용 예정 -- 학습 비용 0

### 2.1 StatsTrendChart (LineChart)

```
파일: src/components/statistics/StatsTrendChart.tsx
Props: { data: TrendPoint[]; isLoading: boolean }
```

데이터 구조:
```json
[
  { "month": "2025-11", "received": 38, "completed": 31 },
  { "month": "2025-12", "received": 42, "completed": 36 },
  ...
]
```

Recharts 구조:
```
ResponsiveContainer (width="100%" height={250})
  LineChart (data={data})
    CartesianGrid (strokeDasharray="3 3")
    XAxis (dataKey="month", tickFormatter -> "11월")
    YAxis (width={40})
    Tooltip + Legend
    Line (dataKey="received", name="접수", stroke="#3B82F6", solid)
    Line (dataKey="completed", name="완료", stroke="#10B981", dashed)
```

### 2.2 StatsProductBarChart (BarChart)

```
파일: src/components/statistics/StatsProductBarChart.tsx
Props: { data: ProductFrequency[]; isLoading: boolean }
```

데이터 구조:
```json
[
  { "productModel": "WE-300", "count": 42 },
  { "productModel": "BS-200", "count": 35 },
  ...
]
```

Recharts 구조:
```
ResponsiveContainer (width="100%" height={300})
  BarChart (data={data}, layout="vertical")
    CartesianGrid (strokeDasharray="3 3")
    XAxis (type="number")
    YAxis (type="category", dataKey="productModel", width={80})
    Tooltip
    Bar (dataKey="count", fill="#3B82F6", radius={[0,4,4,0]})
```

수평 막대: `layout="vertical"` + XAxis type="number" + YAxis type="category"

### 2.3 StatsSymptomPieChart (PieChart)

```
파일: src/components/statistics/StatsSymptomPieChart.tsx
Props: { data: SymptomSegment[]; isLoading: boolean }
```

데이터 구조:
```json
[
  { "key": "audio",    "label": "음향",   "count": 82, "color": "#3B82F6" },
  { "key": "charging", "label": "충전",   "count": 65, "color": "#10B981" },
  { "key": "exterior", "label": "외관",   "count": 43, "color": "#F59E0B" },
  { "key": "pairing",  "label": "페어링", "count": 31, "color": "#8B5CF6" },
  { "key": "other",    "label": "기타",   "count": 26, "color": "#94A3B8" }
]
```

Recharts 구조:
```
ResponsiveContainer (width="100%" height={250})
  PieChart
    Pie (data={data}, dataKey="count", nameKey="label",
         cx="50%" cy="50%", innerRadius={60}, outerRadius={90})
      Cell (fill={entry.color}) x N
    Tooltip
    Legend (layout="vertical", align="right")
```

도넛: `innerRadius={60}` + `outerRadius={90}`

### 2.4 StatsCostStackedChart (StackedBarChart)

```
파일: src/components/statistics/StatsCostStackedChart.tsx
Props: { data: CostTrendPoint[]; isLoading: boolean }
```

데이터 구조:
```json
[
  { "month": "2025-11", "expense": 450000, "payment": 120000, "compensation": 200000 },
  ...
]
```

Recharts 구조:
```
ResponsiveContainer (width="100%" height={250})
  BarChart (data={data})
    CartesianGrid (strokeDasharray="3 3")
    XAxis (dataKey="month", tickFormatter -> "11월")
    YAxis (tickFormatter -> "450K")
    Tooltip (formatter -> "450,000원")
    Legend
    Bar (dataKey="expense",      name="지출", fill="#EF4444", stackId="cost")
    Bar (dataKey="payment",      name="수납", fill="#10B981", stackId="cost")
    Bar (dataKey="compensation", name="보상", fill="#3B82F6", stackId="cost")
```

3개 Bar가 동일 `stackId="cost"`로 스택.

### 차트 공통: 스켈레톤 + 빈 데이터

```tsx
// isLoading=true -> animate-pulse 블록
// data.length===0 -> "데이터가 없습니다" 회색 메시지

if (isLoading) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 desktop:p-5">
      <div className="animate-pulse">
        <div className="mb-4 h-4 w-40 rounded bg-gray-200" />
        <div className="h-[220px] rounded bg-gray-100" />
      </div>
    </div>
  );
}

if (data.length === 0) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 desktop:p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-800">{title}</h3>
      <div className="flex h-[220px] items-center justify-center text-sm text-gray-400">
        데이터가 없습니다
      </div>
    </div>
  );
}
```

---

## 3. KPI 4카드 + MoM 레이아웃

### 타입 추가 (types/index.ts)

```typescript
export interface StatisticsKpiResponse {
  totalTickets: number;
  totalTicketsDelta: number;        // MoM %
  completionRate: number;           // %
  completionRateDelta: number;      // %p
  avgResolutionDays: number;
  avgResolutionDaysDelta: number;   // days
  totalCostNet: number;             // 원 (음수 = 적자)
  totalCostNetDelta: number;        // MoM %
}
```

### KPI 4카드 구성

기존 `KpiCard` 컴포넌트를 그대로 재사용:

```typescript
const STATS_KPI_CONFIG = [
  {
    label: '총 A/S 접수',
    valueKey: 'totalTickets' as const,
    deltaKey: 'totalTicketsDelta' as const,
    accent: 'border-t-blue-500',
    valueColor: 'text-blue-600',
    format: (v: number) => v.toLocaleString(),
    invertDelta: false,
  },
  {
    label: '완료율',
    valueKey: 'completionRate' as const,
    deltaKey: 'completionRateDelta' as const,
    accent: 'border-t-green-500',
    valueColor: 'text-green-600',
    format: (v: number) => `${v.toFixed(1)}%`,
    invertDelta: false,
  },
  {
    label: '평균 처리일',
    valueKey: 'avgResolutionDays' as const,
    deltaKey: 'avgResolutionDaysDelta' as const,
    accent: 'border-t-amber-400',
    valueColor: 'text-amber-500',
    format: (v: number) => `${v.toFixed(1)}일`,
    invertDelta: true,   // 감소 = 좋음
  },
  {
    label: '순비용',
    valueKey: 'totalCostNet' as const,
    deltaKey: 'totalCostNetDelta' as const,
    accent: 'border-t-red-500',
    valueColor: 'text-red-500',
    format: (v: number) => {
      const abs = Math.abs(v);
      if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
      if (abs >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
      return v.toLocaleString();
    },
    invertDelta: true,   // 비용 감소 = 좋음
  },
] as const;
```

레이아웃: `grid grid-cols-2 gap-3 desktop:grid-cols-4` (DashboardPage와 동일)

---

## 4. SLA 준수율 뱃지 3종

### 타입 추가 (types/index.ts)

```typescript
export interface SlaItem {
  key: string;          // "assignmentSla" | "firstResponseSla" | "resolutionSla"
  label: string;        // "접수 -> 배정"
  target: string;       // "<4h"
  currentRate: number;  // 94.0 (%)
  met: boolean;         // true = 목표 달성
}
```

### 상태 로직

```typescript
// src/components/statistics/SlaSummary.tsx

function getSlaStatus(item: SlaItem) {
  if (item.met) {
    return {
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      badgeBorder: 'border-emerald-200',
      icon: '\\u2713',    // checkmark
      statusLabel: '달성',
    };
  }
  return {
    badgeBg: 'bg-red-50',
    badgeText: 'text-red-700',
    badgeBorder: 'border-red-200',
    icon: '\\u2717',      // cross
    statusLabel: '미달',
  };
}
```

3종 뱃지 렌더링:

```
+------------------+------------------+------------------+
| 접수 -> 배정      | 최초응답          | 전체해결          |
| 목표: <4h        | 목표: <24h       | 목표: <5영업일    |
| 94%  [v 달성]    | 88%  [x 미달]    | 92%  [v 달성]    |
+------------------+------------------+------------------+
```

레이아웃: `grid grid-cols-1 gap-3 desktop:grid-cols-3`

---

## 5. 담당자별 성과 테이블

### 타입 추가 (types/index.ts)

```typescript
export interface AssigneePerformance {
  name: string;
  totalTickets: number;
  completedTickets: number;
  avgDays: number;
  slaRate: number;       // %
}
```

### 테이블 구조

```
+--------+--------+------+----------+---------+
| 담당자  | 총건수  | 완료  | 평균(일)  | SLA(%)  |
+--------+--------+------+----------+---------+
| 김기사  |    68  |   55 |     2.8  |    94   |
| 박수리  |    72  |   61 |     3.1  |    91   |
| 이엔지  |    54  |   48 |     3.5  |    88   |
| 정전자  |    41  |   35 |     2.5  |    96   |
| 한정비  |    38  |   30 |     4.1  |    82   |
+--------+--------+------+----------+---------+
```

컴포넌트: `src/components/statistics/AssigneeTable.tsx`

- 데스크톱: 5열 `<table>` (`hidden desktop:table`)
- 모바일: 카드 리스트 (`desktop:hidden`)
- SLA 색상: >=90% 초록, 80-89% 주황, <80% 빨강
- RBAC: TEAM_LEAD, ADMIN만 표시 (향후 authStore 연동)

---

## 6. Month-Picker 필터 데이터 재요청 메커니즘

### 컴포넌트

```
파일: src/components/statistics/MonthPicker.tsx
Props: { value: string; onChange: (month: string) => void }
```

- `<input type="month">` 네이티브 사용 (별도 라이브러리 불필요)
- 기본값: `dayjs().format('YYYY-MM')` (이번 달)
- value 형식: "2026-04"

### 데이터 재요청 메커니즘

```
StatisticsPage (period useState)
  |
  |-- MonthPicker onChange -> setPeriod("2026-03")
  |
  |-- useStatsKpi(period)            queryKey: ['stats','kpi','2026-03']
  |-- useStatsTrend(period)          queryKey: ['stats','trend','2026-03']
  |-- useStatsProductFrequency(period)
  |-- useStatsSymptomDistribution(period)
  |-- useStatsCostTrend(period)
  |-- useStatsSlaSummary(period)
  |-- useStatsAssigneePerformance(period)
```

period가 변경되면:
1. `setPeriod("2026-03")` -> React 리렌더
2. 7개 hook의 queryKey가 변경됨 (period가 key의 일부)
3. react-query가 새 queryKey에 대한 캐시를 확인
4. 캐시 miss -> queryFn 실행 -> API 호출 (period 파라미터 포함)
5. 이전 period의 캐시는 staleTime 동안 유지 (뒤로 돌아갈 때 즉시 표시)

setInterval/useEffect 불필요 -- react-query의 queryKey 변경이 자동으로 재요청을 트리거.

---

## 7. 30초 자동 갱신 구현 방식

### 결정: react-query `refetchInterval` (useEffect/setInterval 사용 안 함)

| 방식 | 판정 | 이유 |
|------|:----:|------|
| useEffect + setInterval | 불채택 | 수동 상태 관리 필요, 메모리 릭 가능, queryClient와 충돌 |
| useEffect + setTimeout 재귀 | 불채택 | 동일 문제 |
| **react-query refetchInterval** | **채택** | 이미 App.tsx에 QueryClientProvider 설정됨. 탭 비활성 자동 중지, 에러 시 자동 재시도, 캐시 통합 |

### 구현

각 hook에서 `refetchInterval` 지정:

```typescript
// KPI, SLA -- 30초 (실시간성 높음)
refetchInterval: 30_000,
refetchIntervalInBackground: false,

// 차트, 테이블 -- 60초 (변동 적음)
refetchInterval: 60_000,
refetchIntervalInBackground: false,
```

### 동작 흐름

```
[페이지 진입]
  -> 7개 useQuery 실행 -> 7개 API 동시 호출
  -> 데이터 수신 -> 컴포넌트 렌더

[30초 후]
  -> KPI, SLA hook: refetchInterval 트리거 -> /stats/kpi, /stats/sla-summary 재호출
  -> 데이터 변경 시 리렌더, 동일하면 리렌더 없음 (structural sharing)

[60초 후]
  -> 차트 4종, 담당자 테이블: refetchInterval 트리거

[탭 비활성]
  -> refetchIntervalInBackground: false -> polling 중지
  -> 탭 복귀 시 refetchOnWindowFocus: false(전역) -> 즉시 재호출 없음
  -> 다음 interval 도래 시 재개

[period 변경 시]
  -> queryKey 변경 -> 새 데이터 fetch (기존 interval도 새 period로 갱신)
```

---

## 8. 520px 모바일 반응형 CSS 전략

### 브레이크포인트

```css
/* 이미 정의됨: src/index.css L124 */
@custom-variant desktop {
  @media (min-width: 521px) {
    @slot;
  }
}
```

**모바일 (<=520px)**: 모든 섹션 1열 풀너비 스택
**데스크톱 (>520px)**: 2열/4열 그리드

### 섹션별 반응형 매핑

```
StatisticsPage 레이아웃
|
|-- [필터] MonthPicker -- 항상 풀너비
|   className="w-full desktop:w-auto"
|
|-- [KPI] 4카드 -- 모바일 2열, 데스크톱 4열
|   className="grid grid-cols-2 gap-3 desktop:grid-cols-4"
|
|-- [차트 Row 1] 트렌드 + 제품빈도 -- 모바일 1열, 데스크톱 2열
|   className="grid grid-cols-1 gap-4 desktop:grid-cols-2"
|
|-- [차트 Row 2] 증상분포 + 비용추이 -- 모바일 1열, 데스크톱 2열
|   className="grid grid-cols-1 gap-4 desktop:grid-cols-2"
|
|-- [SLA] 3카드 -- 모바일 1열, 데스크톱 3열
|   className="grid grid-cols-1 gap-3 desktop:grid-cols-3"
|
|-- [담당자] 테이블/카드 -- 모바일 카드, 데스크톱 테이블
|   <table className="hidden w-full desktop:table">
|   <div className="space-y-2 desktop:hidden">
```

### 차트 반응형 처리

```tsx
// 모든 차트에서 ResponsiveContainer 사용
<ResponsiveContainer width="100%" height={250}>
  // 부모 div의 너비를 자동 추적 -> 520px에서도 정상 렌더
</ResponsiveContainer>
```

X축 라벨: `tickFormatter={(v) => String(v).slice(5) + '월'}` (모바일에서 간결)

---

## 9. 신규 생성 파일 목록 (구현 순서)

| # | 파일 | 역할 | 의존 |
|---|------|------|------|
| 1 | `src/types/index.ts` (수정) | StatisticsKpiResponse, SlaItem, AssigneePerformance 추가 | -- |
| 2 | `src/mocks/handlers.ts` (수정) | 5개 mock 엔드포인트 추가 | 타입 |
| 3 | `src/hooks/useStatsKpi.ts` | KPI hook | apiClient, 타입 |
| 4 | `src/hooks/useStatsTrend.ts` | 트렌드 hook | apiClient, 타입 |
| 5 | `src/hooks/useStatsProductFrequency.ts` | 제품빈도 hook | apiClient, 타입 |
| 6 | `src/hooks/useStatsSymptomDistribution.ts` | 증상분포 hook | apiClient, 타입 |
| 7 | `src/hooks/useStatsCostTrend.ts` | 비용추이 hook | apiClient, 타입 |
| 8 | `src/hooks/useStatsSlaSummary.ts` | SLA hook | apiClient, 타입 |
| 9 | `src/hooks/useStatsAssigneePerformance.ts` | 담당자 hook | apiClient, 타입 |
| 10 | `src/components/statistics/StatsTrendChart.tsx` | LineChart | recharts, 타입 |
| 11 | `src/components/statistics/StatsProductBarChart.tsx` | BarChart | recharts, 타입 |
| 12 | `src/components/statistics/StatsSymptomPieChart.tsx` | PieChart | recharts, 타입 |
| 13 | `src/components/statistics/StatsCostStackedChart.tsx` | StackedBarChart | recharts, 타입 |
| 14 | `src/components/statistics/SlaSummary.tsx` | SLA 뱃지 3종 | 타입 |
| 15 | `src/components/statistics/AssigneeTable.tsx` | 담당자 테이블 | 타입 |
| 16 | `src/components/statistics/MonthPicker.tsx` | 월 필터 | dayjs |
| 17 | `src/pages/StatisticsPage.tsx` (재작성) | 페이지 조립 | 전체 |

---

## 10. StatisticsPage 최종 구조

```tsx
export default function StatisticsPage() {
  const [period, setPeriod] = useState(dayjs().format('YYYY-MM'));

  const kpi = useStatsKpi(period);
  const trend = useStatsTrend(period);
  const products = useStatsProductFrequency(period);
  const symptoms = useStatsSymptomDistribution(period);
  const costs = useStatsCostTrend(period);
  const sla = useStatsSlaSummary(period);
  const assignees = useStatsAssigneePerformance(period);

  return (
    <section>
      {/* Header + Filter */}
      <div className="flex flex-col gap-3 desktop:flex-row desktop:items-end desktop:justify-between">
        <div>
          <h1 className="page-title">전체 통계 대시보드</h1>
          <p className="page-desc">실시간 운영 통계 -- 30초 자동 갱신</p>
        </div>
        <MonthPicker value={period} onChange={setPeriod} />
      </div>

      {/* KPI 4카드 */}
      <div className="mt-5 grid grid-cols-2 gap-3 desktop:grid-cols-4">
        {STATS_KPI_CONFIG.map(...KpiCard)}
      </div>

      {/* 차트 Row 1: 트렌드 + 제품빈도 */}
      <div className="mt-4 grid grid-cols-1 gap-4 desktop:grid-cols-2">
        <StatsTrendChart data={trend.data ?? []} isLoading={trend.isLoading} />
        <StatsProductBarChart data={products.data ?? []} isLoading={products.isLoading} />
      </div>

      {/* 차트 Row 2: 증상분포 + 비용추이 */}
      <div className="mt-4 grid grid-cols-1 gap-4 desktop:grid-cols-2">
        <StatsSymptomPieChart data={symptoms.data ?? []} isLoading={symptoms.isLoading} />
        <StatsCostStackedChart data={costs.data ?? []} isLoading={costs.isLoading} />
      </div>

      {/* SLA 준수율 */}
      <div className="mt-4">
        <SlaSummary items={sla.data ?? []} isLoading={sla.isLoading} />
      </div>

      {/* 담당자별 성과 */}
      <div className="mt-4">
        <AssigneeTable data={assignees.data ?? []} isLoading={assignees.isLoading} />
      </div>
    </section>
  );
}
```

---

## 11. QA 체크리스트

- [ ] KPI 4카드에 mock 값 표시 (247 / 84.4% / 3.2일 / -890K)
- [ ] MoM 델타 화살표 + 색상 (평균처리일 감소=초록, 순비용 감소=초록)
- [ ] LineChart: 접수(파란실선) + 완료(초록점선) 2개 라인
- [ ] BarChart: 제품 10개 수평 막대
- [ ] PieChart: 5개 세그먼트 도넛 + 범례
- [ ] StackedBarChart: 지출(빨강)/수납(초록)/보상(파랑) 3스택
- [ ] SLA 3종 뱃지: 달성(초록 체크) / 미달(빨강 엑스) 분기
- [ ] 담당자 테이블: 5행 5열 데이터 표시
- [ ] MonthPicker: 월 변경 시 모든 차트/KPI 갱신
- [ ] 30초 후 Network 탭에서 /stats/kpi 재요청 확인
- [ ] 520px: 모든 섹션 1열 풀너비, 가로 스크롤 없음
- [ ] 521px: KPI 4열, 차트 2열 나란히
- [ ] `tsc --noEmit` 에러 0건
- [ ] `vite build` 성공
