import { useState } from "react";
import { FilePlus2, Pill, AlertTriangle, Upload } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../Button";
import InputField from "../InputField";
import {
  createMedicalRecord,
  createMedication,
  uploadReport,
} from "../../services/elderRecordsService";

const ACTIONS = [
  { key: "record", label: "Add Medical Record", icon: FilePlus2, tone: "bg-primary/10 text-primary" },
  { key: "medication", label: "Update Medication", icon: Pill, tone: "bg-emerald-100 text-emerald-800" },
  { key: "allergy", label: "Add Allergy", icon: AlertTriangle, tone: "bg-rose-soft text-rose" },
  { key: "report", label: "Upload Report", icon: Upload, tone: "bg-accent-soft text-primary-dark" },
];

const emptyRecord = {
  category: "General",
  title: "",
  description: "",
  status: "Logged",
  bpSystolic: "",
  bpDiastolic: "",
  weight: "",
  recordedAt: new Date().toISOString().slice(0, 10),
};

const emptyAllergy = {
  allergen: "",
  allergyType: "Drug",
  severity: "Moderate",
  reaction: "",
  notes: "",
  status: "Active",
  recordedAt: new Date().toISOString().slice(0, 10),
};

export default function QuickActions({ elderId, token, onDone }) {
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [recordForm, setRecordForm] = useState(emptyRecord);
  const [allergyForm, setAllergyForm] = useState(emptyAllergy);
  const [medForm, setMedForm] = useState({
    name: "",
    dosage: "",
    frequency: "",
    notes: "",
  });
  const [reportForm, setReportForm] = useState({
    title: "",
    reportType: "Prescription",
    file: null,
  });

  const open = (key) => {
    if (key === "record") {
      setRecordForm(emptyRecord);
      setModal("record");
    } else if (key === "allergy") {
      setAllergyForm(emptyAllergy);
      setModal("allergy");
    } else {
      setModal(key);
    }
  };

  const submitRecord = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const needsStatus = recordForm.category === "Diagnosis";
      await createMedicalRecord(
        elderId,
        {
          ...recordForm,
          status: needsStatus
            ? recordForm.status === "Logged"
              ? "Active"
              : recordForm.status
            : "Logged",
        },
        token
      );
      toast.success("Medical record added");
      setModal(null);
      onDone?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save record");
    } finally {
      setSaving(false);
    }
  };

  const submitAllergy = async (e) => {
    e.preventDefault();
    if (!allergyForm.allergen.trim()) {
      toast.error("Please enter the allergen");
      return;
    }
    setSaving(true);
    try {
      const lines = [
        `Type: ${allergyForm.allergyType}`,
        `Severity: ${allergyForm.severity}`,
        allergyForm.reaction.trim() ? `Reaction: ${allergyForm.reaction.trim()}` : null,
        allergyForm.notes.trim() ? `Notes: ${allergyForm.notes.trim()}` : null,
      ].filter(Boolean);

      await createMedicalRecord(
        elderId,
        {
          category: "Allergy",
          title: allergyForm.allergen.trim(),
          description: lines.join("\n"),
          status: allergyForm.status,
          recordedAt: allergyForm.recordedAt,
        },
        token
      );
      toast.success("Allergy recorded");
      setModal(null);
      onDone?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save allergy");
    } finally {
      setSaving(false);
    }
  };

  const submitMed = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createMedication(elderId, medForm, token);
      toast.success("Medication added");
      setMedForm({ name: "", dosage: "", frequency: "", notes: "" });
      setModal(null);
      onDone?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save medication");
    } finally {
      setSaving(false);
    }
  };

  const submitReport = async (e) => {
    e.preventDefault();
    if (!reportForm.file) {
      toast.error("Please choose a file");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("file", reportForm.file);
      fd.append("title", reportForm.title);
      fd.append("reportType", reportForm.reportType);
      await uploadReport(elderId, fd, token);
      toast.success("Report uploaded");
      setReportForm({ title: "", reportType: "Prescription", file: null });
      setModal(null);
      onDone?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setSaving(false);
    }
  };

  const updateRecord = (e) =>
    setRecordForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const updateAllergy = (e) =>
    setAllergyForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const showVitals = recordForm.category === "Vitals" || recordForm.category === "Checkup";

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {ACTIONS.map(({ key, label, icon: Icon, tone }) => (
          <button
            key={key}
            type="button"
            onClick={() => open(key)}
            className="group flex flex-col items-start gap-3 rounded-xl border border-border bg-paper-card p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className={`rounded-lg p-2.5 ${tone}`}>
              <Icon size={18} strokeWidth={2} />
            </span>
            <span className="text-sm font-semibold text-ink group-hover:text-primary">
              + {label}
            </span>
          </button>
        ))}
      </div>

      {modal === "record" && (
        <Modal title="Add medical record" onClose={() => setModal(null)}>
          <form onSubmit={submitRecord} className="space-y-3">
            <InputField
              size="md"
              label="Category"
              name="category"
              as="select"
              options={["Vitals", "Diagnosis", "Checkup", "Medication", "General"]}
              value={recordForm.category}
              onChange={updateRecord}
              required
            />
            <InputField
              size="md"
              label="Title"
              name="title"
              value={recordForm.title}
              onChange={updateRecord}
              placeholder={
                recordForm.category === "Diagnosis"
                  ? "e.g. Type 2 Diabetes"
                  : "e.g. Morning checkup"
              }
              required
            />
            <InputField
              size="md"
              label="Description"
              name="description"
              as="textarea"
              rows={2}
              value={recordForm.description}
              onChange={updateRecord}
            />
            {(recordForm.category === "Diagnosis") && (
              <InputField
                size="md"
                label="Status"
                name="status"
                as="select"
                options={["Active", "Monitoring", "Critical", "Resolved"]}
                value={recordForm.status === "Logged" ? "Active" : recordForm.status}
                onChange={updateRecord}
              />
            )}
            {showVitals && (
              <div className="space-y-3 rounded-xl border border-border bg-paper p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Vitals
                </p>
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-ink-soft">Blood pressure (mmHg)</p>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                    <InputField
                      size="md"
                      label="Systolic"
                      name="bpSystolic"
                      type="number"
                      value={recordForm.bpSystolic}
                      onChange={updateRecord}
                      placeholder="120"
                      mono
                    />
                    <span className="pb-3 text-lg font-semibold text-ink-soft">/</span>
                    <InputField
                      size="md"
                      label="Diastolic"
                      name="bpDiastolic"
                      type="number"
                      value={recordForm.bpDiastolic}
                      onChange={updateRecord}
                      placeholder="80"
                      mono
                    />
                  </div>
                </div>
                <InputField
                  size="md"
                  label="Weight (kg)"
                  name="weight"
                  type="number"
                  value={recordForm.weight}
                  onChange={updateRecord}
                  placeholder="e.g. 68"
                  mono
                />
              </div>
            )}
            <InputField
              size="md"
              label="Date"
              name="recordedAt"
              type="date"
              value={recordForm.recordedAt}
              onChange={updateRecord}
              mono
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="md" fullWidth={false} onClick={() => setModal(null)}>
                Cancel
              </Button>
              <Button type="submit" size="md" fullWidth={false} loading={saving}>
                Save
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {modal === "allergy" && (
        <Modal title="Record allergy" onClose={() => setModal(null)}>
          <form onSubmit={submitAllergy} className="space-y-4">
            <InputField
              size="md"
              label="Allergen"
              name="allergen"
              value={allergyForm.allergen}
              onChange={updateAllergy}
              placeholder="e.g. Penicillin, peanuts, dust"
              required
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InputField
                size="md"
                label="Allergy type"
                name="allergyType"
                as="select"
                options={["Drug", "Food", "Environmental", "Other"]}
                value={allergyForm.allergyType}
                onChange={updateAllergy}
              />
              <InputField
                size="md"
                label="Severity"
                name="severity"
                as="select"
                options={["Mild", "Moderate", "Severe"]}
                value={allergyForm.severity}
                onChange={updateAllergy}
              />
            </div>
            <InputField
              size="md"
              label="Typical reaction"
              name="reaction"
              as="textarea"
              rows={2}
              value={allergyForm.reaction}
              onChange={updateAllergy}
              placeholder="e.g. Rash, swelling, breathing difficulty"
            />
            <InputField
              size="md"
              label="Extra notes"
              name="notes"
              as="textarea"
              rows={2}
              value={allergyForm.notes}
              onChange={updateAllergy}
              placeholder="Optional: when it was noticed, doctor advice, etc."
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InputField
                size="md"
                label="Status"
                name="status"
                as="select"
                options={["Active", "Resolved"]}
                value={allergyForm.status}
                onChange={updateAllergy}
              />
              <InputField
                size="md"
                label="Date noted"
                name="recordedAt"
                type="date"
                value={allergyForm.recordedAt}
                onChange={updateAllergy}
                mono
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" size="md" fullWidth={false} onClick={() => setModal(null)}>
                Cancel
              </Button>
              <Button type="submit" size="md" fullWidth={false} loading={saving}>
                Save allergy
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {modal === "medication" && (
        <Modal title="Update medication" onClose={() => setModal(null)}>
          <form onSubmit={submitMed} className="space-y-3">
            <InputField
              size="md"
              label="Medicine name"
              name="name"
              value={medForm.name}
              onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
              required
            />
            <InputField
              size="md"
              label="Dosage"
              name="dosage"
              value={medForm.dosage}
              onChange={(e) => setMedForm({ ...medForm, dosage: e.target.value })}
              placeholder="e.g. 5mg"
              required
            />
            <InputField
              size="md"
              label="Frequency"
              name="frequency"
              value={medForm.frequency}
              onChange={(e) => setMedForm({ ...medForm, frequency: e.target.value })}
              placeholder="e.g. Twice daily"
              required
            />
            <InputField
              size="md"
              label="Notes"
              name="notes"
              as="textarea"
              rows={2}
              value={medForm.notes}
              onChange={(e) => setMedForm({ ...medForm, notes: e.target.value })}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="md" fullWidth={false} onClick={() => setModal(null)}>
                Cancel
              </Button>
              <Button type="submit" size="md" fullWidth={false} loading={saving}>
                Save
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {modal === "report" && (
        <Modal title="Upload medical report" onClose={() => setModal(null)}>
          <form onSubmit={submitReport} className="space-y-3">
            <InputField
              size="md"
              label="Title"
              name="title"
              value={reportForm.title}
              onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
              required
            />
            <InputField
              size="md"
              label="Report type"
              name="reportType"
              as="select"
              options={["Prescription", "Blood Report", "ECG", "X-Ray", "PDF"]}
              value={reportForm.reportType}
              onChange={(e) => setReportForm({ ...reportForm, reportType: e.target.value })}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                File (PDF / image)
              </label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) =>
                  setReportForm({ ...reportForm, file: e.target.files?.[0] || null })
                }
                className="rounded-lg border border-border bg-paper-card px-3 py-2.5 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="md" fullWidth={false} onClick={() => setModal(null)}>
                Cancel
              </Button>
              <Button type="submit" size="md" fullWidth={false} loading={saving}>
                Upload
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-paper-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
          <button type="button" onClick={onClose} className="text-sm text-ink-soft hover:text-ink">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
