# A/S & CS 통합 관리 플랫폼 — Developer Setup

자동화 Agent 가 처리할 수 없어 **사람이 직접** 해야 하는 작업 목록입니다.
완료하면 체크박스를 켜고 커밋하세요.

## Manual Tasks

- [ ] `.mcp.json`의 `mysql-read`·`mysql-write` 서버 환경변수 채우기 — MySQL 호스트·포트·DB명·계정·비밀번호 입력 필요
- [ ] `.mcp.json`의 `github` 서버 Personal Access Token 발급 후 env 등록
- [ ] Tailscale VPN 설정 및 로컬 Claude LLM API 접근 URL·포트 확인 후 `.env`에 등록
- [ ] 기존 Spring 백엔드 API 문서(엔드포인트 목록) 공유 — A/S 도메인 재사용 범위 사전 확인
- [ ] SMS(알림톡)·SMTP·택배사 API 자격증명 `.env`에 등록 — 기존 어드민 시스템 담당자 확인 필요
- [ ] `.mcp.json`의 `resend` 서버 API 키 채우기 — 이메일 발송 테스트용
- [ ] Google Workspace MCP 인증 완료 — Google Slides 목업 자동 생성 및 공유 권한 확인
- [ ] 택배사 API MCP 추가 검토 — 현재 MCP 카탈로그에 택배사 연동 전용 서버 없음
