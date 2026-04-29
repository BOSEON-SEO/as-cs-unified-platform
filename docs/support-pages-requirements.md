# 지원 페이지 상세 요구사항

> ProductRegistrationPage · TicketAssignPage · SettingsPage

---

## 1. ProductRegistrationPage — 정품등록·시리얼·쿠폰 관리

### 1.1 목적

시리얼 번호 검증, 정품등록 관리, 보증 기간 자동 산정, 쿠폰 자동 발급, 위변조 블랙리스트를 **단일 화면**에서 처리. 기존 어드민의 분산된 3개 메뉴를 통합.

### 1.2 ROADMAP 연관성

- **Phase 4**: "정품등록·시리얼 검수·쿠폰 발급 관리" (ROADMAP.md 56행)
- **Phase 3 연동**: TicketCreatePage에서 시리얼 자동 검증 (step 1)
- **Phase 2 연동**: CustomerPage 정품등록 탭에서 고객별 등록 목록 표시

### 1.3 사용자 흐름

```
1. 시리얼 빠른 검증 (상단 검색 바)
   시리얼 입력 → [검증] → 정상/중복/위변조/미등록 즉시 판별

2. 정품등록 목록 관리
   필터(상태/모델/기간) → 테이블(시리얼, 모델, 고객, 등록일, 보증만료, 쿠폰)

3. 상세 → 쿠폰 발급/무효화
   행 클릭 → 상세 패널 → 쿠폰 발급 / 보증 연장 / 블랙리스트

4. 위변조 감지 → 블랙리스트
   동일 시리얼 2회 등록 → 경고 → 팀장 승인 → 블랙리스트 + 기존 건 반려
```

### 1.4 필수 기능 및 UI 컴포넌트

| 컴포넌트 | 설명 |
|---------|------|
| **SerialVerifyBar** | 시리얼 입력 + [검증] 버튼. 결과: 정상(green)/중복(red)/위변조(red)/미등록(gray) 인라인 뱃지 |
| **RegistrationFilterBar** | FilterBar 재사용: 상태(대기/등록/반려/블랙), 모델(select), 기간(date range) |
| **RegistrationTable** | DataTable 재사용: 시리얼, 모델, 고객, 등록일, 보증만료(뱃지: 유효green/임박amber/만료red), 쿠폰상태 |
| **RegistrationDetailPanel** | SidePanel: 고객 링크, 제품 정보, 보증 기간, 쿠폰 코드+상태, 등록 이력 타임라인 |
| **CouponActions** | [쿠폰 발급] (AS_ENGINEER+) / [쿠폰 무효화] (TEAM_LEAD+, 사유 필수) / [보증 연장] (ADMIN) |
| **BlacklistModal** | [블랙리스트 등록] (TEAM_LEAD+): 사유 입력 → 기존 등록 건 자동 반려 |
| **4개 탭** | 정품등록(N) / 시리얼 관리 / 쿠폰 발급 이력 / 블랙리스트(N) |

### 1.5 데이터 모델

#### as_product_registrations

| 컬럼 | 타입 | 설명 |
|------|------|------|
| registration_id | BIGINT PK | 등록 ID |
| serial_number | VARCHAR(100) NOT NULL | 시리얼 번호 |
| product_model | VARCHAR(100) NOT NULL | 제품 모델 |
| customer_id | BIGINT FK→customers | 고객 |
| customer_phone | VARCHAR(20) NOT NULL | 전화번호 (비정규화) |
| purchase_date | DATE NOT NULL | 구매일 |
| warranty_months | INT NOT NULL | 보증 기간(월) — Product에서 참조 |
| warranty_expiry | DATE NOT NULL | 보증 만료일 (purchase_date + warranty_months 자동 계산) |
| warranty_status | ENUM('VALID','EXPIRING','EXPIRED') | 만료 30일 이내=EXPIRING |
| registration_status | ENUM('PENDING','REGISTERED','REJECTED','BLACKLISTED') | |
| registration_channel | VARCHAR(20) | 웹/앱/오프라인 |
| created_at | DATETIME | |

**인덱스**: (serial_number UNIQUE), (customer_id), (warranty_status, warranty_expiry), (registration_status)

#### as_coupons

| 컬럼 | 타입 | 설명 |
|------|------|------|
| coupon_id | BIGINT PK | |
| registration_id | BIGINT FK | 정품등록 연결 |
| coupon_code | VARCHAR(20) UNIQUE | CPR-YYYY-XXXXXX |
| coupon_type | VARCHAR(50) | 정품등록 5%, 보증 연장 등 |
| status | ENUM('ISSUED','USED','EXPIRED','INVALIDATED') | |
| valid_until | DATE | 유효기간 |
| invalidation_reason | VARCHAR(500) NULL | 무효화 사유 |
| created_at | DATETIME | |

#### as_serial_blacklist

| 컬럼 | 타입 | 설명 |
|------|------|------|
| blacklist_id | BIGINT PK | |
| serial_number | VARCHAR(100) NOT NULL | |
| reason | VARCHAR(500) NOT NULL | |
| registered_by | BIGINT FK→users | |
| created_at | DATETIME | |

### 1.6 API 요구사항

| Method | Endpoint | 설명 | RBAC |
|--------|----------|------|------|
| GET | /api/registrations | 목록 (필터·페이징) | ALL |
| GET | /api/registrations/{id} | 상세 | ALL |
| POST | /api/registrations | 신규 등록 | AS_ENGINEER+ |
| PATCH | /api/registrations/{id} | 상태 변경 | AS_ENGINEER+ |
| GET | /api/serials/verify?sn={serial} | 시리얼 검증 | ALL |
| POST | /api/serials/blacklist | 블랙리스트 등록 | TEAM_LEAD+ |
| POST | /api/coupons | 쿠폰 수동 발급 | AS_ENGINEER+ |
| GET | /api/coupons | 쿠폰 목록 | ALL |
| PATCH | /api/coupons/{id}/invalidate | 쿠폰 무효화 | TEAM_LEAD+ |

### 1.7 기술 요구사항

- **보증 만료 자동 계산**: purchase_date + warranty_months → warranty_expiry. @Scheduled daily batch로 warranty_status 갱신 (VALID→EXPIRING→EXPIRED).
- **쿠폰 자동 발급**: 정품등록 status=REGISTERED 전이 시 @TransactionalEventListener → coupon auto-create.
- **중복 시리얼 탐지**: serial_number UNIQUE 제약 + 등록 시도 시 SELECT COUNT → 2건 이상이면 경고 + 블랙리스트 후보.
- **CustomerPage 연동**: CustomerPage 정품등록 탭 → GET /api/customers/{id}/registrations (이미 정의됨).

---

## 2. TicketAssignPage — 티켓 배분·담당자 관리

### 2.1 목적

미배정 티켓을 실시간 파악하고, **수동 배정(드래그&드롭)** 또는 **자동 배정(라운드로빈/부하 기반)**을 수행. 기존 구두/메신저 배정 → 시스템 내 추적으로 전환.

### 2.2 ROADMAP 연관성

- **Phase 3**: "티켓 목록·배분 (담당자 배정 및 상태 변경)" (ROADMAP.md 40행)
- **Phase 3 DoD**: "접수 → 처리 → 완료 E2E 플로우 정상 동작" — 배정은 E2E의 2단계
- **TicketDetailPage 연동**: step 2 (배정) 시 ENGINEER_ASSIGNED 이벤트 자동 기록

### 2.3 사용자 흐름

```
[팀장/총괄]
1. 자동 배정 토글 확인 (ON/OFF 배너)
2. 미배정 큐에서 대기 건 확인 (대기 시간 경고 뱃지)
3. 수동: 카드 드래그 → 담당자 행에 드롭 → 배정 완료 + 알림
   모바일: 카드 → [배정 ▼ 담당자 선택] → 배정
4. 일괄: 체크박스 N건 선택 → [일괄 배정] → 담당자 선택 → 배정
5. 자동 배정 설정: 모드(라운드로빈/부하 기반), 최대 보유, 크루 풀 ON/OFF

[총괄만]
6. 자동 배정 ON/OFF 토글 변경
7. 크루 풀 멤버 추가/제거
8. 배정 제외 조건 설정 (SLA 초과 2건+ 스킵 등)
```

### 2.4 필수 기능 및 UI 컴포넌트

| 컴포넌트 | 설명 |
|---------|------|
| **AutoAssignBanner** | 전폭 gradient 배너: 대형 토글(ON/OFF) + KPI 4종(금일 배정, 평균 시간, 규칙 위반, 미배정 잔여) |
| **UnassignedQueue** | 좌측 패널: 드래그 가능 카드 리스트. 대기 뱃지(2h amber, 4h+ red). 정렬(접수일/긴급도/제품). 체크박스 일괄 배정 |
| **AssigneeWorkloadTable** | 중앙: 테이블(담당, 부하 bar, 금주, 평균일, SLA, 응답률, [+1]). 드롭 타깃 |
| **CrewPoolPanel** | 우측: 크루 개별 ON/OFF 토글 카드 + 설정(모드, 최대 보유, 제외 조건) |
| **BatchAssignModal** | 일괄 배정 모달: 선택 건수 + 담당자 드롭다운 + [배정] |
| **AssignHistoryModal** | 배정 이력 타임라인 (일시, 배정자, 사유) |

**레이아웃**: 3-column (desktop: UnassignedQueue 240px | WorkloadTable 1.4fr | CrewPoolPanel 1fr). Mobile: 2-tab [미배정 큐 | 담당자 현황]

### 2.5 데이터 모델

#### as_assignment_rules (싱글턴, id=1 고정)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | TINYINT DEFAULT 1 PK | CHECK(id=1) |
| enabled | BOOLEAN DEFAULT FALSE | 자동 배정 ON/OFF |
| mode | ENUM('ROUND_ROBIN','LEAST_LOADED','CAPABILITY_MATCH') | |
| max_per_assignee | INT DEFAULT 20 | 담당자별 최대 보유 |
| skip_sla_exceeded | BOOLEAN DEFAULT TRUE | SLA 초과 2건+ 스킵 |
| prefer_same_customer | BOOLEAN DEFAULT FALSE | 동일 고객 직전 담당자 우선 |
| last_robin_user_id | BIGINT NULL | 라운드로빈 순서 포인터 |
| updated_at | DATETIME | |

#### as_assignment_pool

| 컬럼 | 타입 | 설명 |
|------|------|------|
| pool_id | BIGINT PK | |
| user_id | BIGINT FK→users UNIQUE | |
| enabled | BOOLEAN DEFAULT TRUE | 풀 내 ON/OFF |

### 2.6 API 요구사항

| Method | Endpoint | 설명 | RBAC |
|--------|----------|------|------|
| GET | /api/tickets/unassigned | 미배정 큐 | TEAM_LEAD+ |
| PATCH | /api/tickets/{id}/assign | 수동 배정 | TEAM_LEAD+ |
| POST | /api/tickets/batch-assign | 일괄 배정 | TEAM_LEAD+ |
| PATCH | /api/tickets/{id}/reassign | 재배정 (사유 필수) | TEAM_LEAD+ |
| GET | /api/assignees/workload | 담당자별 부하 | TEAM_LEAD+ |
| GET | /api/assignment-rules | 규칙 조회 + KPI | TEAM_LEAD+ |
| PUT | /api/assignment-rules | 규칙 변경 (토글 포함) | **ADMIN only** |
| POST | /api/assignment-rules/execute | 수동 자동 배정 실행 | TEAM_LEAD+ |
| GET | /api/tickets/{id}/assignment-history | 배정 이력 | ALL |

### 2.7 기술 요구사항

- **자동 배정 토글 즉시 반영**: PUT /api/assignment-rules → enabled 변경 → 즉시 적용. ON→OFF: 신규 미배정 유지. OFF→ON: 신규 접수부터 자동 (기존 미배정 소급 안 함).
- **라운드로빈 동시성**: @Transactional SERIALIZABLE on as_assignment_rules row. last_robin_user_id 원자적 갱신.
- **DnD**: @dnd-kit (desktop only). Mobile: 드롭다운 fallback. MVP에서는 드롭다운만 구현, DnD는 후속 개선.
- **Sidebar 연동**: Sidebar footer '자동 배정 ON/OFF' 텍스트가 실시간 반영. react-query cache invalidation on rule change.
- **ENGINEER_ASSIGNED 이벤트**: 배정 시 as_ticket_events 자동 INSERT (method: manual/auto_round_robin).

---

## 3. SettingsPage — 설정 (총괄 전용)

### 3.1 목적

사용자 계정 관리, 시스템 설정 (알림·자동배정·VIP·SLA), LLM 위키 설정, 기본값(마스터 데이터) 관리를 **총괄(ADMIN)**이 UI에서 직접 수행. 기존 DB 직접 수정 → UI 관리 전환.

### 3.2 ROADMAP 연관성

- **Phase 2**: "로그인·권한 시스템 (역할별 접근 제어)" — 사용자 관리 부분
- **Phase 3**: 자동배정 규칙, SLA 기한 설정 — TicketAssignPage와 공유
- **Phase 5**: LLM 위키 설정 — AI 의사결정 서포트 on/off 제어
- **전 Phase 공통**: 알림 채널 설정, VIP 기준, 택배사 목록

### 3.3 사용자 흐름

```
[총괄만 접근 가능 — RequireAuth allowedRoles={['ADMIN']}]

Tab 1: 사용자
  사용자 목록 테이블 → [+ 추가] → 이름/이메일/역할 → 초기 비밀번호 자동 생성+메일
  [편집] → 역할 변경 / 비밀번호 초기화 / 비활성화

Tab 2: 시스템/SLA
  알림 채널: [x] 이메일 SMTP [x] SMS [x] 알림톡 (개별 토글)
  SLA 기한: 접수→배정 [4h], 배정→작업 [1일], 최초응답 [24h], 전체 해결 [5일]
  알림 규칙: [x] SLA 80% 경과 알림 [x] SLA 초과 에스컬레이션 [x] 좀비 리마인더
  VIP 기준: 구매 ₩[1,000,000] 이상 또는 횟수 [5]회 이상

Tab 3: LLM 위키
  API 엔드포인트: https://claude-local.tailnet:8443 (read-only, 환경 변수 표시)
  API 키: ••••••••gNSe (마스킹, [갱신] 버튼)
  답변 제안: [ON/OFF 토글] (자동 발송 절대 금지 — suggestion만)
  연결 테스트: [🔌 연결 테스트] 버튼 → 성공/실패 표시

Tab 4: 기본값(코드/항목)
  비용 항목: 축별 카테고리 추가/수정/삭제 (기존 사용 중이면 삭제 방지)
  택배사 목록: 이름 + 추적 URL 패턴 + API 코드
  상태 코드: 티켓 상태 목록 (시스템 상태는 수정 불가, 커스텀만 추가)
```

### 3.4 필수 기능 및 UI 컴포넌트

| 컴포넌트 | 설명 |
|---------|------|
| **SettingsTabs** | 4-tab container: 사용자 / 시스템·SLA / LLM 위키 / 기본값 |
| **UserManagementTab** | 사용자 테이블(이름, 이메일, 역할 뱃지, 상태, 최근 로그인, [편집]) + [+추가] 모달 |
| **UserEditModal** | 이름, 이메일, 역할 select(4종), 비밀번호 초기화 체크, 비활성화 토글 |
| **SystemSettingsTab** | 알림 토글 3종 + SLA 숫자 입력 4종 + 알림 규칙 체크박스 6종 + VIP 임계값 입력 2종 |
| **LlmSettingsTab** | API URL(read-only) + API 키(마스킹+갱신) + 제안 토글 + [연결 테스트] |
| **DefaultsTab** | 3-sub-section: 비용 항목(CRUD) + 택배사(CRUD) + 상태 코드(read+add) |
| **SystemStatusCard** | 시스템 연결 상태 표시: LLM/SMTP/SMS/택배API/VPN/MySQL (각 ● 녹색/● 적색) |
| **SaveButton** | 각 탭 하단 [저장] + 변경 사항 감지 (dirty check) + 미저장 경고 |

### 3.5 데이터 모델

#### as_system_settings (싱글턴 key-value 또는 단일 JSON row)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| setting_key | VARCHAR(100) PK | 설정 키 |
| setting_value | JSON | 설정 값 |
| updated_at | DATETIME | |
| updated_by | BIGINT FK→users | |

**설정 키 목록**:
- `notification_channels`: `{ email: true, sms: true, alimtalk: true }`
- `sla_thresholds`: `{ assignmentHours: 4, workStartDays: 1, firstResponseHours: 24, resolutionDays: 5 }`
- `alert_rules`: `{ sla80: true, slaEscalation: true, zombieReminder: true, ... }`
- `vip_criteria`: `{ purchaseAmount: 1000000, purchaseCount: 5 }`
- `llm_config`: `{ endpoint: "...", suggestionEnabled: true }`
- `carrier_list`: `[{ name: "CJ대한통운", code: "CJ", trackingUrl: "..." }, ...]`
- `cost_categories`: `{ OUR_EXPENSE: [...], CUSTOMER_PAYMENT: [...], ... }`

### 3.6 API 요구사항

| Method | Endpoint | 설명 | RBAC |
|--------|----------|------|------|
| GET | /api/users | 사용자 목록 | ADMIN |
| POST | /api/users | 사용자 추가 (초기 비번 생성+메일) | ADMIN |
| PATCH | /api/users/{id} | 역할 변경, 비활성화, 비번 초기화 | ADMIN |
| GET | /api/settings/system | 시스템 설정 전체 | ADMIN |
| PATCH | /api/settings/system | 부분 업데이트 | ADMIN |
| GET | /api/settings/llm | LLM 설정 (API 키 마스킹) | ADMIN |
| PATCH | /api/settings/llm | LLM 설정 변경 | ADMIN |
| POST | /api/settings/llm/test | 연결 테스트 (Claude API ping) | ADMIN |
| GET | /api/settings/defaults?type={type} | 기본값 조회 | ADMIN |
| POST | /api/settings/defaults | 기본값 추가 | ADMIN |
| PATCH | /api/settings/defaults/{id} | 기본값 수정 | ADMIN |
| DELETE | /api/settings/defaults/{id} | 기본값 삭제 (사용 중 방지) | ADMIN |

### 3.7 기술 요구사항

- **권한 변경 즉시 반영**: PATCH /api/users/{id} { role: 'TEAM_LEAD' } → 해당 사용자의 다음 API 호출부터 새 role 적용. JWT에 role이 포함되므로, 역할 변경 시 기존 JWT 무효화 + 재발급 필요 (서버에서 token blacklist 또는 role 변경 시 refresh token 삭제).
- **설정 변경 즉시 반영**: VIP 기준 변경 → 다음 고객 조회부터 새 기준 적용. SLA 임계값 변경 → 다음 SLA 계산부터 반영. 진행 중인 티켓에는 소급 적용하지 않음 (생성 시점의 설정 스냅샷).
- **기본값 삭제 방지**: 비용 항목 삭제 시 해당 카테고리를 사용 중인 as_cost_entries 존재 여부 확인. 사용 중이면 400 에러 + 메시지 '해당 항목을 사용 중인 비용 N건이 있습니다'.
- **LLM 제안 on/off**: suggestionEnabled=false → 전체 앱에서 AiSuggestionPanel 숨김 처리 (프론트에서 GET /api/settings/llm → 캐시, 조건부 렌더링).
- **시스템 상태 표시**: SettingsPage 하단 또는 Sidebar footer에 6개 시스템 연결 상태 표시. 각 서비스 health check 엔드포인트 필요 (Phase 5).

---

## 페이지 간 데이터 의존성 요약

```
SettingsPage
├── assignment_rules → TicketAssignPage (자동 배정 규칙 공유)
├── vip_criteria → CustomerPage (VIP 뱃지 기준)
├── sla_thresholds → TicketDetailPage (SLA 계산) + DashboardPage (SLA KPI)
├── cost_categories → CostTrackingPage (비용 항목 드롭다운)
├── carrier_list → ShipmentPage (택배사 선택 목록)
├── notification_channels → MailLog system auto-triggers
└── llm_config → AiSuggestionPanel (제안 ON/OFF)

ProductRegistrationPage
├── serial_verify → TicketCreatePage step 1 (시리얼 자동 검증)
├── registrations → CustomerPage 정품등록 탭 (고객별 조회)
├── warranty_expiry → TicketDetailPage (보증 기간 표시)
└── coupons → CustomerPage 정품등록 탭 (쿠폰 상태 표시)

TicketAssignPage
├── assignment_rules ← SettingsPage (규칙 설정)
├── unassigned queue ← TicketListPage (RECEIVED 상태 티켓)
├── assign action → TicketDetailPage (step 2 배정)
├── ENGINEER_ASSIGNED event → TicketEvent timeline
└── workload data → DashboardPage (담당자별 부하 차트)
```

---

## Goal 달성 기술 경로

| Goal | 기술 요구 | 구현 시점 |
|------|----------|----------|
| 자동 배정 토글 즉시 반영 | PUT /api/assignment-rules { enabled } → Spring @EventListener → 다음 TICKET_CREATED부터 적용 | Phase 3 Sprint 2 |
| 정품등록 쿠폰 자동 발급 | registration REGISTERED 전이 → @TransactionalEventListener → coupon INSERT + MailLog | Phase 4 Sprint 3 |
| 권한 변경 즉시 반영 | PATCH /api/users/{id} → JWT refresh 강제 → 다음 요청부터 새 role | Phase 2 Sprint 0 |
| VIP 기준 동적 변경 | GET /api/settings/system → staleTime 5min 캐시 → CustomerPage에서 grade 판단 시 참조 | Phase 3 |
| 기본값 삭제 방지 | DELETE 시 FK 참조 건수 확인 → 0건이면 삭제 허용, N건이면 400 에러 | Phase 3 |
| LLM 제안 ON/OFF | GET /api/settings/llm → suggestionEnabled → AiSuggestionPanel 조건부 렌더 | Phase 5 |
