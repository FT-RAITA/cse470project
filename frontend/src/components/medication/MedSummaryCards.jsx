import {
  Pill,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default function MedSummaryCards({ summary, loading }) {
  const cards = [
    {
      label: "Active medicines",
      value: summary?.totalActive ?? 0,
      icon: Pill,
      tone: "bg-primary/10 text-primary",
    },
    {
      label: "Doses scheduled today",
      value: summary?.dosesScheduledToday ?? 0,
      icon: CalendarClock,
      tone: "bg-sky-100 text-sky-800",
    },
    {
      label: "Doses taken",
      value: summary?.dosesTakenToday ?? 0,
      icon: CheckCircle2,
      tone: "bg-emerald-100 text-emerald-800",
    },
    {
      label: "Missed doses",
      value: summary?.dosesMissedToday ?? 0,
      icon: AlertTriangle,
      tone: "bg-rose-soft text-rose",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-border bg-paper-card"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, tone }) => (
        <div
          key={label}
          className="group rounded-xl border border-border bg-paper-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
              {label}
            </p>
            <span className={`rounded-lg p-2 ${tone}`}>
              <Icon size={15} strokeWidth={2} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-semibold text-ink">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}
