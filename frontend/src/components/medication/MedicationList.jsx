import { useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Trash2, Package } from "lucide-react";
import Button from "../Button";
import InputField from "../InputField";
import {
  deleteCareMedication,
  updateInventory,
} from "../../services/medicationService";

const statusStyle = {
  Active: "bg-emerald-100 text-emerald-800",
  Paused: "bg-accent-soft text-primary-dark",
  Completed: "bg-sky-100 text-sky-800",
  Stopped: "bg-paper text-ink-soft border border-border",
};

export default function MedicationList({
  medications = [],
  elderId,
  token,
  onEdit,
  onChanged,
  loading,
}) {
  const [inventoryMed, setInventoryMed] = useState(null);
  const [qty, setQty] = useState(0);
  const [threshold, setThreshold] = useState(5);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const openInventory = (med) => {
    setInventoryMed(med);
    setQty(med.quantityRemaining ?? 0);
    setThreshold(med.lowStockThreshold ?? 5);
  };

  const saveInventory = async () => {
    setSaving(true);
    try {
      await updateInventory(
        elderId,
        inventoryMed._id,
        { quantityRemaining: Number(qty), lowStockThreshold: Number(threshold) },
        token
      );
      toast.success("Inventory updated");
      setInventoryMed(null);
      onChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update inventory");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await deleteCareMedication(elderId, confirmDelete._id, token);
      toast.success(`${confirmDelete.name} removed`);
      setConfirmDelete(null);
      onChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete");
    }
  };

  return (
    <>
      <div className="rounded-xl border border-border bg-paper-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-display text-lg font-semibold text-ink">
            Medication list
          </h3>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-paper" />
            ))}
          </div>
        ) : medications.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-ink-soft">
            No medications yet. Add the first medicine to start tracking doses.
          </p>
        ) : (
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            {medications.map((m) => {
              const low = m.quantityRemaining <= m.lowStockThreshold;
              return (
                <div
                  key={m._id}
                  className="rounded-xl border border-border bg-paper p-4 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-ink">{m.name}</p>
                      <p className="text-sm text-ink-soft">
                        {m.dosage} · {m.frequency}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        statusStyle[m.status] || statusStyle.Active
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>

                  <p className="mt-2 font-mono text-xs text-ink-soft">
                    {(m.scheduledTimes || []).join(" · ") || "No times set"}
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        low ? "text-rose" : "text-ink-soft"
                      }`}
                    >
                      {m.quantityRemaining} {m.quantityUnit}
                      {low ? " · Low stock" : ""}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => openInventory(m)}
                        className="rounded-md border border-border p-1.5 text-ink-soft hover:bg-paper-card hover:text-ink"
                        title="Update inventory"
                      >
                        <Package size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(m)}
                        className="rounded-md border border-border p-1.5 text-ink-soft hover:bg-paper-card hover:text-ink"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(m)}
                        className="rounded-md p-1.5 text-rose hover:bg-rose-soft"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {inventoryMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-paper-card p-6 shadow-lg">
            <h3 className="font-display text-lg font-semibold text-ink">
              Update inventory
            </h3>
            <p className="mt-1 text-sm text-ink-soft">{inventoryMed.name}</p>
            <div className="mt-4 space-y-3">
              <InputField
                size="md"
                label="Remaining quantity"
                type="number"
                name="qty"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
              <InputField
                size="md"
                label="Low-stock threshold"
                type="number"
                name="threshold"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" size="md" fullWidth={false} onClick={() => setInventoryMed(null)}>
                Cancel
              </Button>
              <Button size="md" fullWidth={false} loading={saving} onClick={saveInventory}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-paper-card p-6 shadow-lg">
            <h3 className="font-display text-lg font-semibold text-ink">
              Remove {confirmDelete.name}?
            </h3>
            <p className="mt-1.5 text-sm text-ink-soft">
              This also deletes its dose history for this medicine.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" size="md" fullWidth={false} onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="md" fullWidth={false} onClick={remove}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
