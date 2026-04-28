/**
 * 통합 헤더 — 모바일에서는 햄버거 메뉴 포함
 * Desktop: col 2 / row 2 (Topbar 역할)
 * Mobile : 전체 너비, 최상단
 */

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  return (
    <header className="header-bar flex items-center gap-3 border-b border-[var(--color-border)] bg-white px-4 desktop:px-6">
      {/* ── 모바일: 햄버거 ── */}
      <button
        onClick={onMenuToggle}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-[var(--color-text-secondary)] hover:bg-[#F1F5F9] desktop:hidden"
        aria-label="메뉴 열기"
      >
        ☰
      </button>

      {/* ── 모바일: 로고 ── */}
      <div className="flex items-center gap-2 desktop:hidden">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-violet-500 text-xs font-extrabold text-white">
          A
        </div>
        <span className="text-sm font-bold text-[var(--color-text-primary)]">A/S&amp;CS</span>
      </div>

      {/* ── Desktop: Breadcrumb ── */}
      <div className="hidden shrink-0 text-xs font-medium text-[var(--color-text-secondary)] desktop:block">
        홈 &rsaquo;{' '}
        <span className="font-semibold text-[var(--color-primary)]">대시보드</span>
      </div>

      {/* ── 검색 (desktop 전용, 모바일에서는 숨김) ── */}
      <div className="relative hidden max-w-[380px] flex-1 desktop:block">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] opacity-60">
          🔍
        </span>
        <input
          type="text"
          placeholder="전화번호 / A/S# / 고객명 / 시리얼 (Ctrl+K)"
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-main-bg)] py-2 pl-[34px] pr-3.5 text-xs focus:border-[var(--color-primary-light)] focus:outline-none focus:ring-2 focus:ring-blue-500/10"
        />
      </div>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── Right actions ── */}
      <div className="flex items-center gap-2">
        {/* 새 A/S 접수 — 모바일에서 숨김 */}
        <button
          className="hidden h-[34px] w-[34px] items-center justify-center rounded-lg text-[15px] text-[var(--color-text-secondary)] hover:bg-[#F1F5F9] desktop:flex"
          title="새 A/S 접수"
        >
          ＋
        </button>

        {/* 알림 */}
        <button
          className="relative flex h-[34px] w-[34px] items-center justify-center rounded-lg text-[15px] text-[var(--color-text-secondary)] hover:bg-[#F1F5F9]"
          title="알림"
        >
          🔔
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-[var(--color-danger)]" />
        </button>

        {/* 사용자 */}
        <div className="flex items-center gap-2 rounded-full bg-[#F1F5F9] py-1 pl-1 pr-2.5">
          <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-[11px] font-bold text-white">
            관
          </div>
          <div className="hidden desktop:block">
            <div className="text-xs font-semibold text-[var(--color-text-primary)]">관리자</div>
            <div className="text-[10px] text-[var(--color-text-secondary)]">총괄</div>
          </div>
        </div>
      </div>
    </header>
  );
}
