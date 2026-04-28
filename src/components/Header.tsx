import { useLocation } from 'react-router-dom';
import { routesMeta } from '@/router';

/**
 * 통합 헤더 — 동적 breadcrumb + 모바일 햄버거
 */

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { pathname } = useLocation();

  /* 현재 경로에 맞는 페이지 메타 찾기 */
  const currentPage = routesMeta.find((r) => r.path === pathname)
    ?? routesMeta.find((r) => r.path === '/'); // fallback to dashboard

  const pageTitle = currentPage?.title ?? '대시보드';
  const pageIcon = currentPage?.icon ?? '📊';

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

      {/* ── 모바일: 현재 페이지명 ── */}
      <div className="flex items-center gap-2 desktop:hidden">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-violet-500 text-xs font-extrabold text-white">
          A
        </div>
        <span className="truncate text-sm font-bold text-[var(--color-text-primary)]">
          {pageIcon} {pageTitle}
        </span>
      </div>

      {/* ── Desktop: Breadcrumb (동적) ── */}
      <div className="hidden shrink-0 text-xs font-medium text-[var(--color-text-secondary)] desktop:block">
        홈 &rsaquo;{' '}
        <span className="font-semibold text-[var(--color-primary)]">
          {pageIcon} {pageTitle}
        </span>
      </div>

      {/* ── 검색 ── */}
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
        <button
          className="hidden h-[34px] w-[34px] items-center justify-center rounded-lg text-[15px] text-[var(--color-text-secondary)] hover:bg-[#F1F5F9] desktop:flex"
          title="새 A/S 접수"
        >
          ＋
        </button>

        <button
          className="relative flex h-[34px] w-[34px] items-center justify-center rounded-lg text-[15px] text-[var(--color-text-secondary)] hover:bg-[#F1F5F9]"
          title="알림"
        >
          🔔
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-[var(--color-danger)]" />
        </button>

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
