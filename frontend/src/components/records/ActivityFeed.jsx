export default function ActivityFeed({ items = [] }) {
  if (!items.length) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-paper-card p-6 text-sm text-ink-soft">
        Activity will appear here as caregivers update records.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-paper-card p-5 shadow-sm">
      <h3 className="mb-4 font-display text-lg font-semibold text-ink">
        Activity feed
      </h3>
      <ul className="space-y-3">
        {items.slice(0, 8).map((item) => (
          <li
            key={item._id}
            className="rounded-lg border border-border bg-paper px-3.5 py-3"
          >
            <p className="text-sm font-medium text-ink">{item.message}</p>
            <p className="mt-1 text-xs text-ink-soft">
              {item.actor?.name || "Caregiver"} ·{" "}
              {new Date(item.createdAt).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
