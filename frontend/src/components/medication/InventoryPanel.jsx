import { AlertTriangle, Package } from "lucide-react";

export default function InventoryPanel({ medications = [], lowStock = [] }) {
  return (
    <div className="rounded-xl border border-border bg-paper-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Package size={18} className="text-primary" />
        <h3 className="font-display text-lg font-semibold text-ink">
          Medication inventory
        </h3>
      </div>

      {lowStock.length > 0 && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose/30 bg-rose-soft px-3 py-2.5 text-sm text-rose">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <p>
            {lowStock.length} medicine{lowStock.length === 1 ? "" : "s"} running
            low — refill soon.
          </p>
        </div>
      )}

      {medications.length === 0 ? (
        <p className="text-sm text-ink-soft">No inventory to show yet.</p>
      ) : (
        <ul className="space-y-2">
          {medications
            .filter((m) => m.status === "Active")
            .map((m) => {
              const low = m.quantityRemaining <= m.lowStockThreshold;
              const pct = Math.min(
                100,
                Math.round(
                  (m.quantityRemaining /
                    Math.max(m.lowStockThreshold * 4, m.quantityRemaining, 1)) *
                    100
                )
              );
              return (
                <li key={m._id} className="rounded-lg border border-border bg-paper px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-ink">{m.name}</p>
                    <p
                      className={`font-mono text-xs font-semibold ${
                        low ? "text-rose" : "text-ink-soft"
                      }`}
                    >
                      {m.quantityRemaining} {m.quantityUnit}
                    </p>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                    <div
                      className={`h-full rounded-full ${
                        low ? "bg-rose" : "bg-primary"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {low && (
                    <p className="mt-1 text-[11px] font-semibold text-rose">
                      Low stock (threshold {m.lowStockThreshold})
                    </p>
                  )}
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}
