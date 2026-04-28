/**
 * A/S 현황 대시보드 — Phase 2 뼈대
 * 반응형: 모바일 2열 / 데스크톱 4열 KPI
 */
export function DashboardPage() {
  const kpis = [
    { label: '접수 대기', value: '—', accent: 'border-t-amber-400', color: 'text-amber-500' },
    { label: '진행중',   value: '—', accent: 'border-t-blue-500',  color: 'text-blue-600' },
    { label: '금일 완료', value: '—', accent: 'border-t-green-500', color: 'text-green-600' },
    { label: 'SLA 초과', value: '—', accent: 'border-t-red-500',   color: 'text-red-500' },
  ] as const;

  return (
    <section>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 A/S 현황 대시보드</h1>
          <p className="page-desc">실시간 운영 현황판 · Phase 2 기반 구축 완료</p>
        </div>
        <div className="hidden items-center gap-2 desktop:flex">
          <button className="rounded-[7px] border border-[var(--color-border)] bg-white px-3.5 py-[7px] text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[#F1F5F9]">
            🔄 새로고침
          </button>
        </div>
      </div>

      {/* KPI row — mobile 2col, desktop 4col */}
      <div className="mb-5 grid grid-cols-2 gap-3 desktop:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded-[10px] border border-[var(--color-border)] border-t-[3px] bg-white p-3.5 text-left ${kpi.accent}`}
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
      <div className="placeholder-card">
        Phase 2 — API 연동 후 실시간 데이터가 표시됩니다
      </div>
    </section>
  );
}
