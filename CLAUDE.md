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

## 도메인 규칙
- 모든 고객 조회는 **전화번호** 기준
- 티켓은 담당자 단위로 배분되며 상태 이력이 남아야 함
- 비용은 3축(지출·수납·보상)으로 분리 추적
- LLM 자동 답변은 **suggestion 형태만** (자동 발송 절대 금지)
- 회수 관리는 판매 후 단기 접수 건(직접 기사 배정)만 해당
- 교환·반품 처리 시 재고 재등록 / 리퍼브 / 부품 처리 분기 필수
- 이메일·SMS 발송 시 반드시 MailLog 기록

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

## 레퍼런스 시스템: tobe-tickets
기존에 Flask로 구축된 **읽기 전용** AS 티켓 분석 대시보드.
본 플랫폼의 대시보드·인사이트 설계 시 핵심 레퍼런스.

- **리포**: `https://github.com/TobeNetworksGlobal/tobe-tickets.git` (private)
- **스택**: Flask 3 + PyMySQL + Chart.js + 순수 CSS
- **특성**: SELECT 전용 (INSERT/UPDATE/DELETE 없음)

### tobe-tickets 대시보드 목록 (흡수 대상)
| 경로 | 역할 | 본 플랫폼 매핑 |
|---|---|---|
| `/` (dashboard) | 6 KPI · 처리유형 분포 · 단계 평균 · 브랜드 chips | → #5 A/S 현황 + #14 전체 통계 |
| `/actions` | 11개 이상 패턴 탐지 (좀비·응대누락·가짜완료·시각오류) | → #17 액션 필요 큐 |
| `/tickets` | 8 필터 + 4 정렬 + 액션 패턴 드릴다운 | → #4 A/S 접수 목록 |
| `/team` | 담당자별 보유/완료/정체/평균/알림% | → #12 티켓 배분·담당자 |
| `/analytics` | KPI 5섹션 + 정체 티켓 + 데이터 품질 | → #16 티켓 인사이트 |
| `/ticket/<seq>` | 시간 배너 + 정체 Top3 + 9소스 통합 타임라인 | → #4 A/S 상세 타임라인 |
| `/customer` | 전화번호 기반 전체 AS 이력 | → #1 고객 정보 조회 |

### tobe-tickets 통합 데이터 소스 (9개 테이블)
| 테이블 | 행수 | 용도 |
|---|---|---|
| `crm_as` | 40K | AS 메인 |
| `crm_as_product` | 42K | 제품·진단·notify_phase |
| `crm_as_history` | 12K | 어드민 편집 로그 |
| `crm_as_export` / `crm_as_export_product` | 15K | 출고 |
| `crm_return_management` | 20K | 회수 |
| `crm_as_notify` | 2.3K | 알림톡 발송 요청 |
| `crm_call_memo` | 402K | 통화/문의 메모 |
| `tbnws.tbnws_send_sms_result` | 2.6M | SMS/카톡 발송 결과 |
| `gtgear.gtgear_forum_board` | 54K | Zendesk 티켓 mirror |

### tobe-tickets 핵심 분석 패턴 (재사용)
- Lead time 백분위수 (P50/P75/P90/P95)
- 처리유형별 평균 소요일
- 알림톡 단계 분포
- 단계별 정체 분석 (접수→시작→입고→출고)
- 좀비/정체 티켓 탐지 (11개 액션 패턴)
- 담당자별 보유·완료·정체 히트맵

## DoD 패턴
- 각 페이지: 목록 → 상세 → 생성/편집 플로우 완성
- API 호출 전부 Spring 백엔드 경유
- 이메일·SMS 발송 시 MailLog 자동 생성 확인
- Electron 빌드 및 모바일 웹 반응형 양쪽 QA 완료
- tobe-tickets 대시보드 기능을 본 플랫폼으로 흡수·확장 (읽기→CRUD)