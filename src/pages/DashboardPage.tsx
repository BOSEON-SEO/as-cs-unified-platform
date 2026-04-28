/**
 * 대시보드 메인 페이지 — Phase 2 뼈대
 */
export function DashboardPage() {
  return (
    <section>
      {/* Page header */}
      <div className="mb-5 flex items-end justify-between border-b border-[var(--color-border)] pb-4">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-[#0F172A]">
            📊 A/S 현황 대시보드
          </h1>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            실시간 운영 현황판 · Phase 2 기반 구축 완료
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-[7px] border border-[var(--color-border)] bg-white px-3.5 py-[7px] text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[#F1F5F9]">
            🔄 새로고침
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="mb-5 grid grid-cols-4 gap-3">
        {[
          { label: '접수 대기', value: '—', accent: 'border-t-amber-400', color: 'text-amber-500' },
          { label: '진행중',   value: '—', accent: 'border-t-blue-500',  color: 'text-blue-600' },
          { label: '금일 완료', value: '—', accent: 'border-t-green-500', color: 'text-green-600' },
          { label: 'SLA 초과', value: '—', accent: 'border-t-red-500',   color: 'text-red-500' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded-[10px] border border-[var(--color-border)] bg-white p-3.5 text-left ${kpi.accent} border-t-[3px]`}
          >
            <div className="mb-1 text-[11px] font-medium text-[var(--color-text-secondary)]">
              {kpi.label}
            </div>
            <div className={`text-2xl font-extrabold leading-tight ${kpi.color}`}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder */}
      <div className="flex h-60 items-center justify-center rounded-[10px] border border-dashed border-[var(--color-border)] bg-white text-sm text-[var(--color-text-muted)]">
        Phase 2 — API 연동 후 실시간 데이터가 표시됩니다
      </div>
    </section>
  );
}
