import { Bell, Clock } from "lucide-react";

export default function MedReminders({ reminders = [] }) {
  if (!reminders.length) return null;

  return (
    <div className="rounded-xl border border-accent bg-accent-soft/40 p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-primary-dark">
        <Bell size={16} strokeWidth={2} />
        <h3 className="font-display text-base font-semibold">
          Medication reminders
        </h3>
      </div>
      <ul className="space-y-2">
        {reminders.map((r) => (
          <li
            key={r._id}
            className="flex items-start gap-2 rounded-lg border border-border bg-paper-card px-3 py-2.5 text-sm"
          >
            <Clock size={14} className="mt-0.5 text-primary" />
            <div>
              <p className="font-medium text-ink">{r.message}</p>
              <p className="text-xs text-ink-soft">
                {r.dosage}
                {r.overdue ? " · Overdue" : " · Upcoming"}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
