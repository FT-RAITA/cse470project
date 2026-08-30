import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function MedicationAdherenceChart({ data = [], rangeLabel = "" }) {
  const hasData = data.some((row) => row.adherence != null);

  return (
    <section className="rounded-xl border border-border bg-paper-card p-5 shadow-sm">
      <div>
        <h3 className="font-display text-lg font-semibold text-ink">Medication adherence trend</h3>
        <p className="mt-1 text-xs text-ink-soft">
          {rangeLabel}. Based only on recorded Taken, Missed, or Skipped dose outcomes.
        </p>
      </div>

      {!hasData ? (
        <p className="py-16 text-center text-sm text-ink-soft">
          No medication adherence data available yet.
        </p>
      ) : (
        <div className="mt-5 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ee-border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--ee-ink-soft)" />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
                stroke="var(--ee-ink-soft)"
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                formatter={(value, _name, item) => [
                  `${value}% (${item.payload.taken}/${item.payload.recorded} recorded doses taken)`,
                  "Adherence",
                ]}
                contentStyle={{
                  backgroundColor: "var(--ee-paper-card)",
                  borderColor: "var(--ee-border)",
                  borderRadius: "8px",
                  color: "var(--ee-ink)",
                }}
              />
              <Line
                type="monotone"
                dataKey="adherence"
                stroke="var(--ee-primary)"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
