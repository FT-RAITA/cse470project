const statusStyle = {
  Completed: "bg-emerald-100 text-emerald-800",
  Pending: "bg-accent-soft text-primary-dark",
  Missed: "bg-rose-soft text-rose",
  Cancelled: "bg-paper text-ink-soft border border-border",
};

export default function ActivityTimeline({ activity = [], loading }) {
  return (
    <div className="rounded-xl border border-border bg-paper-card p-5 shadow-sm">
      <h3 className="mb-4 font-display text-lg font-semibold text-ink">Activity timeline</h3>
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-paper" />
          ))}
        </div>
      ) : !activity.length ? (
        <p className="py-8 text-center text-sm text-ink-soft">No activity for this period.</p>
      ) : (
        <ol className="space-y-4">
          {activity.map((item, idx) => (
            <li key={`${item.time}-${idx}`} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                <span className="w-px flex-1 bg-border" />
              </div>
              <div className="pb-2 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-ink-soft">{item.time}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyle[item.status] || statusStyle.Pending}`}>
                    {item.status}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-ink">✓ {item.title}</p>
                <p className="text-xs text-ink-soft">
                  {item.elder} · {item.category}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
