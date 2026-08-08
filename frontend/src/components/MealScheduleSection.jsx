import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CalendarDays, Plus, Pencil, Trash2, X } from "lucide-react";
import Button from "./Button";
import InputField from "./InputField";
import { useAuth } from "../context/AuthContext";
import {
  getMealSchedulesByElder,
  createMealSchedule,
  updateMealSchedule,
  deleteMealSchedule,
} from "../services/mealScheduleService";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MEAL_TYPES = ["Breakfast", "Lunch", "Snack", "Dinner"];

const emptyForm = { time: "", food: "", notes: "" };

export default function MealScheduleSection({ elderId, readOnly = false }) {
  const { token } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // slot = { day, mealType }, plus existing meal (if editing) and form fields
  const [activeSlot, setActiveSlot] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);

  useEffect(() => {
    fetchSchedules();
  }, [elderId]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await getMealSchedulesByElder(elderId, token);
      setSchedules(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load meal schedule");
    } finally {
      setLoading(false);
    }
  };

  const findMeal = (day, mealType) =>
    schedules.find((m) => m.day === day && m.mealType === mealType);

  const openSlot = (day, mealType) => {
    if (readOnly) return;
    const existing = findMeal(day, mealType);
    setActiveSlot({ day, mealType, editingId: existing?._id || null });
    setForm(
      existing
        ? { time: existing.time, food: existing.food, notes: existing.notes || "" }
        : emptyForm
    );
  };

  const closeModal = () => {
    setActiveSlot(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        elder: elderId,
        day: activeSlot.day,
        mealType: activeSlot.mealType,
        ...form,
      };
      if (activeSlot.editingId) {
        const res = await updateMealSchedule(activeSlot.editingId, payload, token);
        setSchedules((prev) =>
          prev.map((m) => (m._id === activeSlot.editingId ? res.data : m))
        );
        toast.success("Meal updated");
      } else {
        const res = await createMealSchedule(payload, token);
        setSchedules((prev) => [...prev, res.data]);
        toast.success("Meal added");
      }
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save meal");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMealSchedule(confirmingDeleteId, token);
      setSchedules((prev) => prev.filter((m) => m._id !== confirmingDeleteId));
      toast.success("Meal removed");
      setConfirmingDeleteId(null);
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete meal");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-paper-card p-6">
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CalendarDays size={16} strokeWidth={2} />
        </div>
        <h3 className="font-display text-lg font-semibold text-ink">
          Meal Schedule
        </h3>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-lg bg-paper" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-1.5">
            <thead>
              <tr>
                <th className="w-24 text-left text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Meal
                </th>
                {DAYS.map((day) => (
                  <th
                    key={day}
                    className="text-center text-xs font-semibold uppercase tracking-wider text-ink-soft"
                  >
                    {day.slice(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MEAL_TYPES.map((mealType) => (
                <tr key={mealType}>
                  <td className="pr-2 text-sm font-semibold text-ink">
                    {mealType}
                  </td>
                  {DAYS.map((day) => {
                    const meal = findMeal(day, mealType);
                    return (
                      <td key={day}>
                        <button
                          onClick={() => openSlot(day, mealType)}
                          disabled={readOnly && !meal}
                          className={`flex h-16 w-full flex-col items-center justify-center gap-0.5 rounded-lg border text-xs transition-colors ${
                            meal
                              ? `border-border bg-paper text-ink ${readOnly ? "" : "hover:border-primary"}`
                              : readOnly
                                ? "border-dashed border-border/60 text-ink-soft/40"
                                : "border-dashed border-border text-ink-soft hover:border-primary hover:text-primary"
                          }`}
                        >
                          {meal ? (
                            <>
                              <span className="font-mono text-[10px] text-ink-soft">
                                {meal.time}
                              </span>
                              <span className="line-clamp-1 max-w-[80px] font-medium">
                                {meal.food}
                              </span>
                            </>
                          ) : readOnly ? (
                            <span>—</span>
                          ) : (
                            <Plus size={14} strokeWidth={2} />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-paper-card p-6 shadow-lg">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">
                  {activeSlot.editingId ? "Edit" : "Add"} {activeSlot.mealType}
                </h3>
                <p className="text-xs text-ink-soft">{activeSlot.day}</p>
              </div>
              <button
                onClick={closeModal}
                className="rounded-md p-1 text-ink-soft hover:bg-paper hover:text-ink"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <InputField
                label="Time"
                name="time"
                size="md"
                type="time"
                required
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              />
              <InputField
                label="Food"
                name="food"
                size="md"
                required
                value={form.food}
                onChange={(e) => setForm((f) => ({ ...f, food: e.target.value }))}
                placeholder="e.g. Oatmeal with banana"
              />
              <InputField
                label="Notes"
                name="notes"
                size="md"
                as="textarea"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional"
              />

              <div className="flex items-center justify-between pt-2">
                {activeSlot.editingId ? (
                  <button
                    type="button"
                    onClick={() => setConfirmingDeleteId(activeSlot.editingId)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-rose hover:text-rose/80"
                  >
                    <Trash2 size={13} strokeWidth={2} />
                    Delete
                  </button>
                ) : (
                  <span />
                )}
                <Button type="submit" size="md" fullWidth={false} loading={saving}>
                  {activeSlot.editingId ? "Save" : "Add"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmingDeleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-paper-card p-6 shadow-lg">
            <h3 className="font-display text-lg font-semibold text-ink">
              Remove this meal?
            </h3>
            <p className="mt-1.5 text-sm text-ink-soft">This can't be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="ghost"
                size="md"
                fullWidth={false}
                onClick={() => setConfirmingDeleteId(null)}
              >
                Cancel
              </Button>
              <Button variant="danger" size="md" fullWidth={false} onClick={handleDelete}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
