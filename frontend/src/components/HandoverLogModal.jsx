import { useState } from "react";
import { X, ClipboardList } from "lucide-react";
import toast from "react-hot-toast";
import Button from "./Button";
import { submitHandoverLog } from "../services/caregiverSwapRequestService";
import { useAuth } from "../context/AuthContext";

export default function HandoverLogModal({ request, onClose, onSubmitted }) {
  const { token } = useAuth();
  const [summary, setSummary] = useState(request.handoverLog?.summary || "");
  const [attentionNeeded, setAttentionNeeded] = useState(
    request.handoverLog?.attentionNeeded || ""
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!summary.trim()) {
      toast.error("Add a short summary of what was done.");
      return;
    }
    try {
      setSaving(true);
      const response = await submitHandoverLog(
        request._id,
        summary.trim(),
        attentionNeeded.trim(),
        token
      );
      toast.success("Handover log sent.");
      onSubmitted?.(response.data.request);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save handover log");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-paper-card p-6 shadow-lg">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-primary" />
            <h3 className="font-display text-lg font-semibold text-ink">
              Shift handover log
            </h3>
          </div>
          <button onClick={onClose} className="text-ink-soft hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <p className="mb-4 text-xs text-ink-soft">
          {request.receiver?.name || "The caregiver"} is now covering your elders
          for Slot {request.requesterSlotIndex + 1}. Leave a quick note.
        </p>

        <label className="mb-1 block text-xs font-semibold text-ink">
          What was done
        </label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
          placeholder="e.g. Gave morning meds at 8am, breakfast eaten fully, short walk done."
          className="mb-3 w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
        />

        <label className="mb-1 block text-xs font-semibold text-ink">
          Needs special attention
        </label>
        <textarea
          value={attentionNeeded}
          onChange={(e) => setAttentionNeeded(e.target.value)}
          rows={3}
          placeholder="e.g. Mood was low this morning, watch for dizziness after the new dosage."
          className="mb-5 w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
        />

        <div className="flex justify-end gap-3">
          <Button variant="ghost" size="md" fullWidth={false} onClick={onClose}>
            Cancel
          </Button>
          <Button size="md" fullWidth={false} onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving…" : "Save handover log"}
          </Button>
        </div>
      </div>
    </div>
  );
}