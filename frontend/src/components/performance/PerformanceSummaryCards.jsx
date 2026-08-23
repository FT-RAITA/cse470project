import {
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Percent,
  Clock3,
  CalendarCheck,
  Gauge,
} from "lucide-react";

export default function PerformanceSummaryCards({ summary, loading }) {
  const cards = [
    { label: "Tasks Assigned", value: summary?.tasksAssigned ?? 0, icon: ClipboardList, tone: "bg-primary/10 text-primary" },
    { label: "Tasks Completed", value: summary?.tasksCompleted ?? 0, icon: CheckCircle2, tone: "bg-emerald-100 text-emerald-800" },
    { label: "Tasks Missed", value: summary?.tasksMissed ?? 0, icon: AlertTriangle, tone: "bg-rose-soft text-rose" },
    { label: "Completion Rate", value: `${summary?.completionRate ?? 0}%`, icon: Percent, tone: "bg-sky-100 text-sky-800" },
    { label: "On-Time Completion", value: `${summary?.onTimeRate ?? 0}%`, icon: Clock3, tone: "bg-accent-soft text-primary-dark" },
    { label: "Shift Attendance", value: `${summary?.attendanceRate ?? 0}%`, icon: CalendarCheck, tone: "bg-primary/10 text-primary" },
    { label: "Performance Score", value: `${summary?.performanceScore ?? 0}/100`, icon: Gauge, tone: "bg-accent-soft text-primary-dark" },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-paper-card" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
      {cards.map(({ label, value, icon: Icon, tone }) => (
        <div
          key={label}
          className="rounded-xl border border-border bg-paper-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft leading-snug">
              {label}
            </p>
            <span className={`rounded-lg p-2 ${tone}`}>
              <Icon size={14} />
            </span>
          </div>
          <p className="mt-3 font-display text-2xl font-semibold text-ink">{value}</p>
        </div>
      ))}
    </div>
  );
}
