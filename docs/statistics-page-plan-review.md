# StatisticsPage 구현 계획 기술 검증 보고서

> 검증 대상: `docs/statistics-page-plan.md`
> 교차 참조: `src/App.tsx`, `src/components/KpiCard.tsx`, `src/types/index.ts`, `src/mocks/handlers.ts`, `package.json`, `src/index.css`

---

## (1) Hooks 7종 설계: 단일책임원칙 및 재사용성

### 점수: 88/100

### 평가

**강점:**
- 각 hook이 정확히 1개의 API 엔드포인트에 매핑되어 단일책임원칙(SRP)을 준수한다. `useStatsKpi`는 KPI만, `useStatsTrend`는 트렌드만 담당.
- `period` 파라미터를 queryKey에 포함하여 필터 변경 시 자동 캐시 분리 -- react-query의 핵심 패턴을 올바르게 활용.
- 반환 타입이 `UseQueryResult<T>`로 통일되어 컴포넌트 측에서 `{ data, isLoading, isError }` 일관 사용 가능.
- 기존 타입(`TrendPoint`, `ProductFrequency`, `SymptomSegment`, `CostTrendPoint`)을 그대로 재사용하여 타입 중복 없음.

**문제점:**

| # | 심각도 | 문제 | 개선안 |
|---|:------:|------|--------|
| H-1 | **MEDIUM** | **7개 hook 파일이 각각 15줄 미만으로 거의 동일한 보일러플레이트**. queryFn과 queryKey만 다르고 구조가 반복된다. 7파일은 유지보수 시 일괄 수정이 필요할 때 번거롭다. | `createStatsQuery(endpoint, queryKeySegment)` 팩토리 함수를 만들고 7개 hook을 한 파일 `useStats.ts`에서 내보내는 방안 검토. 단, 현재 7파일 방식도 tree-shaking과 코드 분할에 유리하므로 "허용 가능한 반복"이다. |
| H-2 | **MEDIUM** | **`trend`와 `cost-trend` hook이 `params: { months: 6 }`을 하드코딩**. 향후 3개월/12개월 보기가 필요하면 hook 시그니처를 변경해야 한다. | `months` 파라미터를 hook 인자로 승격: `useStatsTrend(period: string, months = 6)`. queryKey에도 `months` 포함. |
| H-3 | **LOW** | **`apiClient`를 `default export`로 import하는데, dev-spec의 apiClient 코드(Section 1)는 `export const apiClient`(named)**. 실제 구현된 `src/api/apiClient.ts`는 `export default apiClient`이므로 계획의 import 방식(`import apiClient from`)이 맞지만, 두 문서 간 불일치가 혼동을 줄 수 있다. | 계획 문서에 "apiClient.ts는 default export" 명시. |

### 재사용성 판정

| DashboardPage 재사용 | StatisticsPage 재사용 | 향후 재사용 |
|:---:|:---:|:---:|
| `useStatsTrend` -> DashboardPage의 트렌드 차트에 동일 hook 사용 가능 | 전용 | `useStatsKpi`의 응답 구조를 DashboardKpiResponse와 통합하면 크로스 페이지 캐시 공유 가능 |

---

## (2) 4종 차트 라이브러리 선택

### 점수: 92/100

### 번들 크기

| 라이브러리 | 전체 gzip | tree-shaken gzip (named import) | 설치 상태 |
|-----------|:---------:|:------:|:--------:|
| **Recharts 3.8.1** | ~45KB | ~30KB | 설치됨 |
| Chart.js + react-chartjs-2 | ~16KB | ~12KB | 미설치 |
| Nivo | ~55KB | ~40KB | 미설치 |

**선택 근거 평가:**
- Recharts가 이미 `package.json`에 설치되어 있으므로 **추가 의존성 0**. 이 결정은 합리적.
- `<ResponsiveContainer>`로 520px 반응형을 라이브러리 수준에서 해결 -- CSS 추가 작업 없음.
- DashboardPage와 동일 라이브러리이므로 **코드베이스 일관성** 유지.
- Chart.js가 번들 크기에서 우위이나, React 래퍼(react-chartjs-2)를 추가 설치해야 하고 선언적 JSX 패턴이 아닌 imperative API 혼합이 필요하여 이 프로젝트의 패턴과 불일치.

**문제점:**

| # | 심각도 | 문제 | 개선안 |
|---|:------:|------|--------|
| C-1 | **MEDIUM** | **PieChart의 `<Cell fill={entry.color}>`에서 `entry` 참조 방식 미명시**. Recharts v3에서 Pie의 children으로 Cell을 렌더링할 때 `data.map((entry, index) => <Cell key={index} fill={entry.color} />)` 패턴을 사용해야 하는데, 이 구현 세부가 pseudocode에서 생략됨. | 완전한 JSX 코드 예시 제공. `data.map`으로 Cell을 순회 렌더링. |
| C-2 | **LOW** | **StackedBarChart의 Y축 `tickFormatter -> "450K"` 로직 미구현**. `(v) => v >= 1000 ? (v/1000).toFixed(0) + 'K' : v` 함수가 필요하나 pseudocode에 언급만 됨. | 실제 구현 시 포맷터 함수 제공. |
| C-3 | **LOW** | **4개 차트 모두 동일한 스켈레톤/빈 데이터 패턴**을 개별 파일에서 반복 구현. | 공통 `ChartWrapper` 컴포넌트로 추출: `<ChartWrapper title={...} isLoading={...} isEmpty={data.length===0}>{children}</ChartWrapper>`. |

### 성능 판정

- Recharts v3의 `ResponsiveContainer`는 `ResizeObserver`를 사용하여 리사이즈 이벤트를 debounce한다 -- 성능 OK.
- 7개 차트가 동시에 마운트되지만, recharts는 SVG 기반이므로 Canvas에 비해 DOM 노드가 많을 수 있다. 12명 사용자 규모에서는 문제 없음.
- `React.memo`가 차트 컴포넌트에 적용되지 않았다. 30초 polling 시 데이터 동일해도 리렌더될 수 있다. **권장: 차트 컴포넌트에 `memo()` 래핑**.

---

## (3) SLA 뱃지 3종: 상태 구분과 색상/아이콘 일관성

### 점수: 85/100

### 평가

**강점:**
- 2-state 시스템(`met: true/false`)이 단순 명확하다. 복잡한 다단계 상태보다 운영자가 즉시 이해 가능.
- 색상: 달성=emerald(초록), 미달=red(빨강) -- 시맨틱 색상이 프로젝트 CSS 변수(`--color-success`, `--color-danger`)와 정렬.
- 아이콘: 체크마크(`\u2713`) / 엑스(`\u2717`) -- 유니코드 문자로 추가 아이콘 라이브러리 불필요.

**문제점:**

| # | 심각도 | 문제 | 개선안 |
|---|:------:|------|--------|
| S-1 | **HIGH** | **"경고" 중간 상태 부재**. SLA 88% (미달이지만 85% 이상)와 SLA 50% (심각한 미달)가 동일한 빨강으로 표시된다. 실무에서 "목표에 근접하지만 미달"과 "심각한 미달"의 구분이 필요하다. | 3-state 확장: `met: true`(>=90%, 초록) / `warning`(80-89%, amber) / `critical`(<80%, 빨강). `SlaItem.met`을 `boolean`에서 `'met' \| 'warning' \| 'critical'`로 변경하거나, `currentRate` 기반으로 프론트엔드에서 파생. |
| S-2 | **MEDIUM** | **`getSlaStatus` 함수가 `badgeBorder` 속성을 반환하지만 사용처가 불명확**. SLA 뱃지의 실제 JSX 코드가 계획에 없어 border가 적용되는지 확인 불가. | 뱃지 JSX 완성 코드 제공. `border ${badgeBorder}` 클래스 적용. |
| S-3 | **LOW** | **`target` 필드가 `string` ("<4h")이나 이는 표시용일 뿐, 실제 달성 여부 판정은 서버에서 수행**. 프론트엔드에서 target을 파싱할 필요 없음이 명시되지 않음. | "met/currentRate는 서버 응답 값을 그대로 사용. target은 display only" 명시. |

### 기존 컴포넌트와의 일관성

KpiCard의 delta 색상(emerald/red)과 SLA 뱃지 색상(emerald/red)이 동일 팔레트를 사용하여 **시각적 일관성 양호**.

---

## (4) Month-Picker 필터: Race Condition 방지

### 점수: 90/100

### 평가

**강점:**
- react-query의 queryKey 기반 캐시 분리가 race condition을 구조적으로 방지한다. period="2026-03"의 응답이 period="2026-04"의 캐시를 덮어쓰지 않음.
- `setPeriod` -> queryKey 변경 -> 자동 재요청 흐름이 React의 단방향 데이터 흐름을 준수.
- 이전 period 캐시가 `staleTime` 동안 유지되므로 뒤로 돌아갈 때 즉시 표시 -- UX 우수.

**문제점:**

| # | 심각도 | 문제 | 개선안 |
|---|:------:|------|--------|
| R-1 | **MEDIUM** | **사용자가 빠르게 월을 3번 변경하면 (04->03->02), 7 x 3 = 21개 요청이 동시 발생**. react-query v5는 이전 queryKey의 fetch를 자동 취소하지 않으므로 (abort 미설정), 불필요한 네트워크 요청이 발생한다. | 각 hook에서 `signal` 전달: `queryFn: async ({ signal }) => { const { data } = await apiClient.get(url, { params, signal }); return data; }`. react-query v5는 queryKey 변경 시 이전 fetch의 AbortController.abort()를 호출한다. |
| R-2 | **LOW** | **`<input type="month">`의 브라우저 호환성**. Firefox는 month input을 text input으로 폴백한다. 12명 사용자가 모두 Chrome/Electron이면 문제없으나, 모바일 웹에서 Firefox 사용 시 UX 저하. | 대안: dayjs로 직접 구현하거나 `<select>` 폴백. 현재 프로젝트의 Electron + Chrome 사용자 기반에서는 OK. |

### race condition 발생 시나리오 검증

```
시나리오: 사용자가 04월 -> 03월 -> 02월을 1초 간격으로 선택

Without signal (현재 계획):
  t=0s: 7 requests for period=04 (진행 중)
  t=1s: 7 requests for period=03 (진행 중, 04 응답 아직 미도착)
  t=2s: 7 requests for period=02 (진행 중)
  -> 최대 21 동시 요청, 04/03 응답은 도착하지만 UI에 반영 불필요

With signal (개선안):
  t=0s: 7 requests for period=04
  t=1s: abort 04, 7 requests for period=03
  t=2s: abort 03, 7 requests for period=02
  -> 최대 7 동시 요청
```

---

## (5) 30초 갱신: 메모리 누수 및 브라우저 포커스 처리

### 점수: 93/100

### 평가

**강점:**
- `refetchInterval` 사용이 useEffect/setInterval 대비 **구조적으로 메모리 누수 방지**. react-query가 컴포넌트 언마운트 시 자동으로 interval을 정리한다.
- `refetchIntervalInBackground: false`로 탭 비활성 시 polling 중지 -- 불필요한 서버 부하 방지.
- KPI/SLA(30초) vs 차트/테이블(60초) 차등 적용이 합리적 -- 실시간성과 서버 부하의 균형.

**문제점:**

| # | 심각도 | 문제 | 개선안 |
|---|:------:|------|--------|
| P-1 | **MEDIUM** | **`refetchOnWindowFocus: false`(전역)로 인해 탭 복귀 시 stale 데이터가 최대 30초간 표시**. 사용자가 5분 이상 다른 탭에 있다가 복귀하면 오래된 KPI를 보게 된다. | StatisticsPage 전용으로 `refetchOnWindowFocus: true`를 각 hook에서 override. App.tsx 전역 `false`와 무관하게 hook-level 설정이 우선 적용된다. |
| P-2 | **LOW** | **7개 hook이 동시에 refetch하면 순간적으로 7 HTTP 요청이 동시 발생**. 12명 x 7 = 최대 84 req/30s. MSW dev 환경에서는 OK이나 실제 Spring 서버에서는 부하 고려 필요. | 서버 측 Spring `@Cacheable(30s)`로 대응 (이미 설계됨). 프론트엔드에서는 `refetchInterval`을 2-3초씩 offset하는 것은 과도한 최적화이므로 불필요. |
| P-3 | **LOW** | **페이지 이탈 후 polling 정리 여부 미명시**. StatisticsPage에서 다른 페이지로 이동하면 컴포넌트 언마운트 -> useQuery 구독 해제 -> refetchInterval 자동 정리. 이 흐름이 문서에 명시되지 않음. | "react-query는 observer가 0이 되면 자동으로 interval을 정리한다" 명시. |

### 메모리 누수 검증

```
[StatisticsPage 마운트]
  -> 7 useQuery observers 등록
  -> 7 refetchInterval 타이머 시작

[/15 (설정) 으로 이동]
  -> StatisticsPage 언마운트
  -> 7 observers 해제
  -> 7 refetchInterval 타이머 자동 정리 (react-query 내부)
  -> gcTime(기본 5분) 후 캐시도 제거

메모리 누수: 없음 (react-query가 보장)
```

---

## (6) 520px 반응형: 텍스트 가독성 및 터치 영역

### 점수: 78/100

### 평가

**강점:**
- `desktop:` variant 사용이 기존 프로젝트 패턴과 완벽히 정렬.
- `ResponsiveContainer width="100%"`로 차트가 모바일에서 자동 축소.
- 담당자 테이블의 `hidden desktop:table` / `desktop:hidden` 전환이 명확.

**문제점:**

| # | 심각도 | 문제 | 개선안 |
|---|:------:|------|--------|
| M-1 | **HIGH** | **터치 영역(44px) 미준수**. MonthPicker의 `<input type="month">`는 브라우저 기본 크기(약 32px 높이)로 렌더링된다. WCAG 2.5.5 권장 최소 44x44px를 충족하지 못한다. SLA 뱃지도 높이가 약 60px이지만 터치 가능 영역이 뱃지 내부로 한정되어 여백 클릭 시 반응 없음. | MonthPicker input에 `min-h-[44px] py-3` 추가. SLA 뱃지를 `<button>` 또는 전체 영역 클릭 가능하게 변경. |
| M-2 | **MEDIUM** | **차트 X축 라벨이 520px에서 겹칠 가능성**. 6개월 라벨("11월", "12월", ...)이 좁은 화면에서 겹칠 수 있다. `tickFormatter`로 "11", "12"로 축약이 계획되어 있으나, BarChart의 Y축(productModel, width=80px)은 520px에서 차트 영역을 심하게 압축한다. | 모바일에서 BarChart Y축 width를 60px로 축소하거나, productModel을 5자로 truncate. 또는 `<input type="month">`와 동일하게 모바일에서는 BarChart를 가로 스크롤 허용. |
| M-3 | **MEDIUM** | **PieChart Legend `layout="vertical" align="right"`가 520px에서 차트와 범례가 겹침**. 모바일에서는 Legend를 하단(`layout="horizontal"`, `verticalAlign="bottom"`)으로 변경해야 한다. | 조건부 Legend 방향: `layout={isMobile ? "horizontal" : "vertical"}`. 또는 단순히 `layout="horizontal" verticalAlign="bottom"`으로 통일(데스크톱에서도 수용 가능). |
| M-4 | **LOW** | **KPI 카드 텍스트 가독성**. `text-[11px]` label과 `text-[10px]` delta가 520px 모바일에서 매우 작다. 특히 고령 사용자에게 가독성 저하. | 모바일에서 label을 12px, delta를 11px로 약간 확대하는 `text-[11px] desktop:text-[11px]` (현재 동일이므로 실질 변경 없음). 이 프로젝트의 12명 사용자가 젊은 직원이므로 **현재 수준 수용 가능**. |

---

## (7) Phase 2 기반과의 통합성

### 점수: 91/100

### 평가

**강점:**
- `apiClient` (axios + JWT interceptor) 동일 인스턴스 사용 -- API 레이어 통합 완벽.
- `QueryClient` (App.tsx) 전역 설정(staleTime 30s, retry 1) 상속 -- 설정 일관성.
- `KpiCard` 컴포넌트를 DashboardPage와 공유 -- 컴포넌트 재사용 실현.
- 타입(`TrendPoint`, `ProductFrequency` 등)이 `types/index.ts`에 이미 정의 -- 중복 없음.
- `createHashRouter` (Electron file:// 호환) 위에서 정상 동작 -- 라우팅 통합 OK.
- MSW mock 2종(`stats/kpi`, `stats/assignee-performance`)이 이미 등록 -- 부분 통합 완료.

**문제점:**

| # | 심각도 | 문제 | 개선안 |
|---|:------:|------|--------|
| I-1 | **HIGH** | **KpiCard에 `format` prop이 없다**. 계획의 `STATS_KPI_CONFIG`는 `format: (v: number) => string` 함수를 포함하는데, 실제 KpiCard의 Props에는 `format`이 없다. KpiCard는 `value: number \| string`을 받아 `toLocaleString()`만 수행. 따라서 "84.4%"나 "3.2일" 같은 포맷된 값은 **호출 측에서 미리 format하여 string으로 전달**해야 한다. | 계획의 KpiCard 호출 코드를 수정: `value={cfg.format(kpi.data?.[cfg.valueKey] ?? 0)}` -> KpiCard에 string이 전달됨. 또는 KpiCard에 `format` prop 추가. |
| I-2 | **MEDIUM** | **KpiCard의 `trend` prop을 계획에서 전달하지 않는다**. `STATS_KPI_CONFIG`에 `trend` 필드가 없다. KpiCard는 `trend: 'up' \| 'down' \| 'flat'`을 필수 prop으로 요구한다. `delta` 값에서 `trend`를 파생해야 한다. | `trend: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'` 파생 로직 추가. `STATS_KPI_CONFIG`에 `trend` 필드를 추가하거나, 호출 측에서 동적 계산. |
| I-3 | **MEDIUM** | **MSW mock 5개 추가 필요(trend, product-frequency, symptom-distribution, cost-trend, sla-summary)가 계획에 언급만 되고 mock 데이터가 제공되지 않음**. 개발자가 mock 데이터를 직접 작성해야 한다. | 설계 문서의 value_example 기반으로 5개 mock handler의 완전한 응답 JSON 제공. |
| I-4 | **LOW** | **`authStore`와의 연동 미구현**. 담당자 성과 테이블의 RBAC(TEAM_LEAD, ADMIN only) 가드가 "향후 연동"으로 남아 있다. | 현 단계에서는 모든 사용자에게 표시하고, LoginPage/RequireAuth 구현 후 `useAuthStore().user.role`로 조건부 렌더링 추가. |

---

## 종합 판정

| # | 검증 항목 | 점수 | 등급 |
|---|---------|:----:|:----:|
| (1) | Hooks 7종 SRP/재사용성 | 88 | A- |
| (2) | 차트 라이브러리 선택 | 92 | A |
| (3) | SLA 뱃지 상태 구분 | 85 | B+ |
| (4) | Race condition 방지 | 90 | A- |
| (5) | 30초 갱신 메모리/포커스 | 93 | A |
| (6) | 520px 반응형 가독성/터치 | 78 | C+ |
| (7) | Phase 2 통합성 | 91 | A- |
| **종합** | | **88** | **B+** |

---

## MUST-FIX (구현 전 반드시 해결: 3건)

1. **I-1: KpiCard format prop 불일치** -- KpiCard에 `format` prop이 없으므로, 호출 측에서 `value={cfg.format(rawValue)}`로 string 변환 후 전달하는 코드를 계획에 명시해야 한다.

2. **I-2: KpiCard trend prop 누락** -- `STATS_KPI_CONFIG`에 `trend` 필드가 없다. `delta`에서 동적으로 파생하는 로직(`delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'`)을 계획에 추가해야 한다.

3. **M-1: 모바일 터치 영역 44px 미준수** -- MonthPicker `<input type="month">`에 `min-h-[44px]` 적용 필요.

## SHOULD-FIX (구현 품질 향상: 5건)

4. **R-1**: queryFn에 `signal` 전달하여 period 변경 시 이전 요청 자동 취소.
5. **P-1**: `refetchOnWindowFocus: true`를 각 hook에서 override하여 탭 복귀 시 즉시 갱신.
6. **S-1**: SLA 뱃지를 3-state(met/warning/critical)로 확장하여 80-89% 구간 분리.
7. **M-3**: PieChart Legend를 `layout="horizontal" verticalAlign="bottom"`으로 변경.
8. **C-3**: 차트 스켈레톤/빈 데이터 패턴을 `ChartWrapper` 공통 컴포넌트로 추출.

## NICE-TO-HAVE (3건)

9. **H-1**: 7개 hook을 팩토리 함수로 통합하여 보일러플레이트 감소.
10. **H-2**: `months` 파라미터를 hook 인자로 승격.
11. **I-3**: MSW mock 5종의 완전한 응답 JSON 제공.
