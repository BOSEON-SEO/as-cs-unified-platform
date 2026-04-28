/**
 * Electron 타이틀바 — 32px 높이, 전체 너비
 * macOS-style traffic lights + 앱 제목 + 연결 상태
 */
export function Titlebar() {
  return (
    <div
      className="app-titlebar col-span-2 flex items-center justify-between px-3.5 text-white text-[11px] font-semibold tracking-wide"
      style={{ background: 'linear-gradient(180deg, #1E3A8A, #1E40AF)' }}
    >
      {/* Traffic lights */}
      <div className="flex gap-2">
        <span className="h-3 w-3 rounded-full bg-[#EF4444]" />
        <span className="h-3 w-3 rounded-full bg-[#F59E0B]" />
        <span className="h-3 w-3 rounded-full bg-[#10B981]" />
      </div>

      {/* Center title */}
      <div className="flex-1 text-center text-[#BFDBFE]">
        A/S &amp; CS 통합 관리 플랫폼 — v0.2.0
      </div>

      {/* Right status */}
      <div className="text-[10px] text-[#93C5FD]">
        <span className="text-[#86EFAC]">●</span> 연결됨
      </div>
    </div>
  );
}
