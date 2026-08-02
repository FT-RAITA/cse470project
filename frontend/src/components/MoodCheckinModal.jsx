import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { X, Smile, History, Trash2 } from "lucide-react";
import InputField from "./InputField";
import Button from "./Button";
import { useAuth } from "../context/AuthContext";
import {
  createMoodCheckin,
  getMoodCheckins,
  deleteMoodCheckin,
} from "../services/moodCheckinService";

const MOOD_OPTIONS = ["Great", "Good", "Okay", "Low", "Very Low"];
const PHYSICAL_OPTIONS = ["Excellent", "Good", "Fair", "Poor"];
const ENERGY_OPTIONS = ["High", "Moderate", "Low", "Very Low"];
const APPETITE_OPTIONS = ["Normal", "Increased", "Decreased", "None"];

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  overallMood: "",
  physicalCondition: "",
  energyLevel: "",
  appetite: "",
  issues: "",
  notes: "",
};

function formatDateTime(d) {
  return new Date(d).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MoodCheckinModal({ elder, onClose }) {
  const { token } = useAuth();
  const [tab, setTab] = useState("new"); // "new" | "history"
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (tab === "history") fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await getMoodCheckins(elder._id, token);
      setHistory(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load check-in history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.overallMood || !form.physicalCondition || !form.energyLevel || !form.appetite) {
      toast.error("Please fill in mood, physical condition, energy, and appetite.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        issues: form.issues
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean),
      };
      await createMoodCheckin(elder._id, payload, token);
      toast.success(`Check-in logged for ${elder.fullName}`);
      setForm(emptyForm);
      setTab("history");
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save check-in");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMoodCheckin(id, token);
      setHistory((prev) => prev.filter((c) => c._id !== id));
      toast.success("Check-in removed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not remove check-in");
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-paper-card shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Smile size={16} strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-ink">
                Mood check-in
              </h3>
              <p className="text-xs text-ink-soft">{elder.fullName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-ink-soft hover:bg-paper hover:text-ink"
            aria-label="Close"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border px-6 pt-3">
          <button
            onClick={() => setTab("new")}
            className={`rounded-t-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              tab === "new"
                ? "border-b-2 border-primary text-primary"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            New check-in
          </button>
          <button
            onClick={() => setTab("history")}
            className={`flex items-center gap-1.5 rounded-t-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              tab === "history"
                ? "border-b-2 border-primary text-primary"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <History size={13} strokeWidth={2} />
            History
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "new" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <InputField
                size="md"
                label="Date"
                name="date"
                type="date"
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputField
                  size="md"
                  label="Overall Mood"
                  name="overallMood"
                  as="select"
                  required
                  options={MOOD_OPTIONS}
                  value={form.overallMood}
                  onChange={(e) => update("overallMood", e.target.value)}
                />
                <InputField
                  size="md"
                  label="Physical Condition"
                  name="physicalCondition"
                  as="select"
                  required
                  options={PHYSICAL_OPTIONS}
                  value={form.physicalCondition}
                  onChange={(e) => update("physicalCondition", e.target.value)}
                />
                <InputField
                  size="md"
                  label="Energy Level"
                  name="energyLevel"
                  as="select"
                  required
                  options={ENERGY_OPTIONS}
                  value={form.energyLevel}
                  onChange={(e) => update("energyLevel", e.target.value)}
                />
                <InputField
                  size="md"
                  label="Appetite"
                  name="appetite"
                  as="select"
                  required
                  options={APPETITE_OPTIONS}
                  value={form.appetite}
                  onChange={(e) => update("appetite", e.target.value)}
                />
              </div>
              <InputField
                size="md"
                label="Issues"
                name="issues"
                value={form.issues}
                onChange={(e) => update("issues", e.target.value)}
                placeholder="Separate with commas — e.g. Coughing, Trouble sleeping"
              />
              <InputField
                size="md"
                label="Notes"
                name="notes"
                as="textarea"
                rows={3}
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Anything else worth remembering about today"
              />
              <div className="flex justify-end pt-1">
                <Button type="submit" loading={saving} size="md" fullWidth={false}>
                  Save check-in
                </Button>
              </div>
            </form>
          ) : loadingHistory ? (
            <div className="flex justify-center py-10">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : history.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-soft">
              No check-ins logged yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {history.map((c) => (
                <li key={c._id} className="rounded-lg border border-border bg-paper p-4">
                  <div className="flex items-start justify-between">
                    <p className="font-mono text-xs text-ink-soft">
                      {formatDateTime(c.date)}
                    </p>
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="rounded-md p-1 text-ink-soft hover:bg-rose-soft hover:text-rose"
                      aria-label="Delete check-in"
                    >
                      <Trash2 size={13} strokeWidth={2} />
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge label="Mood" value={c.overallMood} />
                    <Badge label="Physical" value={c.physicalCondition} />
                    <Badge label="Energy" value={c.energyLevel} />
                    <Badge label="Appetite" value={c.appetite} />
                  </div>
                  {c.issues?.length > 0 && (
                    <p className="mt-2 text-xs text-rose">
                      Issues: {c.issues.join(", ")}
                    </p>
                  )}
                  {c.notes && <p className="mt-1.5 text-sm text-ink-soft">{c.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Badge({ label, value }) {
  return (
    <span className="rounded-full border border-border bg-paper-card px-2.5 py-1 text-[11px] font-medium text-ink-soft">
      {label}: <span className="font-semibold text-ink">{value}</span>
    </span>
  );
}