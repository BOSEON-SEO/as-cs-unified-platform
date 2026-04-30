/**
 * MSW Request Handlers -- 15 mock endpoints
 *
 * Domains covered:
 *   1-4   Auth (login, refresh, me, logout)
 *   5-8   Dashboard (kpi, trend, recent-tickets, action-queue)
 *   9-10  Statistics (kpi, assignee-performance)
 *   11-12 Customers (search, detail)
 *   13    Tickets (list)
 *   14    Shipments (list)
 *   15    Mail-logs (stats)
 */

import { http, HttpResponse } from 'msw';

const BASE = '/api';

// ---------------------------------------------------------------------------
// 1-4. Auth
// ---------------------------------------------------------------------------

const MOCK_USERS = [
  { userId: 1, username: 'engineer1', name: '김기사', role: 'AS_ENGINEER' as const, email: 'eng1@co.kr', password: '1234' },
  { userId: 2, username: 'cs1',       name: '이상담', role: 'CS_CX' as const,       email: 'cs1@co.kr',  password: '1234' },
  { userId: 3, username: 'lead1',     name: '박팀장', role: 'TEAM_LEAD' as const,   email: 'lead@co.kr', password: '1234' },
  { userId: 4, username: 'admin',     name: '최총괄', role: 'ADMIN' as const,       email: 'admin@co.kr',password: '1234' },
];

let currentUser: (typeof MOCK_USERS)[number] | null = null;

const authHandlers = [
  // 1. POST /auth/login
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = await request.json() as { username: string; password: string };
    const user = MOCK_USERS.find(
      (u) => u.username === body.username && u.password === body.password,
    );
    if (!user) {
      return HttpResponse.json(
        { code: 'AUTH_FAILED', message: '아이디 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 },
      );
    }
    currentUser = user;
    const { password: _pw, ...userWithoutPw } = user;
    return HttpResponse.json({
      accessToken: `mock-access-${user.userId}`,
      refreshToken: `mock-refresh-${user.userId}`,
      user: userWithoutPw,
    });
  }),

  // 2. POST /auth/refresh
  http.post(`${BASE}/auth/refresh`, () => {
    if (!currentUser) {
      return HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 });
    }
    return HttpResponse.json({
      accessToken: `mock-access-${currentUser.userId}-refreshed`,
    });
  }),

  // 3. GET /auth/me
  http.get(`${BASE}/auth/me`, () => {
    if (!currentUser) {
      return HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 });
    }
    const { password: _pw, ...userWithoutPw } = currentUser;
    return HttpResponse.json(userWithoutPw);
  }),

  // 4. POST /auth/logout
  http.post(`${BASE}/auth/logout`, () => {
    currentUser = null;
    return HttpResponse.json({ success: true });
  }),
];

// ---------------------------------------------------------------------------
// 5-8. Dashboard
// ---------------------------------------------------------------------------

const dashboardHandlers = [
  // 5. GET /dashboard/kpi
  http.get(`${BASE}/dashboard/kpi`, () => {
    return HttpResponse.json({
      pendingCount: 24,
      pendingDelta: -8.3,
      inProgressCount: 31,
      inProgressDelta: 12.5,
      closedTodayCount: 7,
      closedTodayDelta: 16.7,
      slaExceededCount: 3,
      slaExceededDelta: -25.0,
      updatedAt: new Date().toISOString(),
    });
  }),

  // 6. GET /dashboard/trend
  http.get(`${BASE}/dashboard/trend`, () => {
    return HttpResponse.json([
      { month: '2025-11', received: 38, completed: 31 },
      { month: '2025-12', received: 42, completed: 36 },
      { month: '2026-01', received: 35, completed: 33 },
      { month: '2026-02', received: 48, completed: 40 },
      { month: '2026-03', received: 51, completed: 44 },
      { month: '2026-04', received: 24, completed: 18 },
    ]);
  }),

  // 7. GET /dashboard/recent-tickets
  http.get(`${BASE}/dashboard/recent-tickets`, () => {
    return HttpResponse.json([
      { ticketId: 2641, ticketNo: 'AS-2641', customerName: '김민수', productModel: 'WE-300', status: 'IN_PROGRESS',  createdAt: '2026-04-30T11:22:00+09:00' },
      { ticketId: 2640, ticketNo: 'AS-2640', customerName: '이영희', productModel: 'BS-200', status: 'RECEIVED',     createdAt: '2026-04-30T10:15:00+09:00' },
      { ticketId: 2639, ticketNo: 'AS-2639', customerName: '박서준', productModel: 'NC-100', status: 'ASSIGNED',     createdAt: '2026-04-30T09:48:00+09:00' },
      { ticketId: 2638, ticketNo: 'AS-2638', customerName: '최유진', productModel: 'WE-300', status: 'CLOSED',       createdAt: '2026-04-29T16:30:00+09:00' },
      { ticketId: 2637, ticketNo: 'AS-2637', customerName: '정하늘', productModel: 'GT-500', status: 'COST_ENTERED', createdAt: '2026-04-29T14:22:00+09:00' },
    ]);
  }),

  // 8. GET /dashboard/action-queue
  http.get(`${BASE}/dashboard/action-queue`, () => {
    return HttpResponse.json([
      { key: 'zombie',        label: '좀비 티켓',   count: 2, severity: 'critical' },
      { key: 'no_response',   label: '응대 누락',   count: 1, severity: 'critical' },
      { key: 'unassigned',    label: '미배정 4h+',  count: 5, severity: 'high' },
      { key: 'fake_close',    label: '가짜 완료',   count: 0, severity: 'high' },
      { key: 'cost_mismatch', label: '비용 불일치', count: 3, severity: 'medium' },
    ]);
  }),
];

// ---------------------------------------------------------------------------
// 9-10. Statistics
// ---------------------------------------------------------------------------

const statsHandlers = [
  // 9. GET /stats/kpi
  http.get(`${BASE}/stats/kpi`, () => {
    return HttpResponse.json({
      totalTickets: 247,
      totalTicketsDelta: 12.0,
      completionRate: 84.4,
      completionRateDelta: 2.1,
      avgResolutionDays: 3.2,
      avgResolutionDaysDelta: -0.3,
      totalCostNet: -890000,
      totalCostNetDelta: -21.0,
    });
  }),

  // 10. GET /stats/assignee-performance
  http.get(`${BASE}/stats/assignee-performance`, () => {
    return HttpResponse.json([
      { name: '김기사', totalTickets: 68, completedTickets: 55, avgDays: 2.8, slaRate: 94 },
      { name: '박수리', totalTickets: 72, completedTickets: 61, avgDays: 3.1, slaRate: 91 },
      { name: '이엔지', totalTickets: 54, completedTickets: 48, avgDays: 3.5, slaRate: 88 },
      { name: '정전자', totalTickets: 41, completedTickets: 35, avgDays: 2.5, slaRate: 96 },
      { name: '한정비', totalTickets: 38, completedTickets: 30, avgDays: 4.1, slaRate: 82 },
    ]);
  }),
];

// ---------------------------------------------------------------------------
// 11-12. Customers
// ---------------------------------------------------------------------------

const MOCK_CUSTOMERS = [
  { customerId: 1, name: '홍길동', phone: '010-1234-5678', email: 'hong@test.com', address: '서울시 강남구', createdAt: '2025-01-15T10:00:00' },
  { customerId: 2, name: '김철수', phone: '010-9876-5432', email: 'kim@test.com',  address: '서울시 서초구', createdAt: '2025-02-20T14:00:00' },
  { customerId: 3, name: '이영희', phone: '010-5555-1234', email: 'lee@test.com',  address: '경기도 성남시', createdAt: '2025-03-10T09:00:00' },
];

const customerHandlers = [
  // 11. GET /customers?phone=
  http.get(`${BASE}/customers`, ({ request }) => {
    const url = new URL(request.url);
    const phone = url.searchParams.get('phone');
    const name = url.searchParams.get('name');
    let filtered = [...MOCK_CUSTOMERS];
    if (phone) filtered = filtered.filter((c) => c.phone.includes(phone));
    if (name) filtered = filtered.filter((c) => c.name.includes(name));
    return HttpResponse.json({
      content: filtered,
      page: 1,
      size: 20,
      totalElements: filtered.length,
      totalPages: 1,
    });
  }),

  // 12. GET /customers/:id
  http.get(`${BASE}/customers/:id`, ({ params }) => {
    const id = Number(params['id']);
    const customer = MOCK_CUSTOMERS.find((c) => c.customerId === id);
    if (!customer) {
      return HttpResponse.json({ code: 'NOT_FOUND' }, { status: 404 });
    }
    return HttpResponse.json({
      ...customer,
      purchases: [
        { purchaseId: 101, productName: '무선 이어폰 Pro', modelName: 'WE-300', purchaseDate: '2025-06-15' },
      ],
      ticketCount: 2,
      lastTicketDate: '2026-04-28',
    });
  }),
];

// ---------------------------------------------------------------------------
// 13. Tickets
// ---------------------------------------------------------------------------

const MOCK_TICKETS = [
  { ticketId: 2641, ticketNo: 'AS-2641', customerName: '김민수', customerPhone: '010-1111-2222', productModel: 'WE-300', status: 'IN_PROGRESS',  priority: 'HIGH',   assigneeName: '김기사', symptom: '좌측 이어폰 소리 안남',       createdAt: '2026-04-30T11:22:00' },
  { ticketId: 2640, ticketNo: 'AS-2640', customerName: '이영희', customerPhone: '010-3333-4444', productModel: 'BS-200', status: 'RECEIVED',     priority: 'MEDIUM', assigneeName: null,     symptom: '충전 안됨',                   createdAt: '2026-04-30T10:15:00' },
  { ticketId: 2639, ticketNo: 'AS-2639', customerName: '박서준', customerPhone: '010-5555-6666', productModel: 'NC-100', status: 'ASSIGNED',     priority: 'LOW',    assigneeName: '박수리', symptom: '노이즈캔슬링 작동 불량',     createdAt: '2026-04-30T09:48:00' },
  { ticketId: 2638, ticketNo: 'AS-2638', customerName: '최유진', customerPhone: '010-7777-8888', productModel: 'WE-300', status: 'CLOSED',       priority: 'MEDIUM', assigneeName: '김기사', symptom: '페어링 불량 -> 부품 교체 완료', createdAt: '2026-04-29T16:30:00' },
  { ticketId: 2637, ticketNo: 'AS-2637', customerName: '정하늘', customerPhone: '010-9999-0000', productModel: 'GT-500', status: 'COST_ENTERED', priority: 'HIGH',   assigneeName: '이엔지', symptom: '배터리 팽창',                 createdAt: '2026-04-29T14:22:00' },
];

const ticketHandlers = [
  // 13. GET /tickets
  http.get(`${BASE}/tickets`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const page = Number(url.searchParams.get('page') ?? '1');
    const size = Number(url.searchParams.get('size') ?? '20');
    let filtered = [...MOCK_TICKETS];
    if (status) filtered = filtered.filter((t) => t.status === status);
    return HttpResponse.json({
      content: filtered.slice((page - 1) * size, page * size),
      page,
      size,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / size),
    });
  }),
];

// ---------------------------------------------------------------------------
// 14. Shipments
// ---------------------------------------------------------------------------

const shipmentHandlers = [
  // 14. GET /shipments
  http.get(`${BASE}/shipments`, () => {
    return HttpResponse.json({
      content: [
        { shipmentId: 501, ticketNo: 'AS-2641', type: 'OUTBOUND', status: 'DISPATCHED', recipientName: '김민수', courierCompany: 'CJ대한통운', trackingNumber: '6012345678', createdAt: '2026-04-28T10:00:00' },
        { shipmentId: 502, ticketNo: 'AS-2638', type: 'RETURN',   status: 'DELIVERED',  recipientName: '최유진', courierCompany: '한진택배',   trackingNumber: '4109876543', createdAt: '2026-04-27T15:00:00' },
      ],
      page: 1,
      size: 20,
      totalElements: 2,
      totalPages: 1,
    });
  }),
];

// ---------------------------------------------------------------------------
// 15. Mail-logs stats
// ---------------------------------------------------------------------------

const mailLogHandlers = [
  // 15. GET /mail-logs/stats
  http.get(`${BASE}/mail-logs/stats`, () => {
    return HttpResponse.json({
      totalSent: 2648926,
      successRate: 98.2,
      failedCount: 8,
      pendingCount: 3,
    });
  }),
];

// ---------------------------------------------------------------------------
// Export all handlers (15 endpoints)
// ---------------------------------------------------------------------------

export const handlers = [
  ...authHandlers,       // 1-4
  ...dashboardHandlers,  // 5-8
  ...statsHandlers,      // 9-10
  ...customerHandlers,   // 11-12
  ...ticketHandlers,     // 13
  ...shipmentHandlers,   // 14
  ...mailLogHandlers,    // 15
];
