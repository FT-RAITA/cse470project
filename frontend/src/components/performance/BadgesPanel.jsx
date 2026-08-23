export default function BadgesPanel({ badges = [] }) {
  return (
    <div className="rounded-xl border border-border bg-paper-card p-5 shadow-sm">
      <h3 className="font-display text-lg font-semibold text-ink">Badges & recognition</h3>
      {!badges.length ? (
        <p className="mt-4 text-sm text-ink-soft">No badges earned in this period.</p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {badges.map((b) => (
            <span
              key={b.id}
              className="rounded-full border border-border bg-paper px-3 py-1.5 text-xs font-semibold text-ink"
            >
              {b.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
