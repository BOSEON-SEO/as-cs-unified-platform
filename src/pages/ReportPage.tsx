/**
 * ReportPage (#13) -- Report generation, preview, and CSV/XLSX download
 *
 * Sections:
 *   1. Report type selector (4 cards: MONTHLY / QUARTERLY / COMPENSATION / CUSTOM)
 *   2. Period input (month-picker / quarter / date-range based on type)
 *   3. KPI preview (6 metrics from /reports/preview)
 *   4. Download buttons (CSV active, XLSX active, PDF disabled)
 *
 * Responsive: 520px mobile 1-col stack via desktop: variant
 */

import { useState, useCallback } from 'react';
import dayjs from 'dayjs';
import { useReportPreview, useReportDownload } from '@/hooks/useReports.ts';
import type { ReportType } from '@/types/index.ts';
import type { ExportFormat } from '@/utils/downloadFile.ts';

// ---------------------------------------------------------------------------
// Report type cards config
// ---------------------------------------------------------------------------

const REPORT_TYPE_CONFIG: Array<{
  type: ReportType;
  title: string;
  desc: string;
}> = [
  { type: 'MONTHLY',      title: 'Monthly Report',      desc: 'Monthly A/S summary with ticket counts, costs, and assignee breakdown' },
  { type: 'QUARTERLY',    title: 'Quarterly Report',     desc: '3-month trend comparison and aggregated KPIs' },
  { type: 'COMPENSATION', title: 'Vendor Compensation',  desc: 'Headquarters compensation claim with 3-axis cost detail' },
  { type: 'CUSTOM',       title: 'Custom Report',        desc: 'User-selected sections with custom date range' },
];

// ---------------------------------------------------------------------------
// KPI preview labels
// ---------------------------------------------------------------------------

const PREVIEW_ITEMS: Array<{
  key: string;
  label: string;
  format: (v: number) => string;
}> = [
  { key: 'totalReceived',     label: 'Total Received',  format: (v) => v.toLocaleString() },
  { key: 'totalCompleted',    label: 'Completed',       format: (v) => v.toLocaleString() },
  { key: 'completionRate',    label: 'Completion Rate',  format: (v) => `${v.toFixed(1)}%` },
  { key: 'totalExpense',      label: 'Total Expense',    format: (v) => `${(v / 10000).toFixed(0)}만원` },
  { key: 'totalCompensation', label: 'Compensation',     format: (v) => `${(v / 10000).toFixed(0)}만원` },
  { key: 'avgDays',           label: 'Avg Resolution',   format: (v) => `${v.toFixed(1)}일` },
];

// ---------------------------------------------------------------------------
// Helper: derive period range from type + input
// ---------------------------------------------------------------------------

function derivePeriod(type: ReportType, monthValue: string, fromValue: string, toValue: string) {
  if (type === 'CUSTOM') {
    return { periodFrom: fromValue, periodTo: toValue };
  }
  if (type === 'QUARTERLY') {
    const d = dayjs(monthValue + '-01');
    const qStart = d.startOf('month').subtract((d.month() % 3), 'month');
    return {
      periodFrom: qStart.format('YYYY-MM-DD'),
      periodTo: qStart.add(3, 'month').subtract(1, 'day').format('YYYY-MM-DD'),
    };
  }
  // MONTHLY / COMPENSATION
  const d = dayjs(monthValue + '-01');
  return {
    periodFrom: d.startOf('month').format('YYYY-MM-DD'),
    periodTo: d.endOf('month').format('YYYY-MM-DD'),
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReportPage() {
  // -- State --
  const [selectedType, setSelectedType] = useState<ReportType>('MONTHLY');
  const [monthValue, setMonthValue] = useState(dayjs().format('YYYY-MM'));
  const [fromValue, setFromValue] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [toValue, setToValue] = useState(dayjs().format('YYYY-MM-DD'));

  const { periodFrom, periodTo } = derivePeriod(selectedType, monthValue, fromValue, toValue);

  // -- Hooks --
  const preview = useReportPreview({ type: selectedType, periodFrom, periodTo });
  const download = useReportDownload();

  // -- Handlers --
  const handleDownload = useCallback(
    (format: ExportFormat) => {
      download.mutate({ type: selectedType, periodFrom, periodTo, format });
    },
    [download, selectedType, periodFrom, periodTo],
  );

  return (
    <section>
      <h1 className="page-title">Report</h1>
      <p className="page-desc">Report generation -- CSV/XLSX download with KPI preview</p>

      {/* ================================================================
          Section 1: Report Type Selector (4 cards)
          ================================================================ */}
      <div className="mt-5 grid grid-cols-1 gap-3 desktop:grid-cols-4">
        {REPORT_TYPE_CONFIG.map((cfg) => {
          const isActive = selectedType === cfg.type;
          return (
            <button
              key={cfg.type}
              type="button"
              onClick={() => setSelectedType(cfg.type)}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                isActive
                  ? 'border-[var(--color-primary-light)] bg-blue-50 shadow-sm'
                  : 'border-[var(--color-border)] bg-white hover:border-gray-300'
              }`}
            >
              <div className={`text-sm font-semibold ${isActive ? 'text-[var(--color-primary)]' : 'text-gray-800'}`}>
                {cfg.title}
              </div>
              <div className="mt-1 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
                {cfg.desc}
              </div>
            </button>
          );
        })}
      </div>

      {/* ================================================================
          Section 2: Period Input
          ================================================================ */}
      <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-800">Period</h2>

        {selectedType === 'CUSTOM' ? (
          /* Custom: date range */
          <div className="flex flex-col gap-3 desktop:flex-row desktop:items-end desktop:gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">From</span>
              <input
                type="date"
                value={fromValue}
                onChange={(e) => setFromValue(e.target.value)}
                className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary-light)] focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">To</span>
              <input
                type="date"
                value={toValue}
                onChange={(e) => setToValue(e.target.value)}
                className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary-light)] focus:outline-none"
              />
            </label>
          </div>
        ) : (
          /* Monthly / Quarterly / Compensation: month picker */
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">
              {selectedType === 'QUARTERLY' ? 'Quarter (select any month in the quarter)' : 'Month'}
            </span>
            <input
              type="month"
              value={monthValue}
              onChange={(e) => setMonthValue(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary-light)] focus:outline-none desktop:w-48"
            />
          </label>
        )}

        <div className="mt-2 text-[11px] text-[var(--color-text-muted)]">
          Range: {periodFrom} ~ {periodTo}
        </div>
      </div>

      {/* ================================================================
          Section 3: KPI Preview (6 metrics)
          ================================================================ */}
      <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-800">Preview</h2>

        {preview.isLoading ? (
          /* Skeleton */
          <div className="grid grid-cols-2 gap-3 desktop:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="animate-pulse rounded-lg bg-gray-50 p-3">
                <div className="mb-2 h-3 w-16 rounded bg-gray-200" />
                <div className="h-5 w-12 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : preview.data ? (
          <div className="grid grid-cols-2 gap-3 desktop:grid-cols-3">
            {PREVIEW_ITEMS.map((item) => {
              const raw = preview.data[item.key as keyof typeof preview.data] as number | undefined;
              const value = raw != null ? item.format(raw) : '--';
              return (
                <div key={item.key} className="rounded-lg bg-gray-50 p-3">
                  <div className="text-[11px] font-medium text-[var(--color-text-secondary)]">{item.label}</div>
                  <div className="mt-1 text-lg font-bold text-gray-900">{value}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-[var(--color-text-muted)]">
            Select a report type and period to preview
          </div>
        )}
      </div>

      {/* ================================================================
          Section 4: Download Buttons
          ================================================================ */}
      <div className="mt-4 flex flex-col gap-3 desktop:flex-row">
        {/* CSV */}
        <button
          type="button"
          onClick={() => handleDownload('csv')}
          disabled={download.isPending || !preview.data}
          className="flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {download.isPending && download.variables?.format === 'csv' ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : null}
          CSV Download
        </button>

        {/* XLSX */}
        <button
          type="button"
          onClick={() => handleDownload('xlsx')}
          disabled={download.isPending || !preview.data}
          className="flex items-center justify-center gap-2 rounded-lg border border-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {download.isPending && download.variables?.format === 'xlsx' ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
          ) : null}
          XLSX Download
        </button>

        {/* PDF (disabled) */}
        <button
          type="button"
          disabled
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-400 desktop:ml-auto"
          title="PDF export is coming soon"
        >
          PDF (Coming Soon)
        </button>
      </div>

      {/* Download status */}
      {download.isSuccess && (
        <div className="mt-3 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          Download started successfully.
        </div>
      )}
      {download.isError && (
        <div className="mt-3 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
          Download failed: {download.error.message}
        </div>
      )}
    </section>
  );
}
