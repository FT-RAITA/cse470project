import { useEffect, useMemo, useState } from "react";
import {Check,ChevronDown,Clock,Dumbbell,HeartPulse,Loader2,Pill,RefreshCw,Utensils,HeartHandshake,Stethoscope,AlertTriangle,} from "lucide-react";
import toast from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import {getTodayTasks,completeTask,regenerateTasksForElder,} from "../services/taskService";
import { getAllElders } from "../services/elderService";

const priorityConfig = {
  urgent: {
    label: "Urgent",
    className: "bg-rose-100 text-rose-700",
  },
  high: {
    label: "High",
    className: "bg-orange-100 text-orange-700",
  },
  medium: {
    label: "Medium",
    className: "bg-amber-100 text-amber-700",
  },
  low: {
    label: "Low",
    className: "bg-slate-100 text-slate-600",
  },
};

const typeConfig = {
  medication: {
    label: "Medication",
    icon: Pill,
  },
  meal: {
    label: "Meal",
    icon: Utensils,
  },
  exercise: {
    label: "Activity",
    icon: Dumbbell,
  },
  mood_checkin: {
    label: "Mood Check-in",
    icon: HeartPulse,
  },
    emotional_support: {
    label: "Emotional Support",
    icon: HeartHandshake,
  },
  doctor_appointment: {
    label: "Doctor's Appointment",
    icon: Stethoscope,
  },
};

const formatTime = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatDate = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
};

export default function Tasks() {
  const { token } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [elders, setElders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [priorityFilter, setPriorityFilter] = useState("all");
  const [elderFilter, setElderFilter] = useState("all");

  const [processingId, setProcessingId] = useState(null);
  const [regeneratingId, setRegeneratingId] = useState(null);

  const loadTasks = async () => {
    try {
      setRefreshing(true);

      const response = await getTodayTasks(token);

      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Could not load today's care tasks."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadElders = async () => {
    try {
      const response = await getAllElders(token);
      setElders(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Could not load elders:", error);
    }
  };

  useEffect(() => {
    if (!token) return;

    loadTasks();
    loadElders();
  }, [token]);

    const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === "completed").length;
    const incomplete = tasks.filter((task) => task.status === "incomplete").length;
    const pending = tasks.filter((task) => task.status === "pending").length;

    return { total, completed, incomplete, pending };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (task.status === "completed") return false;

      const priorityMatches =
        priorityFilter === "all" ||
        task.priority === priorityFilter;

      const taskElderId =
        task.elder?._id || task.elder;

      const elderMatches =
        elderFilter === "all" ||
        taskElderId === elderFilter;

      return priorityMatches && elderMatches;
    });
  }, [tasks, priorityFilter, elderFilter]);

  const handleComplete = async (taskId) => {
    try {
      setProcessingId(taskId);

      const response = await completeTask(taskId, token);

      setTasks((previous) =>
        previous.map((task) =>
          task._id === taskId ? response.data : task
        )
      );

      toast.success("Task completed");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Could not complete task."
      );
    } finally {
      setProcessingId(null);
    }
  };


  const handleRegenerate = async (elderId, elderName) => {
    try {
      setRegeneratingId(elderId);

      const response = await regenerateTasksForElder(
        elderId,
        token
      );

      // Replace the current pending tasks for this elder
       setTasks((previous) => {
        const otherTasks = previous.filter((task) => {
          const isThisElder =
            (task.elder?._id || task.elder) === elderId;
          return !isThisElder || task.status !== "pending";
        });

        return [...otherElderTasks, ...(response.data || [])].sort(
          (a, b) =>
            (b.priorityScore || 0) - (a.priorityScore || 0)
        );
      });

      toast.success(`Tasks regenerated for ${elderName}`);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Could not regenerate tasks."
      );
    } finally {
      setRegeneratingId(null);
    }
  };

  const getElderName = (task) => {
    if (task.elder?.fullName) {
      return task.elder.fullName;
    }

    const elder = elders.find(
      (e) => e._id === task.elder
    );

    return elder?.fullName || "Unknown elder";
  };

  const getTaskType = (type) => {
    return (
      typeConfig[type] || {
        label: "Care Task",
        icon: HeartHandshake,
      }
    );
  };

  const getPriority = (priority) => {
    return (
      priorityConfig[priority] || priorityConfig.medium
    );
  };

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar />

      <main className="flex-1 px-6 py-8 lg:px-12">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">
              Care Tasks
            </h1>

            <p className="mt-1 text-sm text-ink-soft">
              Today's automatically generated care queue
            </p>
          </div>

          <button
            onClick={loadTasks}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-paper-card px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />

            Refresh Tasks
          </button>
        </div>

                {/* Summary */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-paper-card p-5">
            <p className="text-sm text-ink-soft">
              Pending Tasks
            </p>

            <p className="mt-1 font-display text-2xl font-semibold text-ink">
              {stats.pending}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-paper-card p-5">
            <p className="text-sm text-ink-soft">
              Urgent
            </p>

            <p className="mt-1 font-display text-2xl font-semibold text-rose-600">
              {
                filteredTasks.filter(
                  (task) => task.priority === "urgent"
                ).length
              }
            </p>
          </div>

          <div className="rounded-xl border border-border bg-paper-card p-5">
            <p className="text-sm text-ink-soft">
              High Priority
            </p>

            <p className="mt-1 font-display text-2xl font-semibold text-orange-600">
              {
                filteredTasks.filter(
                  (task) => task.priority === "high"
                ).length
              }
            </p>
          </div>

          <div className="rounded-xl border border-border bg-paper-card p-5">
            <p className="text-sm text-ink-soft">
              Elders
            </p>

            <p className="mt-1 font-display text-2xl font-semibold text-ink">
              {elders.length}
            </p>
          </div>
        </div>

        {/* Completion bar */}
        <div className="mb-6 rounded-xl border border-border bg-paper-card p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink">
              Today's completion
            </p>
            <p className="text-xs text-ink-soft">
              {stats.total === 0
                ? "No tasks generated yet today"
                : `${stats.completed} of ${stats.total} tasks completed`}
            </p>
          </div>

          <div className="flex h-3 w-full overflow-hidden rounded-full bg-paper">
            {stats.total === 0 ? (
              <div className="h-full w-full bg-paper" />
            ) : (
              <>
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                  title={`Completed: ${stats.completed}`}
                />
                <div
                  className="h-full bg-rose-400"
                  style={{ width: `${(stats.incomplete / stats.total) * 100}%` }}
                  title={`Incomplete: ${stats.incomplete}`}
                />
                <div
                  className="h-full bg-amber-300"
                  style={{ width: `${(stats.pending / stats.total) * 100}%` }}
                  title={`Pending: ${stats.pending}`}
                />
              </>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-ink-soft">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Completed ({stats.completed})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              Incomplete ({stats.incomplete})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              Pending ({stats.pending})
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-border bg-paper-card p-4 sm:flex-row">
          <div className="relative flex-1">
            <select
              value={elderFilter}
              onChange={(e) =>
                setElderFilter(e.target.value)
              }
              className="w-full appearance-none rounded-lg border border-border bg-paper px-3 py-2.5 pr-10 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            >
              <option value="all">
                All elders
              </option>

              {elders.map((elder) => (
                <option
                  key={elder._id}
                  value={elder._id}
                >
                  {elder.fullName}
                </option>
              ))}
            </select>

            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft"
            />
          </div>

          <div className="relative flex-1">
            <select
              value={priorityFilter}
              onChange={(e) =>
                setPriorityFilter(e.target.value)
              }
              className="w-full appearance-none rounded-lg border border-border bg-paper px-3 py-2.5 pr-10 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            >
              <option value="all">
                All priorities
              </option>

              <option value="urgent">
                Urgent
              </option>

              <option value="high">
                High
              </option>

              <option value="medium">
                Medium
              </option>

              <option value="low">
                Low
              </option>
            </select>

            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft"
            />
          </div>
        </div>

        {/* Task list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-xl border border-border bg-paper-card"
              />
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-paper-card py-20 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Check size={26} />
            </div>

            <h3 className="font-display text-lg font-semibold text-ink">
              No pending tasks
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
              There are no tasks matching your current
              filters. Your elders are all caught up.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => {
              const type = getTaskType(task.type);
              const priority = getPriority(task.priority);
              const TypeIcon = type.icon;

              const elderName = getElderName(task);

                            const processing =
                processingId === task._id;

              const isIncomplete = task.status === "incomplete";

              return (
                <div
                  key={task._id}
                  className={`rounded-xl border p-5 shadow-sm ${
                    isIncomplete
                      ? "border-rose-200 bg-rose-50/60"
                      : "border-border bg-paper-card"
                  }`}
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    {/* Task information */}
                    <div className="flex min-w-0 flex-1 gap-4">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                          isIncomplete
                            ? "bg-rose-100 text-rose-600"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        <TypeIcon size={21} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-base font-semibold text-ink">
                            {task.title}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priority.className}`}
                          >
                            {priority.label}
                          </span>

                          {isIncomplete && (
                            <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
                              <AlertTriangle size={12} />
                              Incomplete · over 2h overdue
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft">
                          <span>
                            {elderName}
                          </span>

                          <span className="flex items-center gap-1">
                            <TypeIcon size={14} />
                            {type.label}
                          </span>

                          {task.dueAt && (
                            <span
                              className={`flex items-center gap-1 ${
                                isIncomplete ? "text-rose-600" : ""
                              }`}
                            >
                              <Clock size={14} />
                              {formatTime(task.dueAt)}
                              {" · "}
                              {formatDate(task.dueAt)}
                            </span>
                          )}
                        </div>

                        {task.reason && (
                          <p className="mt-2 text-sm text-ink-soft">
                            {task.reason}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions: no skip — only complete */}
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() =>
                          handleComplete(task._id)
                        }
                        disabled={processing}
                        className="flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2.5 text-sm font-medium text-paper-card transition hover:bg-primary-dark disabled:opacity-50"
                      >
                        {processing ? (
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />
                        ) : (
                          <Check size={16} />
                        )}

                        Complete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Regenerate section */}
        <section className="mt-10">
          <div className="mb-4">
            <h2 className="font-display text-lg font-semibold text-ink">
              Regenerate tasks
            </h2>

            <p className="mt-1 text-sm text-ink-soft">
              Re-run the care rules after adding a medication,
              activity, meal schedule, or mood check-in.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {elders.map((elder) => (
              <div
                key={elder._id}
                className="flex items-center justify-between rounded-xl border border-border bg-paper-card p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {elder.fullName}
                  </p>

                  {elder.elderID && (
                    <p className="mt-0.5 text-xs text-ink-soft">
                      ID: {elder.elderID}
                    </p>
                  )}
                </div>

                <button
                  onClick={() =>
                    handleRegenerate(
                      elder._id,
                      elder.fullName
                    )
                  }
                  disabled={
                    regeneratingId === elder._id
                  }
                  className="ml-3 flex shrink-0 items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-ink transition hover:bg-paper disabled:opacity-50"
                >
                  <RefreshCw
                    size={14}
                    className={
                      regeneratingId === elder._id
                        ? "animate-spin"
                        : ""
                    }
                  />

                  Regenerate
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}