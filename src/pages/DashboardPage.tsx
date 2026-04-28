/**
 * #5 A/S 현황 대시보드 — 메인 index 페이지
 */
export function DashboardPage() {
  return (
    <section>
      <h1 className="page-title">📊 A/S 현황 대시보드</h1>
      <p className="page-desc">실시간 운영 현황판 · 30초마다 자동 갱신</p>

      <div className="mt-5 grid grid-cols-2 gap-3 desktop:grid-cols-4">
        {([
          { label: '접수 대기', value: '—', accent: 'border-t-amber-400', color: 'text-amber-500' },
          { label: '진행중',    value: '—', accent: 'border-t-blue-500',  color: 'text-blue-600' },
          { label: '금일 완료', value: '—', accent: 'border-t-green-500', color: 'text-green-600' },
          { label: 'SLA 초과',  value: '—', accent: 'border-t-red-500',   color: 'text-red-500' },
        ] as const).map((kpi) => (
          <div key={kpi.label} className={`rounded-[10px] border border-[var(--color-border)] border-t-[3px] bg-white p-3.5 ${kpi.accent}`}>
            <div className="mb-1 text-[11px] font-medium text-[var(--color-text-secondary)]">{kpi.label}</div>
            <div className={`text-2xl font-extrabold leading-tight ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="placeholder-card mt-5">API 연동 후 실시간 데이터가 표시됩니다</div>
    </section>
  );
}
