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

# 02. 전체 상담 내역

**전 채널 상담 이력 통합 목록 & 상세**

Phase 1 산출물 | 슬라이드 02 / 15

---

## 목적 & 핵심 가치

### 왜 만드나?

- 전화·이메일·채팅·젠데스크 등 **전 채널 상담 이력을 한 화면에 통합**
- CS/CX가 고객 문의 이력을 **채널 무관하게** 시간순으로 파악
- 기존 어드민의 채널별 분리 조회 → **단일 통합 목록으로 대체**

### 기존 vs 신규

| 기존 어드민 | 신규 통합 앱 |
|------------|-------------|
| 채널별 분리 조회 (전화/이메일/채팅 각각) | 전 채널 통합 목록 |
| 필터 없이 전체 나열 | 날짜·채널·유형·담당자 복합 필터 |
| 상세에서 후속 조치 불가 | 상세에서 바로 이메일/SMS 발송 |
| 검색 기능 미흡 | 키워드·전화번호·고객명 통합 검색 |

---

## 접근 권한

| 역할 | 인원 | 접근 범위 | 제한 사항 |
|------|------|----------|----------|
| **A/S 담당자** | 5명 | 자기 관련 건만 READ | 타 담당자 건 조회 불가 |
| **CS/CX** | 4명 | 전체 READ + 상담 기록 추가 | 삭제 불가 |
| **팀장** | 2명 | 전체 READ | 편집 불가 |
| **총괄** | 1명 | FULL READ + 편집 + 삭제 | 없음 |

---

## 데스크톱 와이어프레임 (1280x720)

```
+=================================================================+
| #1E3A8A  2. 전체 상담 내역                          02 / 15     |
+=========+=======================================================+
|         | 필터 영역 [A]                                         |
| SIDEBAR | [날짜 From] ~ [날짜 To]  [채널 v] [상담유형 v]          |
|         | [담당자 v] [키워드 검색...]  [# 조회] [초기화]            |
| [ ] 고객|                                                        |
| [*] 상담| 상담 목록 [B]                                           |
| [ ] A/S | No | 일시       | 채널  | 고객명  | 전화번호     |   |
| [ ] 현황| 1  | 04-28 10:30| 전화  | 김민수  | 010-1234-5678|   |
| [ ] 비용| 2  | 04-27 15:20| 이메일| 박지영  | 010-9876-5432|   |
| [ ] 출고| 3  | 04-27 09:10| 채팅  | 이수진  | 010-5555-1234|   |
| [ ] 회수|                                                        |
| [ ] ... | [< 1 2 3 ... 15 >]  총 148건 | 10/30/50건 v           |
+=================================================================+
```

---

## 모바일 와이어프레임 (375x812)

```
+-----------------------------+
| #1E3A8A  상담 내역    [=]   |
+-----------------------------+
| [날짜 From] ~ [날짜 To]     |
| [채널 v] [유형 v] [담당자 v] |
| [키워드 검색...]             |
| [조회]  [초기화]             |
+-----------------------------+
| 04-28 10:30  전화           |
| 김민수 010-1234-5678        |
| 제품 문의 - 배송 관련    >   |
+-----------------------------+
| 04-27 15:20  이메일          |
| 박지영 010-9876-5432        |
| A/S 문의 - 수리 접수     >   |
+-----------------------------+
| [< 1 2 3 ... >]             |
+-----------------------------+
| 고객 | 상담 | A/S | ... |설정|
+-----------------------------+
  (하단 탭바 - 사이드바 대체)
```

---

## 필터 영역 [A] 상세

| UI 요소 | 타입 | 상세 |
|---------|------|------|
| 날짜 시작 | datepicker | 기본값: 오늘 - 30일 |
| 날짜 종료 | datepicker | 기본값: 오늘 |
| 채널 | select | 전체 / 전화 / 이메일 / 채팅 / 젠데스크 / 기타 |
| 상담유형 | select | 전체 / 제품문의 / A/S문의 / 배송문의 / 교환반품 / 기타 |
| 담당자 | select | 전체 / 담당자 목록 (A/S 담당자는 본인만 표시) |
| 키워드 검색 | text | 고객명, 전화번호, 상담 내용 통합 검색 |
| 조회 버튼 | btn-primary | **Enter 키 동작**, 로딩 시 스피너 |
| 초기화 버튼 | btn-secondary | 전 필드 초기화 + 기본값 복원 |

---

## 상담 상세 페이지

### 표시 필드

| 필드 | 소스 | 포맷 | 예시 |
|------|------|------|------|
| 상담 번호 | ConsultLog.id | CS-YYYYMMDD-NNN | CS-20260428-001 |
| 일시 | ConsultLog.createdAt | YYYY-MM-DD HH:mm | 2026-04-28 10:30 |
| 채널 | ConsultLog.channel | 태그 | 전화 |
| 상담유형 | ConsultLog.type | 태그 | 제품문의 |
| 고객명 | Customer.name | 텍스트 (클릭 시 고객 조회 이동) | 김민수 |
| 전화번호 | Customer.phone | 하이픈 | 010-1234-5678 |
| 담당자 | ConsultLog.assignee | 텍스트 | 이상현 |
| 상담 내용 | ConsultLog.content | 텍스트 (멀티라인) | 제품 배송 지연 문의... |

### 후속 조치 CTA

- **[이메일 발송]**: 고객 이메일로 발송 모달 → POST /api/mail-logs/email → MailLog 기록
- **[SMS 발송]**: 고객 전화번호로 발송 모달 → POST /api/mail-logs/sms → MailLog 기록
- **[A/S 접수]**: A/S 접수 페이지(#4)로 이동 (고객·제품 정보 자동 채움)

---

## 시나리오 SC-1: CS/CX 상담 이력 조회 및 후속 발송

```
CS/CX 로그인
    ↓
전체 상담 내역 페이지 진입
    ↓
필터 설정: 날짜 04-21 ~ 04-28, 채널: 전화
    ↓
[조회] 클릭
    ↓
API: GET /api/consults?dateFrom=2026-04-21&dateTo=2026-04-28&channel=PHONE&page=0&size=10
    ↓
목록에서 대상 건 클릭 → 상세 페이지
    ↓
상담 내용 확인 후 [이메일 발송] 클릭
    ↓
발송 모달에서 내용 작성 → [전송]
    ↓
POST /api/mail-logs/email → MailLog 자동 기록
    → 토스트: "이메일 발송 완료"
```

---

## 시나리오 SC-2: A/S 담당자 본인 관련 건 조회

```
A/S 담당자 로그인
    ↓
전체 상담 내역 페이지 진입
    → 담당자 필터: 본인으로 고정 (변경 불가)
    ↓
API: GET /api/consults?assignee=본인ID&page=0&size=10
    ↓
본인 관련 상담 이력만 표시
    ↓
상세 확인 후 필요 시 A/S 접수(#4)로 이동
```

---

## API 엔드포인트 매핑

| 액션 | Method | Endpoint |
|------|--------|----------|
| 상담 목록 조회 | GET | `/api/consults?dateFrom&dateTo&channel&type&assignee&keyword&page&size` |
| 상담 상세 조회 | GET | `/api/consults/{id}` |
| 상담 기록 추가 | POST | `/api/consults` |
| 상담 기록 수정 | PATCH | `/api/consults/{id}` (총괄만) |
| 상담 기록 삭제 | DELETE | `/api/consults/{id}` (총괄만) |
| 이메일 발송 | POST | `/api/mail-logs/email` |
| SMS 발송 | POST | `/api/mail-logs/sms` |

---

## 변경·추가 요약

<span class="tag-new">NEW</span> 전 채널 상담 이력 통합 목록 (기존 채널별 분리 → 단일 화면)
<span class="tag-new">NEW</span> 날짜·채널·유형·담당자 복합 필터
<span class="tag-new">NEW</span> 상세 페이지에서 이메일/SMS 직접 발송 CTA
<span class="tag-new">NEW</span> 키워드 통합 검색 (고객명·전화번호·내용)

<span class="tag-chg">CHG</span> A/S 담당자는 본인 관련 건만 필터링
<span class="tag-chg">CHG</span> 역할별 접근 범위 분기 (조회/편집/삭제)

<span class="tag-imp">IMP</span> 목록→상세 드릴다운 UX 통일
<span class="tag-imp">IMP</span> 페이지네이션 표준화 (10/30/50건)
<span class="tag-imp">IMP</span> MailLog 자동 기록 (이메일·SMS 발송 시 필수)

---

<!-- _class: lead -->

# 확인 필요 사항

- **상담유형 분류 체계**: 제품문의/A/S문의/배송문의/교환반품/기타 → 실무진 확정 필요
- **채널 종류**: 전화/이메일/채팅/젠데스크/기타 외 추가 채널 유무 → 실무진 컨펌
- **A/S 담당자 조회 범위**: 본인 관련 건의 정의 (담당자 = 본인 OR 참여자 포함?) → 팀장 확정

---

<!-- _class: lead -->

# Q&A

전체 상담 내역 — 전 채널 상담 이력 통합 목록 & 상세

Phase 1 | 슬라이드 02 / 15
