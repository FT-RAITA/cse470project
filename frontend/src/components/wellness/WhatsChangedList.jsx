const TONE = {
  positive: "border-emerald-200 bg-emerald-50 text-emerald-900",
  attention: "border-amber-200 bg-amber-50 text-amber-900",
};

export default function WhatsChangedList({ changes = [] }) {
  if (!changes.length) return null;

  return (
    <div className="rounded-xl border border-border bg-paper-card p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-ink">What&apos;s Changed?</h2>
      <div className="mt-4 space-y-3">
        {changes.map((item, idx) => (
          <div
            key={`${item.title}-${idx}`}
            className={`rounded-lg border px-4 py-3 ${TONE[item.tone] || TONE.positive}`}
          >
            <p className="text-sm font-semibold">{item.title}</p>
            <p className="mt-1 text-sm opacity-90">{item.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
