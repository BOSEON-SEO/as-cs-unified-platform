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
