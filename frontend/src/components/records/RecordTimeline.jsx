function relativeDay(date) {
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((today - target) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  if (diff < 14) return "Last week";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function RecordTimeline({ items = [] }) {
  if (!items.length) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-paper-card p-6 text-sm text-ink-soft">
        No updates yet. Use quick actions to add the first record.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-paper-card p-5 shadow-sm">
      <h3 className="mb-4 font-display text-lg font-semibold text-ink">
        Record timeline
      </h3>
      <ol className="space-y-4">
        {items.slice(0, 10).map((item) => (
          <li key={item._id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
              <span className="w-px flex-1 bg-border" />
            </div>
            <div className="pb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                {relativeDay(item.createdAt)}
              </p>
              <p className="mt-0.5 text-sm font-medium text-ink">
                ✔ {item.message}
              </p>
              {item.actor?.name && (
                <p className="text-xs text-ink-soft">by {item.actor.name}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
