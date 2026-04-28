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

# 01. 고객 정보 조회

**전화번호 기반 통합 고객 뷰**

Phase 1 산출물 | 슬라이드 01 / 15
검수 피드백 전건 반영 완료 (R-1~R-7, SC-1~SC-5, T-1~T-5)

---

## 목적 & 핵심 가치

### 왜 만드나?

- **전화번호 하나**로 고객의 신상·구매·A/S·상담·정품등록 **전 이력을 한 화면에**
- CS/CX가 전화 인입 시 **3초 이내** 고객 컨텍스트 파악
- 기존 어드민의 분산된 3개 검색 화면 → **단일 페이지로 대체**

### 기존 vs 신규

| 기존 어드민 | 신규 통합 앱 |
|------------|-------------|
| 이름/주문번호 각각 분리 검색 (3개 화면) | 전화번호 1개로 통합 검색 |
| 구매/A/S/상담 각각 페이지 이동 | 5탭 통합 뷰 (컨텍스트 유지) |
| 동명이인 처리 없음 | 복수 결과 선택 모달 |
| 권한 구분 없음 | 역할별 UI 분기 |

---

## 접근 권한

| 역할 | 인원 | 접근 범위 | 제한 사항 |
|------|------|----------|----------|
| **A/S 담당자** | 5명 | READ + A/S 접수 CTA | 고객 정보 편집 불가 |
| **CS/CX** | 4명 | READ + 상담 기록 추가 | A/S 접수 CTA 숨김 |
| **팀장** | 2명 | READ + 담당자 이력 확인 | 편집 불가 |
| **총괄** | 1명 | FULL READ + 편집 | 고객 정보 편집 가능 |

---

## 데스크톱 와이어프레임 (1280x720)

```
+=================================================================+
| #1E3A8A  1. 고객 정보 조회                          01 / 15     |
+=========+=======================================================+
|         | 검색 영역 [A]                                         |
| SIDEBAR | [전화번호(필수)] [고객명(선택)] [조회범위 v]               |
|         | [# 조회]  [초기화]                                     |
| [*] 고객|                                                        |
| [ ] 상담| 고객 기본 정보 카드 [B]    [편집] [정품2] [VIP]           |
| [ ] A/S | 김민수 | 010-1234-5678 | minsu@e.. | 2024-08-15      |
| [ ] 현황| 구매 1,250,000원 | A/S 3건(진행1) | 최근상담 04-20     |
| [ ] 비용|                                                        |
| [ ] 출고| 탭 [C]: [구매(5)] [A/S(3)] [상담(8)] [정품(2)] [메모]    |
| [ ] 회수|                                                        |
| [ ] ... | 탭 콘텐츠 [D]: 테이블 + 페이지네이션                      |
+=================================================================+
```

---

## 모바일 와이어프레임 (375x812)

```
+-----------------------------+
| #1E3A8A  고객 조회    [=]   |
+-----------------------------+
| 전화번호(필수)               |
| [010-1234-5678          ]   |
| [조회]  [초기화]             |
+-----------------------------+
| 김민수       [VIP] [정품2]  |
| 010-1234-5678               |
| 구매 1,250,000원 | A/S 3건  |
+-----------------------------+
| [구매(5)][A/S(3)][상담(8)]> |
+-----------------------------+
| (탭 콘텐츠: 카드형 리스트)    |
+-----------------------------+
| 고객 | 상담 | A/S | ... |설정|
+-----------------------------+
  (하단 탭바 - 사이드바 대체)
```

---

## 검색 영역 [A] 상세

| UI 요소 | 타입 | 상세 |
|---------|------|------|
| 전화번호 입력 | text | **필수**, 하이픈 자동 삽입, 숫자만 허용 |
| 고객명 입력 | text | 선택, 보조 필터 |
| 조회 범위 | select | 전체 / A/S 이력 있음 / 구매 이력 있음 / 상담 이력 있음 |
| 조회 버튼 | btn-primary | **Enter 키 동작**, 로딩 시 스피너 |
| 초기화 버튼 | btn-secondary | 전 필드 초기화 |

### 검색 결과 분기

```
전화번호 입력 → 조회
   ├─ 결과 0건 → Empty State (신규 등록 CTA)
   ├─ 결과 1건 → 고객 카드 즉시 표시
   └─ 결과 2건+ → 복수 선택 모달
```

---

## 고객 기본 정보 카드 [B]

### 표시 필드 (8개)

| 필드 | 소스 | 포맷 | 예시 |
|------|------|------|------|
| 고객명 | Customer.name | 텍스트 | 김민수 |
| 전화번호 | Customer.phone (PK) | 하이픈 | 010-1234-5678 |
| 이메일 | Customer.email | 텍스트 | minsu@email.com |
| 가입일 | Customer.createdAt | YYYY-MM-DD | 2024-08-15 |
| 최근 구매일 | MAX(Order.orderDate) | YYYY-MM-DD | 2026-03-22 |
| 총 구매 금액 | SUM(Order.amount) | N,NNN원 | 1,250,000원 |
| A/S 건수 | COUNT(Ticket) | N건 (진행 M건) | 3건 (진행 1건) |
| 최근 상담일 | MAX(ConsultLog.date) | YYYY-MM-DD | 2026-04-20 |

### 뱃지

- **VIP**: 구매 3회 이상 + 누적 100만원 이상 *(NOTE: 팀장/총괄 확정 필요)*
- **정품등록**: "정품등록 N건", 클릭 시 정품 탭 활성화

---

## 탭 구성 [C] + 콘텐츠 [D]

### 5개 탭

| 탭 | 건수 표시 | 기본 활성 | 주요 컬럼 |
|----|---------|---------|----------|
| **구매 이력** | (N) | **기본** | 주문번호·제품·금액·배송상태·A/S상태·[접수] |
| **A/S 이력** | (N) | - | 티켓번호·증상·담당자·상태·비용합계 |
| **상담 이력** | (N) | - | 일시·채널·유형·요약·[이메일][SMS] |
| **정품등록** | (N) | - | 제품·시리얼·보증만료·쿠폰 |
| **메모** | 아이콘 | - | 작성자·일시·내용 (CS/CX만 작성) |

### 역할별 차이

- **A/S 담당자**: 구매 탭에 [A/S 접수] 버튼 표시
- **CS/CX**: 상담 탭에 [이메일][SMS] 발송, 메모 탭 작성 가능
- **팀장**: A/S 이력 "담당자" 컬럼으로 배분 현황 파악

---

## 시나리오 SC-1: 전화 인입 고객 확인 (CS/CX)

```
전화 수신
    ↓
전화번호 입력 → [조회]
    ↓
API: GET /api/customers?phone=010-1234-5678
    ↓
고객 카드 + 탭 표시
    ↓
상담이력 탭 → 이전 맥락 확인
    ↓
메모 탭 → 상담 내용 저장
    ↓
필요 시: [이메일 발송] / [SMS 발송]
    → POST /api/mail-logs → MailLog 자동 기록
    → 토스트: "발송 완료"
```

---

## 시나리오 SC-2: A/S 접수 시작 (A/S 담당자)

```
전화번호 조회 → 고객 카드 표시
    ↓
구매이력 탭 (기본 활성)
    ↓
대상 제품 행의 [A/S 접수] 클릭
    ↓
A/S 접수 페이지(#4)로 이동
  URL: /as/new?customerId={id}&orderId={oid}&productId={pid}
  → 고객명, 전화번호, 제품명, 모델명, 시리얼 자동 채움
    ↓
접수 폼 작성 → 저장
    → A/S 이력 탭에 새 티켓 반영
```

---

## API 엔드포인트 매핑

| 액션 | Method | Endpoint |
|------|--------|----------|
| 고객 조회 | GET | `/api/customers?phone={p}&name={n}` |
| 구매 이력 | GET | `/api/customers/{id}/orders?page&size` |
| A/S 이력 | GET | `/api/customers/{id}/tickets?page&size` |
| 상담 이력 | GET | `/api/customers/{id}/consults?page&size` |
| 정품등록 | GET | `/api/customers/{id}/registrations` |
| 메모 CRUD | GET/POST | `/api/customers/{id}/memos` |
| 메모 수정/삭제 | PATCH/DELETE | `/api/memos/{id}` |
| 신규 고객 등록 | POST | `/api/customers` |
| 고객 정보 수정 | PATCH | `/api/customers/{id}` (총괄만) |
| 이메일 발송 | POST | `/api/mail-logs/email` |
| SMS 발송 | POST | `/api/mail-logs/sms` |

---

## 변경·추가 요약

<span class="tag-new">NEW</span> 전화번호 통합 검색 (기존 3개 화면 → 1개)
<span class="tag-new">NEW</span> 복수 결과 선택 모달 (기존: 첫 번째만 표시)
<span class="tag-new">NEW</span> 검색 결과 없음 + 신규 등록 CTA
<span class="tag-new">NEW</span> 고객별 메모 CRUD (24h 수정 제한)

<span class="tag-chg">CHG</span> 구매이력에 A/S 상태 컬럼 + 접수 CTA 추가
<span class="tag-chg">CHG</span> 역할별 탭/버튼 가시성 분기
<span class="tag-chg">CHG</span> 상담이력에서 바로 이메일/SMS 발송

<span class="tag-imp">IMP</span> 구매/A/S/상담/정품/메모 5탭 통합 뷰
<span class="tag-imp">IMP</span> 페이지네이션 표준화 (10/30/50건)

---

<!-- _class: lead -->

# 확인 필요 사항

- **VIP 등급 기준**: 구매 3회+ AND 100만원+ → 팀장/총괄 확정 필요
- **상담이력 범위**: 이 탭(고객 한정) vs 전체 상담(#2) 차이 → 실무진 컨펌

---

<!-- _class: lead -->

# Q&A

고객 정보 조회 — 전화번호 기반 통합 고객 뷰

Phase 1 | 슬라이드 01 / 15
