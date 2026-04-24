# A/S & CS 통합 관리 플랫폼

기존 Spring+MySQL 어드민 인프라를 기반으로 A/S 접수·진행·비용·물류·반품 전 흐름을 하나의 Electron+웹 앱에서 관리하는 A/S 전용 통합 시스템

## Stack
- React
- Electron
- Tailwind CSS
- Spring Boot
- MySQL
- Claude API

## Constraints
- 기존 MySQL 통합 DB 사용 필수 — 스키마 변경은 추가(ALTER/CREATE) 방향만 허용
- 기존 Spring Boot 백엔드 API 재사용 또는 A/S 도메인 엔드포인트 추가로 확장
- SMS(알림톡)·SMTP·택배사 API는 기존 어드민 시스템 자격증명 재사용
- 로컬 Claude LLM 위키는 Tailscale VPN 경유 API로만 접근
- Electron(Windows/macOS) 데스크톱 앱과 모바일 웹 브라우저 동시 지원 필수
- 총 12인 사용자 규모 (A/S 5명·CS/CX 4명·팀장 2명·총괄 1명)
