/**
 * 하단 상태바 — 22px 높이, 전체 너비
 * 모바일에서는 핵심 정보만 표시
 */
export function Statusbar() {
  return (
    <div className="col-span-full flex items-center gap-3.5 bg-[var(--color-primary)] px-3.5 text-[10px] text-[#BFDBFE]">
      <span>🟢 API</span>
      <span className="opacity-40">·</span>
      <span className="hidden desktop:inline">📡 Tailscale VPN</span>
      <span className="hidden opacity-40 desktop:inline">·</span>
      <span className="text-[#86EFAC]">● Live</span>
      <span className="hidden opacity-40 desktop:inline">·</span>
      <span className="hidden desktop:inline">관리자 / 총괄</span>
      <span className="ml-auto">v0.2.0</span>
    </div>
  );
}
