const STATUS_STYLES = {
  Pending: "bg-accent-soft text-primary-dark",
  Approved: "bg-emerald-100 text-emerald-800",
  Rejected: "bg-rose-soft text-rose",
  Completed: "bg-sky-100 text-sky-800",
  Cancelled: "bg-paper text-ink-soft border border-border",
};

const PRIORITY_STYLES = {
  Normal: "text-ink-soft",
  Important: "text-accent",
  "Emergency Request": "text-rose font-semibold",
};

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        STATUS_STYLES[status] || "bg-paper text-ink-soft"
      }`}
    >
      {status}
    </span>
  );
}

export function PriorityLabel({ priority }) {
  return (
    <span className={`text-sm ${PRIORITY_STYLES[priority] || "text-ink-soft"}`}>
      {priority}
    </span>
  );
}

export function VisitorBadge({ badge }) {
  if (!badge) return null;
  const styles = {
    "First Visit": "bg-sky-100 text-sky-800",
    "Returning Visitor": "bg-accent-soft text-primary-dark",
    "Frequent Visitor": "bg-primary/10 text-primary",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        styles[badge] || "bg-paper text-ink-soft"
      }`}
    >
      {badge}
    </span>
  );
}

export function VisitTimeline({ status }) {
  const steps = ["Pending", "Approved", "Completed", "Archived"];

  const activeIndex = (() => {
    if (status === "Pending") return 0;
    if (status === "Approved") return 1;
    if (status === "Completed") return 2;
    if (status === "Rejected" || status === "Cancelled") return 0;
    return 0;
  })();

  const isTerminalFail = status === "Rejected" || status === "Cancelled";

  return (
    <div className="rounded-xl border border-border bg-paper p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-soft">
        Visit status timeline
      </p>
      {isTerminalFail ? (
        <p className="text-sm font-medium text-rose">
          Request was {status.toLowerCase()}. Timeline stopped at Pending.
        </p>
      ) : (
        <ol className="space-y-0">
          {steps.map((step, i) => {
            const done = i <= activeIndex;
            const current = i === activeIndex;
            return (
              <li key={step} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      done
                        ? "bg-primary text-paper-card"
                        : "bg-border text-ink-soft"
                    } ${current ? "ring-2 ring-accent ring-offset-2 ring-offset-paper" : ""}`}
                  >
                    {i + 1}
                  </span>
                  {i < steps.length - 1 && (
                    <span
                      className={`my-1 w-0.5 flex-1 min-h-4 ${
                        i < activeIndex ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}
                </div>
                <div className={`pb-4 ${current ? "text-ink font-semibold" : "text-ink-soft"}`}>
                  <p className="text-sm">{step}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateInput(d) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}
