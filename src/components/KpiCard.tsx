/**
 * KpiCard -- Reusable KPI metric card with MoM delta and skeleton loading.
 *
 * Used by DashboardPage (#5) and StatisticsPage (#14).
 * Inherits design tokens from prototype-v2 (border-t accent, 2xl value).
 *
 * React.memo prevents unnecessary re-renders during 30s polling cycles
 * when sibling cards receive identical data.
 */

import { memo } from 'react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface KpiCardProps {
  /** Display label (e.g. "접수 대기") */
  label: string;
  /** Numeric or formatted value (e.g. 24, "84.4%", "-890K") */
  value: number | string;
  /** Month-over-month change in %. Positive = increase, negative = decrease */
  delta: number;
  /** Explicit direction for icon display */
  trend: 'up' | 'down' | 'flat';
  /** Tailwind border-t color class (e.g. "border-t-amber-400") */
  accent: string;
  /** Tailwind text color class for the value (e.g. "text-amber-500") */
  valueColor: string;
  /** Show pulse skeleton instead of content */
  isLoading?: boolean;
  /**
   * When true, "down" trend is treated as positive (green).
   * Use for metrics where decrease = improvement (e.g. SLA exceeded, pending).
   */
  invertDelta?: boolean;
}

// ---------------------------------------------------------------------------
// Delta display logic
// ---------------------------------------------------------------------------

function getDeltaDisplay(
  delta: number,
  trend: 'up' | 'down' | 'flat',
  invertDelta: boolean,
) {
  if (trend === 'flat' || delta === 0) {
    return { icon: '\u2014', color: 'text-gray-400', text: '0%' }; // em dash
  }

  const isUp = trend === 'up';

  // "Good" means: up is good normally, but inverted for metrics like
  // pending count or SLA exceeded where going down is desirable.
  const isGood = invertDelta ? !isUp : isUp;

  return {
    icon: isUp ? '\u25B2' : '\u25BC', // ▲ / ▼
    color: isGood ? 'text-emerald-600' : 'text-red-500',
    text: `${Math.abs(delta).toFixed(1)}%`,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function KpiCardInner({
  label,
  value,
  delta,
  trend,
  accent,
  valueColor,
  isLoading = false,
  invertDelta = false,
}: KpiCardProps) {
  const d = getDeltaDisplay(delta, trend, invertDelta);

  return (
    <div
      className={`rounded-[10px] border border-[var(--color-border)] border-t-[3px] bg-white p-3.5 ${accent}`}
    >
      {isLoading ? (
        /* ---------- Skeleton ---------- */
        <div className="animate-pulse">
          <div className="mb-2 h-3 w-16 rounded bg-gray-200" />
          <div className="mb-1.5 h-7 w-12 rounded bg-gray-200" />
          <div className="h-3 w-20 rounded bg-gray-200" />
        </div>
      ) : (
        /* ---------- Content ---------- */
        <>
          <div className="mb-1 text-[11px] font-medium text-[var(--color-text-secondary)]">
            {label}
          </div>
          <div className={`text-2xl font-extrabold leading-tight ${valueColor}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          <div className={`mt-1 flex items-center gap-1 text-[10px] font-medium ${d.color}`}>
            <span>{d.icon}</span>
            <span>{d.text}</span>
            <span className="text-[var(--color-text-muted)]">vs prev month</span>
          </div>
        </>
      )}
    </div>
  );
}

const KpiCard = memo(KpiCardInner);

export default KpiCard;
