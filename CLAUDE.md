# A/S & CS 통합 관리 플랫폼

## 개요
기존 어드민 시스템에서 A/S 도메인을 분리한 전용 통합 앱.
Electron(Windows/macOS 데스크톱)과 웹(모바일 브라우저)을 동시에 지원하는 React 기반 앱.

## 아키텍처
- **프론트엔드**: React + Tailwind CSS (반응형 레이아웃)
- **데스크톱 래핑**: Electron
- **백엔드**: 기존 Spring Boot API 재사용·확장 (클라이언트→DB 직접 쿼리 금지)
- **DB**: 기존 MySQL 통합 DB (공유, 스키마 추가 방향만 허용)
- **LLM 위키**: 로컬 Claude API (Tailscale VPN 경유)
- **알림 채널**: 기존 어드민 SMTP, SMS(알림톡), 택배사 API 재사용

## 사용자 및 권한
- A/S 담당자 (5명): A/S 접수·진행·종료·출고
- CS/CX (4명): 상담 내역·티켓 조회
- 팀장 (2명): 티켓 배분·비용 현황·리포트
- 총괄 (1명): 전체 대시보드·설정

## 주요 도메인 엔티티
- **Customer**: 전화번호(조회 PK 기준)·신상·구매 이력
- **Ticket**: A/S 접수부터 종료까지의 이력 단위
- **Product**: 모델명·시리얼·정품등록 정보
- **Shipment**: 출고·회수 물류 정보
- **CostEntry**: 비용 3축 (우리 지출 / 고객 수납 / 본사 보상)
- **MailLog**: 이메일·SMS 송수신 기록
- **TicketEvent**: 티켓 라이프사이클 이벤트 로그 (불변, INSERT 전용)

## 티켓 라이프사이클 추적
- 모든 티켓 조작(접수·배정·상태변경·소통·비용·출고·종료)은 `TicketEvent`로 자동 기록
- 이벤트 유형: TICKET_CREATED, ENGINEER_ASSIGNED, WORK_STARTED, FIRST_RESPONSE, STATUS_CHANGED, EMAIL_SENT, SMS_SENT, PHONE_CALL_LOGGED, COST_ADDED/UPDATED/APPROVED, SHIPMENT_CREATED/DELIVERED, TICKET_CLOSED/REOPENED 등 22종
- FIRST_RESPONSE는 해당 티켓 첫 고객향 발송 시 자동 감지·태깅
- 이벤트는 **불변** — INSERT만 허용, UPDATE/DELETE 금지
- 서버 시각 기준 (클라이언트 시각 불신), payload에 개인정보 원문 저장 금지
- KPI: 접수→배정(<2h), 접수→최초응답(<24h), 전체 처리(<7영업일), 커뮤니케이션 밀도(≥1회/영업일)
- 상세 설계: `docs/ticket-lifecycle-tracking.md`

## 도메인 규칙
- 모든 고객 조회는 **전화번호** 기준
- 티켓은 담당자 단위로 배분되며 상태 이력이 남아야 함
- 비용은 3축(지출·수납·보상)으로 분리 추적
- LLM 자동 답변은 **suggestion 형태만** (자동 발송 절대 금지)
- 회수 관리는 판매 후 단기 접수 건(직접 기사 배정)만 해당
- 교환·반품 처리 시 재고 재등록 / 리퍼브 / 부품 처리 분기 필수
- 이메일·SMS 발송 시 반드시 MailLog 기록
- 모든 앱 조작·소통·비용 변경은 TicketEvent로 자동 로깅 (별도 입력 부담 최소화)

## 핵심 페이지 목록
1. 고객 정보 조회
2. 전체 상담 내역
3. 젠데스크 문의 마이그레이션
4. A/S 접수 및 상세 관리
5. A/S 현황 대시보드
6. A/S 비용 추적
7. A/S 출고 관리
8. 회수 관리
9. 정품등록·쿠폰·시리얼 관리
10. 교환&반품 관리
11. 이메일·SMS 로그
12. 티켓 배분·담당자 관리
13. 리포트 현황
14. 전체 통계 대시보드
15. 설정

## DoD 패턴
- 각 페이지: 목록 → 상세 → 생성/편집 플로우 완성
- API 호출 전부 Spring 백엔드 경유
- 이메일·SMS 발송 시 MailLog 자동 생성 확인
- Electron 빌드 및 모바일 웹 반응형 양쪽 QA 완료

---

## 참고: 기존 어드민 B2CCRM(A/S) 코드 위치 맵

> 새 시스템은 기존 어드민의 B2CCRM 도메인에서 A/S만 떼어내 재구성. 백엔드는 그대로 재사용·확장하고, 프론트는 새로 만들기 때문에 기존 위치를 알아 두는 것만으로 충분. 본 섹션은 "어디서 찾고 무엇을 참고할지"를 위한 인덱스.

### 레포 위치
- 백엔드(Spring Boot): `C:\workspace\tbnws_admin_back`
- 프론트(React+MUI+Vite): `C:\workspace\tbnws_admin_front`

### 백엔드 — B2CCRM 핵심 파일

| 영역 | 경로 |
|------|------|
| Controller(API 정의) | [b2c/controller/B2CCRMApi.java](../tbnws_admin_back/src/main/java/com/tbnws/gtgear/support/tbnws_admin_back/b2c/controller/B2CCRMApi.java) (1457줄) |
| Controller(구현) | [b2c/controller/B2CCRMController.java](../tbnws_admin_back/src/main/java/com/tbnws/gtgear/support/tbnws_admin_back/b2c/controller/B2CCRMController.java) (1023줄) |
| Service | [b2c/service/B2CCRMService.java](../tbnws_admin_back/src/main/java/com/tbnws/gtgear/support/tbnws_admin_back/b2c/service/B2CCRMService.java) (2243줄) |
| DAO | [b2c/dao/B2CCRMDAO.java](../tbnws_admin_back/src/main/java/com/tbnws/gtgear/support/tbnws_admin_back/b2c/dao/B2CCRMDAO.java) (809줄) |
| MyBatis 매퍼 | `tbnws_admin_back/src/main/resources/mapper/b2ccrm.xml` (114+ 쿼리) |
| Request DTO | `b2c/dto/b2ccrm/request/` |
| Response DTO | `b2c/dto/b2ccrm/response/` |

### 백엔드 — API 엔드포인트 그룹 (`/api/b2ccrm/*`)

| 그룹 | 대표 엔드포인트 |
|------|-----------------|
| A/S 조회 | `GET/POST /as`, `GET /as/{asSeq}` |
| A/S 생성·삭제 | `POST /createAS`, `DELETE /deleteAS/{asSeq}`, `POST /updateCustomerInfo` |
| A/S 제품 | `GET /getASProductInfo`, `GET /searchASProduct`, `POST /addNewProductToAS/{asSeq}`, `DELETE /removeASProduct/{asSeq}/{productSeq}` |
| A/S 필드 수정 | `PATCH /updateASField/{asSeq}`, `PATCH /updateASProductField/{productSeq}` |
| 젠데스크 연결 | `GET /getBoardList`, `POST /linkNewTicketToAS`, `POST /linkNewTicketListToAS/{asSeq}`, `POST /unlinkTicketFromAS` |
| 알림톡 | `POST /asNotify`, `GET /getASNotifyResult` |
| A/S 출고 | `GET/POST /asExport`, `GET/PATCH/DELETE /asExport/{seq}`, `POST /asExport/excel` |
| A/S 회수 | `GET/POST /returnManagement`, `GET/PATCH/DELETE /returnManagement/{seq}` |
| 비용 | `POST /crmCost` |
| 상담 메모 | `GET /getMemoList`, `GET /getMemoStatus`, `POST /addMemo` |
| 리포트 | `GET/POST /report`, `GET/PATCH/DELETE /report/{seq}`, `PATCH /report/{seq}/complete` |
| 환불 | `GET/POST/PATCH/DELETE /customerRefund`, `POST /customerRefund/isCompleted` |

### 백엔드 — 핵심 테이블

| 테이블 | 용도 |
|--------|------|
| `crm_as` | A/S 기본정보 (고객·전화·주소·담당자·상태) — 새 시스템 `Ticket` 후보 |
| `crm_as_product` | A/S별 제품 목록 (코드·수량·처리유형) |
| `as_board_rel` | A/S ↔ 젠데스크 티켓 연결 |
| `as_export` | A/S 출고 정보 → 새 시스템 `Shipment(out)` |
| `return_management` | A/S 회수 → 새 시스템 `Shipment(return)` |
| `crm_as_history` | A/S 변경이력 → 새 시스템 `TicketEvent`의 원형 (단, 기존은 가변/필드 단위) |

### 백엔드 — 핵심 흐름 요약
- **A/S 생성**(`createAS`): A/S INSERT → 젠데스크 티켓 연결(선택) → `saveASHistory()` 이력 저장 (단일 트랜잭션)
- **A/S 출고**(`createAsExport`): 출고 INSERT → 상품별로 지티기어/풀필먼트/리퍼브 분기 → ERP 재고 차감 또는 출고요청 생성 → 필요 시 알림톡
- **A/S 회수**(`createReturnManagement`): 회수 INSERT → 상품 등록 → 즉시 입고 대상은 ERP 발주생성 → 입고/가용재고 집계
- **외부 시스템**: 젠데스크(티켓), 알림톡/SMS/이메일(`SendService`), 택배(`sendLogenReturnEmail`), 사방넷(비등록 채널), ERP(재고·발주)

### 새 시스템에서 그대로 재사용 vs 재설계

| 재사용 | 재설계 |
|--------|--------|
| MyBatis 동적 검색(`SearchASListRequest` 패턴) | `crm_as_history` → 불변 `TicketEvent`로 교체 (INSERT 전용, payload 표준화) |
| 외부 연동 추상화(`SendService`, ERP 호출) | DTO 분리: `request/response` 평면 → 도메인 그룹화 (`AsOperationContext` 등) |
| `saveASHistory()` 호출 지점 (이벤트 자동 로깅 위치 식별용) | 알림톡/이메일을 Service 인라인 호출 → 이벤트 기반 비동기 처리 |
| 젠데스크/사방넷/ERP 연결부 | 트랜잭션 경계: 출고/회수 시 보상 트랜잭션 도입 |

### 프론트 — B2C 페이지 위치

위치: `tbnws_admin_front/src/pages/b2c/`

| 새 시스템 페이지 | 참고할 기존 파일 |
|-----------------|------------------|
| 4. A/S 접수·상세 관리 | [pages/b2c/AS.tsx](../tbnws_admin_front/src/pages/b2c/AS.tsx) (가장 핵심) |
| 5. A/S 현황 대시보드 | AS.tsx의 필터·집계 부분 |
| 6. A/S 비용 추적 | [pages/b2c/ASCostStatus.tsx](../tbnws_admin_front/src/pages/b2c/ASCostStatus.tsx) |
| 7. A/S 출고 관리 | [pages/b2c/ASExport.tsx](../tbnws_admin_front/src/pages/b2c/ASExport.tsx) |
| 8. 회수 관리 | [pages/b2c/ReturnManagement.tsx](../tbnws_admin_front/src/pages/b2c/ReturnManagement.tsx) |
| 9. 정품등록·시리얼 | [pages/b2c/Warranty.tsx](../tbnws_admin_front/src/pages/b2c/Warranty.tsx), [ProductRegisterManualPage.tsx](../tbnws_admin_front/src/pages/b2c/ProductRegisterManualPage.tsx) |
| 10. 교환·반품 | [pages/b2c/Refund.tsx](../tbnws_admin_front/src/pages/b2c/Refund.tsx), [CustomerRefundPage.tsx](../tbnws_admin_front/src/pages/b2c/CustomerRefundPage.tsx) |
| 2. 전체 상담 내역 | [pages/b2c/AllMemoPage.tsx](../tbnws_admin_front/src/pages/b2c/AllMemoPage.tsx) |
| 3. 젠데스크 마이그레이션 | [pages/b2c/ZendeskList.tsx](../tbnws_admin_front/src/pages/b2c/ZendeskList.tsx) |
| 13. 리포트 현황 | [pages/b2c/Report.tsx](../tbnws_admin_front/src/pages/b2c/Report.tsx) |

### 프론트 — AS.tsx 컴포넌트 트리 (가장 복잡)

```
AS.tsx (Material-React-Table + 필터 + DateRangePicker)
└── ASModal (1350px 다이얼로그, 좌우 분할)
    ├── ASSummarySection (우, 330px)
    │   ├── ASTitle / ASTicketListComponent / ASCustomerInfoComponent / ASProcessingInfoComponent
    ├── ASProductListComponent (좌, 메인)
    │   └── ASProductDetailComponent / ProductSelector
    ├── ASHistory (우 부가)
    ├── ASNotify (알림톡) / SendSMSDialog (SMS)
└── AddASDialog
```

> 새 앱은 Tailwind + shadcn/ui DataTable + HeadlessUI Dialog 조합으로 같은 구조 재현 가능. MUI 의존은 모두 떼어냄.

### 프론트 — URL 상수
- 위치: `tbnws_admin_front/src/constant/url/b2ccrm/b2ccrm.ts` (109줄)
- 패턴: `as`, `createAS`, `updateASField`, `getASHistory`, `getBoardList`, `linkNewTicketToAS`, `sendASAlimtalk`, `asExport*`, `returnManagement*`, `customerRefund`, `report` 등 도메인별 키

### 프론트 — 데이터 페칭 패턴 (B2C 영역 실제 사용 비율)
- **`useGet` (React Query)**: 대다수 목록·상세 조회 — 새 앱도 동일 권장
- **`useMutating`**: POST/PATCH/DELETE — 새 앱도 동일 권장
- **Repository + tsyringe DI**: B2C에선 `customerRefund`, `combineProduct` 일부에만 사용 — 새 앱은 굳이 도입 안 해도 됨

### 새 앱에서 빌려올 만한 패턴
- 담당자 토글(내담당/미배치/전체) + 기간 필터 + 그룹화 테이블 (`AS.tsx`)
- A/S 상세 모달의 좌우 패널 분할 + 부가 다이얼로그(알림톡·SMS·이력) 조합
- React-Hook-Form + 날짜 범위 다이얼로그 + Autocomplete (담당자/카테고리)
- 모바일/PC 분기: MUI `useMediaQuery` → Tailwind 반응형 클래스로 치환

### 주의 — 새 시스템 설계와의 차이
- 기존 `crm_as_history`는 가변·필드 단위 기록. 새 시스템 `TicketEvent`는 **불변·INSERT 전용·22종 enum**으로 강하게 정형화됨 → 마이그레이션 시 매핑 규칙 필요
- 기존엔 알림톡·메일·SMS가 Service 안에서 직접 호출 → 새 시스템은 발송과 동시에 `MailLog` + `TicketEvent(EMAIL_SENT/SMS_SENT)` 자동 생성이 의무
- 기존엔 `crm_as` 단일 테이블에 고객정보가 같이 들어가 있는 경우 있음 → 새 시스템은 `Customer`(전화번호 PK) ↔ `Ticket` 분리