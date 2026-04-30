import { createHashRouter } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';

import CustomerPage from '@/pages/CustomerPage';
import ConsultationPage from '@/pages/ConsultationPage';
import ZendeskPage from '@/pages/ZendeskPage';
import TicketListPage from '@/pages/TicketListPage';
import TicketDetailPage from '@/pages/TicketDetailPage';
import { DashboardPage } from '@/pages/DashboardPage';
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
 * 라우트 메타 정보 — Sidebar·Header breadcrumb 등에서 공유
 *
 * prototype-v2 pageId를 URL path로 사용:
 *   /{pageId}  →  /1, /2, /3, /tickets, /4, /5, /6, /7, /8, /9, /10, /11, /ai, /12, /13, /14, /15
 *
 * index route (/) = pageId "5" (A/S 현황 대시보드)
 */
export interface RouteMeta {
  pageId: string;
  path: string;
  title: string;
  icon: string;
}

export const routesMeta: RouteMeta[] = [
  { pageId: '1',       path: '/1',        title: '고객 정보 조회',       icon: '👤' },
  { pageId: '2',       path: '/2',        title: '전체 상담 내역',       icon: '💬' },
  { pageId: '3',       path: '/3',        title: '젠데스크 조회',        icon: '🔗' },
  { pageId: 'tickets', path: '/tickets',  title: 'A/S 티켓 목록',       icon: '📋' },
  { pageId: '4',       path: '/4',        title: 'A/S 상세 (단계별)',    icon: '🛠' },
  { pageId: '5',       path: '/',         title: 'A/S 현황 대시보드',    icon: '📊' },
  { pageId: '6',       path: '/6',        title: 'A/S 비용 추적',       icon: '💰' },
  { pageId: '7',       path: '/7',        title: 'A/S 출고 관리',       icon: '📦' },
  { pageId: '8',       path: '/8',        title: '회수 관리',            icon: '🚚' },
  { pageId: '9',       path: '/9',        title: '정품등록 · 시리얼',    icon: '🏷' },
  { pageId: '10',      path: '/10',       title: '교환 · 반품',          icon: '🔄' },
  { pageId: '11',      path: '/11',       title: '이메일 · SMS 로그',    icon: '📧' },
  { pageId: 'ai',      path: '/ai',       title: 'AI 의사결정 서포트',   icon: '🤖' },
  { pageId: '12',      path: '/12',       title: '티켓 배분',            icon: '👥' },
  { pageId: '13',      path: '/13',       title: '리포트',               icon: '📑' },
  { pageId: '14',      path: '/14',       title: '전체 통계 대시보드',    icon: '📈' },
  { pageId: '15',      path: '/15',       title: '설정',                 icon: '⚙' },
];

/**
 * 앱 라우터 — 17개 페이지, /{pageId} 패턴
 * createHashRouter: Electron prod 빌드에서 file:// 프로토콜 호환
 * URL 형태: index.html#/1, index.html#/tickets 등
 */
export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      /* #5  A/S 현황 대시보드 (index) */
      { index: true, element: <DashboardPage /> },

      /* #1  고객 정보 조회 */
      { path: '1', element: <CustomerPage /> },

      /* #2  전체 상담 내역 */
      { path: '2', element: <ConsultationPage /> },

      /* #3  젠데스크 조회 */
      { path: '3', element: <ZendeskPage /> },

      /* #4  A/S 티켓 목록 (pageId = "tickets") */
      { path: 'tickets', element: <TicketListPage /> },

      /* #5  A/S 상세 (단계별) */
      { path: '4', element: <TicketDetailPage /> },

      /* #6  A/S 비용 추적 */
      { path: '6', element: <CostTrackingPage /> },

      /* #7  A/S 출고 관리 */
      { path: '7', element: <ShipmentPage /> },

      /* #8  회수 관리 */
      { path: '8', element: <RecallPage /> },

      /* #9  정품등록 · 시리얼 */
      { path: '9', element: <ProductRegistrationPage /> },

      /* #10 교환 · 반품 */
      { path: '10', element: <ExchangeReturnPage /> },

      /* #11 이메일 · SMS 로그 */
      { path: '11', element: <MailLogPage /> },

      /* AI  AI 의사결정 서포트 */
      { path: 'ai', element: <AiSupportPage /> },

      /* #12 티켓 배분 */
      { path: '12', element: <TicketAssignPage /> },

      /* #13 리포트 */
      { path: '13', element: <ReportPage /> },

      /* #14 전체 통계 대시보드 */
      { path: '14', element: <StatisticsPage /> },

      /* #15 설정 */
      { path: '15', element: <SettingsPage /> },
    ],
  },
]);
