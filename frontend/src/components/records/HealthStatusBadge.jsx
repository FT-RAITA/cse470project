import { CheckCircle2, AlertTriangle, Siren } from "lucide-react";

const MAP = {
  Stable: {
    label: "Stable",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Icon: CheckCircle2,
  },
  "Needs Attention": {
    label: "Needs Attention",
    className: "bg-accent-soft text-primary-dark border-accent",
    Icon: AlertTriangle,
  },
  Critical: {
    label: "Critical",
    className: "bg-rose-soft text-rose border-rose/30",
    Icon: Siren,
  },
};

export default function HealthStatusBadge({ status }) {
  const cfg = MAP[status] || MAP.Stable;
  const { Icon } = cfg;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold ${cfg.className}`}
    >
      <Icon size={16} strokeWidth={2} />
      {cfg.label}
    </span>
  );
}
