/**
 * 사용자 역할
 */
export type UserRole = 'AS_ENGINEER' | 'CS_CX' | 'TEAM_LEAD' | 'ADMIN';

/**
 * 사이드바 네비게이션 아이템
 */
export interface NavItem {
  pageId: string;
  path: string;
  label: string;
  icon: string;
  badge?: string | number | null;
  badgeStyle?: 'default' | 'gradient' | 'muted';
  hasDot?: boolean;
}

/**
 * 사이드바 그룹
 */
export interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

/**
 * 페이지 메타
 */
export interface PageMeta {
  pageId: string;
  title: string;
  icon: string;
  description: string;
}

// =========================================================================
// KPI
// =========================================================================

/** 단일 KPI 카드에 표시되는 데이터 */
export interface KpiItem {
  label: string;
  value: number | string;
  /** MoM 변화율 (%). 양수=증가, 음수=감소, 0=변동없음 */
  delta: number;
  /** 'up' | 'down' | 'flat' -- delta 부호에서 파생 가능하지만 명시적 방향 */
  trend: 'up' | 'down' | 'flat';
}

/** GET /api/dashboard/kpi 응답 */
export interface DashboardKpiResponse {
  pendingCount: number;
  pendingDelta: number;
  inProgressCount: number;
  inProgressDelta: number;
  closedTodayCount: number;
  closedTodayDelta: number;
  slaExceededCount: number;
  slaExceededDelta: number;
  updatedAt: string;
}

// =========================================================================
// Chart Data
// =========================================================================

/** 월별 트렌드 차트 데이터 포인트 */
export interface TrendPoint {
  month: string;          // "2026-04"
  received: number;
  completed: number;
}

/** 제품별 A/S 빈도 */
export interface ProductFrequency {
  productModel: string;
  count: number;
}

/** 증상 유형 분포 */
export interface SymptomSegment {
  key: string;
  label: string;
  count: number;
  color: string;
}

/** 비용 3축 월별 추이 */
export interface CostTrendPoint {
  month: string;
  expense: number;       // 우리 지출
  payment: number;       // 고객 수납
  compensation: number;  // 본사 보상
}

/** 범용 차트 데이터 래퍼 */
export interface ChartData<T> {
  title: string;
  data: T[];
}

// =========================================================================
// Ticket
// =========================================================================

export const TICKET_STATUSES = [
  'RECEIVED', 'ASSIGNED', 'IN_PROGRESS',
  'COST_ENTERED', 'SHIPPING', 'CLOSED',
  'CANCELLED', 'ON_HOLD',
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const RECEIPT_CHANNELS = ['PHONE', 'EMAIL', 'ZENDESK', 'WALK_IN', 'OTHER'] as const;
export type ReceiptChannel = (typeof RECEIPT_CHANNELS)[number];

/** A/S 티켓 */
export interface AsTicket {
  ticketId: number;
  ticketNo: string;               // "AS-2641"
  customerId: number;
  customerName: string;
  customerPhone: string;
  productId: number | null;
  productName: string | null;
  productModel: string | null;
  serialNumber: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId: number | null;
  assigneeName: string | null;
  symptom: string;
  diagnosis: string | null;
  resolution: string | null;
  memo: string | null;
  receiptChannel: ReceiptChannel;
  createdAt: string;              // ISO 8601
  updatedAt: string;
  closedAt: string | null;
}

/** 대시보드 최근 티켓 (경량) */
export interface RecentTicket {
  ticketId: number;
  ticketNo: string;
  customerName: string;
  productModel: string;
  status: TicketStatus;
  createdAt: string;
}

/** 액션 필요 큐 아이템 */
export const ACTION_SEVERITIES = ['critical', 'high', 'medium', 'low'] as const;
export type ActionSeverity = (typeof ACTION_SEVERITIES)[number];

export interface ActionItem {
  key: string;
  label: string;
  count: number;
  severity: ActionSeverity;
}

// =========================================================================
// Customer
// =========================================================================

export interface Customer {
  customerId: number;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  addressDetail: string | null;
  zipCode: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerPurchase {
  purchaseId: number;
  productName: string;
  modelName: string;
  serialNumber: string | null;
  purchaseDate: string;
  purchaseChannel: string | null;
  warrantyEndDate: string | null;
}

export interface CustomerDetail extends Customer {
  purchases: CustomerPurchase[];
  ticketCount: number;
  lastTicketDate: string | null;
}

// =========================================================================
// Report
// =========================================================================

export const REPORT_TYPES = ['MONTHLY', 'QUARTERLY', 'COMPENSATION', 'CUSTOM'] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export interface Report {
  reportId: number;
  type: ReportType;
  title: string;
  periodFrom: string;            // "2026-04-01"
  periodTo: string;              // "2026-04-30"
  status: 'DRAFT' | 'GENERATED' | 'EXPORTED';
  createdBy: number;
  createdByName: string;
  createdAt: string;
}

export interface ReportPreview {
  totalReceived: number;
  totalCompleted: number;
  completionRate: number;        // %
  totalExpense: number;          // 원
  totalCompensation: number;     // 원
  avgDays: number;
}

// =========================================================================
// Paginated API response
// =========================================================================

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// =========================================================================
// API error
// =========================================================================

export interface ApiError {
  status: number;
  code: string;
  message: string;
  timestamp: string;
}
