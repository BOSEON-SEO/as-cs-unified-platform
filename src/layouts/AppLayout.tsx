import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Titlebar } from '@/components/Titlebar';
import { Statusbar } from '@/components/Statusbar';

/**
 * 앱 셸 레이아웃 — prototype-v2 기반 반응형
 *
 * Desktop (>520px) — CSS Grid 4행 x 2열:
 *   row 1 (32px)  : Titlebar   [col 1-2]
 *   row 2 (56px)  : Sidebar    [col 1, row 2-3] + Header [col 2]
 *   row 3 (1fr)   : Sidebar    [cont'd]          + Main  [col 2]
 *   row 4 (22px)  : Statusbar  [col 1-2]
 *
 * Mobile (<=520px) — 단일 열:
 *   Titlebar → Header (햄버거) → Main → Statusbar
 *   Sidebar = 오버레이 슬라이드
 */
export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenuToggle = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <div className="app-shell h-screen overflow-hidden bg-[var(--color-main-bg)]">
      {/* Row 1: Titlebar — 전체 너비 */}
      <Titlebar />

      {/* Row 2-3, Col 1: Sidebar (desktop: static grid / mobile: overlay) */}
      <Sidebar open={sidebarOpen} onClose={handleSidebarClose} />

      {/* Row 2, Col 2: Header */}
      <Header onMenuToggle={handleMenuToggle} />

      {/* Row 3, Col 2: Main content */}
      <main className="main-content custom-scrollbar overflow-y-auto bg-[var(--color-main-bg)] px-4 py-5 desktop:px-8 desktop:py-6">
        <Outlet />
      </main>

      {/* Row 4: Statusbar — 전체 너비 */}
      <Statusbar />
    </div>
  );
}
