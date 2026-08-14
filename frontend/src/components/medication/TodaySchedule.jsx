import toast from "react-hot-toast";
import { Check, X, Minus } from "lucide-react";
import { updateDoseStatus } from "../../services/medicationService";

const statusStyle = {
  Pending: "bg-accent-soft text-primary-dark",
  Taken: "bg-emerald-100 text-emerald-800",
  Missed: "bg-rose-soft text-rose",
  Skipped: "bg-paper text-ink-soft border border-border",
};

export default function TodaySchedule({ doses = [], elderId, token, onChanged, loading }) {
  const mark = async (doseId, status) => {
    try {
      const res = await updateDoseStatus(elderId, doseId, status, token);
      toast.success(res.data.message);
      onChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update dose");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-paper-card shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <h3 className="font-display text-lg font-semibold text-ink">
          Today's medication schedule
        </h3>
      </div>

      {loading ? (
        <div className="space-y-3 p-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-paper" />
          ))}
        </div>
      ) : doses.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-ink-soft">
          No doses scheduled for today. Add an active medicine with schedule times.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {doses.map((d) => (
            <li
              key={d._id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-ink">
                  {d.medication?.name || "Medicine"}
                </p>
                <p className="text-sm text-ink-soft">
                  {d.medication?.dosage} ·{" "}
                  <span className="font-mono text-ink">{d.scheduledTime}</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    statusStyle[d.status] || statusStyle.Pending
                  }`}
                >
                  {d.status}
                </span>
                {d.status === "Pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => mark(d._id, "Taken")}
                      className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-paper-card hover:bg-primary-dark"
                    >
                      <Check size={13} /> Taken
                    </button>
                    <button
                      type="button"
                      onClick={() => mark(d._id, "Missed")}
                      className="inline-flex items-center gap-1 rounded-md bg-rose px-2.5 py-1.5 text-xs font-semibold text-paper-card hover:bg-rose/90"
                    >
                      <X size={13} /> Missed
                    </button>
                    <button
                      type="button"
                      onClick={() => mark(d._id, "Skipped")}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-ink-soft hover:bg-paper"
                    >
                      <Minus size={13} /> Skip
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
