import { useEffect, useMemo, useState } from "react";
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

const empty = {
  name: "",
  dosage: "",
  frequency: "Once daily",
  scheduledTimesText: "09:00",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
  extendEndDate: "",
  instructions: "",
  quantityRemaining: 30,
  quantityUnit: "pills",
  lowStockThreshold: 5,
  notes: "",
};

function toDateInput(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function toForm(med) {
  if (!med) return empty;
  return {
    name: med.name || "",
    dosage: med.dosage || "",
    frequency: med.frequency || "Once daily",
    scheduledTimesText: (med.scheduledTimes || []).join(", ") || "09:00",
    startDate: toDateInput(med.startDate),
    endDate: toDateInput(med.endDate),
    extendEndDate: "",
    instructions: med.instructions || "",
    quantityRemaining: med.quantityRemaining ?? 30,
    quantityUnit: med.quantityUnit || "pills",
    lowStockThreshold: med.lowStockThreshold ?? 5,
    notes: med.notes || "",
  };
}

function formatDisplayDate(value) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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

  const minExtendDate = useMemo(() => {
    if (!isEdit) return "";
    if (form.endDate) return addDays(form.endDate, 1);
    const today = new Date().toISOString().slice(0, 10);
    if (form.startDate && form.startDate > today) return form.startDate;
    return today;
  }, [isEdit, form.endDate, form.startDate]);

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
    if (Number(form.quantityRemaining) < 0) {
      next.quantityRemaining = "Cannot be negative.";
    }
    if (!isEdit) {
      if (!form.startDate) next.startDate = "Start date is required.";
      if (form.endDate && form.startDate && form.endDate < form.startDate) {
        next.endDate = "End date must be on or after start date.";
      }
    } else if (form.extendEndDate) {
      if (minExtendDate && form.extendEndDate < minExtendDate) {
        next.extendEndDate = "Invalid end date.";
      }
    }
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

    setSaving(true);
    try {
      if (isEdit) {
        const payload = {
          name: form.name.trim(),
          dosage: form.dosage.trim(),
          frequency: form.frequency.trim(),
          scheduledTimes,
          instructions: form.instructions.trim(),
          quantityRemaining: Number(form.quantityRemaining),
          quantityUnit: form.quantityUnit.trim() || "pills",
          lowStockThreshold: Number(form.lowStockThreshold),
          notes: form.notes.trim(),
        };
        if (form.extendEndDate) {
          payload.endDate = form.extendEndDate;
        }
        await updateCareMedication(elderId, medication._id, payload, token);
        toast.success(
          form.extendEndDate ? "Medication updated and end date extended" : "Medication updated"
        );
      } else {
        await createCareMedication(
          elderId,
          {
            name: form.name.trim(),
            dosage: form.dosage.trim(),
            frequency: form.frequency.trim(),
            scheduledTimes,
            startDate: form.startDate,
            endDate: form.endDate || null,
            instructions: form.instructions.trim(),
            quantityRemaining: Number(form.quantityRemaining),
            quantityUnit: form.quantityUnit.trim() || "pills",
            lowStockThreshold: Number(form.lowStockThreshold),
            status: "Active",
            notes: form.notes.trim(),
          },
          token
        );
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

        <form onSubmit={submit} className="mt-4 space-y-3" noValidate>
          <InputField
            size="md"
            label="Medicine name"
            name="name"
            value={form.name}
            onChange={update}
            error={errors.name}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <InputField
              size="md"
              label="Dosage"
              name="dosage"
              value={form.dosage}
              onChange={update}
              error={errors.dosage}
              placeholder="e.g. 5mg"
              required
            />
            <InputField
              size="md"
              label="Frequency"
              name="frequency"
              as="select"
              options={FREQUENCIES}
              value={form.frequency}
              onChange={update}
              error={errors.frequency}
              required
            />
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

          {!isEdit ? (
            <div className="grid grid-cols-2 gap-3">
              <InputField
                size="md"
                label="Start date"
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={update}
                error={errors.startDate}
                mono
                required
              />
              <InputField
                size="md"
                label="End date"
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={update}
                error={errors.endDate}
                mono
              />
            </div>
          ) : (
            <div className="space-y-3 rounded-xl border border-border bg-paper p-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Start date
                  </p>
                  <p className="mt-1 font-medium text-ink">
                    {formatDisplayDate(medication.startDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Current end date
                  </p>
                  <p className="mt-1 font-medium text-ink">
                    {formatDisplayDate(medication.endDate)}
                  </p>
                </div>
              </div>
              <InputField
                size="md"
                label="Extend end date"
                type="date"
                name="extendEndDate"
                value={form.extendEndDate}
                onChange={update}
                error={errors.extendEndDate}
                mono
              />
            </div>
          )}

          <InputField
            size="md"
            label="Special instructions"
            name="instructions"
            as="textarea"
            rows={2}
            value={form.instructions}
            onChange={update}
          />
          <div className="grid grid-cols-3 gap-3">
            <InputField
              size="md"
              label="Quantity"
              type="number"
              name="quantityRemaining"
              value={form.quantityRemaining}
              onChange={update}
              error={errors.quantityRemaining}
            />
            <InputField
              size="md"
              label="Unit"
              name="quantityUnit"
              value={form.quantityUnit}
              onChange={update}
              placeholder="pills"
            />
            <InputField
              size="md"
              label="Low-stock at"
              type="number"
              name="lowStockThreshold"
              value={form.lowStockThreshold}
              onChange={update}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="md"
              fullWidth={false}
              onClick={onClose}
              disabled={saving}
            >
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
