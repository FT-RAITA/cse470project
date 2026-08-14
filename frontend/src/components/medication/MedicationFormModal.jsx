import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Button from "../Button";
import InputField from "../InputField";
import {
  createCareMedication,
  updateCareMedication,
} from "../../services/medicationService";

const FREQUENCIES = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Every morning",
  "Every night",
  "As needed",
];
const STATUSES = ["Active", "Paused", "Completed"];

const empty = {
  name: "",
  dosage: "",
  frequency: "Once daily",
  scheduledTimesText: "09:00",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
  instructions: "",
  quantityRemaining: 30,
  quantityUnit: "pills",
  lowStockThreshold: 5,
  status: "Active",
  notes: "",
};

function toForm(med) {
  if (!med) return empty;
  return {
    name: med.name || "",
    dosage: med.dosage || "",
    frequency: med.frequency || "Once daily",
    scheduledTimesText: (med.scheduledTimes || []).join(", ") || "09:00",
    startDate: med.startDate
      ? new Date(med.startDate).toISOString().slice(0, 10)
      : "",
    endDate: med.endDate
      ? new Date(med.endDate).toISOString().slice(0, 10)
      : "",
    instructions: med.instructions || "",
    quantityRemaining: med.quantityRemaining ?? 30,
    quantityUnit: med.quantityUnit || "pills",
    lowStockThreshold: med.lowStockThreshold ?? 5,
    status: med.status === "Stopped" ? "Completed" : med.status || "Active",
    notes: med.notes || "",
  };
}

export default function MedicationFormModal({
  elderId,
  token,
  medication,
  onClose,
  onSaved,
}) {
  const isEdit = !!medication;
  const [form, setForm] = useState(() => toForm(medication));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(toForm(medication));
  }, [medication]);

  const update = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((err) => ({ ...err, [name]: "" }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required.";
    if (!form.dosage.trim()) next.dosage = "Dosage is required.";
    if (!form.frequency.trim()) next.frequency = "Frequency is required.";
    if (Number(form.quantityRemaining) < 0)
      next.quantityRemaining = "Cannot be negative.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const scheduledTimes = form.scheduledTimesText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      name: form.name.trim(),
      dosage: form.dosage.trim(),
      frequency: form.frequency.trim(),
      scheduledTimes,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      instructions: form.instructions.trim(),
      quantityRemaining: Number(form.quantityRemaining),
      quantityUnit: form.quantityUnit.trim() || "pills",
      lowStockThreshold: Number(form.lowStockThreshold),
      status: form.status,
      notes: form.notes.trim(),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateCareMedication(elderId, medication._id, payload, token);
        toast.success("Medication updated");
      } else {
        await createCareMedication(elderId, payload, token);
        toast.success("Medication added");
      }
      onSaved?.();
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save medication");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-paper-card p-6 shadow-lg">
        <h3 className="font-display text-lg font-semibold text-ink">
          {isEdit ? "Edit medication" : "Add medication"}
        </h3>
        <p className="mt-1 text-sm text-ink-soft">
          Set dosage, schedule times, and inventory for this medicine.
        </p>

        <form onSubmit={submit} className="mt-4 space-y-3" noValidate>
          <InputField size="md" label="Medicine name" name="name" value={form.name} onChange={update} error={errors.name} required />
          <div className="grid grid-cols-2 gap-3">
            <InputField size="md" label="Dosage" name="dosage" value={form.dosage} onChange={update} error={errors.dosage} placeholder="e.g. 5mg" required />
            <InputField size="md" label="Frequency" name="frequency" as="select" options={FREQUENCIES} value={form.frequency} onChange={update} error={errors.frequency} required />
          </div>
          <InputField
            size="md"
            label="Scheduled times"
            name="scheduledTimesText"
            value={form.scheduledTimesText}
            onChange={update}
            placeholder="e.g. 08:00, 20:00"
            mono
          />
          <div className="grid grid-cols-2 gap-3">
            <InputField size="md" label="Start date" type="date" name="startDate" value={form.startDate} onChange={update} mono />
            <InputField size="md" label="End date" type="date" name="endDate" value={form.endDate} onChange={update} mono />
          </div>
          <InputField size="md" label="Special instructions" name="instructions" as="textarea" rows={2} value={form.instructions} onChange={update} />
          <div className="grid grid-cols-3 gap-3">
            <InputField size="md" label="Quantity" type="number" name="quantityRemaining" value={form.quantityRemaining} onChange={update} error={errors.quantityRemaining} />
            <InputField size="md" label="Unit" name="quantityUnit" value={form.quantityUnit} onChange={update} placeholder="pills" />
            <InputField size="md" label="Low-stock at" type="number" name="lowStockThreshold" value={form.lowStockThreshold} onChange={update} />
          </div>
          <InputField size="md" label="Status" name="status" as="select" options={STATUSES} value={form.status} onChange={update} />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="md" fullWidth={false} onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" size="md" fullWidth={false} loading={saving}>
              {isEdit ? "Save changes" : "Add medicine"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
