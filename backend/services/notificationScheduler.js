import Elder from "../models/elder.js";
import Medication from "../models/medication.js";
import MedicationDoseLog from "../models/medicationDoseLog.js";
import DoctorAppointment from "../models/DoctorAppointment.js";
import Appointment from "../models/appointment.js";
import Task from "../models/task.js";
import ShiftCoverage from "../models/shiftCoverage.js";
import { createNotification } from "./notificationService.js";

let timer = null;
const MINUTE = 60 * 1000;
const formatTime = (d) => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const buildScheduledDateTime = (dateValue, timeValue) => {
  const due = new Date(dateValue);
  if (Number.isNaN(due.getTime())) return null;

  const raw = String(timeValue ?? "").trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3]?.toUpperCase();

  if (!Number.isInteger(hour) || !Number.isInteger(minute) || minute < 0 || minute > 59) return null;
  if (period) {
    if (hour < 1 || hour > 12) return null;
    hour = hour % 12 + (period === "PM" ? 12 : 0);
  } else if (hour < 0 || hour > 23) {
    return null;
  }

  due.setHours(hour, minute, 0, 0);
  return Number.isNaN(due.getTime()) ? null : due;
};

const resolveCaregiver = async (elderId, at = new Date()) => {
  const effectiveAt = new Date(at);
  if (!Number.isNaN(effectiveAt.getTime())) {
    const coverage = await ShiftCoverage.findOne({
      elder: elderId,
      startAt: { $lte: effectiveAt },
      endAt: { $gte: effectiveAt },
    }).select("coveringCaregiver").lean();
    if (coverage?.coveringCaregiver) return coverage.coveringCaregiver;
  }

  const elder = await Elder.findById(elderId).select("caregiver").lean();
  return elder?.caregiver || null;
};

const ensureTodayDoseLogs = async (now) => {
  const day = new Date(now); day.setHours(0,0,0,0);
  const meds = await Medication.find({
    status: "Active",
    $and: [
      { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
      { $or: [{ endDate: null }, { endDate: { $gte: day } }] },
    ],
  }).select("elder scheduledTimes frequency");

  const defaultTimes = (frequency = "") => {
    const f = frequency.toLowerCase();
    if (f.includes("three") || f.includes("3")) return ["08:00","14:00","20:00"];
    if (f.includes("twice") || f.includes("2") || f.includes("two")) return ["08:00","20:00"];
    if (f.includes("bed") || f.includes("night")) return ["21:00"];
    if (f.includes("morning")) return ["08:00"];
    return ["09:00"];
  };

  for (const med of meds) {
    const times = med.scheduledTimes?.length ? med.scheduledTimes : defaultTimes(med.frequency);
    for (const time of times) {
      if (!buildScheduledDateTime(day, time)) continue;
      await MedicationDoseLog.findOneAndUpdate(
        { medication: med._id, scheduledDate: day, scheduledTime: time },
        { $setOnInsert: { elder: med.elder, medication: med._id, scheduledDate: day, scheduledTime: time, status: "Pending" } },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }
  }
};

const medicationChecks = async (now) => {
  await ensureTodayDoseLogs(now);
  const dayStart = new Date(now); dayStart.setHours(0,0,0,0);
  const dayEnd = new Date(now); dayEnd.setHours(23,59,59,999);
  const doses = await MedicationDoseLog.find({
    scheduledDate: { $gte: dayStart, $lte: dayEnd }, status: "Pending"
  }).populate("medication", "name dosage status quantityRemaining lowStockThreshold quantityUnit")
    .populate("elder", "fullName");

  for (const dose of doses) {
    if (!dose.medication || dose.medication.status !== "Active" || !dose.elder) continue;
    const due = buildScheduledDateTime(dose.scheduledDate, dose.scheduledTime);
    if (!due) continue;
    const caregiver = await resolveCaregiver(dose.elder._id, due);
    if (!caregiver) continue;
    const base = { recipient: caregiver, elder: dose.elder._id, type: "medication", relatedType: "MedicationDoseLog", relatedId: dose._id, actionUrl: `/elders/${dose.elder._id}/medications`, actionLabel: "Open medications" };
    if (now >= new Date(due.getTime() - 30*MINUTE) && now < due) await createNotification({ ...base, severity:"reminder", title:"Medicine due soon", message:`${dose.medication.name} ${dose.medication.dosage} for ${dose.elder.fullName} is due at ${formatTime(due)}.`, dedupeKey:`medication-${dose._id}-30min` });
    if (now >= due && now < new Date(due.getTime() + 30*MINUTE)) await createNotification({ ...base, severity:"reminder", title:"Medicine due now", message:`${dose.medication.name} is due now for ${dose.elder.fullName}.`, dedupeKey:`medication-${dose._id}-due` });
    if (now >= new Date(due.getTime()+30*MINUTE)) await createNotification({ ...base, severity:"warning", title:"Medicine overdue", message:`${dose.medication.name} is 30 minutes overdue for ${dose.elder.fullName}.`, dedupeKey:`medication-${dose._id}-overdue30` });
  }
};

const doctorChecks = async (now) => {
  const end = new Date(now.getTime()+25*60*MINUTE);
  const rows = await DoctorAppointment.find({ status:"Upcoming", appointmentDate:{ $gte: now, $lte:end } }).populate("elder","fullName");
  for (const a of rows) {
    if (!a.elder) continue;
    const caregiver = await resolveCaregiver(a.elder._id, a.appointmentDate) || a.caregiver;
    const base={recipient:caregiver,elder:a.elder._id,type:"doctor_appointment",relatedType:"DoctorAppointment",relatedId:a._id,actionUrl:"/doctor-appointments",actionLabel:"Open appointment"};
    if (now >= new Date(a.appointmentDate.getTime()-24*60*MINUTE) && now < new Date(a.appointmentDate.getTime()-2*60*MINUTE)) await createNotification({...base,severity:"reminder",title:"Doctor appointment tomorrow",message:`Dr. ${a.doctorName} appointment for ${a.elder.fullName} is tomorrow at ${formatTime(a.appointmentDate)}.`,dedupeKey:`doctor-${a._id}-24hour`});
    if (now >= new Date(a.appointmentDate.getTime()-2*60*MINUTE) && now < a.appointmentDate) await createNotification({...base,severity:"reminder",title:"Doctor appointment soon",message:`Dr. ${a.doctorName} appointment for ${a.elder.fullName} is in about 2 hours.`,dedupeKey:`doctor-${a._id}-2hour`});
  }
};

const visitorChecks = async (now) => {
  const end = new Date(now.getTime()+2*60*MINUTE);
  const rows = await Appointment.find({ status:"Approved", appointmentDateTime:{ $gte:now,$lte:end } }).populate("elder","fullName caregiver").populate("visitor","name");
  for (const a of rows) {
    if (!a.elder || !a.visitor) continue;
    if (!(now >= new Date(a.appointmentDateTime.getTime()-60*MINUTE) && now < a.appointmentDateTime)) continue;
    const caregiver=await resolveCaregiver(a.elder._id,a.appointmentDateTime)||a.elder.caregiver;
    await createNotification({recipient:caregiver,elder:a.elder._id,type:"visitor",severity:"reminder",title:"Visitor arriving soon",message:`${a.visitor.name} is scheduled to visit ${a.elder.fullName} in 1 hour.`,relatedType:"Appointment",relatedId:a._id,actionUrl:"/appointments",actionLabel:"Open visits",dedupeKey:`visitor-${a._id}-1hour-caregiver`});
    await createNotification({recipient:a.visitor._id,elder:a.elder._id,type:"visitor",severity:"reminder",title:"Visit begins soon",message:`Your visit with ${a.elder.fullName} begins in 1 hour.`,relatedType:"Appointment",relatedId:a._id,actionUrl:"/appointments",actionLabel:"Open visit",dedupeKey:`visitor-${a._id}-1hour-visitor`});
  }
};

const taskChecks = async (now) => {
  const start = new Date(now.getTime()-24*60*MINUTE), end = new Date(now.getTime()+35*MINUTE);
  const rows = await Task.find({ status:{ $in:["pending","incomplete"] }, dueAt:{ $gte:start,$lte:end } }).populate("elder","fullName");
  for (const task of rows) {
    if (!task.elder) continue;
    const caregiver=await resolveCaregiver(task.elder._id,task.dueAt)||task.caregiver;
    const base={recipient:caregiver,elder:task.elder._id,type:"caregiver_task",relatedType:"Task",relatedId:task._id,actionUrl:"/tasks",actionLabel:"Open tasks"};
    if (now >= new Date(task.dueAt.getTime()-30*MINUTE) && now < task.dueAt) await createNotification({...base,severity:"reminder",title:"Task due soon",message:`${task.title} for ${task.elder.fullName} is due in 30 minutes.`,dedupeKey:`task-${task._id}-30min`});
    if (["high","urgent"].includes(task.priority)) await createNotification({...base,severity:task.priority==="urgent"?"critical":"warning",title:task.priority==="urgent"?"Urgent care task":"High priority care task",message:`${task.title} for ${task.elder.fullName} is ${task.priority} priority.`,dedupeKey:`task-${task._id}-priority-${task.priority}`});
    if (now>task.dueAt) await createNotification({...base,severity:"warning",title:"Task overdue",message:`${task.title} for ${task.elder.fullName} is overdue.`,dedupeKey:`task-${task._id}-overdue`});
  }
};

export const runNotificationChecks = async () => {
  const now = new Date();
  for (const [name,fn] of [["medication",medicationChecks],["doctor",doctorChecks],["visitor",visitorChecks],["task",taskChecks]]) {
    try { await fn(now); } catch (error) { console.error(`NOTIFICATION SCHEDULER ${name.toUpperCase()} ERROR:`, error.message); }
  }
};

export const startNotificationScheduler = () => {
  if (timer) return timer;
  runNotificationChecks().catch((e)=>console.error("NOTIFICATION SCHEDULER START ERROR:",e.message));
  timer=setInterval(()=>runNotificationChecks(),MINUTE);
  timer.unref?.();
  return timer;
};
