/**
 * Electron 타이틀바 — 32px 높이, 전체 너비
 * 웹 모드에서도 표시 (디자인 일관성)
 * 모바일에서는 축소 표시
 */
export function Titlebar() {
  return (
    <div
      className="app-titlebar col-span-full flex items-center justify-between px-3.5 text-[11px] font-semibold tracking-wide text-white"
      style={{ background: 'linear-gradient(180deg, #1E3A8A, #1E40AF)' }}
    >
      {/* Traffic lights (desktop only) */}
      <div className="hidden gap-2 desktop:flex">
        <span className="h-3 w-3 rounded-full bg-[#EF4444]" />
        <span className="h-3 w-3 rounded-full bg-[#F59E0B]" />
        <span className="h-3 w-3 rounded-full bg-[#10B981]" />
      </div>

      {/* Center title */}
      <div className="flex-1 text-center text-[#BFDBFE]">
        <span className="hidden desktop:inline">A/S &amp; CS 통합 관리 플랫폼 — </span>v0.2.0
      </div>

      {/* Right status */}
      <div className="text-[10px] text-[#93C5FD]">
        <span className="text-[#86EFAC]">●</span>{' '}
        <span className="hidden desktop:inline">연결됨</span>
      </div>
    </div>
  );
}
