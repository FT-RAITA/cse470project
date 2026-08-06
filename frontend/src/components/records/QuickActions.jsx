import { useState } from "react";
import {
  FilePlus2,
  Pill,
  Stethoscope,
  AlertTriangle,
  Upload,
} from "lucide-react";
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
  { key: "diagnosis", label: "Add Diagnosis", icon: Stethoscope, tone: "bg-sky-100 text-sky-800" },
  { key: "allergy", label: "Add Allergy", icon: AlertTriangle, tone: "bg-rose-soft text-rose" },
  { key: "report", label: "Upload Report", icon: Upload, tone: "bg-accent-soft text-primary-dark" },
];

const emptyRecord = {
  category: "General",
  title: "",
  description: "",
  status: "Active",
  bpSystolic: "",
  bpDiastolic: "",
  weight: "",
  recordedAt: new Date().toISOString().slice(0, 10),
};

export default function QuickActions({ elderId, token, onDone }) {
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [recordForm, setRecordForm] = useState(emptyRecord);
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
    if (key === "diagnosis") {
      setRecordForm({ ...emptyRecord, category: "Diagnosis" });
      setModal("record");
    } else if (key === "allergy") {
      setRecordForm({ ...emptyRecord, category: "Allergy" });
      setModal("record");
    } else if (key === "record") {
      setRecordForm(emptyRecord);
      setModal("record");
    } else {
      setModal(key);
    }
  };

  const submitRecord = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createMedicalRecord(elderId, recordForm, token);
      toast.success("Medical record added");
      setModal(null);
      onDone?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save record");
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

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
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
              options={["Vitals", "Diagnosis", "Allergy", "Checkup", "Medication", "General"]}
              value={recordForm.category}
              onChange={updateRecord}
              required
            />
            <InputField size="md" label="Title" name="title" value={recordForm.title} onChange={updateRecord} required />
            <InputField size="md" label="Description" name="description" as="textarea" rows={2} value={recordForm.description} onChange={updateRecord} />
            <InputField
              size="md"
              label="Status"
              name="status"
              as="select"
              options={["Active", "Resolved", "Monitoring", "Critical"]}
              value={recordForm.status}
              onChange={updateRecord}
            />
            <div className="grid grid-cols-3 gap-3">
              <InputField size="md" label="BP systolic" name="bpSystolic" type="number" value={recordForm.bpSystolic} onChange={updateRecord} mono />
              <InputField size="md" label="BP diastolic" name="bpDiastolic" type="number" value={recordForm.bpDiastolic} onChange={updateRecord} mono />
              <InputField size="md" label="Weight (kg)" name="weight" type="number" value={recordForm.weight} onChange={updateRecord} mono />
            </div>
            <InputField size="md" label="Date" name="recordedAt" type="date" value={recordForm.recordedAt} onChange={updateRecord} mono />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="md" fullWidth={false} onClick={() => setModal(null)}>Cancel</Button>
              <Button type="submit" size="md" fullWidth={false} loading={saving}>Save</Button>
            </div>
          </form>
        </Modal>
      )}

      {modal === "medication" && (
        <Modal title="Update medication" onClose={() => setModal(null)}>
          <form onSubmit={submitMed} className="space-y-3">
            <InputField size="md" label="Medicine name" name="name" value={medForm.name} onChange={(e) => setMedForm({ ...medForm, name: e.target.value })} required />
            <InputField size="md" label="Dosage" name="dosage" value={medForm.dosage} onChange={(e) => setMedForm({ ...medForm, dosage: e.target.value })} placeholder="e.g. 5mg" required />
            <InputField size="md" label="Frequency" name="frequency" value={medForm.frequency} onChange={(e) => setMedForm({ ...medForm, frequency: e.target.value })} placeholder="e.g. Twice daily" required />
            <InputField size="md" label="Notes" name="notes" as="textarea" rows={2} value={medForm.notes} onChange={(e) => setMedForm({ ...medForm, notes: e.target.value })} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="md" fullWidth={false} onClick={() => setModal(null)}>Cancel</Button>
              <Button type="submit" size="md" fullWidth={false} loading={saving}>Save</Button>
            </div>
          </form>
        </Modal>
      )}

      {modal === "report" && (
        <Modal title="Upload medical report" onClose={() => setModal(null)}>
          <form onSubmit={submitReport} className="space-y-3">
            <InputField size="md" label="Title" name="title" value={reportForm.title} onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })} required />
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
              <Button variant="ghost" size="md" fullWidth={false} onClick={() => setModal(null)}>Cancel</Button>
              <Button type="submit" size="md" fullWidth={false} loading={saving}>Upload</Button>
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
