# ReportPage (#13) 구현 검증 보고서

> 검증 대상 파일:
> - `src/pages/ReportPage.tsx` (272줄)
> - `src/hooks/useReports.ts` (67줄)
> - `src/utils/downloadFile.ts` (60줄)
> - `src/mocks/handlers.ts` (reportHandlers 3종: #16-18)
> - `src/types/index.ts` (ReportType, Report, ReportPreview)
>
> TypeScript 검증: `tsc -b --noEmit` EXIT_CODE=0

---

## 1. 기능성 (85/100)

### 1.1 useReports hook 동작

| 항목 | 판정 | 상세 |
|------|:----:|------|
| useReportPreview | **PASS** | queryKey `['reports','preview',type,periodFrom,periodTo]`로 3파라미터 캐시 분리. `enabled` 조건으로 빈 파라미터 시 호출 방지. |
| useReportDownload | **PASS** | `useMutation<void, Error, DownloadParams>`로 적절한 타입 지정. `isPending`/`isSuccess`/`isError` 상태 추적. |
| queryFn signal | **ISSUE** | queryFn에 AbortController signal이 전달되지 않는다. 타입/기간을 빠르게 변경하면 이전 preview 요청이 취소되지 않아 불필요한 네트워크 호출 발생. |

**문제 F-1 (MEDIUM)**: `useReportPreview`의 queryFn에 `signal` 미전달.
```typescript
// 현재
queryFn: async () => { ... }
// 개선
queryFn: async ({ signal }) => {
  const { data } = await apiClient.get('/reports/preview', { params, signal });
  return data;
}
```

### 1.2 리포트 유형 선택

| 항목 | 판정 | 상세 |
|------|:----:|------|
| 4 카드 렌더링 | **PASS** | MONTHLY/QUARTERLY/COMPENSATION/CUSTOM 4종. `button` 태그로 접근성 확보. |
| 활성 상태 시각 피드백 | **PASS** | `border-primary-light + bg-blue-50 + shadow-sm` 활성, `border-border + bg-white` 비활성. |
| 타입 전환 시 preview 재요청 | **PASS** | `selectedType`이 queryKey에 포함되어 자동 재요청. |

### 1.3 기간 입력

| 항목 | 판정 | 상세 |
|------|:----:|------|
| MONTHLY/COMPENSATION month picker | **PASS** | `<input type="month">` + `dayjs` 기간 파생. |
| QUARTERLY 분기 계산 | **PASS** | `d.month() % 3`로 분기 시작월 계산. 4월 선택 -> Q2(4/1~6/30). |
| CUSTOM date range | **PASS** | 2개 `<input type="date">` + from/to 독립 상태. |
| Range 표시 | **PASS** | 하단에 "Range: 2026-04-01 ~ 2026-04-30" 표시. |

**문제 F-2 (MEDIUM)**: CUSTOM 모드에서 from > to 검증이 없다. "2026-05-01 ~ 2026-04-01" 같은 역전된 기간으로 API 호출이 가능하다.
- **개선**: `enabled: ... && fromValue <= toValue` 또는 `to` input에 `min={fromValue}` 속성 추가.

**문제 F-3 (LOW)**: QUARTERLY 분기 계산의 엣지 케이스. 1월(`month()=0`) -> `0 % 3 = 0` -> subtract(0) -> 1월 시작 (Q1 정상). 12월은 `dayjs` month() = 11 -> `11 % 3 = 2` -> subtract(2) -> 10월 시작 (Q4 정상). 로직 정확.

### 1.4 KPI 표시

| 항목 | 판정 | 상세 |
|------|:----:|------|
| 6종 KPI 표시 | **PASS** | totalReceived/totalCompleted/completionRate/totalExpense/totalCompensation/avgDays. |
| 포맷 함수 | **PASS** | 숫자 toLocaleString, % 소수점 1자리, 만원 단위, 일 단위. |
| 스켈레톤 로딩 | **PASS** | 6칸 animate-pulse 블록. |
| 빈 상태 | **PASS** | "Select a report type and period to preview" 메시지. |

**문제 F-4 (LOW)**: `preview.data` 타입 접근에서 `as keyof typeof preview.data` 타입 단언 사용 (L200). `noUncheckedIndexedAccess` 환경에서 `undefined` 가능성이 있으나, `raw != null` 체크(L201)로 런타임 안전.

### 1.5 파일 다운로드

| 항목 | 판정 | 상세 |
|------|:----:|------|
| CSV 다운로드 경로 | **PASS** | `GET /reports/export/csv?type=...&periodFrom=...&periodTo=...` |
| XLSX 다운로드 경로 | **PASS** | `GET /reports/export/xlsx?type=...&periodFrom=...&periodTo=...` |
| 파일명 생성 | **PASS** | `AS_monthly_2026-04-01_2026-04-30_20260430T143000.csv` 패턴. timestamp에서 `:-` 제거. |
| blob -> download | **PASS** | `URL.createObjectURL` + `<a>` click + cleanup 3단계. |
| PDF 비활성 | **PASS** | `disabled` + title tooltip "PDF export is coming soon". |

**문제 F-5 (HIGH)**: 다운로드 실패 시 에러 메시지가 `download.error.message`를 직접 표시한다 (L267). axios 에러의 message는 "Request failed with status code 500" 같은 기술적 메시지로, 사용자에게 부적절하다.
- **개선**: 에러 메시지를 사용자 친화적으로 변환. `download.isError && <div>...다운로드에 실패했습니다. 다시 시도해 주세요.</div>`.

---

## 2. 인코딩: CSV UTF-8 BOM (90/100)

### 검증

| 항목 | 판정 | 상세 |
|------|:----:|------|
| BOM 프리픽스 삽입 | **PASS** | `downloadFile.ts` L41-46: `blob.text()` -> `charCodeAt(0) === 0xFEFF` 체크 -> 없으면 `'\uFEFF' + text` 프리픽스. |
| MSW mock BOM | **PASS** | `handlers.ts` L297: `'\uFEFF'` + 한글 유니코드 이스케이프 문자열. BOM이 이미 포함됨. |
| Content-Type | **PASS** | `text/csv; charset=utf-8` 헤더 설정. |
| 이중 BOM 방지 | **PASS** | `hasBom` 체크로 서버가 이미 BOM을 포함하면 클라이언트에서 추가하지 않음. |

**문제 E-1 (MEDIUM)**: `blob.text()`가 전체 CSV를 메모리에 문자열로 로드한다. 대용량 CSV(10MB+)에서 메모리 사용량이 2배(blob + text)가 된다.
- **개선**: 서버에서 항상 BOM을 포함하도록 강제하고, 클라이언트 BOM 체크를 제거하면 blob을 텍스트로 변환할 필요 없음. 또는 `blob.slice(0, 3)`으로 첫 3바이트만 검사하여 전체 텍스트 로드 방지.

**문제 E-2 (LOW)**: MSW mock의 CSV 내용이 유니코드 이스케이프(`\uBC88\uD638` = "번호")로 하드코딩되어 가독성이 낮다. 개발/디버깅 시 내용 파악 어려움.
- **영향**: mock 데이터만의 문제이므로 프로덕션에는 영향 없음.

---

## 3. UI/UX (82/100)

### 3.1 4카드 레이아웃

| 항목 | 판정 | 상세 |
|------|:----:|------|
| 그리드 | **PASS** | `grid-cols-1 desktop:grid-cols-4`. 모바일 1열, 데스크톱 4열. |
| 카드 디자인 | **PASS** | `rounded-xl border-2 p-4`. 선택/미선택 시각 분리 명확. |
| 접근성 | **PASS** | `<button type="button">` 사용 -- 키보드/스크린리더 접근 가능. |

**문제 U-1 (MEDIUM)**: 카드 description 텍스트가 `text-[11px]`로 매우 작다. 520px 모바일에서 가독성 저하. 특히 "Headquarters compensation claim with 3-axis cost detail" 같은 긴 영문은 읽기 어려움.
- **개선**: 모바일에서 `text-xs`(12px)로 증가하거나, 설명을 한국어로 변경.

**문제 U-2 (MEDIUM)**: 카드 title과 description이 전부 영어다. 프로젝트의 나머지 UI는 한국어("A/S 현황 대시보드", "실시간 운영 현황판")인데 ReportPage만 영어이므로 **언어 일관성 위반**.
- **개선**: title -> "월간 리포트" / "분기 리포트" / "본사 보상 추적" / "커스텀 리포트". description도 한국어화.

### 3.2 기간 입력 폼

| 항목 | 판정 | 상세 |
|------|:----:|------|
| 라벨 | **PASS** | "Month" / "Quarter" / "From" / "To" 라벨 제공. |
| focus 스타일 | **PASS** | `focus:border-primary-light focus:outline-none`. |
| Range 표시 | **PASS** | 실시간 기간 표시. |

**문제 U-3 (MEDIUM)**: `<input type="month">`에 `min`/`max` 속성이 없어 미래 날짜나 너무 오래된 날짜를 선택할 수 있다. 2030년이나 2020년 선택 시 빈 데이터가 반환된다.
- **개선**: `max={dayjs().format('YYYY-MM')}` + `min="2025-01"` 제한.

### 3.3 다운로드 버튼 상태

| 항목 | 판정 | 상세 |
|------|:----:|------|
| disabled 상태 | **PASS** | `!preview.data`이면 비활성 (프리뷰 없이 다운로드 방지). |
| 로딩 스피너 | **PASS** | `isPending && variables.format === 'csv'`로 해당 버튼에만 스피너 표시. |
| 성공 배너 | **PASS** | `isSuccess` -> emerald 배너. |
| 에러 배너 | **PASS** | `isError` -> red 배너. |

**문제 U-4 (MEDIUM)**: 성공 배너가 계속 표시된다. `download.reset()`을 호출하지 않아 다른 동작 후에도 "Download started successfully"가 남아 있다.
- **개선**: 3초 후 자동 숨김(`setTimeout` + state) 또는 다음 다운로드 시작 시 `download.reset()` 호출.

**문제 U-5 (LOW)**: CSV와 XLSX를 동시에 다운로드하면 `download.isPending`이 1개만 추적한다. `useMutation`은 단일 mutation 상태이므로 CSV 다운로드 중 XLSX 클릭 시 CSV 상태가 덮어씌워진다.
- **개선**: 포맷별 별도 mutation 또는 다운로드 중 다른 버튼 비활성화 (현재 `isPending`으로 이미 비활성화됨 -- OK).

---

## 4. 모바일 반응형 (88/100)

### 검증

| 항목 | 뷰포트 | 판정 | 상세 |
|------|:------:|:----:|------|
| 타입 카드 | <=520px | **PASS** | `grid-cols-1` -- 1열 풀너비 스택 |
| 기간 입력 CUSTOM | <=520px | **PASS** | `flex-col` -- From/To 세로 스택 |
| 기간 입력 month | <=520px | **PASS** | `w-full` -- 풀너비 |
| KPI 미리보기 | <=520px | **PASS** | `grid-cols-2` -- 2열 (6칸 = 3행) |
| 다운로드 버튼 | <=520px | **PASS** | `flex-col` -- 세로 스택 풀너비 |
| 521px+ 전환 | >520px | **PASS** | 카드 4열, 입력 가로, KPI 3열, 버튼 가로 |
| 가로 스크롤 | <=520px | **PASS** | overflow 없음 (모든 요소 `w-full` 이내) |

**문제 M-1 (MEDIUM)**: 다운로드 버튼의 터치 영역이 `py-2.5`(약 40px 높이)로 WCAG 2.5.5 권장 44px에 약간 미달.
- **개선**: `py-3`(48px)으로 변경.

**문제 M-2 (LOW)**: PDF 버튼이 `desktop:ml-auto`로 데스크톱에서만 우측 정렬되지만 모바일에서는 풀너비. 모바일에서 비활성 PDF 버튼이 CSV/XLSX와 동일 크기로 표시되어 혼동 가능.
- **개선**: 모바일에서 PDF 버튼을 `text-xs` + `py-2`로 축소하거나, 모바일에서 숨김(`hidden desktop:flex`).

---

## 5. 코드 품질 (87/100)

### 5.1 구조

| 항목 | 판정 | 상세 |
|------|:----:|------|
| 관심사 분리 | **PASS** | Page(조립) / Hook(데이터) / Util(다운로드) 3계층 분리. |
| 타입 안전성 | **PASS** | `tsc --noEmit` 에러 0건. `ReportType`, `ExportFormat`, `ReportPreview` 모두 타입 정의됨. |
| TS 제약 준수 | **PASS** | enum 미사용, `import type` 사용, `as const` + union type. |

### 5.2 재사용성

| 항목 | 판정 | 상세 |
|------|:----:|------|
| downloadFile 유틸 | **PASS** | `downloadFile(options)` -- ReportPage 외 다른 페이지(TicketList CSV, MailLog Excel)에서도 재사용 가능. |
| useReportPreview | **PASS** | queryKey로 캐시 분리 -- 동일 파라미터 재요청 시 캐시 히트. |
| KPI 미리보기 | **PARTIAL** | `PREVIEW_ITEMS` 배열이 페이지 내 상수로 하드코딩. 다른 곳에서 동일 포맷 필요 시 재사용 불가. |

### 5.3 성능

| 항목 | 판정 | 상세 |
|------|:----:|------|
| 불필요 리렌더 | **ISSUE** | `useCallback(handleDownload)`에 `download` 객체가 의존성 배열에 포함되어 있다. `useMutation` 반환 객체는 매 렌더마다 새 참조이므로 **useCallback이 사실상 무효화**된다. |
| memo 없음 | **MINOR** | ReportPage는 polling이 없어 KpiCard처럼 빈번한 리렌더가 없으므로 `memo` 미적용은 수용 가능. |

**문제 Q-1 (MEDIUM)**: `useCallback` 의존성 배열에 `download`(mutation 객체)가 포함되어 매 렌더마다 새 함수가 생성된다.
```typescript
// 현재 (무효한 useCallback)
const handleDownload = useCallback(
  (format: ExportFormat) => {
    download.mutate({ type: selectedType, periodFrom, periodTo, format });
  },
  [download, selectedType, periodFrom, periodTo], // download는 매번 새 참조
);

// 개선: download.mutate를 직접 참조하거나 useCallback 제거
const handleDownload = (format: ExportFormat) => {
  download.mutate({ type: selectedType, periodFrom, periodTo, format });
};
```

### 5.4 보안

| 항목 | 판정 | 상세 |
|------|:----:|------|
| XSS | **PASS** | 사용자 입력(날짜)은 `<input>` 기본 sanitization. 다운로드 파일명에 사용자 입력 미포함(타입+기간+타임스탬프). |
| CSRF | **PASS** | `apiClient`의 JWT Authorization 헤더로 보호. |
| 파일명 인젝션 | **PASS** | 파일명이 `AS_${type}_${periodFrom}_${periodTo}_${timestamp}.${ext}` 패턴으로 고정 문자열 조합. 사용자 자유 입력 없음. |
| blob 메모리 | **PASS** | `URL.revokeObjectURL` cleanup으로 메모리 해제. |

---

## 6. E2E 플로우 검증 (84/100)

### Happy Path

```
Step 1: 페이지 진입 (/13)
  -> MONTHLY 카드 기본 선택 (파란 테두리)
  -> month picker에 현재 월 표시
  -> useReportPreview 호출 -> KPI 6종 표시
  -> CSV/XLSX 버튼 활성, PDF 비활성
  결과: PASS

Step 2: 타입 변경 (QUARTERLY 클릭)
  -> QUARTERLY 카드 활성화
  -> month picker 라벨 "Quarter (select any month in the quarter)"
  -> derivePeriod 분기 계산 -> Range 표시 갱신
  -> queryKey 변경 -> preview 재요청
  결과: PASS

Step 3: 기간 변경 (3월 선택)
  -> monthValue = "2026-03"
  -> Q1(2026-01-01 ~ 2026-03-31) 계산
  -> Range 갱신 -> preview 재요청
  결과: PASS

Step 4: KPI 미리보기 확인
  -> 247 / 208 / 84.4% / 345만원 / 128만원 / 3.2일
  결과: PASS

Step 5: CSV 다운로드 클릭
  -> isPending = true -> 스피너 표시
  -> GET /reports/export/csv?type=QUARTERLY&periodFrom=...&periodTo=...
  -> blob 수신 -> BOM 체크 -> <a> click -> 파일 다운로드
  -> isSuccess = true -> "Download started successfully" 배너
  결과: PASS

Step 6: CUSTOM 타입 전환
  -> date range 입력 표시
  -> From/To 독립 변경
  -> preview 재요청
  결과: PASS
```

### Edge Cases

| 시나리오 | 판정 | 상세 |
|---------|:----:|------|
| 빈 기간 | **PASS** | `enabled: !!type && !!periodFrom && !!periodTo` -> 빈 값이면 API 미호출 |
| 미래 날짜 | **ISSUE** | 미래 월 선택 시 mock이 동일 데이터 반환. 실제 서버에서는 빈 데이터 -> KPI "--" 표시 (OK). 단 다운로드 버튼이 활성 상태로 빈 CSV 다운로드 가능. |
| 네트워크 에러 | **PASS** | `download.isError` -> 에러 배너. retry 1회(전역). |
| 이중 클릭 | **PASS** | `download.isPending` 시 버튼 disabled -> 이중 요청 방지 |

**문제 E2E-1 (HIGH)**: CUSTOM 모드에서 from > to 역전 시 preview가 호출되고 mock이 정상 데이터를 반환한다. 실제 서버에서는 에러가 발생하겠지만, 클라이언트에서 선제 검증이 없다.

**문제 E2E-2 (MEDIUM)**: 성공 배너가 영구 표시. Step 5 후 Step 6에서 타입을 변경해도 "Download started successfully"가 남아 있다.

---

## 종합 점수

| # | 검증 항목 | 점수 | 등급 |
|---|---------|:----:|:----:|
| 1 | 기능성 | 85 | B+ |
| 2 | 인코딩 (UTF-8 BOM) | 90 | A- |
| 3 | UI/UX | 82 | B |
| 4 | 모바일 반응형 | 88 | A- |
| 5 | 코드 품질 | 87 | B+ |
| 6 | E2E 플로우 | 84 | B |
| **종합** | | **86** | **B+** |

---

## 발견된 문제 요약 (14건)

### MUST-FIX (3건)

| # | 심각도 | 문제 | 개선 |
|---|:------:|------|------|
| F-5 | HIGH | 에러 메시지에 기술적 axios 에러가 그대로 노출 | 사용자 친화적 메시지로 교체 |
| E2E-1 | HIGH | CUSTOM from > to 역전 검증 없음 | `enabled` 조건에 `fromValue <= toValue` 추가 또는 `to` input에 `min={fromValue}` |
| U-2 | MEDIUM | 카드 title/desc 영어 -- 프로젝트 전체 한국어와 불일치 | 한국어화 |

### SHOULD-FIX (7건)

| # | 심각도 | 문제 | 개선 |
|---|:------:|------|------|
| F-1 | MEDIUM | queryFn에 signal 미전달 (취소 불가) | `queryFn: async ({ signal }) => ...` + `apiClient.get(url, { signal })` |
| F-2 | MEDIUM | CUSTOM from > to 기간 역전 허용 | input `min`/`max` 속성 |
| U-1 | MEDIUM | 카드 desc text-[11px] 모바일 가독성 | 12px로 증가 |
| U-3 | MEDIUM | month input min/max 미설정 | `max={현재월}` `min="2025-01"` |
| U-4 | MEDIUM | 성공 배너 영구 표시 | 3초 자동 숨김 또는 `download.reset()` |
| E-1 | MEDIUM | CSV BOM 체크 시 전체 텍스트 로드 (대용량 부담) | 서버 BOM 강제 또는 `blob.slice(0,3)` 검사 |
| Q-1 | MEDIUM | useCallback 의존성 download 매번 새 참조로 무효화 | useCallback 제거 또는 `download.mutate` 직접 참조 |
| M-1 | MEDIUM | 다운로드 버튼 터치 영역 40px < 44px | `py-3`(48px)으로 변경 |

### NICE-TO-HAVE (4건)

| # | 심각도 | 문제 | 개선 |
|---|:------:|------|------|
| F-4 | LOW | preview.data 키 접근 타입 단언 | `keyof ReportPreview` 매핑으로 타입 안전성 강화 |
| E-2 | LOW | MSW CSV mock 유니코드 이스케이프 가독성 | 한글 리터럴로 변경 |
| U-5 | LOW | 동시 다운로드 상태 추적 단일 mutation | 현재 disabled로 방지되므로 OK |
| M-2 | LOW | 모바일에서 비활성 PDF 버튼 풀너비 | 모바일에서 축소 또는 숨김 |
