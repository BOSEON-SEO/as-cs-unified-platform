/**
 * 상단바 — 56px 높이, col 2
 * Breadcrumb + 통합 검색 + 알림/다크모드 + 사용자 프로필
 */
export function Topbar() {
  return (
    <div className="col-start-2 row-start-2 flex items-center gap-3.5 border-b border-[var(--color-border)] bg-white px-6">
      {/* Breadcrumb */}
      <div className="shrink-0 text-xs font-medium text-[var(--color-text-secondary)]">
        홈 &rsaquo; <span className="font-semibold text-[var(--color-primary)]">대시보드</span>
      </div>

      {/* Global search */}
      <div className="relative max-w-[380px] flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] opacity-60">
          🔍
        </span>
        <input
          type="text"
          placeholder="전화번호 / A/S# / 고객명 / 시리얼 (Ctrl+K)"
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-main-bg)] py-2 pl-[34px] pr-3.5 text-xs focus:border-[var(--color-primary-light)] focus:outline-none focus:ring-2 focus:ring-blue-500/10"
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2.5">
        <button
          className="flex h-[34px] w-[34px] items-center justify-content-center rounded-lg text-[15px] text-[var(--color-text-secondary)] hover:bg-[#F1F5F9]"
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

        {/* User */}
        <div className="flex items-center gap-2 rounded-full bg-[#F1F5F9] py-1 pl-1 pr-2.5">
          <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-[11px] font-bold text-white">
            관
          </div>
          <div>
            <div className="text-xs font-semibold text-[var(--color-text-primary)]">관리자</div>
            <div className="text-[10px] text-[var(--color-text-secondary)]">총괄</div>
          </div>
        </div>
      </div>
    </div>
  );
}
