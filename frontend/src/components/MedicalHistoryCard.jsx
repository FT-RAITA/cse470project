import { Stethoscope, AlertTriangle } from "lucide-react";

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function MedicalHistoryCard({
  medicalHistory = [],
  allergies = [],
  chronicDiseases = [],
}) {
  return (
    <div className="rounded-xl border border-border bg-paper-card p-6">
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Stethoscope size={16} strokeWidth={2} />
        </div>
        <h3 className="font-display text-lg font-semibold text-ink">
          Medical History
        </h3>
      </div>

      {(allergies.length > 0 || chronicDiseases.length > 0) && (
        <div className="mb-5 grid gap-4 sm:grid-cols-2">
          {allergies.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose">
                <AlertTriangle size={12} strokeWidth={2.5} />
                Allergies
              </p>
              <div className="flex flex-wrap gap-1.5">
                {allergies.map((a) => (
                  <span
                    key={a}
                    className="rounded-full bg-rose-soft px-2.5 py-1 text-xs font-medium text-rose"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {chronicDiseases.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Chronic Conditions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {chronicDiseases.map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-paper px-2.5 py-1 text-xs font-medium text-ink-soft"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {medicalHistory.length === 0 ? (
        <p className="text-sm text-ink-soft">No medical history recorded yet.</p>
      ) : (
        <ul className="space-y-4 border-t border-border pt-4">
          {medicalHistory.map((entry, i) => (
            <li key={i} className="flex gap-3">
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
              <div>
                <div className="flex items-baseline gap-2">
                  <p className="text-sm font-semibold text-ink">
                    {entry.condition}
                  </p>
                  {entry.diagnosisDate && (
                    <span className="font-mono text-[11px] text-ink-soft">
                      {formatDate(entry.diagnosisDate)}
                    </span>
                  )}
                </div>
                {entry.notes && (
                  <p className="mt-0.5 text-sm text-ink-soft">{entry.notes}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
