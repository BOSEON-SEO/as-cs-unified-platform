import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';

/* ── Lazy-loaded pages ── */
import { DashboardPage } from '@/pages/DashboardPage';
import CustomerPage from '@/pages/CustomerPage';
import ConsultationPage from '@/pages/ConsultationPage';
import ZendeskPage from '@/pages/ZendeskPage';
import TicketListPage from '@/pages/TicketListPage';
import TicketDetailPage from '@/pages/TicketDetailPage';
import CostTrackingPage from '@/pages/CostTrackingPage';
import ShipmentPage from '@/pages/ShipmentPage';
import RecallPage from '@/pages/RecallPage';
import ProductRegistrationPage from '@/pages/ProductRegistrationPage';
import ExchangeReturnPage from '@/pages/ExchangeReturnPage';
import MailLogPage from '@/pages/MailLogPage';
import AiSupportPage from '@/pages/AiSupportPage';
import TicketAssignPage from '@/pages/TicketAssignPage';
import ReportPage from '@/pages/ReportPage';
import StatisticsPage from '@/pages/StatisticsPage';
import SettingsPage from '@/pages/SettingsPage';

/**
 * 앱 라우터 — 17개 페이지 (prototype-v2 기반)
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      /* ── 대시보드 (기본) ── */
      { index: true, element: <DashboardPage /> },

      /* ── 고객 & 상담 ── */
      { path: 'customer',      element: <CustomerPage /> },
      { path: 'consultation',  element: <ConsultationPage /> },
      { path: 'zendesk',       element: <ZendeskPage /> },

      /* ── A/S 운영 ── */
      { path: 'tickets',        element: <TicketListPage /> },
      { path: 'tickets/detail', element: <TicketDetailPage /> },
      { path: 'cost',           element: <CostTrackingPage /> },
      { path: 'shipment',       element: <ShipmentPage /> },
      { path: 'recall',         element: <RecallPage /> },

      /* ── 제품 & 처리 ── */
      { path: 'product-registration', element: <ProductRegistrationPage /> },
      { path: 'exchange-return',      element: <ExchangeReturnPage /> },

      /* ── 커뮤니케이션 ── */
      { path: 'mail-log', element: <MailLogPage /> },

      /* ── AI 어시스턴트 ── */
      { path: 'ai-support', element: <AiSupportPage /> },

      /* ── 관리 ── */
      { path: 'ticket-assign', element: <TicketAssignPage /> },
      { path: 'report',        element: <ReportPage /> },
      { path: 'statistics',    element: <StatisticsPage /> },
      { path: 'settings',      element: <SettingsPage /> },
    ],
  },
]);
