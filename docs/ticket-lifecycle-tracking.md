# 티켓 라이프사이클 이벤트 추적 시스템

## 1. 목적

A/S 티켓의 전체 생명주기를 이벤트 단위로 기록하여:
- **어디서 지연이 발생하는지** 구간별 소요 시간 분석
- **고객 불편 지점** 파악 (최초 응답까지 대기 시간, 커뮤니케이션 빈도)
- **엔지니어 업무 부하** 및 처리 패턴 분석
- **비용 산정 과정** 투명성 확보

---

## 2. 핵심 엔티티: TicketEvent

### 테이블 설계 (`as_ticket_events`)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `event_id` | BIGINT PK AUTO_INCREMENT | 이벤트 고유 ID |
| `ticket_id` | BIGINT FK → as_tickets | 티켓 참조 |
| `event_type` | VARCHAR(40) | 이벤트 유형 (아래 enum) |
| `actor_id` | BIGINT FK → users | 행위자 (시스템이면 NULL) |
| `actor_role` | VARCHAR(20) | 행위자 역할 (AS_TECH / CS_CX / LEAD / ADMIN / SYSTEM / CUSTOMER) |
| `channel` | VARCHAR(20) | 채널 (APP / EMAIL / SMS / PHONE / SYSTEM) |
| `occurred_at` | DATETIME(3) | 이벤트 발생 시각 (밀리초) |
| `payload` | JSON | 이벤트 유형별 상세 데이터 |
| `prev_value` | VARCHAR(100) | 변경 전 값 (상태 변경 등) |
| `next_value` | VARCHAR(100) | 변경 후 값 |
| `duration_from_prev_ms` | BIGINT | 직전 이벤트로부터 경과 시간(ms) — 서버 자동 계산 |
| `created_at` | DATETIME DEFAULT NOW() | 레코드 생성 시각 |

### 인덱스

```sql
CREATE INDEX idx_ticket_events_ticket ON as_ticket_events(ticket_id, occurred_at);
CREATE INDEX idx_ticket_events_type ON as_ticket_events(event_type, occurred_at);
CREATE INDEX idx_ticket_events_actor ON as_ticket_events(actor_id, occurred_at);
```

---

## 3. 이벤트 유형 (event_type enum)

### 3.1 티켓 라이프사이클

| event_type | 설명 | 자동/수동 | payload 예시 |
|------------|------|-----------|-------------|
| `TICKET_CREATED` | 접수 생성 | 자동 | `{symptom, productId, customerPhone}` |
| `ENGINEER_ASSIGNED` | 엔지니어 배정 | 수동(팀장) | `{assigneeId, assigneeName}` |
| `WORK_STARTED` | 작업 시작 | 수동(엔지니어) | `{note}` |
| `FIRST_RESPONSE` | 고객 최초 응답 | **자동 감지** | `{channel, messageId}` — 해당 티켓에서 첫 고객향 발송 시 자동 태깅 |
| `STATUS_CHANGED` | 상태 변경 | 자동 | `{from, to, reason}` |
| `TICKET_CLOSED` | 종료 | 수동 | `{resolutionType, summary}` |
| `TICKET_REOPENED` | 재개 | 수동 | `{reason}` |

### 3.2 고객 커뮤니케이션

| event_type | 설명 | 자동/수동 | payload 예시 |
|------------|------|-----------|-------------|
| `EMAIL_SENT` | 이메일 발송 | 자동(MailLog 연동) | `{mailLogId, subject, templateId}` |
| `SMS_SENT` | SMS 발송 | 자동(MailLog 연동) | `{mailLogId, content}` |
| `PHONE_CALL_LOGGED` | 전화 통화 기록 | 수동 | `{duration, summary, direction}` |
| `CUSTOMER_REPLY_RECEIVED` | 고객 회신 수신 | 자동/수동 | `{channel, content}` |

### 3.3 비용 관련

| event_type | 설명 | 자동/수동 | payload 예시 |
|------------|------|-----------|-------------|
| `COST_ADDED` | 비용 항목 추가 | 수동 | `{axis, amount, description}` — axis: OUR_EXPENSE / CUSTOMER_PAYMENT / VENDOR_COMPENSATION |
| `COST_UPDATED` | 비용 수정 | 수동 | `{costEntryId, before, after, reason}` |
| `COST_APPROVED` | 비용 승인 | 수동(팀장) | `{totalOur, totalCustomer, totalVendor}` |

### 3.4 물류/출고

| event_type | 설명 | 자동/수동 | payload 예시 |
|------------|------|-----------|-------------|
| `SHIPMENT_CREATED` | 출고 생성 | 수동 | `{shipmentId, trackingNo}` |
| `SHIPMENT_DISPATCHED` | 출고 발송 | 자동(택배API) | `{carrier, trackingNo}` |
| `SHIPMENT_DELIVERED` | 출고 배달 완료 | 자동(택배API) | `{deliveredAt}` |
| `PICKUP_SCHEDULED` | 회수 예약 | 수동 | `{driverId, scheduledDate}` |
| `PICKUP_COMPLETED` | 회수 완료 | 수동 | `{condition, grade}` |

### 3.5 앱 조작 (암묵적 로깅)

| event_type | 설명 | 자동/수동 | payload 예시 |
|------------|------|-----------|-------------|
| `DETAIL_VIEWED` | 티켓 상세 조회 | **자동** | `{viewerId}` — 누가 언제 확인했는지 |
| `NOTE_ADDED` | 내부 메모 추가 | 수동 | `{content}` |
| `ATTACHMENT_UPLOADED` | 첨부파일 업로드 | 수동 | `{fileName, fileSize, fileType}` |
| `LLM_SUGGESTION_VIEWED` | LLM 답변 제안 조회 | **자동** | `{suggestionId, accepted}` |

---

## 4. 자동 로깅 규칙

### 4.1 앱 조작 시 자동 생성되는 이벤트

| 사용자 액션 | 자동 생성 이벤트 |
|------------|-----------------|
| A/S 접수 폼 저장 | `TICKET_CREATED` |
| 티켓 상태 드롭다운 변경 | `STATUS_CHANGED` |
| 이메일 발송 버튼 클릭 | `EMAIL_SENT` + MailLog + (해당 티켓 첫 고객향이면) `FIRST_RESPONSE` |
| SMS 발송 버튼 클릭 | `SMS_SENT` + MailLog + (해당 티켓 첫 고객향이면) `FIRST_RESPONSE` |
| 비용 항목 추가 | `COST_ADDED` |
| 출고 생성 | `SHIPMENT_CREATED` |
| 티켓 상세 페이지 진입 | `DETAIL_VIEWED` (debounce 5분) |

### 4.2 FIRST_RESPONSE 자동 감지 로직

```
해당 ticket_id의 기존 이벤트 중
  event_type IN ('EMAIL_SENT', 'SMS_SENT', 'PHONE_CALL_LOGGED')
  AND actor_role != 'CUSTOMER'
가 0건이면 → 현재 발송 이벤트와 동시에 FIRST_RESPONSE 이벤트 자동 생성
```

### 4.3 duration_from_prev_ms 자동 계산

```
INSERT 시 서버에서:
  SELECT MAX(occurred_at) FROM as_ticket_events WHERE ticket_id = ?
  duration_from_prev_ms = new_occurred_at - prev_occurred_at
```

---

## 5. 분석 KPI (파생 지표)

### 5.1 구간별 소요 시간

| KPI | 계산 방법 | 목표 |
|-----|----------|------|
| **접수→배정** (Assignment Time) | `ENGINEER_ASSIGNED.occurred_at - TICKET_CREATED.occurred_at` | < 2시간 |
| **배정→작업시작** (Pickup Time) | `WORK_STARTED.occurred_at - ENGINEER_ASSIGNED.occurred_at` | < 4시간 |
| **접수→최초응답** (First Response Time) | `FIRST_RESPONSE.occurred_at - TICKET_CREATED.occurred_at` | < 24시간 |
| **최초응답→종료** (Resolution Time) | `TICKET_CLOSED.occurred_at - FIRST_RESPONSE.occurred_at` | < 5영업일 |
| **전체 처리 시간** (E2E Time) | `TICKET_CLOSED.occurred_at - TICKET_CREATED.occurred_at` | < 7영업일 |
| **커뮤니케이션 밀도** | `COUNT(COMM events) / E2E days` | 최소 1회/영업일 |

### 5.2 병목 분석 뷰

```sql
-- 구간별 평균 소요 시간 (최근 30일)
SELECT
  AVG(assign_time) AS avg_assign_hours,
  AVG(first_response_time) AS avg_first_response_hours,
  AVG(resolution_time) AS avg_resolution_hours,
  AVG(e2e_time) AS avg_e2e_hours
FROM (
  SELECT
    t.ticket_id,
    TIMESTAMPDIFF(HOUR, created.occurred_at, assigned.occurred_at) AS assign_time,
    TIMESTAMPDIFF(HOUR, created.occurred_at, first_resp.occurred_at) AS first_response_time,
    TIMESTAMPDIFF(HOUR, first_resp.occurred_at, closed.occurred_at) AS resolution_time,
    TIMESTAMPDIFF(HOUR, created.occurred_at, closed.occurred_at) AS e2e_time
  FROM as_tickets t
  JOIN as_ticket_events created ON t.ticket_id = created.ticket_id AND created.event_type = 'TICKET_CREATED'
  LEFT JOIN as_ticket_events assigned ON t.ticket_id = assigned.ticket_id AND assigned.event_type = 'ENGINEER_ASSIGNED'
  LEFT JOIN as_ticket_events first_resp ON t.ticket_id = first_resp.ticket_id AND first_resp.event_type = 'FIRST_RESPONSE'
  LEFT JOIN as_ticket_events closed ON t.ticket_id = closed.ticket_id AND closed.event_type = 'TICKET_CLOSED'
  WHERE created.occurred_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
) sub;
```

### 5.3 엔지니어별 성과 지표

| 지표 | 설명 |
|------|------|
| 평균 처리 시간 | 배정~종료 |
| 평균 최초 응답 시간 | 배정~첫 고객 응답 |
| 커뮤니케이션 빈도 | 건당 평균 소통 횟수 |
| 재개율 | 종료 후 TICKET_REOPENED 비율 |
| 비용 정확도 | 비용 수정(COST_UPDATED) 빈도 |

---

## 6. API 엔드포인트

| 액션 | Method | Endpoint | 비고 |
|------|--------|----------|------|
| 티켓 이벤트 조회 | GET | `/api/tickets/{id}/events?page&size` | 시간순 정렬 |
| 이벤트 타임라인 | GET | `/api/tickets/{id}/timeline` | 타임라인 뷰 전용 (그룹핑+구간시간 포함) |
| 수동 이벤트 기록 | POST | `/api/tickets/{id}/events` | PHONE_CALL_LOGGED, NOTE_ADDED 등 |
| KPI 대시보드 | GET | `/api/analytics/ticket-kpi?from&to` | 구간별 평균, 분포 |
| 엔지니어별 성과 | GET | `/api/analytics/engineer-performance?from&to` | 팀장/총괄만 |
| 병목 분석 | GET | `/api/analytics/bottleneck?from&to` | 어느 구간에서 지연 집중? |
| SLA 위반 목록 | GET | `/api/analytics/sla-violations?from&to` | 목표 초과 건 |

---

## 7. UI 반영 포인트

### 7.1 티켓 상세 페이지 — 타임라인 패널

```
┌─────────────────────────────────────────┐
│ 📋 AS-2026-0412  이어폰 좌측 무음       │
├─────────────────────────────────────────┤
│ [기본정보] [타임라인] [비용] [소통이력]  │
├─────────────────────────────────────────┤
│                                         │
│  ● 2026-04-20 09:12  접수 생성          │
│  │  CS/CX 이수진 · 증상: 좌측 무음      │
│  │                                      │
│  ● 2026-04-20 10:45  엔지니어 배정      │  ← 1시간 33분
│  │  팀장 김팀장 → 엔지니어 박수리       │
│  │                                      │
│  ● 2026-04-20 14:20  작업 시작          │  ← 3시간 35분
│  │  엔지니어 박수리                     │
│  │                                      │
│  ● 2026-04-20 15:00  최초 고객 응답     │  ← 5시간 48분
│  │  📧 이메일 "증상 확인 및 수리 안내"  │
│  │                                      │
│  ● 2026-04-21 09:30  비용 산정          │
│  │  지출 15,000 / 수납 10,000 / 보상 0  │
│  │                                      │
│  ● 2026-04-21 10:15  SMS 발송           │
│  │  📱 "수리 완료 안내"                 │
│  │                                      │
│  ● 2026-04-21 11:00  출고 생성          │
│  │  📦 CJ대한통운 123456789             │
│  │                                      │
│  ● 2026-04-22 14:30  티켓 종료          │  ← 전체 2일 5시간
│  │  처리 완료 — 부품 교체               │
│                                         │
│  ─── 전체 소요: 2일 5시간 18분 ───      │
│  ─── 고객 소통: 3회 (이메일 2, SMS 1) ──│
└─────────────────────────────────────────┘
```

### 7.2 대시보드 — KPI 카드

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 평균배정  │ │ 평균최초  │ │ 평균해결  │ │ SLA위반  │
│  1.8h    │ │  5.2h    │ │  3.1일   │ │  4건     │
│ 목표 <2h │ │ 목표<24h │ │ 목표<5일 │ │ ↓2건     │
│  ✅      │ │  ✅      │ │  ✅      │ │  ⚠️      │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### 7.3 병목 분석 차트

- **구간별 소요 시간 분포** (Box plot): 접수→배정 / 배정→시작 / 시작→응답 / 응답→종료
- **요일별 평균 처리 시간** (Bar chart): 월~금 어느 요일이 느린지
- **엔지니어별 비교** (Horizontal bar): 누가 빠르고 누가 느린지
- **재개율 추이** (Line chart): 한번에 해결 못하는 비율 트렌드

---

## 8. 구현 우선순위

| 순서 | 항목 | Phase |
|------|------|-------|
| 1 | `as_ticket_events` 테이블 생성 | Phase 3 |
| 2 | 티켓 CRUD 시 자동 이벤트 INSERT | Phase 3 |
| 3 | MailLog 발송 시 이벤트 연동 + FIRST_RESPONSE 자동 감지 | Phase 5 |
| 4 | 타임라인 패널 UI (티켓 상세 탭) | Phase 3 |
| 5 | PHONE_CALL_LOGGED 수동 입력 UI | Phase 3 |
| 6 | KPI 대시보드 카드 | Phase 3 |
| 7 | 병목 분석 차트 (리포트 현황 #13) | Phase 3 |
| 8 | 엔지니어 성과 뷰 (팀장/총괄) | Phase 3 |
| 9 | SLA 위반 알림 (SMS/이메일) | Phase 5 |
| 10 | 출고/회수 이벤트 연동 | Phase 4 |

---

## 9. 도메인 규칙 추가

- **이벤트는 불변(immutable)**: INSERT만 허용, UPDATE/DELETE 금지
- **시계열 정렬**: `occurred_at` 기준 — 서버 시각 사용 (클라이언트 시각 불신)
- **FIRST_RESPONSE는 티켓당 1회**: 중복 생성 방지 로직 필수
- **DETAIL_VIEWED debounce**: 같은 사용자가 5분 내 재조회 시 중복 기록 안 함
- **payload JSON 스키마**: event_type별 JSON Schema 검증 (서버 사이드)
- **개인정보 주의**: payload에 고객 개인정보 원문 저장 금지 — ID 참조만
