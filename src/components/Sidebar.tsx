import { NavLink } from 'react-router-dom';
import type { NavGroup } from '@/types';

/**
 * 사이드바 메뉴 구조 — prototype-v2 기반 17개 메뉴
 * 6개 카테고리 그룹, 각 아이템은 react-router-dom NavLink
 * path = /{pageId} 패턴 (router.tsx 와 동일)
 */
const navGroups: NavGroup[] = [
  {
    groupTitle: '고객 & 상담',
    items: [
      { pageId: '1',       path: '/1',       label: '고객 정보 조회',    icon: '👤' },
      { pageId: '2',       path: '/2',       label: '전체 상담 내역',    icon: '💬', badge: 42 },
      { pageId: '3',       path: '/3',       label: '젠데스크 조회',     icon: '🔗' },
    ],
  },
  {
    groupTitle: 'A/S 운영',
    items: [
      { pageId: 'tickets', path: '/tickets', label: 'A/S 티켓 목록',    icon: '📋', badge: 82 },
      { pageId: '4',       path: '/4',       label: 'A/S 상세 (단계별)', icon: '🛠' },
      { pageId: '5',       path: '/',        label: 'A/S 현황 대시보드', icon: '📊', hasDot: true },
      { pageId: '6',       path: '/6',       label: 'A/S 비용 추적',    icon: '💰' },
      { pageId: '7',       path: '/7',       label: 'A/S 출고 관리',    icon: '📦', badge: 12 },
      { pageId: '8',       path: '/8',       label: '회수 관리',         icon: '🚚', badge: 14 },
    ],
  },
  {
    groupTitle: '제품 & 처리',
    items: [
      { pageId: '9',       path: '/9',       label: '정품등록 · 시리얼', icon: '🏷' },
      { pageId: '10',      path: '/10',      label: '교환 · 반품',       icon: '🔄' },
    ],
  },
  {
    groupTitle: '커뮤니케이션',
    items: [
      { pageId: '11',      path: '/11',      label: '이메일 · SMS 로그', icon: '📧' },
    ],
  },
  {
    groupTitle: 'AI 어시스턴트',
    items: [
      { pageId: 'ai',      path: '/ai',      label: 'AI 의사결정 서포트', icon: '🤖', badge: 'NEW', badgeStyle: 'gradient' },
    ],
  },
  {
    groupTitle: '관리',
    items: [
      { pageId: '12',      path: '/12',      label: '티켓 배분',   icon: '👥', badge: 5 },
      { pageId: '13',      path: '/13',      label: '리포트',      icon: '📑', badge: '설계 중', badgeStyle: 'muted' },
      { pageId: '14',      path: '/14',      label: '전체 통계',   icon: '📈' },
      { pageId: '15',      path: '/15',      label: '설정',        icon: '⚙' },
    ],
  },
];

/* ─── Badge 스타일 분기 ─── */
function badgeClassName(style?: string): string {
  if (style === 'gradient') {
    return 'rounded-lg bg-gradient-to-r from-violet-500 to-blue-500 px-1.5 py-0.5 text-[9px] font-bold text-white';
  }
  if (style === 'muted') {
    return 'rounded-lg bg-[#475569] px-1.5 py-0.5 text-[9px] font-bold text-[#CBD5E1]';
  }
  return 'rounded-[10px] bg-white/10 px-[7px] py-[1px] text-[10px] font-bold';
}

/* ─── Props ─── */
interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* ── Mobile backdrop ── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 mobile-only"
          onClick={onClose}
        />
      )}

      {/* ── Sidebar panel ── */}
      <aside
        className={`
          sidebar-panel custom-scrollbar
          fixed inset-y-0 left-0 z-50 flex w-[var(--sidebar-width)] flex-col
          overflow-y-auto bg-[var(--color-sidebar-bg)] text-[#CBD5E1]
          transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          desktop:static desktop:z-auto desktop:translate-x-0
          desktop:row-span-2 desktop:row-start-2
        `}
      >
        {/* ── Brand ── */}
        <div className="flex items-center justify-between border-b border-white/[.08] px-[18px] py-3.5">
          <NavLink to="/" onClick={onClose} className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-extrabold text-white">
              A
            </div>
            <div className="text-[13px] font-bold leading-tight text-[#F1F5F9]">
              A/S &amp; CS
              <small className="mt-0.5 block text-[10px] font-medium text-[#64748B]">
                통합 관리 플랫폼
              </small>
            </div>
          </NavLink>
          {/* 모바일 닫기 */}
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-lg text-[#64748B] hover:bg-white/10 hover:text-white desktop:hidden"
            aria-label="사이드바 닫기"
          >
            ✕
          </button>
        </div>

        {/* ── Nav groups ── */}
        <nav className="flex-1 py-2">
          {navGroups.map((group) => (
            <div key={group.groupTitle} className="mb-3 px-2.5">
              <div className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#475569]">
                {group.groupTitle}
              </div>
              {group.items.map((item) => (
                <NavLink
                  key={item.pageId}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex items-center gap-2.5 rounded-[7px] px-3 py-2 text-[12.5px] font-medium transition-all
                     ${
                       isActive
                         ? 'bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] font-semibold text-white shadow-[0_2px_8px_rgba(59,130,246,.3)]'
                         : 'text-[#94A3B8] hover:bg-white/5 hover:text-[#F1F5F9]'
                     }`
                  }
                >
                  <span className="w-[18px] shrink-0 text-center text-sm">{item.icon}</span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.hasDot && (
                    <span className="h-[7px] w-[7px] rounded-full bg-[var(--color-danger)]" />
                  )}
                  {item.badge != null && !item.hasDot && (
                    <span className={badgeClassName(item.badgeStyle)}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* ── Footer status ── */}
        <div className="border-t border-white/[.06] px-[18px] py-3.5 text-[10.5px] leading-relaxed text-[#64748B]">
          <div>🔌 Spring API <span className="text-[#86EFAC]">●</span></div>
          <div>🤖 AI 서포트 (Claude) <span className="text-[#86EFAC]">●</span></div>
          <div>⚡ 자동 배정 <span className="text-[#86EFAC]">ON</span></div>
          <div className="mt-1 text-[#475569]">v0.2.0</div>
        </div>
      </aside>
    </>
  );
}
