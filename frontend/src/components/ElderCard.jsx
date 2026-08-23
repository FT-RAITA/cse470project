import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Droplet, ChevronRight, Pencil, Trash2, Smile, HeartHandshake, Lock } from "lucide-react";

const tints = ["#C99A3C", "#3E6B5F", "#B5544A", "#7A6A9E", "#4C7A9E"];
function tintFor(id) {
  const sum = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return tints[sum % tints.length];
}

const formatWindow = (startAt, endAt) => {
  if (!startAt || !endAt) return "";
  const fmt = (d) =>
    new Date(d).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  return `${fmt(startAt)} – ${fmt(endAt)}`;
};

export default function ElderCard({ elder, onEdit, onDelete, onMoodCheckin }) {
  const navigate = useNavigate();
  const tint = tintFor(elder._id);
  const initials = elder.fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // NEW — a covering caregiver can see this card and its tasks, but not
  // the full profile. Clicking it explains why instead of navigating.
  const handleCardClick = () => {
    if (elder.isTemporary) {
      toast.error("You are not the assigned caregiver for this elder.");
      return;
    }
    navigate(`/elders/${elder._id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative cursor-pointer overflow-hidden rounded-xl border bg-paper-card
        shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${
          elder.isTemporary ? "border-amber-300" : "border-border"
        }`}
    >
      <div className="h-1.5 w-full" style={{ backgroundColor: elder.isTemporary ? "#D97706" : tint }} />

      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-base font-semibold text-white"
              style={{ backgroundColor: elder.isTemporary ? "#D97706" : tint }}
            >
              {initials}
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-ink">
                {elder.fullName}
              </h3>
              <p className="text-xs text-ink-soft">
                {elder.age ? `${elder.age} years` : "Age not set"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {elder.bloodGroup && (
              <span className="flex items-center gap-1 rounded-md border border-border bg-paper px-2 py-1 font-mono text-xs font-medium text-primary-dark">
                <Droplet size={11} strokeWidth={2.5} />
                {elder.bloodGroup}
              </span>
            )}
            {!elder.isTemporary && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoodCheckin(elder);
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-paper text-primary transition-colors hover:bg-primary hover:text-paper-card"
                aria-label={`Log mood check-in for ${elder.fullName}`}
                title="Mood check-in"
              >
                <Smile size={15} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        {/* Badge + window for elders you're temporarily covering */}
        {elder.isTemporary && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            <HeartHandshake size={13} strokeWidth={2} />
            <span>
              Covering{elder.coveredFrom?.name ? ` for ${elder.coveredFrom.name}` : ""}
              {elder.coverageWindow ? ` · ${formatWindow(elder.coverageWindow.startAt, elder.coverageWindow.endAt)}` : ""}
            </span>
          </div>
        )}

        {elder.chronicDiseases?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {elder.chronicDiseases.slice(0, 3).map((d) => (
              <span
                key={d}
                className="rounded-full bg-paper px-2.5 py-1 text-[11px] font-medium text-ink-soft"
              >
                {d}
              </span>
            ))}
            {elder.chronicDiseases.length > 3 && (
              <span className="rounded-full bg-paper px-2.5 py-1 text-[11px] font-medium text-ink-soft">
                +{elder.chronicDiseases.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-border pt-3">
          {elder.isTemporary ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-amber-700">
              <Lock size={12} strokeWidth={2.5} />
              Profile locked — care tasks only
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-semibold text-primary">
              View profile
              <ChevronRight size={14} strokeWidth={2.5} />
            </span>
          )}

          {!elder.isTemporary && (
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(elder._id);
                }}
                className="rounded-md p-1.5 text-ink-soft hover:bg-paper hover:text-primary"
                aria-label={`Edit ${elder.fullName}`}
              >
                <Pencil size={14} strokeWidth={2} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(elder._id, elder.fullName);
                }}
                className="rounded-md p-1.5 text-ink-soft hover:bg-rose-soft hover:text-rose"
                aria-label={`Delete ${elder.fullName}`}
              >
                <Trash2 size={14} strokeWidth={2} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}