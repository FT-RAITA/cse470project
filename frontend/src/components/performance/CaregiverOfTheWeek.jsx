import { Trophy } from "lucide-react";

export default function CaregiverOfTheWeek({ winner }) {
  if (!winner) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-paper-card p-5 text-sm text-ink-soft">
        No weekly winner yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-accent bg-accent-soft/30 p-5 shadow-sm">
      <div className="flex items-center gap-2 text-primary-dark">
        <Trophy size={18} />
        <h3 className="font-display text-lg font-semibold">Caregiver of the Week</h3>
      </div>
      <p className="mt-4 font-display text-2xl font-semibold text-ink">{winner.name}</p>
      <p className="mt-1 text-sm font-semibold text-primary">
        Performance Score: {winner.score}/100
      </p>
      <p className="mt-3 text-sm text-ink-soft italic">Outstanding Care & Support</p>
    </div>
  );
}
