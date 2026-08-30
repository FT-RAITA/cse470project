import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function AppointmentStatusChart({ data = [], period = "" }) {
  const hasData = data.some((row) => row.value > 0);

  return (
    <section className="rounded-xl border border-border bg-paper-card p-5 shadow-sm">
      <h3 className="font-display text-lg font-semibold text-ink">Doctor appointment status</h3>
      <p className="mt-1 text-xs text-ink-soft">{period || "Current month"} · real stored status values</p>

      {!hasData ? (
        <p className="py-16 text-center text-sm text-ink-soft">
          No doctor appointments recorded for this period.
        </p>
      ) : (
        <div className="mt-5 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ee-border)" />
              <XAxis dataKey="status" tick={{ fontSize: 11 }} stroke="var(--ee-ink-soft)" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--ee-ink-soft)" />
              <Tooltip
                formatter={(value) => [value, "Appointments"]}
                contentStyle={{
                  backgroundColor: "var(--ee-paper-card)",
                  borderColor: "var(--ee-border)",
                  borderRadius: "8px",
                  color: "var(--ee-ink)",
                }}
              />
              <Bar dataKey="value" fill="var(--ee-primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
