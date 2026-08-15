import { useEffect, useMemo, useState } from "react";
import { Plus, Dumbbell, Clock3, CalendarDays, Check, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { getAllElders } from "../services/elderService";
import {
  getActivities,
  createActivity,
  completeActivity,
  deleteActivity,
} from "../services/activityService";

const emptyForm = {
  activity: "",
  duration: "",
  schedule: "",
};

const formatScheduleForInput = (date) => {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "";

  const pad = (number) => String(number).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(
    value.getDate()
  )}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
};

const formatSchedule = (schedule) =>
  new Date(schedule).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

export default function ActivityDashboard() {
  const { token } = useAuth();
  const [elders, setElders] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeElder, setActiveElder] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState(null);

  const activitiesByElder = useMemo(() => {
    return activities.reduce((groups, item) => {
      const elderId = item.elder?._id || item.elder;
      if (!groups[elderId]) groups[elderId] = [];
      groups[elderId].push(item);
      return groups;
    }, {});
  }, [activities]);

  useEffect(() => {
    const loadPage = async () => {
      try {
        setLoading(true);
        const [eldersResponse, activitiesResponse] = await Promise.all([
          getAllElders(token),
          getActivities(token),
        ]);
        setElders(eldersResponse.data);
        setActivities(activitiesResponse.data);
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Could not load activities."
        );
      } finally {
        setLoading(false);
      }
    };

    if (token) loadPage();
  }, [token]);

  const openAddModal = (elder) => {
    setActiveElder(elder);
    setForm({ ...emptyForm, schedule: formatScheduleForInput(new Date()) });
  };

  const closeAddModal = () => {
    setActiveElder(null);
    setForm(emptyForm);
  };

  const handleAddActivity = async (event) => {
    event.preventDefault();

    if (!activeElder) return;

    try {
      setSaving(true);
      const response = await createActivity(
        {
          elderId: activeElder._id,
          activity: form.activity.trim(),
          duration: Number(form.duration),
          schedule: new Date(form.schedule).toISOString(),
        },
        token
      );

      setActivities((current) => [response.data, ...current]);
      toast.success(`Activity added for ${activeElder.fullName}`);
      closeAddModal();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not add the activity."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (activityId) => {
    try {
      setWorkingId(activityId);
      const response = await completeActivity(activityId, token);
      setActivities((current) =>
        current.map((item) =>
          item._id === activityId ? response.data : item
        )
      );
      toast.success("Activity marked as completed.");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not complete the activity."
      );
    } finally {
      setWorkingId(null);
    }
  };

  const handleDelete = async (activityId) => {
    try {
      setWorkingId(activityId);
      await deleteActivity(activityId, token);
      setActivities((current) =>
        current.filter((item) => item._id !== activityId)
      );
      toast.success("Activity deleted.");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not delete the activity."
      );
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 px-5 py-7 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 rounded-2xl border border-border bg-paper-card p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Dumbbell size={14} />
                  Activity & Exercise
                </div>
                <h1 className="font-display text-3xl font-semibold text-ink">
                  Plan activities for your elders
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
                  Choose an elder, add a simple activity, set its duration and
                  schedule, then keep track of what has been completed.
                </p>
              </div>

              <div className="rounded-xl bg-paper px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Overview
                </p>
                <p className="mt-1 font-display text-2xl font-semibold text-primary">
                  {elders.length} {elders.length === 1 ? "elder" : "elders"}
                </p>
                <p className="text-xs text-ink-soft">
                  {activities.length} scheduled activities
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {[0, 1].map((item) => (
                <div
                  key={item}
                  className="h-64 animate-pulse rounded-2xl border border-border bg-paper-card"
                />
              ))}
            </div>
          ) : elders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-paper-card px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Dumbbell size={24} />
              </div>
              <h2 className="mt-4 font-display text-xl font-semibold text-ink">
                No elders registered yet
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-soft">
                Add an elder from your dashboard first. They will automatically
                appear here and you can assign activities to them.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {elders.map((elder) => {
                const elderActivities = activitiesByElder[elder._id] || [];

                return (
                  <section
                    key={elder._id}
                    className="overflow-hidden rounded-2xl border border-border bg-paper-card shadow-sm"
                  >
                    <div className="border-b border-border bg-paper/60 p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                            Elder
                          </p>
                          <h2 className="mt-1 truncate font-display text-xl font-semibold text-ink">
                            {elder.fullName}
                          </h2>
                          <p className="mt-1 text-xs text-ink-soft">
                            ID: {elder.elderID || "Not available"}
                          </p>
                        </div>

                        <Button
                          icon={Plus}
                          size="md"
                          fullWidth={false}
                          onClick={() => openAddModal(elder)}
                        >
                          Add Activity
                        </Button>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6">
                      {elderActivities.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
                          <p className="text-sm font-semibold text-ink">
                            No activities assigned yet
                          </p>
                          <p className="mt-1 text-xs leading-5 text-ink-soft">
                            Use “Add Activity” to create the first scheduled
                            activity for {elder.fullName}.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {elderActivities.map((item) => (
                            <article
                              key={item._id}
                              className={`rounded-xl border p-4 transition-colors ${
                                item.completed
                                  ? "border-primary/20 bg-primary/5"
                                  : "border-border bg-paper-card"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-ink">
                                      {item.activity}
                                    </h3>
                                    {item.completed && (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                                        <Check size={11} /> Done
                                      </span>
                                    )}
                                  </div>

                                  <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-ink-soft sm:grid-cols-2">
                                    <span className="inline-flex items-center gap-1.5">
                                      <Clock3 size={13} />
                                      {item.duration} minute{item.duration === 1 ? "" : "s"}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                      <CalendarDays size={13} />
                                      {formatSchedule(item.schedule)}
                                    </span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleDelete(item._id)}
                                  disabled={workingId === item._id}
                                  className="rounded-lg p-2 text-ink-soft transition hover:bg-rose-soft hover:text-rose disabled:cursor-not-allowed disabled:opacity-50"
                                  title="Delete activity"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>

                              {!item.completed && (
                                <div className="mt-4 border-t border-border pt-3">
                                  <Button
                                    icon={Check}
                                    size="md"
                                    fullWidth={false}
                                    loading={workingId === item._id}
                                    onClick={() => handleComplete(item._id)}
                                  >
                                    Mark Complete
                                  </Button>
                                </div>
                              )}
                            </article>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {activeElder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-paper-card p-6 shadow-xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  New activity
                </p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
                  {activeElder.fullName}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeAddModal}
                disabled={saving}
                className="rounded-lg p-2 text-ink-soft hover:bg-paper hover:text-ink disabled:opacity-50"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddActivity} className="mt-6 space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink">
                  Activity
                </label>
                <input
                  required
                  maxLength={120}
                  value={form.activity}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      activity: event.target.value,
                    }))
                  }
                  placeholder="e.g. Morning walk"
                  className="w-full rounded-lg border border-border bg-paper-card px-3.5 py-3 text-sm text-ink placeholder:text-ink-soft/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink">
                  Duration (minutes)
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={form.duration}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      duration: event.target.value,
                    }))
                  }
                  placeholder="15"
                  className="w-full rounded-lg border border-border bg-paper-card px-3.5 py-3 text-sm text-ink placeholder:text-ink-soft/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink">
                  Schedule
                </label>
                <input
                  required
                  type="datetime-local"
                  value={form.schedule}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      schedule: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-border bg-paper-card px-3.5 py-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-border pt-5">
                <Button
                  variant="ghost"
                  size="md"
                  fullWidth={false}
                  onClick={closeAddModal}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  icon={Plus}
                  size="md"
                  fullWidth={false}
                  loading={saving}
                >
                  Save Activity
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
