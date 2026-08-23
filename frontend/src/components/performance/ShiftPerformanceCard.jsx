export default function ShiftPerformanceCard({ shifts }) {
  return (
    <div className="rounded-xl border border-border bg-paper-card p-5 shadow-sm">
      <h3 className="font-display text-lg font-semibold text-ink">Shift performance</h3>
      <p className="mt-1 text-xs text-ink-soft">Attendance summary for reporting</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {[
          ["Scheduled", shifts?.shiftsScheduled ?? 0],
          ["Completed", shifts?.shiftsCompleted ?? 0],
          ["Missed", shifts?.shiftsMissed ?? 0],
          ["Late", shifts?.shiftsLate ?? 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-border bg-paper px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">{label}</p>
            <p className="mt-1 font-display text-xl font-semibold text-ink">{value}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm font-semibold text-primary">
        Attendance rate: {shifts?.attendanceRate ?? 0}%
      </p>
    </div>
  );
}
