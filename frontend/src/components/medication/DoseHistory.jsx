function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const statusStyle = {
  Taken: "bg-emerald-100 text-emerald-800",
  Missed: "bg-rose-soft text-rose",
  Skipped: "bg-paper text-ink-soft border border-border",
};

export default function DoseHistory({ history = [], title = "Medication history" }) {
  return (
    <div className="rounded-xl border border-border bg-paper-card shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      </div>

      {history.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-ink-soft">
          No history yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-paper text-xs uppercase tracking-wider text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Medicine</th>
                <th className="px-4 py-3 font-semibold">Scheduled</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h._id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono text-xs">
                    {formatDate(h.scheduledDate)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">
                      {h.medication?.name || "—"}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {h.medication?.dosage}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {h.scheduledTime}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        statusStyle[h.status] || "bg-paper text-ink-soft"
                      }`}
                    >
                      {h.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
