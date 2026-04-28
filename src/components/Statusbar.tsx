/**
 * 하단 상태바 — 22px 높이, 전체 너비
 * API 상태, VPN, Live 갱신, 사용자 정보, 날짜/버전
 */
export function Statusbar() {
  return (
    <div className="col-span-2 flex items-center gap-3.5 bg-[var(--color-primary)] px-3.5 text-[10px] text-[#BFDBFE]">
      <span>🟢 Spring API</span>
      <span className="opacity-40">·</span>
      <span>📡 Tailscale VPN</span>
      <span className="opacity-40">·</span>
      <span className="text-[#86EFAC]">● Live</span>
      <span className="opacity-40">·</span>
      <span>관리자 / 총괄</span>
      <span className="ml-auto">v0.2.0</span>
    </div>
  );
}
