---
marp: true
theme: default
paginate: true
backgroundColor: #FFFFFF
style: |
  section {
    font-family: 'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
    color: #1E293B;
  }
  section.lead {
    background: linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%);
    color: #FFFFFF;
  }
  section.lead h1 { color: #FFFFFF; }
  section.lead h2 { color: #BFDBFE; }
  table { font-size: 0.75em; width: 100%; }
  th { background: #F1F5F9; }
  code { font-size: 0.85em; }
  .tag-new { background: #DCFCE7; color: #166534; padding: 2px 8px; border-radius: 4px; font-size: 0.75em; font-weight: bold; }
  .tag-chg { background: #FEF3C7; color: #92400E; padding: 2px 8px; border-radius: 4px; font-size: 0.75em; font-weight: bold; }
  .tag-imp { background: #DBEAFE; color: #1E40AF; padding: 2px 8px; border-radius: 4px; font-size: 0.75em; font-weight: bold; }
---

<!-- _class: lead -->

# 03. 젠데스크 문의 마이그레이션

**CSV/JSON 업로드 → 상담 이력 일괄 변환**

Phase 1 산출물 | 슬라이드 03 / 15

---

## 목적 & 핵심 가치

### 왜 만드나?

- 젠데스크에 축적된 과거 상담 이력을 **신규 통합 앱으로 일괄 이관**
- 마이그레이션 후 젠데스크 구독 해지 → **월 비용 절감**
- 수작업 복사 대신 **파일 업로드 + 자동 매핑**으로 작업 시간 최소화

### 기존 vs 신규

| 기존 프로세스 | 신규 통합 앱 |
|-------------|-------------|
| 젠데스크 데이터 수동 복사 | CSV/JSON 파일 업로드 자동 변환 |
| 매핑 규칙 없음 (담당자 재량) | 필드 매핑 미리보기 + 확인 후 등록 |
| 중복 체크 없음 | 동일 ticket ID 중복 감지 (skip/overwrite) |
| 진행 상황 불명 | 진행률 표시 + 결과 리포트 |

---

## 접근 권한

| 역할 | 인원 | 접근 범위 | 제한 사항 |
|------|------|----------|----------|
| **A/S 담당자** | 5명 | 접근 불가 | - |
| **CS/CX** | 4명 | 접근 불가 | - |
| **팀장** | 2명 | 접근 불가 | - |
| **총괄** | 1명 | FULL (업로드·실행·삭제) | 없음 |

---

## 데스크톱 와이어프레임 (1280x720)

```
+=================================================================+
| #1E3A8A  3. 젠데스크 마이그레이션                    03 / 15     |
+=========+=======================================================+
|         | 스텝 인디케이터 [A]                                    |
| SIDEBAR | [1.업로드] ── [2.미리보기] ── [3.매핑확인] ── [4.실행]   |
|         |    (*)           ( )            ( )          ( )       |
| [ ] 고객|                                                        |
| [ ] 상담| 업로드 영역 [B]                                        |
| [ ] A/S | +-----------------------------------------------+      |
| [*] 마이| |                                               |      |
| [ ] 현황| |  CSV 또는 JSON 파일을 드래그 앤 드롭하세요       |      |
| [ ] 비용| |  또는 [파일 선택] 클릭                           |      |
| [ ] 출고| |                                               |      |
| [ ] 회수| +-----------------------------------------------+      |
| [ ] ... | 지원 형식: .csv, .json  |  최대 50MB                   |
|         | 이전 마이그레이션 이력: [이력 보기]                       |
+=================================================================+
```

---

## 모바일 와이어프레임 (375x812)

```
+-----------------------------+
| #1E3A8A  젠데스크 이관 [=]  |
+-----------------------------+
| 1.업로드 > 2.미리보기 >     |
| 3.매핑   > 4.실행           |
+-----------------------------+
|                             |
| CSV 또는 JSON 파일을        |
| 업로드하세요                 |
|                             |
| [파일 선택]                  |
|                             |
| 지원: .csv, .json           |
| 최대: 50MB                  |
+-----------------------------+
| [이전 마이그레이션 이력]      |
+-----------------------------+
| 고객 | 상담 | A/S | ... |설정|
+-----------------------------+
  (하단 탭바 - 사이드바 대체)
```

---

## 스텝별 상세 UI

### Step 1. 업로드

| UI 요소 | 타입 | 상세 |
|---------|------|------|
| 드래그앤드롭 영역 | dropzone | CSV/JSON 파일, 최대 50MB |
| 파일 선택 버튼 | btn-secondary | accept: .csv, .json |
| 이력 보기 링크 | link | 과거 마이그레이션 실행 결과 목록 |

### Step 2. 미리보기

| UI 요소 | 타입 | 상세 |
|---------|------|------|
| 파싱 결과 요약 | card | 총 건수, 정상 건수, 오류 건수 |
| 데이터 테이블 | table | 상위 20건 미리보기 (원본 필드 표시) |
| 오류 행 하이라이트 | row-highlight | 필수 필드 누락·형식 오류 빨간 표시 |

### Step 3. 매핑 확인

| UI 요소 | 타입 | 상세 |
|---------|------|------|
| 필드 매핑 테이블 | table | 젠데스크 필드 → 시스템 필드 자동 매핑 |
| 매핑 수정 | select | 자동 매핑 오류 시 수동 변경 가능 |
| 중복 처리 옵션 | radio | Skip (건너뛰기) / Overwrite (덮어쓰기) |

---

## Step 4. 실행 & 결과

### 실행 중 화면

```
마이그레이션 진행 중...
[████████████████░░░░░░░░] 68%  (340 / 500건)

처리 중: ticket-20250315-042
경과 시간: 00:02:34
예상 남은 시간: 00:01:12
```

### 결과 리포트

| 항목 | 값 | 설명 |
|------|------|------|
| 총 업로드 | 500건 | 파일 내 전체 행 수 |
| 성공 등록 | 480건 | 신규 상담 이력으로 등록 |
| 중복 스킵 | 15건 | 동일 ticket ID 존재 → skip 처리 |
| 오류 | 5건 | 필수 필드 누락 등 (오류 상세 다운로드) |

### 후속 CTA

- **[오류 건 CSV 다운로드]**: 실패 건만 추출하여 수정 후 재업로드
- **[상담 내역으로 이동]**: 등록된 이력 확인 (#2 페이지)

---

## 시나리오 SC-1: 총괄 젠데스크 데이터 일괄 이관

```
총괄 로그인
    ↓
젠데스크 마이그레이션 페이지 진입
    ↓
Step 1: 젠데스크에서 내보낸 CSV 파일 드래그앤드롭
    ↓
API: POST /api/migration/zendesk/upload
    → 파일 파싱 + 유효성 검증
    ↓
Step 2: 미리보기 확인 (500건 중 5건 오류)
    → 오류 행 확인 후 [다음] 클릭
    ↓
Step 3: 필드 매핑 확인
    → 젠데스크 "subject" → 시스템 "상담제목" 자동 매핑 확인
    → 중복 처리: Skip 선택
    → [실행] 클릭
    ↓
Step 4: API: POST /api/migration/zendesk/execute
    → 진행률 실시간 표시
    ↓
결과 리포트: 성공 480건, 스킵 15건, 오류 5건
    → [오류 건 CSV 다운로드]로 실패 건 확인
```

---

## 시나리오 SC-2: 중복 데이터 Overwrite 처리

```
총괄 로그인
    ↓
이전 마이그레이션에서 누락된 필드 보완 후 재업로드
    ↓
Step 1~2: 파일 업로드 + 미리보기
    ↓
Step 3: 중복 처리 옵션 → Overwrite 선택
    → 경고 모달: "기존 N건의 데이터가 덮어씌워집니다. 계속하시겠습니까?"
    → [확인] 클릭
    ↓
Step 4: 실행 → 기존 데이터 업데이트 완료
```

---

## API 엔드포인트 매핑

| 액션 | Method | Endpoint |
|------|--------|----------|
| 파일 업로드 + 파싱 | POST | `/api/migration/zendesk/upload` |
| 미리보기 조회 | GET | `/api/migration/zendesk/preview/{uploadId}` |
| 매핑 설정 저장 | PATCH | `/api/migration/zendesk/mapping/{uploadId}` |
| 일괄 등록 실행 | POST | `/api/migration/zendesk/execute` |
| 실행 진행률 조회 | GET | `/api/migration/zendesk/progress/{jobId}` |
| 마이그레이션 이력 | GET | `/api/migration/zendesk/history?page&size` |
| 오류 건 다운로드 | GET | `/api/migration/zendesk/errors/{jobId}/download` |

---

## 변경·추가 요약

<span class="tag-new">NEW</span> 젠데스크 CSV/JSON 파일 업로드 마이그레이션 기능
<span class="tag-new">NEW</span> 4단계 위저드 (업로드→미리보기→매핑→실행)
<span class="tag-new">NEW</span> 동일 ticket ID 중복 감지 (skip/overwrite 선택)
<span class="tag-new">NEW</span> 실행 진행률 실시간 표시
<span class="tag-new">NEW</span> 오류 건 CSV 다운로드 기능

<span class="tag-chg">CHG</span> 마이그레이션 데이터는 상담 내역(#2) 통합 목록에 자동 반영

<span class="tag-imp">IMP</span> 총괄 전용 기능 (타 역할 접근 차단)
<span class="tag-imp">IMP</span> 마이그레이션 이력 관리 (실행 일시·건수·결과 기록)

---

<!-- _class: lead -->

# 확인 필요 사항

- **젠데스크 내보내기 형식**: CSV/JSON 외 XML 지원 필요 여부 → 총괄 확인
- **필드 매핑 기본 규칙**: 젠데스크 필드명 ↔ 시스템 필드 1:1 매핑표 → 실무진 작성 필요
- **최대 업로드 건수 제한**: 50MB 기준 약 10만 건 예상, 상한 필요 여부 → 개발팀 협의
- **이관 후 젠데스크 해지 시점**: 데이터 검증 기간 확보 → 총괄 결정

---

<!-- _class: lead -->

# Q&A

젠데스크 문의 마이그레이션 — CSV/JSON 업로드 → 상담 이력 일괄 변환

Phase 1 | 슬라이드 03 / 15
