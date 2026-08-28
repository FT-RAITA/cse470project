import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const OPTIONS = [
  { key: "medication", label: "Medication %", suffix: "%" },
  { key: "activity", label: "Activity", suffix: "" },
  { key: "mood", label: "Mood days", suffix: "" },
];

export default function WellnessTrendBarChart({ series = {} }) {
  const [metric, setMetric] = useState("medication");

  const selected = OPTIONS.find((o) => o.key === metric) || OPTIONS[0];

  const data = useMemo(() => {
    const rows = series[metric] || [];
    return rows.map((row) => ({
      label: row.label,
      value: row.value == null ? 0 : row.value,
    }));
  }, [series, metric]);

  const hasData = data.some((d) => d.value > 0);

  return (
    <div className="rounded-xl border border-border bg-paper-card p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-display text-lg font-semibold text-ink">4-week trend</h3>
        <div className="flex flex-wrap gap-2">
          {OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setMetric(opt.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                metric === opt.key
                  ? "bg-primary text-paper-card"
                  : "border border-border bg-paper text-ink-soft"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <p className="mt-8 py-10 text-center text-sm text-ink-soft">No data for this metric yet.</p>
      ) : (
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4DFCF" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#5C6B65" />
              <YAxis tick={{ fontSize: 11 }} stroke="#5C6B65" />
              <Tooltip
                formatter={(value) => [`${value}${selected.suffix}`, selected.label]}
              />
              <Bar dataKey="value" fill="#24463F" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
