import { useState } from "react";
import { Plus, X, User, Stethoscope, Users as UsersIcon, Apple } from "lucide-react";
import InputField from "./InputField";
import Button from "./Button";

const emptyMedical = { condition: "", diagnosisDate: "", notes: "" };
const emptyContact = { name: "", relation: "", phone: "" };

const initialState = (elder) => ({
  fullName: elder?.fullName || "",
  age: elder?.age ?? "",
  dateOfBirth: elder?.dateOfBirth ? elder.dateOfBirth.slice(0, 10) : "",
  gender: elder?.gender || "",
  bloodGroup: elder?.bloodGroup || "",
  phone: elder?.phone || "",
  address: elder?.address || "",
  allergies: elder?.allergies?.join(", ") || "",
  chronicDiseases: elder?.chronicDiseases?.join(", ") || "",
  medicalHistory: elder?.medicalHistory?.length
    ? elder.medicalHistory.map((m) => ({
        condition: m.condition || "",
        diagnosisDate: m.diagnosisDate ? m.diagnosisDate.slice(0, 10) : "",
        notes: m.notes || "",
      }))
    : [],
  emergencyContacts: elder?.emergencyContacts?.length
    ? elder.emergencyContacts
    : [{ ...emptyContact }],
  dietType: elder?.nutritionPlan?.dietType || "",
  calorieGoal: elder?.nutritionPlan?.calorieGoal ?? "",
  waterGoal: elder?.nutritionPlan?.waterGoal ?? "",
  proteinGoal: elder?.nutritionPlan?.proteinGoal ?? "",
  restrictions: elder?.nutritionPlan?.restrictions?.join(", ") || "",
  supplements: elder?.nutritionPlan?.supplements?.join(", ") || "",
});

export default function ElderForm({ elder, onSubmit, submitLabel = "Save" }) {
  const [form, setForm] = useState(initialState(elder));
  const [saving, setSaving] = useState(false);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const updateListItem = (listKey, index, field, value) => {
    setForm((f) => {
      const list = [...f[listKey]];
      list[index] = { ...list[index], [field]: value };
      return { ...f, [listKey]: list };
    });
  };

  const addListItem = (listKey, empty) =>
    setForm((f) => ({ ...f, [listKey]: [...f[listKey], { ...empty }] }));

  const removeListItem = (listKey, index) =>
    setForm((f) => ({
      ...f,
      [listKey]: f[listKey].filter((_, i) => i !== index),
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const hasNutritionPlan =
        form.dietType ||
        form.calorieGoal ||
        form.waterGoal ||
        form.proteinGoal ||
        form.restrictions.trim() ||
        form.supplements.trim();

      const payload = {
        fullName: form.fullName,
        age: form.age ? Number(form.age) : undefined,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        bloodGroup: form.bloodGroup,
        phone: form.phone,
        address: form.address,
        allergies: form.allergies
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        chronicDiseases: form.chronicDiseases
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        medicalHistory: form.medicalHistory.filter((m) => m.condition.trim()),
        emergencyContacts: form.emergencyContacts.filter(
          (c) => c.name.trim() && c.phone.trim()
        ),
        nutritionPlan: hasNutritionPlan
          ? {
              dietType: form.dietType || undefined,
              calorieGoal: form.calorieGoal ? Number(form.calorieGoal) : undefined,
              waterGoal: form.waterGoal ? Number(form.waterGoal) : undefined,
              proteinGoal: form.proteinGoal ? Number(form.proteinGoal) : undefined,
              restrictions: form.restrictions
                .split(",")
                .map((r) => r.trim())
                .filter(Boolean),
              supplements: form.supplements
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            }
          : undefined,
      };
      await onSubmit(payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal information */}
      <Section icon={User} title="Personal Information">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField
            size="md"
            label="Full Name"
            name="fullName"
            required
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            placeholder="e.g. Rehana Begum"
          />
          <InputField
            size="md"
            label="Age"
            name="age"
            type="number"
            value={form.age}
            onChange={(e) => update("age", e.target.value)}
            placeholder="e.g. 72"
          />
          <InputField
            size="md"
            label="Date of Birth"
            name="dateOfBirth"
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => update("dateOfBirth", e.target.value)}
          />
          <InputField
            size="md"
            label="Gender"
            name="gender"
            as="select"
            options={["Male", "Female", "Other"]}
            value={form.gender}
            onChange={(e) => update("gender", e.target.value)}
          />
          <InputField
            size="md"
            label="Blood Group"
            name="bloodGroup"
            as="select"
            mono
            options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]}
            value={form.bloodGroup}
            onChange={(e) => update("bloodGroup", e.target.value)}
          />
          <InputField
            size="md"
            label="Phone"
            name="phone"
            mono
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="e.g. 01711 000000"
          />
          <div className="sm:col-span-2">
            <InputField
              size="md"
              label="Address"
              name="address"
              as="textarea"
              rows={2}
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="Street, area, city"
            />
          </div>
        </div>
      </Section>

      {/* Medical details */}
      <Section icon={Stethoscope} title="Medical Details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField
            size="md"
            label="Allergies"
            name="allergies"
            value={form.allergies}
            onChange={(e) => update("allergies", e.target.value)}
            placeholder="Separate with commas — e.g. Penicillin, Dust"
          />
          <InputField
            size="md"
            label="Chronic Diseases"
            name="chronicDiseases"
            value={form.chronicDiseases}
            onChange={(e) => update("chronicDiseases", e.target.value)}
            placeholder="e.g. Diabetes, Hypertension"
          />
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">
            Medical History
          </p>
          <div className="space-y-3">
            {form.medicalHistory.map((entry, i) => (
              <div
                key={i}
                className="grid grid-cols-1 gap-3 rounded-lg bg-paper p-4 sm:grid-cols-[1.5fr_1fr_1.5fr_auto]"
              >
                <InputField
                  size="md"
                  name={`condition-${i}`}
                  placeholder="Condition"
                  value={entry.condition}
                  onChange={(e) =>
                    updateListItem("medicalHistory", i, "condition", e.target.value)
                  }
                />
                <InputField
                  size="md"
                  name={`diagnosisDate-${i}`}
                  type="date"
                  value={entry.diagnosisDate}
                  onChange={(e) =>
                    updateListItem("medicalHistory", i, "diagnosisDate", e.target.value)
                  }
                />
                <InputField
                  size="md"
                  name={`notes-${i}`}
                  placeholder="Notes"
                  value={entry.notes}
                  onChange={(e) =>
                    updateListItem("medicalHistory", i, "notes", e.target.value)
                  }
                />
                <button
                  type="button"
                  onClick={() => removeListItem("medicalHistory", i)}
                  className="flex h-9 w-9 items-center justify-center self-center rounded-md text-ink-soft hover:bg-rose-soft hover:text-rose"
                  aria-label="Remove entry"
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => addListItem("medicalHistory", emptyMedical)}
            className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark"
          >
            <Plus size={14} strokeWidth={2.5} />
            Add medical history entry
          </button>
        </div>
      </Section>

      {/* Nutrition plan */}
      <Section icon={Apple} title="Nutrition Plan">
        <p className="mb-4 text-xs text-ink-soft">
          Optional — leave blank if there's no specific plan yet.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField
            size="md"
            label="Diet Type"
            name="dietType"
            value={form.dietType}
            onChange={(e) => update("dietType", e.target.value)}
            placeholder="e.g. Low-sodium, Diabetic-friendly"
          />
          <InputField
            size="md"
            label="Calorie Goal"
            name="calorieGoal"
            type="number"
            mono
            value={form.calorieGoal}
            onChange={(e) => update("calorieGoal", e.target.value)}
            placeholder="e.g. 1800 kcal/day"
          />
          <InputField
            size="md"
            label="Water Goal (ml)"
            name="waterGoal"
            type="number"
            mono
            value={form.waterGoal}
            onChange={(e) => update("waterGoal", e.target.value)}
            placeholder="e.g. 2000"
          />
          <InputField
            size="md"
            label="Protein Goal (g)"
            name="proteinGoal"
            type="number"
            mono
            value={form.proteinGoal}
            onChange={(e) => update("proteinGoal", e.target.value)}
            placeholder="e.g. 60"
          />
          <InputField
            size="md"
            label="Restrictions"
            name="restrictions"
            value={form.restrictions}
            onChange={(e) => update("restrictions", e.target.value)}
            placeholder="Separate with commas — e.g. No sugar, Low salt"
          />
          <InputField
            size="md"
            label="Supplements"
            name="supplements"
            value={form.supplements}
            onChange={(e) => update("supplements", e.target.value)}
            placeholder="e.g. Vitamin D, Calcium"
          />
        </div>
      </Section>

      {/* Emergency contacts */}
      <Section icon={UsersIcon} title="Emergency Contacts">
        <div className="space-y-3">
          {form.emergencyContacts.map((contact, i) => (
            <div
              key={i}
              className="grid grid-cols-1 gap-3 rounded-lg bg-paper p-4 sm:grid-cols-[1.2fr_1fr_1.2fr_auto]"
            >
              <InputField
                size="md"
                name={`contactName-${i}`}
                placeholder="Name"
                value={contact.name}
                onChange={(e) =>
                  updateListItem("emergencyContacts", i, "name", e.target.value)
                }
              />
              <InputField
                size="md"
                name={`contactRelation-${i}`}
                placeholder="Relation"
                value={contact.relation}
                onChange={(e) =>
                  updateListItem("emergencyContacts", i, "relation", e.target.value)
                }
              />
              <InputField
                size="md"
                name={`contactPhone-${i}`}
                mono
                placeholder="Phone"
                value={contact.phone}
                onChange={(e) =>
                  updateListItem("emergencyContacts", i, "phone", e.target.value)
                }
              />
              {form.emergencyContacts.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeListItem("emergencyContacts", i)}
                  className="flex h-9 w-9 items-center justify-center self-center rounded-md text-ink-soft hover:bg-rose-soft hover:text-rose"
                  aria-label="Remove contact"
                >
                  <X size={16} strokeWidth={2} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => addListItem("emergencyContacts", emptyContact)}
          className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark"
        >
          <Plus size={14} strokeWidth={2.5} />
          Add another contact
        </button>
      </Section>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={saving} size="md" fullWidth={false}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="rounded-xl border border-border bg-paper-card p-6">
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon size={16} strokeWidth={2} />
        </div>
        <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      </div>
      {children}
    </div>
  );
}
