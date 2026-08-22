import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, RefreshCw, Repeat2, ShieldCheck, UserRoundCheck } from "lucide-react";
import toast from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import {
  generateNextDayCaregiverSchedule,
  getCaregiverSchedule,
  switchCaregiverSlots,
  updateCaregiverSchedulerAvailability,
} from "../services/caregiverScheduleService";

const pad = (n) => String(n).padStart(2, "0");
const dateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const slotLabels = [
  "12:00 AM – 4:00 AM",
  "4:00 AM – 8:00 AM",
  "8:00 AM – 12:00 PM",
  "12:00 PM – 4:00 PM",
  "4:00 PM – 8:00 PM",
  "8:00 PM – 12:00 AM",
];

const formatDate = (key) =>
  new Date(`${key}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

export default function CaregiverSchedule() {
  const { token, user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => addDays(new Date(), 1));
  const [data, setData] = useState({ schedule: null, availability: true });
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(null);
  const [generating, setGenerating] = useState(false);

  const selectedKey = useMemo(() => dateKey(selectedDate), [selectedDate]);
  const todayKey = useMemo(() => dateKey(new Date()), []);
  const tomorrowKey = useMemo(() => dateKey(addDays(new Date(), 1)), []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const response = await getCaregiverSchedule(selectedKey, token);
      setData({
        schedule: response.data.schedule,
        availability: response.data.availability,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load caregiver schedule");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchSchedule();
    // The selected date is the dependency; the API is isolated from existing app data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedKey]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      await generateNextDayCaregiverSchedule(token);
      toast.success("The next-day schedule is ready.");
      await fetchSchedule();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not generate the next-day schedule");
    } finally {
      setGenerating(false);
    }
  };

  const handleAvailability = async (nextValue) => {
    try {
      setData((prev) => ({ ...prev, availability: nextValue }));
      await updateCaregiverSchedulerAvailability(nextValue, token);
      toast.success(nextValue ? "You are available for future auto-assignment." : "You are excluded from future auto-assignment.");
    } catch (error) {
      setData((prev) => ({ ...prev, availability: !nextValue }));
      toast.error(error.response?.data?.message || "Could not update availability");
    }
  };

  const handleSwitch = async (fromSlotIndex, toSlotIndex) => {
    try {
      setSwitching(`${fromSlotIndex}-${toSlotIndex}`);
      await switchCaregiverSlots(selectedKey, fromSlotIndex, toSlotIndex, token);
      toast.success("Your slot was switched successfully.");
      await fetchSchedule();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not switch slots");
    } finally {
      setSwitching(null);
    }
  };

  const schedule = data.schedule;
  const ownSlots = schedule?.slots?.filter((slot) => slot.caregiver?._id === user?.id) || [];
  const hasUsedSwitch = Boolean(
    schedule?.switchHistory?.some((entry) =>
      (entry.actorCaregiver?._id || entry.actorCaregiver) === user?.id
    )
  );
  const assignedCount = schedule?.slots?.filter((slot) => slot.caregiver).length || 0;
  const missingCount = Math.max(0, 6 - assignedCount);

  const dates = Array.from({ length: 7 }, (_, index) => addDays(new Date(), index));

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1 px-8 py-8 lg:px-12">
        <div className="mb-7 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <CalendarDays size={17} />
              Caregiver calendar
            </div>
            <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Your 4-hour shift schedule</h1>
            <p className="mt-1.5 max-w-2xl text-sm text-ink-soft">
              Every day has six fixed 4-hour slots. At midnight, the system creates the following day’s schedule and gives each selected caregiver two slots.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              icon={RefreshCw}
              size="md"
              fullWidth={false}
              disabled={generating}
              onClick={handleGenerate}
            >
              {generating ? "Checking…" : "Check next-day schedule"}
            </Button>
          </div>
        </div>

        <section className="mb-6 rounded-xl border border-border bg-paper-card p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserRoundCheck size={19} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Scheduler availability</p>
                <p className="text-xs text-ink-soft">Controls future automatic assignments only. Existing schedules are never rewritten by this toggle.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleAvailability(!data.availability)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                data.availability
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-border bg-paper text-ink-soft"
              }`}
              aria-pressed={data.availability}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${data.availability ? "bg-emerald-500" : "bg-ink-soft/40"}`} />
              {data.availability ? "Available" : "Unavailable"}
            </button>
          </div>
        </section>

        <section className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {dates.map((date) => {
            const key = dateKey(date);
            const active = key === selectedKey;
            return (
              <button
                type="button"
                key={key}
                onClick={() => setSelectedDate(date)}
                className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                  active
                    ? "border-primary bg-primary text-paper-card"
                    : "border-border bg-paper-card text-ink hover:border-primary/40 hover:bg-paper"
                }`}
              >
                <div className="text-xs font-semibold opacity-75">{date.toLocaleDateString(undefined, { weekday: "short" })}</div>
                <div className="mt-1 font-display text-xl font-semibold">{date.getDate()}</div>
                <div className="text-xs opacity-75">{date.toLocaleDateString(undefined, { month: "short" })}</div>
              </button>
            );
          })}
        </section>

        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">{formatDate(selectedKey)}</p>
            <p className="mt-0.5 text-xs text-ink-soft">
              {selectedKey === tomorrowKey ? "Next-day automatic schedule" : selectedKey === todayKey ? "Today — shifts are view-only" : "Calendar history / scheduled day"}
            </p>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              aria-label="Previous day"
              onClick={() => setSelectedDate((date) => addDays(date, -1))}
              className="rounded-lg border border-border bg-paper-card p-2 text-ink-soft hover:bg-paper hover:text-ink"
            >
              <ChevronLeft size={17} />
            </button>
            <button
              type="button"
              aria-label="Next day"
              onClick={() => setSelectedDate((date) => addDays(date, 1))}
              className="rounded-lg border border-border bg-paper-card p-2 text-ink-soft hover:bg-paper hover:text-ink"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-xl border border-border bg-paper-card" />
            ))}
          </div>
        ) : !schedule ? (
          <div className="rounded-xl border border-dashed border-border bg-paper-card px-6 py-14 text-center">
            <Clock3 className="mx-auto text-ink-soft" size={30} />
            <h2 className="mt-3 font-display text-lg font-semibold text-ink">No schedule generated for this date</h2>
            <p className="mx-auto mt-1.5 max-w-lg text-sm text-ink-soft">
              The scheduler intentionally creates only the next calendar day at midnight. Future dates appear automatically as each midnight arrives.
            </p>
          </div>
        ) : (
          <>
            <section className="mb-5 rounded-xl border border-border bg-paper-card p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">Coverage status</p>
                  <p className="mt-1 text-xs text-ink-soft">
                    {assignedCount} of 6 slots assigned. {schedule.status === "generated" ? "Full coverage is available." : "The system needs more available caregivers for full coverage."}
                  </p>
                </div>
                <div className="rounded-lg bg-paper px-3 py-2 text-xs font-semibold text-ink-soft">
                  {missingCount ? `${missingCount} slot${missingCount === 1 ? "" : "s"} unassigned` : "6 / 6 covered"}
                </div>
              </div>
              {missingCount > 0 && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
                  <ShieldCheck size={15} className="mt-0.5 shrink-0" />
                  At least three available caregivers are required to cover all six slots without giving anyone more than two slots.
                </div>
              )}
            </section>

            <div className="space-y-3">
              {schedule.slots.map((slot, index) => {
                const assignedCaregiver = slot.caregiver;
                const isMine = assignedCaregiver?._id === user?.id;
                const initiallyMine = slot.initialCaregiver?._id === user?.id;
                const switched = Boolean(slot.initialCaregiver?._id && slot.initialCaregiver?._id !== assignedCaregiver?._id);
                const isTargetOpen = selectedKey > todayKey;

                return (
                  <article key={slot.slotIndex} className={`rounded-xl border bg-paper-card p-5 shadow-sm ${isMine ? "border-primary/40 ring-1 ring-primary/10" : "border-border"}`}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isMine ? "bg-primary text-paper-card" : "bg-primary/10 text-primary"}`}>
                          <Clock3 size={19} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-display text-base font-semibold text-ink">Slot {index + 1}</h3>
                            {isMine && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">Your slot</span>}
                            {switched && <span className="flex items-center gap-1 rounded-full bg-accent-soft/50 px-2.5 py-1 text-xs font-semibold text-ink"><Repeat2 size={12} /> Switched</span>}
                          </div>
                          <p className="mt-1 text-sm font-semibold text-ink">{slotLabels[index]}</p>
                          <p className="mt-1 text-xs text-ink-soft">
                            {assignedCaregiver ? `Currently assigned to ${assignedCaregiver.name}` : "Unassigned — needs an available caregiver"}
                          </p>
                          {slot.initialCaregiver && (
                            <p className="mt-1 text-xs text-ink-soft">
                              Original assignment: {slot.initialCaregiver.name}
                              {initiallyMine && switched ? " · you moved this slot" : ""}
                            </p>
                          )}
                        </div>
                      </div>

                      {isMine && isTargetOpen && (
                        <div className="rounded-lg border border-border bg-paper px-3 py-3 lg:max-w-md">
                          {hasUsedSwitch ? (
                            <p className="text-xs font-semibold text-ink-soft">You already used your one switch for this day.</p>
                          ) : (
                            <>
                              <p className="mb-2 text-xs font-semibold text-ink">Move this slot to an open slot:</p>
                              <div className="flex flex-wrap gap-2">
                                {schedule.slots
                                  .filter((target) => target.slotIndex !== slot.slotIndex && !target.caregiver)
                                  .map((target) => {
                                    const key = `${slot.slotIndex}-${target.slotIndex}`;
                                    return (
                                      <button
                                        key={target.slotIndex}
                                        type="button"
                                        disabled={Boolean(switching)}
                                        onClick={() => handleSwitch(slot.slotIndex, target.slotIndex)}
                                        className="rounded-md border border-border bg-paper-card px-2.5 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:border-primary/40 hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
                                        title="Move to this unassigned slot"
                                      >
                                        {switching === key ? "Switching…" : `${target.slotIndex + 1} · Open`}
                                      </button>
                                    );
                                  })}
                              </div>
                              {schedule.slots.filter((target) => !target.caregiver).length === 0 && (
                                <p className="mt-2 text-[11px] leading-4 text-ink-soft">There are no unassigned slots available to switch into.</p>
                              )}
                              <p className="mt-2 text-[11px] leading-4 text-ink-soft">You can use one switch per day. The server accepts only an unassigned target, and concurrent requests are serialized so the first valid switch wins.</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-5 rounded-xl border border-border bg-paper-card p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={19} className="mt-0.5 text-primary" />
                <div>
                  <h3 className="text-sm font-semibold text-ink">Your assignment summary</h3>
                  <p className="mt-1 text-sm text-ink-soft">
                    {ownSlots.length === 2
                      ? hasUsedSwitch
                        ? "You have your two 4-hour slots and have already used your one switch for this day."
                        : "You currently have your required two 4-hour slots. You may move one of them once into an unassigned slot."
                      : `You currently have ${ownSlots.length} assigned slot${ownSlots.length === 1 ? "" : "s"} for this date.`}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
