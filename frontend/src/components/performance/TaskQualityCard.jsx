export default function TaskQualityCard({ summary }) {
  return (
    <div className="rounded-xl border border-border bg-paper-card p-5 shadow-sm">
      <h3 className="font-display text-lg font-semibold text-ink">Task quality</h3>
      <p className="mt-1 text-xs text-ink-soft">Completion and on-time rates for this period</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {[
          ["Completion", `${summary?.completionRate ?? 0}%`],
          ["On-Time", `${summary?.onTimeRate ?? 0}%`],
          ["Completed", summary?.tasksCompleted ?? 0],
          ["Missed", summary?.tasksMissed ?? 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-border bg-paper px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">{label}</p>
            <p className="mt-1 font-display text-xl font-semibold text-ink">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
