# Milestone 구현 계획서

> 대상 페이지: DashboardPage (#5), StatisticsPage (#14), ReportPage (#13)
> 기준일: 2026-04-30
> 현재 상태: 레이아웃 셸 + placeholder (API 인프라 전무)

---

## 1. 구현 체크리스트

### Phase A: 기반 인프라 (선행 필수 — 모든 페이지의 전제 조건)

- [ ] **A-1** `npm install` 핵심 의존성 6종
  - `axios` (HTTP 클라이언트)
  - `@tanstack/react-query` (서버 상태 + 30초 polling)
  - `zustand` (클라이언트 상태: auth, UI)
  - `recharts` (차트 4종)
  - `dayjs` (날짜 포맷, 경과일 계산)
  - `msw` (dev 전용 API 모킹)
- [ ] **A-2** `createBrowserRouter` → `createHashRouter` 전환 (Electron file:// 호환)
- [ ] **A-3** `src/api/apiClient.ts` — axios 인스턴스 + JWT interceptor + 401 auto-refresh
- [ ] **A-4** `src/stores/authStore.ts` — zustand persist (user, token, login/logout)
- [ ] **A-5** `App.tsx` → `QueryClientProvider` 래핑 (staleTime 30s)
- [ ] **A-6** `main.tsx` → MSW 조건부 활성화 (`VITE_ENABLE_MSW=true`)
- [ ] **A-7** `vite.config.ts` → `server.proxy` 추가 (`/api → Spring 서버`)
- [ ] **A-8** `src/types/stats.ts` — 통계/리포트 도메인 타입 정의
- [ ] **A-9** `src/components/common/KpiCard.tsx` — 재사용 KPI 카드 컴포넌트 (값, 델타, 악센트, 로딩)
- [ ] **A-10** `src/mocks/handlers/stats.ts` — 통계 API 15개 엔드포인트 모의 핸들러

### Phase B: DashboardPage (#5) — A/S 현황 대시보드

- [ ] **B-1** `src/hooks/useDashboardKpi.ts` — react-query hook (`refetchInterval: 30_000`)
- [ ] **B-2** DashboardPage KPI 4카드 API 바인딩 (접수대기, 진행중, 금일완료, SLA초과)
- [ ] **B-3** KPI 카드에 MoM 델타(전월 대비 증감) 표시 (화살표 + 퍼센트)
- [ ] **B-4** KPI 카드 로딩 스켈레톤 (pulse 애니메이션)
- [ ] **B-5** 최근 A/S 접수 목록 (5건, 테이블 또는 카드형)
- [ ] **B-6** 월별 접수/완료 트렌드 `LineChart` (Recharts, 최근 6개월)
- [ ] **B-7** 액션 필요 큐 — 이상 패턴 카드 (좀비 티켓, 응대 누락, 미배정 4h+ 등)
- [ ] **B-8** 모바일 반응형: KPI 2열, 차트 풀너비, 액션큐 스택
- [ ] **B-9** `export function` → `export default function` 일관성 수정
- [ ] **B-10** 30초 자동 갱신 주기 동작 검증 (DevTools Network 탭)

### Phase C: StatisticsPage (#14) — 전체 통계 대시보드

- [ ] **C-1** `src/hooks/useStatistics.ts` — 통계 API 7종 react-query hooks
- [ ] **C-2** KPI 4카드 (총 접수 / 완료율 / 평균 처리일 / 순비용) + MoM 델타
- [ ] **C-3** 월별 접수 vs 완료 `LineChart` (Recharts, 최근 6개월)
- [ ] **C-4** 제품별 A/S 빈도 Top 10 `BarChart` (수평 막대)
- [ ] **C-5** 증상 유형 분포 `PieChart` / DonutChart
- [ ] **C-6** 비용 월별 추이 `StackedBarChart` (지출/수납/보상 3축)
- [ ] **C-7** SLA 준수율 섹션 (접수→배정, 최초응답, 전체해결 — 달성/미달 뱃지)
- [ ] **C-8** 담당자별 성과 테이블 (이름, 총건수, 완료, 평균일, SLA율)
- [ ] **C-9** 기간 필터 (month-picker, 기본값: 이번 달)
- [ ] **C-10** 30초 자동 갱신 (`refetchInterval: 30_000`)
- [ ] **C-11** 모바일 반응형: 차트 1열 풀너비 스택, 테이블 가로 스크롤

### Phase D: ReportPage (#13) — 리포트 현황 + 엑셀 다운로드

- [ ] **D-1** `src/hooks/useReports.ts` — 리포트 생성/미리보기 hooks
- [ ] **D-2** 리포트 유형 선택 UI (월간 / 분기 / 본사보상 / 커스텀 — 4 카드)
- [ ] **D-3** 기간 입력 (월간: month-picker, 분기: quarter-picker, 커스텀: date-range)
- [ ] **D-4** 리포트 미리보기 KPI 6종 (총접수, 총완료, 처리율, 총비용, 보상청구, 평균처리일)
- [ ] **D-5** `src/utils/downloadFile.ts` — 범용 blob 다운로드 유틸리티
- [ ] **D-6** CSV 다운로드 (`GET /api/reports/export/csv` → blob → 파일 저장)
- [ ] **D-7** XLSX 다운로드 (`GET /api/reports/export/xlsx` → blob → 파일 저장)
- [ ] **D-8** 다운로드 버튼 3종 (CSV / XLSX / PDF — PDF는 "준비 중" 비활성)
- [ ] **D-9** 다운로드 진행 표시 (로딩 스피너 또는 프로그레스)
- [ ] **D-10** 모바일 반응형: 리포트 카드 1열 스택, 기간 입력 풀너비

### Phase E: Electron 빌드 + 반응형 QA

- [ ] **E-1** `createHashRouter` 전환 후 Electron dev 모드 라우팅 정상 확인
- [ ] **E-2** `npm run build:web` (Vite 빌드) 에러 0건 확인
- [ ] **E-3** `npm run build` (Electron-builder) 실행 → `.exe` / `.dmg` 생성 확인
- [ ] **E-4** Electron prod 빌드에서 3개 페이지 라우팅 정상 확인
- [ ] **E-5** 520px 이하 모바일 반응형: DashboardPage, StatisticsPage, ReportPage 검증
- [ ] **E-6** 1440px 데스크톱: 3개 페이지 레이아웃 정상 확인
- [ ] **E-7** TypeScript strict 모드 에러 0건 (`tsc -b --noEmit`)
- [ ] **E-8** 번들 사이즈 검증 (recharts 추가 후 JS gzip < 200KB 목표)

---

## 2. 기능별 구현 우선순위

| 우선순위 | 기능 | 근거 | 예상 공수 | 의존 |
|:--------:|------|------|:---------:|------|
| **P0** | 기반 인프라 (A-1~A-10) | 모든 페이지의 전제 조건. 이것 없이는 어떤 기능도 동작 불가 | 6h | 없음 |
| **P1** | DashboardPage KPI + 30초 갱신 (B-1~B-4, B-10) | 메인 index 페이지. 로그인 후 최초 화면. ROADMAP Phase 2 DoD | 4h | A |
| **P2** | DashboardPage 차트 + 최근 티켓 (B-5~B-7) | KPI 보완. 운영 현황 시각화의 핵심 | 4h | B-1~B-4 |
| **P3** | StatisticsPage 전체 (C-1~C-11) | Phase 3 DoD 연관. KPI + 차트 4종 + 테이블 | 8h | A |
| **P4** | ReportPage + 엑셀 다운로드 (D-1~D-10) | Phase 3 DoD "리포트 현황". CSV/XLSX 다운로드 | 6h | A |
| **P5** | 반응형 QA (B-8, C-11, D-10, E-5~E-6) | 520px 모바일 + 1440px 데스크톱 양쪽 검증 | 3h | B, C, D |
| **P6** | Electron 빌드 검증 (A-2, E-1~E-4, E-7~E-8) | ROADMAP Phase 5 DoD "Electron 빌드 QA" | 2h | 전체 |

**총 예상 공수: 33h (~4.5 영업일)**

```
Day 1 (8h): P0 인프라 + P1 DashboardPage KPI
Day 2 (8h): P2 DashboardPage 차트/액션큐 + P3 StatisticsPage 시작
Day 3 (8h): P3 StatisticsPage 완료 + P4 ReportPage 시작
Day 4 (6h): P4 ReportPage 완료 + P5 반응형 QA
Day 5 (3h): P6 Electron 빌드 + 최종 QA + 버그 수정
```

---

## 3. 기술적 위험 요소 및 병목 지점

### CRITICAL 위험

| # | 위험 | 영향 | 완화 전략 |
|---|------|------|----------|
| R1 | **createBrowserRouter → createHashRouter 전환 시 Sidebar NavLink 깨짐** | 모든 페이지 라우팅 실패 | router.tsx + Sidebar.tsx + Header.tsx 3파일 동시 수정. routesMeta.path가 hash 포함하지 않으므로 NavLink `to` 값은 동일 — react-router-dom이 hash 내부에서 처리 |
| R2 | **Recharts 번들 크기 (gzip ~45KB)** | JS 총 번들 gzip 140KB 이상으로 증가 | 필요한 컴포넌트만 named import (`import { LineChart, Line, XAxis, ... } from 'recharts'`). tree-shaking 작동 확인. 코드 스플리팅(lazy) 검토 |
| R3 | **MSW + Vite 호환 (msw/browser + ESM)** | dev 모드에서 API 모킹 실패 | MSW 2.x의 `setupWorker`가 Vite ESM과 호환됨 확인. `npx msw init public` 실행 필수 |

### HIGH 위험

| # | 위험 | 영향 | 완화 전략 |
|---|------|------|----------|
| R4 | **Spring API 미준비** | 실제 데이터 바인딩 불가 | MSW mock handlers로 모든 엔드포인트 모킹. mock 데이터는 설계 문서의 value_example 기반 |
| R5 | **TS 6.x + Recharts 타입 호환** | 설치 시 타입 에러 | `skipLibCheck: true` 이미 설정됨. 설치 직후 `tsc --noEmit` 실행 |
| R6 | **엑셀 다운로드 — 서버 API 미존재** | blob 다운로드 테스트 불가 | MSW에서 mock blob 응답 반환. 실제 동작은 Spring 연동 시 검증 |

### MEDIUM 위험

| # | 위험 | 영향 | 완화 전략 |
|---|------|------|----------|
| R7 | **Electron-builder 실행 환경** | CI/로컬 환경 차이로 빌드 실패 | `npm run build:web` 먼저 확인. electron-builder는 로컬에서만 검증 (CI에서는 web 빌드만) |
| R8 | **30초 polling 12명 동시 접속** | 서버 부하 (24 req/min) | react-query의 `refetchOnWindowFocus: false`로 불필요 호출 방지. Spring 측 `@Cacheable(30s)` 권장 |
| R9 | **Recharts 차트 모바일 반응형** | 520px에서 라벨 겹침 | `<ResponsiveContainer width="100%" height={250}>` 사용. 모바일에서 X축 라벨 각도 조정 (`angle={-45}`) |

---

## 4. 최종 QA 검증 기준

### 4.1 리포트 엑셀 다운로드 동작 확인

| # | 검증 항목 | 기대 결과 | 검증 방법 |
|---|----------|----------|----------|
| QA-D1 | 월간 리포트 CSV 다운로드 | `AS_monthly_summary_2026-04_*.csv` 파일 다운로드 시작 | ReportPage에서 [월간] 선택 → 기간 입력 → [CSV 다운로드] 클릭 |
| QA-D2 | XLSX 다운로드 | `.xlsx` 파일이 정상 다운로드되고, Excel에서 열림 | [XLSX 다운로드] 클릭 → 파일 열기 → 한글 깨짐 없음 |
| QA-D3 | CSV 한글 인코딩 | UTF-8 BOM 포함. Excel에서 한글 정상 표시 | 다운로드된 CSV를 Excel/메모장에서 확인 |
| QA-D4 | 미리보기 KPI | 6종 KPI (총접수, 총완료, 처리율, 총비용, 보상청구, 평균처리일) 정상 표시 | 리포트 유형 선택 → 기간 입력 후 미리보기 섹션 확인 |
| QA-D5 | 빈 데이터 처리 | "데이터가 없습니다" 메시지 표시. 다운로드 버튼 비활성 | 미래 날짜 범위 선택 시 |

### 4.2 통계 차트 정상 렌더링

| # | 검증 항목 | 기대 결과 | 검증 방법 |
|---|----------|----------|----------|
| QA-C1 | 트렌드 LineChart | 접수(파랑실선) vs 완료(초록점선) 2선 표시. X축 6개월, Y축 건수 | StatisticsPage 진입 → 차트 영역 확인 |
| QA-C2 | 제품별 BarChart | Top 10 수평 막대. 모델명 라벨 정상 표시 | 같은 페이지 스크롤 다운 |
| QA-C3 | 증상 DonutChart | 5개 세그먼트 (음향/충전/외관/페어링/기타). 범례 표시 | 같은 페이지 |
| QA-C4 | 비용 StackedBarChart | 지출(빨강)/수납(초록)/보상(파랑) 3스택. 월별 X축 | 같은 페이지 |
| QA-C5 | 차트 로딩 | 데이터 로딩 중 스켈레톤 또는 스피너 표시 | Network throttle 3G 적용 후 확인 |
| QA-C6 | 차트 빈 데이터 | "데이터 없음" 메시지 또는 빈 차트 정상 표시 | MSW 핸들러에서 빈 배열 반환 시 |
| QA-C7 | 차트 반응형 | 520px에서 차트가 풀너비로 정상 렌더링. 라벨 겹침 없음 | Chrome DevTools 모바일 뷰포트 |

### 4.3 대시보드 KPI 30초 갱신 주기 확인

| # | 검증 항목 | 기대 결과 | 검증 방법 |
|---|----------|----------|----------|
| QA-B1 | 최초 로딩 | KPI 4카드에 실제 값 표시 (mock 데이터) | DashboardPage 진입 → 값 '—' 아닌 숫자 확인 |
| QA-B2 | 30초 자동 갱신 | 30초 후 Network 탭에 `/api/dashboard/kpi` 재요청 관찰 | DevTools Network 탭 열고 60초 대기 → 2회 요청 확인 |
| QA-B3 | 탭 비활성 시 미갱신 | 브라우저 탭 비활성 상태에서 polling 중지 | 다른 탭 이동 → Network 탭에 추가 요청 없음 확인 |
| QA-B4 | KPI 로딩 스켈레톤 | 데이터 로딩 중 pulse 애니메이션 표시 | 새로고침 직후 0.5초 이내 스켈레톤 확인 |
| QA-B5 | MoM 델타 표시 | 증감률(+12% 또는 -3.2%)이 화살표 아이콘과 함께 표시 | KPI 카드 하단 확인 |

### 4.4 Electron 패키지 빌드 성공

| # | 검증 항목 | 기대 결과 | 검증 방법 |
|---|----------|----------|----------|
| QA-E1 | TypeScript 빌드 | `tsc -b --noEmit` 에러 0건 | 터미널 실행 |
| QA-E2 | Vite 프로덕션 빌드 | `npm run build:web` 성공. dist/ 생성 | 터미널 실행 → dist/ 내 index.html 존재 확인 |
| QA-E3 | Electron-builder 실행 | `npm run build` 성공. release/ 내 설치파일 생성 | 터미널 실행 → `.exe` 또는 `.dmg` 파일 생성 확인 |
| QA-E4 | Electron 라우팅 | prod 빌드 실행 후 DashboardPage(/) 정상 표시 | 생성된 설치파일 실행 → 메인 화면 확인 |
| QA-E5 | Electron 페이지 이동 | Sidebar에서 /14 (통계), /13 (리포트) 클릭 시 정상 이동 | 사이드바 클릭 테스트 |
| QA-E6 | 번들 사이즈 | JS gzip < 200KB (recharts 포함) | Vite 빌드 출력 확인 |

### 4.5 모바일 520px 이하 반응형 정상

| # | 검증 항목 | 기대 결과 | 검증 방법 |
|---|----------|----------|----------|
| QA-M1 | DashboardPage KPI | 2열 그리드로 정상 표시 | Chrome DevTools → 375px iPhone SE |
| QA-M2 | DashboardPage 차트 | 풀너비 렌더링. X축 라벨 축약 또는 각도 조정 | 같은 뷰포트 |
| QA-M3 | StatisticsPage 차트 4종 | 모두 1열 풀너비 스택. 가로 스크롤 없음 | 520px 뷰포트에서 스크롤 확인 |
| QA-M4 | StatisticsPage 테이블 | 가로 스크롤 허용 (overflow-x-auto) | 담당자 성과 테이블 확인 |
| QA-M5 | ReportPage 카드 | 4개 리포트 유형 카드가 1열로 스택 | 같은 뷰포트 |
| QA-M6 | ReportPage 다운로드 | 다운로드 버튼 터치 영역 충분 (최소 44x44px) | 버튼 사이즈 확인 |
| QA-M7 | Sidebar 오버레이 | 햄버거 클릭 → 사이드바 슬라이드 표시 → 페이지 이동 후 자동 닫힘 | 전체 모바일 플로우 |

---

## 5. 외부 의존성, 라이브러리, API 추천

### 5.1 설치 필요 라이브러리 (npm install)

| 패키지 | 버전 | 용도 | 번들 영향 |
|--------|------|------|----------|
| `axios` | ^1.7 | HTTP 클라이언트 + interceptor | gzip ~6KB |
| `@tanstack/react-query` | ^5.x | 서버 상태 + 30초 polling + cache invalidation | gzip ~12KB |
| `zustand` | ^5.x | 클라이언트 상태 (auth, UI) | gzip ~1.5KB |
| `recharts` | ^2.15 | 차트 4종 (Line, Bar, Pie, StackedBar) | gzip ~45KB (tree-shaking 적용 시 ~30KB) |
| `dayjs` | ^1.11 | 날짜 포맷, MoM 델타 계산 | gzip ~3KB |
| `msw` | ^2.x | dev 전용 API 모킹 (devDependencies) | 프로덕션 번들 영향 없음 |

**번들 총 증가량 추정**: 기존 gzip 95KB + 추가 ~68KB = 총 ~163KB (200KB 목표 이내)

### 5.2 설치 불필요 (서버 측에서 처리)

| 기능 | 근거 |
|------|------|
| `xlsx` / `exceljs` | XLSX/CSV는 Spring 서버에서 생성 → blob 응답. 프론트엔드는 blob 다운로드만 |
| `file-saver` | `<a>` 태그 + `URL.createObjectURL` 으로 대체 가능 (별도 라이브러리 불필요) |
| `jspdf` | PDF는 Phase 5+ 후순위. "준비 중" 비활성 버튼으로 처리 |

### 5.3 Spring API 엔드포인트 (MSW mock 대상)

| Method | Path | 용도 | 페이지 |
|--------|------|------|--------|
| GET | `/api/dashboard/kpi` | KPI 4종 + 델타 | Dashboard |
| GET | `/api/dashboard/recent-tickets` | 최근 5건 | Dashboard |
| GET | `/api/dashboard/action-queue` | 이상 패턴 건수 | Dashboard |
| GET | `/api/stats/kpi` | 통계 KPI 4종 | Statistics |
| GET | `/api/stats/trend?months=6` | 월별 접수/완료 추이 | Statistics, Dashboard |
| GET | `/api/stats/product-frequency?limit=10` | 제품별 빈도 | Statistics |
| GET | `/api/stats/symptom-distribution` | 증상 유형 분포 | Statistics |
| GET | `/api/stats/cost-trend?months=6` | 비용 3축 월별 추이 | Statistics |
| GET | `/api/stats/sla-summary` | SLA 준수율 3종 | Statistics |
| GET | `/api/stats/assignee-performance` | 담당자별 성과 | Statistics |
| POST | `/api/reports/generate` | 리포트 생성 (미리보기) | Report |
| GET | `/api/reports/preview/{id}` | 미리보기 KPI | Report |
| GET | `/api/reports/export/csv` | CSV 다운로드 (blob) | Report |
| GET | `/api/reports/export/xlsx` | XLSX 다운로드 (blob) | Report |

---

## 6. 예상 일정 및 테스트 범위

### 6.1 일정

```
Week 1, Day 1-2 (16h)
├── Day 1 AM : P0 인프라 설치 + hashRouter 전환 (A-1~A-7)          [4h]
├── Day 1 PM : P0 타입/KpiCard/MSW handlers (A-8~A-10)            [2h]
│              P1 DashboardPage KPI 바인딩 + 30초 갱신 (B-1~B-4)   [2h]
├── Day 2 AM : P2 DashboardPage 차트 + 최근 티켓 + 액션큐 (B-5~B-7) [4h]
└── Day 2 PM : P3 StatisticsPage KPI + 차트 시작 (C-1~C-4)         [4h]

Week 1, Day 3-4 (14h)
├── Day 3 AM : P3 StatisticsPage 차트 완료 (C-5~C-8)              [4h]
├── Day 3 PM : P3 StatisticsPage 필터 + polling + 반응형 (C-9~C-11) [3h]
│              P4 ReportPage 시작 (D-1~D-3)                        [3h]
└── Day 4 AM : P4 ReportPage 미리보기 + 다운로드 (D-4~D-9)         [4h]

Week 1, Day 5 (5h)
├── AM : P5 반응형 QA 3페이지 (B-8, C-11, D-10, E-5~E-6)          [3h]
└── PM : P6 Electron 빌드 + 최종 QA + 버그 수정 (E-1~E-8)          [2h]
```

**총: 5 영업일 (35h)**

### 6.2 테스트 범위

#### 단위 테스트 (tsc --noEmit + lint)

| 대상 | 검증 |
|------|------|
| 타입 컴파일 | `src/types/stats.ts` — 모든 인터페이스 정상 컴파일 |
| KpiCard 컴포넌트 | props 타입 정합성 |
| downloadFile 유틸 | blob → a.click() 로직 (브라우저 환경 mock 필요) |
| API hooks | react-query key + refetchInterval 설정 확인 |

#### 통합 테스트 (MSW + 수동)

| 시나리오 | 검증 |
|---------|------|
| Dashboard 진입 | KPI 로딩 → 데이터 표시 → 30초 후 재요청 |
| Statistics 차트 렌더링 | 4종 차트 모두 데이터 표시 + 빈 데이터 처리 |
| Report CSV 다운로드 | 파일 다운로드 트리거 → 파일 존재 확인 |
| Electron 라우팅 | hash router로 3페이지 정상 이동 |
| 모바일 반응형 | 375px에서 레이아웃 깨짐 없음 |

#### E2E 검증 (수동)

| 시나리오 | 경로 |
|---------|------|
| Happy path | 로그인 → Dashboard KPI 확인 → /14 Statistics 차트 확인 → /13 Report 다운로드 |
| 모바일 | 햄버거 → Dashboard → 통계 → 리포트 → 다운로드 |
| Electron | 설치 → 실행 → Dashboard → 통계 → 리포트 |

### 6.3 품질 게이트 (Pass/Fail 기준)

| 게이트 | 기준 | 필수 여부 |
|--------|------|:---------:|
| TypeScript | `tsc -b --noEmit` 에러 0건 | **MUST** |
| Vite Build | `npm run build:web` 성공 | **MUST** |
| KPI 30초 갱신 | Network 탭에서 30초 간격 요청 확인 | **MUST** |
| 차트 렌더링 | 4종 차트 모두 데이터 표시 | **MUST** |
| 엑셀 다운로드 | CSV 파일 정상 다운로드 + 한글 정상 | **MUST** |
| Electron Build | `npm run build` 성공 → 설치파일 생성 | **SHOULD** |
| 모바일 반응형 | 520px 이하에서 3페이지 깨짐 없음 | **MUST** |
| 번들 사이즈 | JS gzip < 200KB | **SHOULD** |
