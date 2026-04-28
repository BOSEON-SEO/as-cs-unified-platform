import type { NavGroup } from '@/types';

/**
 * 사이드바 메뉴 구조 — prototype-v2 기반
 */
const navGroups: NavGroup[] = [
  {
    groupTitle: '고객 & 상담',
    items: [
      { pageId: '1',       label: '고객 정보 조회',    icon: '👤' },
      { pageId: '2',       label: '전체 상담 내역',    icon: '💬', badge: 42 },
      { pageId: '3',       label: '젠데스크 조회',     icon: '🔗' },
    ],
  },
  {
    groupTitle: 'A/S 운영',
    items: [
      { pageId: 'tickets', label: 'A/S 티켓 목록',    icon: '📋', badge: 82 },
      { pageId: '4',       label: 'A/S 상세 (단계별)', icon: '🛠' },
      { pageId: '5',       label: 'A/S 현황 대시보드', icon: '📊', hasDot: true },
      { pageId: '6',       label: 'A/S 비용 추적',    icon: '💰' },
      { pageId: '7',       label: 'A/S 출고 관리',    icon: '📦', badge: 12 },
      { pageId: '8',       label: '회수 관리',         icon: '🚚', badge: 14 },
    ],
  },
  {
    groupTitle: '제품 & 처리',
    items: [
      { pageId: '9',       label: '정품등록 · 시리얼', icon: '🏷' },
      { pageId: '10',      label: '교환 · 반품',       icon: '🔄' },
    ],
  },
  {
    groupTitle: '커뮤니케이션',
    items: [
      { pageId: '11',      label: '이메일 · SMS 로그', icon: '📧' },
    ],
  },
  {
    groupTitle: 'AI 어시스턴트',
    items: [
      { pageId: 'ai', label: 'AI 의사결정 서포트', icon: '🤖', badge: 'NEW', badgeStyle: 'gradient' },
    ],
  },
  {
    groupTitle: '관리',
    items: [
      { pageId: '12', label: '티켓 배분',   icon: '👥', badge: 5 },
      { pageId: '13', label: '리포트',      icon: '📑', badge: '설계 중', badgeStyle: 'muted' },
      { pageId: '14', label: '전체 통계',   icon: '📈' },
      { pageId: '15', label: '설정',        icon: '⚙' },
    ],
  },
];

export function Sidebar() {
  return (
    <aside className="custom-scrollbar row-span-2 row-start-2 overflow-y-auto bg-[var(--color-sidebar-bg)] py-3.5 text-[#CBD5E1]">
      {/* Brand */}
      <div className="mb-3 flex items-center gap-2.5 border-b border-white/[.08] px-[18px] pb-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-extrabold text-white">
          A
        </div>
        <div className="text-[13px] font-bold leading-tight text-[#F1F5F9]">
          A/S &amp; CS
          <small className="mt-0.5 block text-[10px] font-medium text-[#64748B]">
            통합 관리 플랫폼
          </small>
        </div>
      </div>

      {/* Nav groups */}
      {navGroups.map((group) => (
        <div key={group.groupTitle} className="mb-3.5 px-2.5">
          <div className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#475569]">
            {group.groupTitle}
          </div>
          {group.items.map((item) => (
            <div
              key={item.pageId}
              className="group flex cursor-pointer items-center gap-2.5 rounded-[7px] px-3 py-2 text-[12.5px] font-medium text-[#94A3B8] transition-all hover:bg-white/5 hover:text-[#F1F5F9]"
            >
              <span className="w-[18px] flex-shrink-0 text-center text-sm">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.hasDot && (
                <span className="h-[7px] w-[7px] rounded-full bg-[var(--color-danger)]" />
              )}
              {item.badge != null && !item.hasDot && (
                <span
                  className={
                    item.badgeStyle === 'gradient'
                      ? 'rounded-lg bg-gradient-to-r from-violet-500 to-blue-500 px-1.5 py-0.5 text-[9px] font-bold text-white'
                      : item.badgeStyle === 'muted'
                        ? 'rounded-lg bg-[#475569] px-1.5 py-0.5 text-[9px] font-bold text-[#CBD5E1]'
                        : 'rounded-[10px] bg-white/10 px-[7px] py-[1px] text-[10px] font-bold'
                  }
                >
                  {item.badge}
                </span>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* Footer status */}
      <div className="mt-auto border-t border-white/[.06] px-[18px] pt-3.5 text-[10.5px] leading-relaxed text-[#64748B]">
        <div>🔌 Spring API <span className="text-[#86EFAC]">●</span></div>
        <div>🤖 AI 서포트 (Claude) <span className="text-[#86EFAC]">●</span></div>
        <div>⚡ 자동 배정 <span className="text-[#86EFAC]">ON</span></div>
        <div className="mt-1 text-[#475569]">v0.2.0</div>
      </div>
    </aside>
  );
}
