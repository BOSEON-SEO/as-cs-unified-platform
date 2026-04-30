# DashboardPage 구현 요구사항 문서 종합 검증 보고서

> 검증 대상: `docs/dashboard-dev-spec.md` + `docs/dashboard-implementation-plan.md`
> 검증 기준일: 2026-04-30
> 검증 관점: (1) 완전성, (2) 기술 타당성, (3) ROADMAP 정렬, (4) 테스트 실행 가능성

---

## 1. 완전성 검증

### 1.1 판정: PASS WITH 7 ISSUES

문서는 개발자가 DashboardPage를 구현하는 데 필요한 대부분의 정보를 포함하고 있다.
16개 파일 목록, Props 인터페이스, 완성 코드 예시, mock 데이터, 테스트 체크리스트가 존재한다.
그러나 아래 7건의 누락/불일치가 있다.

### 1.2 발견된 문제

| # | 심각도 | 문제 | 위치 | 개선 방법 |
|---|:------:|------|------|----------|
| F-1 | **HIGH** | **apiClient.ts 코드 불일치**: dev-spec Section 1은 간략한 `export const apiClient`(인증 없음)를 보여주지만, 실제 구현 요구(Step-3 apiClient 작성 단계)에서는 JWT interceptor가 포함된 133줄 버전이 필요. 두 문서 간 apiClient 코드가 다르다. 더불어 현재 `src/api/apiClient.ts` 파일이 존재하지 않는다(Step-3에서 작성되었으나 하네스에 의해 리셋된 것으로 추정). | dev-spec Sec.1 vs Step-3 apiClient | dev-spec의 apiClient 코드를 "JWT interceptor 포함 전체 버전은 src/api/apiClient.ts 참조"로 수정하고, 파일이 없으면 재생성 필요 |
| F-2 | **HIGH** | **router.tsx import 수정 누락**: DashboardPage를 `export default`로 변경하면 router.tsx L9의 `import { DashboardPage }` (named import)가 컴파일 에러를 발생시킨다. dev-spec Sec.11 하단에 "주의: export 변경" 경고가 있으나, **router.tsx 수정 코드가 제공되지 않았다**. 개발자가 놓칠 수 있다. | dev-spec Sec.11 | router.tsx 수정 코드 명시: `import DashboardPage from '@/pages/DashboardPage';` |
| F-3 | **MEDIUM** | **`npx msw init public --save` 실행 지침 위치 불명확**: dev-spec Sec.4.4에 한 줄로 언급되지만, 실행 순서(파일 생성보다 먼저?)와 생성되는 `public/mockServiceWorker.js`에 대한 설명이 없다. MSW 2.x에서 이 파일이 없으면 `worker.start()`가 404로 실패한다. | dev-spec Sec.4.4 | "파일 생성 전 반드시 실행. `public/mockServiceWorker.js`가 생성됨을 확인" 명시 |
| F-4 | **MEDIUM** | **DashboardRecentTickets에서 `dayjs` import 누락**: Sec.9의 코드 예시에서 `dayjs(t.createdAt).format('MM-DD HH:mm')`을 사용하지만 import문이 없다. `import dayjs from 'dayjs'`가 필요하다. 또한 TS 6.x `verbatimModuleSyntax: true`에서 default import는 `import dayjs from 'dayjs'`로 가능한지 확인 필요 (dayjs는 CJS/ESM 호환이므로 OK). | dev-spec Sec.9 | 코드 상단에 `import dayjs from 'dayjs';` 추가 |
| F-5 | **MEDIUM** | **DashboardRecentTickets에서 `useNavigate` import 누락**: 행 클릭 시 `navigate()` 호출 코드가 있으나 `import { useNavigate } from 'react-router-dom'`과 `const navigate = useNavigate()` 선언이 코드 예시에 없다. | dev-spec Sec.9 | import문과 hook 호출 추가 |
| F-6 | **MEDIUM** | **DashboardActionQueue에서 `useNavigate` import 누락**: Sec.10에서 `navigate(/tickets?filter=...)` 코드가 있으나 import 없음. 동일 이슈. | dev-spec Sec.10 | import문 추가 |
| F-7 | **LOW** | **implementation-plan 타입명 불일치**: implementation-plan에서는 `DashboardTrendPoint`, `DashboardRecentTicket`, `DashboardActionItem`이지만 dev-spec에서는 `TrendPoint`, `RecentTicket`, `ActionItem`으로 축약됨. 두 문서를 동시에 참조하면 혼동 가능. | 두 문서 간 | 하나로 통일 (dev-spec의 축약 버전이 더 깔끔하므로 implementation-plan을 dev-spec에 맞추는 것 권장) |

---

## 2. 기술 타당성 검증

### 2.1 useQuery refetchInterval 30000ms -- 정확한 30초 갱신을 보장하는가?

**판정: CONDITIONALLY CORRECT**

| 항목 | 검증 결과 |
|------|----------|
| `refetchInterval: 30_000` | @tanstack/react-query v5에서 `refetchInterval`은 마지막 fetch 완료 시점 + 30초 후 다음 fetch를 스케줄한다. "정확한 30초 간격"은 아니고 "fetch 완료 후 30초"이므로 API 응답이 2초 걸리면 실제 간격은 32초이다. 12명 규모 대시보드에서 이 정도 오차는 무시 가능. |
| `staleTime: 30_000` | staleTime과 refetchInterval이 동일(30s)하므로 충돌 없음. 데이터가 fresh인 동안에도 refetchInterval은 독립적으로 동작한다. OK. |
| `refetchIntervalInBackground: false` | 탭 비활성 시 polling 중지. 12명 규모에서 서버 부하 절감에 적합. OK. |
| `refetchOnWindowFocus: false` | 탭 복귀 시 즉시 refetch를 하지 않으므로, stale 데이터가 최대 30초간 표시될 수 있다. 실무에서는 `true`로 두어 탭 복귀 시 즉시 갱신하는 것이 UX에 나을 수 있으나, 현재 설정도 수용 가능. |
| `placeholderData: (prev) => prev` | v5에서 `keepPreviousData` 대신 사용. refetch 중 이전 데이터를 유지하여 UI 깜빡임 방지. OK. |

**개선 제안**: `refetchOnWindowFocus`를 `true`로 변경하면 탭 복귀 시 즉시 최신 데이터를 받을 수 있다. 단, `staleTime: 30_000`이므로 30초 이내 재방문은 refetch를 트리거하지 않아 중복 호출 없음.

### 2.2 recharts LineChart가 두 라인을 동시에 표시할 수 있는가?

**판정: CORRECT**

| 항목 | 검증 결과 |
|------|----------|
| recharts `<LineChart>` 내 `<Line>` 2개 | Recharts는 `<LineChart>` 내에 여러 `<Line>` 컴포넌트를 배치하여 다중 라인을 렌더링한다. `dataKey="received"`와 `dataKey="completed"`가 각각 다른 필드를 참조하므로 정상 동작한다. |
| `strokeDasharray="5 3"` | 완료 라인이 점선으로 표시된다. OK. |
| `ResponsiveContainer` | 부모 너비를 자동 추적한다. OK. 단, **부모 요소에 명시적 높이가 없으면 height=0으로 렌더링될 수 있다**. 현재 `height={220}` 고정값이므로 OK. |
| recharts v3.8.1 | 현재 설치된 버전. LineChart, Line, XAxis 등 모두 v3에서 지원. OK. |
| `tickFormatter` 타입 | `(v: string) => v.slice(5)` -- v3에서 tickFormatter의 파라미터가 `string | number`일 수 있으나, 데이터가 string이므로 런타임 OK. TS strict에서 `(v: string)` 타입 단언이 필요할 수 있음. |

**개선 제안**: `tickFormatter` 파라미터 타입을 `(value: string | number) => string`으로 변경하여 recharts v3 내부 타입과 정확히 일치시킬 것.

```typescript
tickFormatter={(v) => String(v).slice(5)}
```

### 2.3 Tailwind 520px 브레이크포인트가 의도대로 동작하는가?

**판정: CORRECT**

| 항목 | 검증 결과 |
|------|----------|
| `@custom-variant desktop { @media (min-width: 521px) }` | `src/index.css` L124-128에 정의됨. Tailwind v4에서 `@custom-variant`는 커스텀 접두사를 생성한다. `desktop:grid-cols-4`는 521px 이상에서만 적용된다. |
| `grid-cols-2 desktop:grid-cols-4` | 기본(모바일): 2열. 521px+: 4열. 의도 일치. |
| `grid-cols-1 desktop:grid-cols-2` | 기본: 1열 스택. 521px+: 2열 나란히. 의도 일치. |
| `hidden desktop:table` | 기본: 숨김. 521px+: table 표시. 의도 일치. |
| `desktop:hidden` | 521px+에서 숨김. 모바일에서만 표시. 의도 일치. |
| `sm:` `md:` 사용 금지 경고 | dev-spec Sec.12에 명시됨. Tailwind v4 `@custom-variant`는 표준 breakpoint를 대체하므로 올바른 안내. |

**이슈 없음**. 반응형 설계가 기존 프로젝트 CSS와 완벽히 정렬됨.

### 2.4 추가 기술 검증

| 항목 | 판정 | 상세 |
|------|:----:|------|
| TS `verbatimModuleSyntax` 준수 | **ISSUE** | dev-spec 코드에서 `import { useQuery } from '@tanstack/react-query'`는 값 import이므로 OK. 그러나 `import type { DashboardKpiResponse }` 형태가 사용되어야 하는데 이 부분은 올바르게 작성됨. |
| TS `erasableSyntaxOnly` 준수 | OK | enum 미사용. `as const` + union type 사용. |
| TS `noUncheckedIndexedAccess` | **ISSUE** | `KPI_CONFIG` 배열에서 `cfg.valueKey`로 `kpi.data?.[cfg.valueKey]`에 접근하는데, `as const`로 선언된 리터럴 키이므로 인덱싱 타입이 좁혀져 OK. 그러나 `data`가 `undefined`일 수 있으므로 `?? 0`이 필수 -- 이미 적용됨. OK. |
| MSW 2.x + Vite ESM 호환 | OK | `import { setupWorker } from 'msw/browser'`는 MSW 2.x ESM entry point. Vite에서 정상 동작. |
| recharts tree-shaking | OK | named import(`import { LineChart, Line, ... }`)만 사용. 전체 recharts를 import하지 않음. |

---

## 3. ROADMAP 정렬 검증

### 3.1 Phase 2 DoD

```
Phase 2 DoD:
- Electron 창에서 로그인 후 고객 조회 가능
- 모바일 브라우저에서도 동일 기능 접근 가능
Phase 2 주요 산출물:
- 전체 대시보드 뼈대
```

| DoD 항목 | DashboardPage 문서 충족 여부 |
|---------|:---:|
| "전체 대시보드 뼈대" | **PARTIAL** -- KPI 4카드 + 차트 + 최근 티켓 + 액션 큐로 뼈대 이상을 구현하나, Phase 2의 핵심은 로그인/고객 조회이므로 대시보드는 "뼈대" 수준이면 충분. 현 문서는 Phase 2를 초과 구현. |
| "Electron 창에서 로그인 후" | **NOT COVERED** -- DashboardPage 문서에 로그인 관련 내용 없음. 별도 LoginPage + authStore가 필요. 이는 DashboardPage 범위 밖이므로 정당. |
| "모바일 브라우저 접근" | **COVERED** -- 520px 반응형 레이아웃 완전 정의. |

### 3.2 Phase 3 DoD (DashboardPage 해당 부분)

```
Phase 3 DoD:
- 접수 -> 처리 -> 완료 E2E 플로우 정상 동작
- 비용 3축 합산 수치 정확
Phase 3 주요 산출물:
- 리포트 현황 (본사 보상 금액 추적)
```

| DoD 항목 | DashboardPage 문서 충족 여부 |
|---------|:---:|
| KPI 30초 갱신 | **COVERED** -- `refetchInterval: 30_000` + TC-1 테스트 체크리스트 |
| 차트 렌더링 | **COVERED** -- recharts LineChart 2라인 + TC-3 체크리스트 |
| 모바일 520px 반응형 | **COVERED** -- `desktop:` 접두사 가이드 + TC-4 체크리스트 |

### 3.3 Phase 5 DoD

```
Phase 5 DoD:
- Electron 빌드 및 모바일 웹 양쪽 최종 QA 통과
```

| DoD 항목 | DashboardPage 문서 충족 여부 |
|---------|:---:|
| Electron 빌드 QA | **NOT COVERED** -- DashboardPage 문서에 Electron 빌드 검증 없음. 단, **createBrowserRouter -> createHashRouter 전환이 선행 의존으로만 언급**되고 실제 전환 코드가 없다. |

### 3.4 ROADMAP 정렬 종합

**판정: SUBSTANTIALLY ALIGNED**

DashboardPage 범위 내에서 Phase 2 "대시보드 뼈대" + Phase 3 "KPI 갱신/차트/반응형"을 충족한다.
Electron 빌드와 로그인은 DashboardPage 범위 밖이므로 별도 작업에서 처리해야 한다.

---

## 4. 테스트 실행 가능성 검증

### 4.1 TC-1: DevTools Network 30초 간격 요청 확인

| 항목 | 판정 | 상세 |
|------|:----:|------|
| 실행 가능성 | **EXECUTABLE** | `npm run dev` -> 브라우저 -> Network 탭 -> 필터 "dashboard"로 확인 가능 |
| Pass 기준 명확성 | **CLEAR** | "30초 간격 /dashboard/kpi 재요청 발생" -- 명확 |
| 전제 조건 | **ISSUE** | MSW가 동작해야 API 응답이 온다. `npx msw init public`이 실행되지 않으면 worker.start()가 실패하여 Network에 요청 자체가 나타나지 않거나 404가 반복된다. TC 전에 "MSW 설정 확인" 전제 조건 명시 필요. |
| 탭 비활성 검증 | OK | "다른 탭으로 이동 -> 30초 대기 -> 돌아오기" 절차 명확 |

### 4.2 TC-2: KPI 숫자 mock 데이터 표시

| 항목 | 판정 | 상세 |
|------|:----:|------|
| 실행 가능성 | **EXECUTABLE** | 페이지 접속 -> 4카드 육안 확인 |
| Pass 기준 명확성 | **CLEAR** | 접수 대기=24, 진행중=31, 금일완료=7, SLA초과=3 구체적 수치 제시 |
| 델타 색상 검증 | **ISSUE** | "진행중: 31, 12.5% (빨간색)"이라고 되어 있는데, `invertDelta: false` + `delta > 0`이면 `isGood = isPositive = true`이므로 **초록색**이 되어야 한다. 그런데 "진행중" 건수 증가가 좋은 것인지? 설계 의도가 불명확하다. 진행중 건수가 증가하면 백로그가 쌓이는 것이므로 "나쁜 것"이어야 한다. **getDeltaDisplay 로직에서 "진행중"의 invertDelta가 잘못 설정되었을 가능성.** |
| 세부 분석 | -- | 현재: `invertDelta: false` -> `delta=12.5 > 0` -> `isGood = true` -> 초록색. 그러나 진행중 건수 증가는 "좋지 않음"이므로 `invertDelta: true`여야 한다. TC-2의 기대 결과 "(빨간색)"이 맞고, KPI_CONFIG의 설정이 틀림. |

**이슈 F-8 (HIGH)**: `진행중` 카드의 `invertDelta`가 `false`로 설정되어 있으나, 진행중 건수 증가는 백로그 증가(나쁨)를 의미하므로 `invertDelta: true`로 변경해야 한다. 또는 "진행중 증가 = 활발히 처리 중 = 좋음"으로 해석하면 `false`가 맞지만, TC-2에서 "(빨간색)"으로 기대하고 있어 문서 내 불일치가 존재한다.

### 4.3 TC-3: LineChart 선 2개 렌더링

| 항목 | 판정 | 상세 |
|------|:----:|------|
| 실행 가능성 | **EXECUTABLE** | 차트 영역 육안 확인 |
| Pass 기준 명확성 | **CLEAR** | "파란 실선 + 초록 점선 + X축 6개월 + Y축 + 범례 + Tooltip" -- 구체적 |
| 스켈레톤 검증 | OK | "로딩 중: 회색 스켈레톤" -- 3G throttle로 확인 가능 |

### 4.4 TC-4: 520px 화면 반응형

| 항목 | 판정 | 상세 |
|------|:----:|------|
| 실행 가능성 | **EXECUTABLE** | Chrome DevTools 기기 시뮬레이터로 확인 |
| Pass 기준 명확성 | **CLEAR** | 375px/520px/521px 3가지 뷰포트별 기대 결과 명시 |
| **경계값 테스트** | **GOOD** | 520px(모바일 최대)과 521px(데스크톱 최소) 경계를 모두 검증. 이는 `@custom-variant desktop { @media (min-width: 521px) }`의 정확한 경계. |
| 가로 스크롤 검증 | OK | "가로 스크롤바 없음" -- 명확한 fail 기준 |

### 4.5 TC-5: 액션 큐 동작

| 항목 | 판정 | 상세 |
|------|:----:|------|
| 실행 가능성 | **EXECUTABLE** | 하단 영역 육안 확인 |
| Pass 기준 | OK | count=0 숨김, severity 색상 구분 |
| 총 건수 검증 | **ISSUE** | "액션 필요 (11건)"이라고 되어 있는데, mock 데이터에서 count>0인 항목의 합은 2+1+5+3=11. 맞음. 단, count=0인 "가짜 완료"도 `items.reduce()`에 포함되면 11이 아닌 11+0=11이므로 filter 전/후 무관. OK. |

### 4.6 TC-6: TypeScript + Vite 빌드

| 항목 | 판정 | 상세 |
|------|:----:|------|
| 실행 가능성 | **EXECUTABLE** | `npx tsc -b --noEmit` + `npx vite build` |
| Pass 기준 | **CLEAR** | 에러 0건 + 빌드 성공 |

---

## 5. 종합 발견 사항

### 5.1 MUST FIX (구현 전 반드시 수정)

| # | 심각도 | 문제 | 수정 방법 |
|---|:------:|------|----------|
| F-1 | HIGH | `src/api/apiClient.ts` 파일 부재 + dev-spec 코드 불일치 | 파일 재생성 (JWT interceptor 포함 전체 버전). dev-spec에는 "src/api/apiClient.ts 참조"로 수정 |
| F-2 | HIGH | router.tsx import 수정 코드 누락 | `import DashboardPage from '@/pages/DashboardPage.tsx'`로 변경하는 코드를 dev-spec에 추가 |
| F-8 | HIGH | "진행중" KPI invertDelta 불일치 (코드: false/초록, TC: 빨강) | 비즈니스 규칙 확정 후 KPI_CONFIG 또는 TC-2 기대값 수정 |

### 5.2 SHOULD FIX (구현 품질 향상)

| # | 심각도 | 문제 | 수정 방법 |
|---|:------:|------|----------|
| F-3 | MEDIUM | MSW init 실행 순서 불명확 | "0번 단계: `npx msw init public --save` 실행" 명시 |
| F-4 | MEDIUM | DashboardRecentTickets dayjs import 누락 | `import dayjs from 'dayjs'` 추가 |
| F-5 | MEDIUM | DashboardRecentTickets useNavigate 누락 | `import { useNavigate } from 'react-router-dom'` 추가 |
| F-6 | MEDIUM | DashboardActionQueue useNavigate 누락 | 동일 |
| F-9 | MEDIUM | recharts tickFormatter 타입 안전성 | `(v) => String(v).slice(5)` 으로 변경 |
| F-10 | MEDIUM | `refetchOnWindowFocus: false` UX 영향 | 탭 복귀 시 stale 데이터 최대 30초. `true`로 변경 권장 |

### 5.3 NICE TO HAVE

| # | 심각도 | 문제 | 수정 방법 |
|---|:------:|------|----------|
| F-7 | LOW | 두 문서 간 타입명 불일치 | 하나로 통일 |
| F-11 | LOW | TC 전제 조건에 "MSW 설정 완료" 미명시 | TC-0 또는 전제 조건 섹션 추가 |
| F-12 | LOW | isError 상태 처리 미정의 | 네트워크 에러 시 "데이터를 불러올 수 없습니다" 메시지 컴포넌트 추가 |
| F-13 | LOW | 빈 데이터 처리 미정의 (recent tickets 0건) | "최근 접수가 없습니다" 빈 상태 UI 정의 |

---

## 6. 수정 반영 권장 우선순위

```
1. [F-1] apiClient.ts 파일 재생성 (없으면 전체 hook이 동작 불가)
2. [F-2] router.tsx import 수정 명시 (없으면 TS 컴파일 에러)
3. [F-8] "진행중" invertDelta 비즈니스 규칙 확정
4. [F-3] MSW init 실행 순서 명시
5. [F-4~F-6] 누락 import문 추가
6. [F-9~F-13] 품질 개선
```

---

## 7. 최종 판정

| 검증 관점 | 점수 | 판정 |
|----------|:----:|:----:|
| **(1) 완전성** | 82/100 | PASS WITH ISSUES -- 코드 예시·타입·mock 데이터 충실. import 누락과 apiClient 불일치가 주요 문제. |
| **(2) 기술 타당성** | 90/100 | PASS -- refetchInterval, recharts, Tailwind 반응형 모두 기술적으로 올바름. tickFormatter 타입과 refetchOnWindowFocus 개선 권장. |
| **(3) ROADMAP 정렬** | 88/100 | PASS -- Phase 2 "대시보드 뼈대" + Phase 3 KPI/차트/반응형 충족. Electron은 범위 밖 별도 처리. |
| **(4) 테스트 실행 가능성** | 85/100 | PASS -- 6개 TC 모두 실행 가능. MSW 전제 조건 미명시와 "진행중" 델타 색상 불일치가 주요 문제. |
| **종합** | **86/100** | **APPROVED WITH 3 MUST-FIX** |

3건의 MUST-FIX(apiClient 파일 재생성, router.tsx import 수정 명시, invertDelta 비즈니스 규칙 확정)를 해결하면 개발자가 즉시 구현에 착수할 수 있는 수준이다.
