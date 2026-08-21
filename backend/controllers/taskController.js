import Task from "../models/task.js";
import Elder from "../models/elder.js";
import Activity from "../models/activity.js";
import DoctorAppointment from "../models/DoctorAppointment.js";
import MedicationDoseLog from "../models/medicationDoseLog.js";
import {
  generateDailyTasksForCaregiver,
  generateTasksForElder,
} from "../services/taskgenerationService.js";

const applyCompletionSideEffect = async (task, userId) => {
  const { refModel, refId } = task.relatedRef || {};
  if (!refModel || !refId) return;

  try {
    if (refModel === "Activity") {
      await Activity.findByIdAndUpdate(refId, {
        completed: true,
        completedAt: new Date(),
      });
    } else if (refModel === "DoctorAppointment") {
      await DoctorAppointment.findByIdAndUpdate(refId, { status: "Completed" });
    } else if (refModel === "MedicationDoseLog") {
      await MedicationDoseLog.findByIdAndUpdate(refId, {
        status: "Taken",
        markedAt: new Date(),
        markedBy: userId,
      });
    }
  } catch (error) {
    console.error("applyCompletionSideEffect failed:", error.message);
  }
};


export const getTodayTasks = async (req, res) => {
  try {
    const tasks = await generateDailyTasksForCaregiver(req.user.id);
    return res.json(tasks);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


export const regenerateForElder = async (req, res) => {
  try {
    const { elderId } = req.params;
    const elder = await Elder.findOne({ _id: elderId, caregiver: req.user.id });
    if (!elder) {
      return res.status(404).json({ message: "Elder not found" });
    }

    await generateTasksForElder(elderId);

    const tasks = await Task.find({ elder: elderId, status: "pending" })
      .sort({ priorityScore: -1, dueAt: 1 })
      .populate("elder", "fullName elderID");

    return res.json(tasks);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


export const completeTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, caregiver: req.user.id });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.status = "completed";
    task.completedAt = new Date();
    await task.save();

    await applyCompletionSideEffect(task, req.user.id);

    return res.json(task);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const autoCompleteRelatedTask = async (refModel, refId) => {
  try {
    await Task.findOneAndUpdate(
      { "relatedRef.refModel": refModel, "relatedRef.refId": refId, status: "pending" },
      { status: "completed", completedAt: new Date(), autoCompleted: true }
    );
  } catch (error) {
    console.error("autoCompleteRelatedTask failed:", error.message);
  }
};
