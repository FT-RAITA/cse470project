import {
  ClipboardList,
  Clock3,
  Pill,
  FileStack,
  HeartPulse,
  CalendarClock,
} from "lucide-react";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SummaryCards({ summary, loading }) {
  const cards = [
    {
      label: "Total medical records",
      value: summary?.totalRecords ?? 0,
      icon: ClipboardList,
      tone: "bg-primary/10 text-primary",
    },
    {
      label: "Last updated",
      value: formatDate(summary?.lastUpdated),
      icon: Clock3,
      tone: "bg-accent-soft text-primary-dark",
      isText: true,
    },
    {
      label: "Active medications",
      value: summary?.activeMedications ?? 0,
      icon: Pill,
      tone: "bg-emerald-100 text-emerald-800",
    },
    {
      label: "Uploaded reports",
      value: summary?.uploadedReports ?? 0,
      icon: FileStack,
      tone: "bg-sky-100 text-sky-800",
    },
    {
      label: "Current health status",
      value: summary?.healthStatus ?? "—",
      icon: HeartPulse,
      tone: "bg-rose-soft text-rose",
      isText: true,
    },
    {
      label: "Upcoming checkup",
      value: summary?.upcomingCheckup
        ? formatDate(summary.upcomingCheckup)
        : "None scheduled",
      icon: CalendarClock,
      tone: "bg-paper text-ink-soft border border-border",
      isText: true,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl border border-border bg-paper-card"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map(({ label, value, icon: Icon, tone, isText }) => (
        <div
          key={label}
          className="group rounded-xl border border-border bg-paper-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft leading-snug">
              {label}
            </p>
            <span
              className={`rounded-lg p-2 transition-transform duration-200 group-hover:scale-105 ${tone}`}
            >
              <Icon size={15} strokeWidth={2} />
            </span>
          </div>
          <p
            className={`mt-3 font-display font-semibold text-ink ${
              isText ? "text-lg leading-tight" : "text-3xl"
            }`}
          >
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}
