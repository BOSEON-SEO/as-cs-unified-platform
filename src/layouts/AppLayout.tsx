import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { Titlebar } from '@/components/Titlebar';
import { Statusbar } from '@/components/Statusbar';

/**
 * 앱 셸 레이아웃 — prototype-v2 기반 4행x2열 CSS Grid
 *
 * Grid 구조:
 *   row 1 (32px)  : Titlebar  [col 1-2]
 *   row 2 (56px)  : Sidebar   [col 1, row 2-3] + Topbar [col 2]
 *   row 3 (1fr)   : Sidebar   [cont'd]          + Main   [col 2]
 *   row 4 (22px)  : Statusbar [col 1-2]
 */
export function AppLayout() {
  return (
    <div
      className="grid h-screen overflow-hidden bg-[var(--color-main-bg)]"
      style={{
        gridTemplateRows: 'var(--titlebar-height) var(--topbar-height) 1fr var(--statusbar-height)',
        gridTemplateColumns: 'var(--sidebar-width) 1fr',
      }}
    >
      {/* Row 1: Titlebar — spans full width */}
      <Titlebar />

      {/* Row 2-3, Col 1: Sidebar */}
      <Sidebar />

      {/* Row 2, Col 2: Topbar */}
      <Topbar />

      {/* Row 3, Col 2: Main content area */}
      <main className="col-start-2 row-start-3 overflow-y-auto bg-[var(--color-main-bg)] px-8 py-6">
        <Outlet />
      </main>

      {/* Row 4: Statusbar — spans full width */}
      <Statusbar />
    </div>
  );
}
