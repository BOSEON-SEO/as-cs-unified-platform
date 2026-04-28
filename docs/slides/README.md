# 슬라이드 빌드 가이드

## Marp 기반 마크다운 슬라이드

이 폴더의 `.md` 파일은 [Marp](https://marp.app/) 형식으로 작성된 프레젠테이션 슬라이드입니다.

## 미리보기 방법

### 1. VS Code 확장 (추천 — 설치만 하면 끝)

1. VS Code에서 **Marp for VS Code** 확장 설치
   - 확장 ID: `marp-team.marp-vscode`
2. `.md` 파일 열기 → 우상단 미리보기 아이콘 클릭
3. 실제 슬라이드 형태로 바로 확인 가능

### 2. Marp CLI (HTML/PDF/PPTX 내보내기)

```bash
# 설치 (전역)
npm install -g @marp-team/marp-cli

# HTML로 변환
npx @marp-team/marp-cli 01-customer-lookup.md -o 01-customer-lookup.html

# PDF로 변환
npx @marp-team/marp-cli 01-customer-lookup.md -o 01-customer-lookup.pdf

# PPTX로 변환 (파워포인트)
npx @marp-team/marp-cli 01-customer-lookup.md -o 01-customer-lookup.pptx

# 라이브 서버 (브라우저에서 실시간 미리보기)
npx @marp-team/marp-cli -s .
```

## 슬라이드 작성 규칙

- `---` 로 슬라이드 구분
- front-matter에 `marp: true` 필수
- `<!-- _class: lead -->` → 타이틀/구분 슬라이드 (배경색 적용)
- 테이블·코드블록·이미지 모두 지원
- 커스텀 스타일은 front-matter `style` 블록에 작성

## 파일 목록

| 파일 | 내용 | 슬라이드 수 |
|------|------|-----------|
| `01-customer-lookup.md` | 고객 정보 조회 화면 스펙 | 14장 |
| `02-consultation-history.md` | 전체 상담 내역 | ~13장 |
| `03-zendesk-migration.md` | 젠데스크 문의 마이그레이션 | ~13장 |
| `04-as-detail.md` | A/S 접수 및 상세 관리 | ~14장 |
| `05-as-dashboard.md` | A/S 현황 대시보드 | ~12장 |
| `06-as-cost.md` | A/S 비용 추적 | ~12장 |
| `07-as-shipment.md` | A/S 출고 관리 | ~12장 |
| `08-return-management.md` | 회수 관리 | ~12장 |
| `09-product-registration.md` | 정품등록·쿠폰·시리얼 관리 | ~12장 |
| `10-exchange-return.md` | 교환&반품 관리 | ~12장 |
| `11-mail-sms-log.md` | 이메일·SMS 로그 | ~12장 |
| `12-ticket-assignment.md` | 티켓 배분·담당자 관리 | ~12장 |
| `13-report.md` | 리포트 현황 | ~11장 |
| `14-statistics-dashboard.md` | 전체 통계 대시보드 | ~11장 |
| `15-settings.md` | 설정 | ~11장 |
| `01-customer-lookup-slide.md` | (레거시) 상세 스펙 원본 | - |
