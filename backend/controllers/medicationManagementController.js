import Elder from "../models/elder.js";
import Medication from "../models/medication.js";
import MedicationDoseLog from "../models/medicationDoseLog.js";
import HealthActivity from "../models/healthActivity.js";

const assertElderOwnership = async (elderId, caregiverId) =>
  Elder.findOne({ _id: elderId, caregiver: caregiverId });

const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const isActiveForDate = (med, day) => {
  if (med.status !== "Active") return false;
  const dayStart = startOfDay(day);
  if (med.startDate && startOfDay(med.startDate) > dayStart) return false;
  if (med.endDate && startOfDay(med.endDate) < dayStart) return false;
  return true;
};

const defaultTimesForFrequency = (frequency = "") => {
  const f = frequency.toLowerCase();
  if (f.includes("three") || f.includes("3")) return ["08:00", "14:00", "20:00"];
  if (f.includes("twice") || f.includes("2") || f.includes("two")) return ["08:00", "20:00"];
  if (f.includes("bed") || f.includes("night")) return ["21:00"];
  if (f.includes("morning")) return ["08:00"];
  return ["09:00"];
};

/** Ensure today's Pending dose rows exist for active meds with schedule */
const ensureTodayDoses = async (elderId, day = new Date()) => {
  const dayStart = startOfDay(day);
  const meds = await Medication.find({ elder: elderId, status: "Active" });

  for (const med of meds) {
    if (!isActiveForDate(med, dayStart)) continue;
    const times =
      med.scheduledTimes?.length > 0
        ? med.scheduledTimes
        : defaultTimesForFrequency(med.frequency);

    for (const time of times) {
      await MedicationDoseLog.findOneAndUpdate(
        {
          medication: med._id,
          scheduledDate: dayStart,
          scheduledTime: time,
        },
        {
          $setOnInsert: {
            elder: elderId,
            medication: med._id,
            scheduledDate: dayStart,
            scheduledTime: time,
            status: "Pending",
          },
        },
        { upsert: true, new: true }
      );
    }
  }
};

const logActivity = async ({ elder, actor, message }) => {
  try {
    await HealthActivity.create({
      elder,
      actor,
      type: "medication_updated",
      message,
    });
  } catch {
    
  }
};

const validateMedInput = (body, { partial = false } = {}) => {
  const errors = [];
  if (!partial || body.name !== undefined) {
    if (!body.name?.trim()) errors.push("Medicine name is required.");
  }
  if (!partial || body.dosage !== undefined) {
    if (!body.dosage?.trim()) errors.push("Dosage is required.");
  }
  if (!partial || body.frequency !== undefined) {
    if (!body.frequency?.trim()) errors.push("Frequency is required.");
  }
  if (body.scheduledTimes && !Array.isArray(body.scheduledTimes)) {
    errors.push("Scheduled times must be a list.");
  }
  if (body.startDate && body.endDate) {
    if (startOfDay(body.endDate) < startOfDay(body.startDate)) {
      errors.push("End date cannot be before start date.");
    }
  }
  if (body.quantityRemaining !== undefined && Number(body.quantityRemaining) < 0) {
    errors.push("Quantity cannot be negative.");
  }
  if (
    body.status &&
    !["Active", "Completed", "Paused", "Stopped"].includes(body.status)
  ) {
    errors.push("Invalid medication status.");
  }
  return errors;
};

export const getMedicationDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    const elder = await assertElderOwnership(id, req.user.id);
    if (!elder) return res.status(404).json({ message: "Elder not found" });

    await ensureTodayDoses(id);

    const todayStart = startOfDay();
    const todayEnd = endOfDay();

    const [medications, todayDoses, recentHistory, missedHistory] =
      await Promise.all([
        Medication.find({ elder: id }).sort({ status: 1, name: 1 }),
        MedicationDoseLog.find({
          elder: id,
          scheduledDate: { $gte: todayStart, $lte: todayEnd },
        })
          .populate("medication", "name dosage frequency quantityRemaining lowStockThreshold quantityUnit status")
          .sort({ scheduledTime: 1 }),
        MedicationDoseLog.find({
          elder: id,
          status: { $in: ["Taken", "Missed", "Skipped"] },
        })
          .populate("medication", "name dosage")
          .populate("markedBy", "name")
          .sort({ markedAt: -1, scheduledDate: -1 })
          .limit(30),
        MedicationDoseLog.find({ elder: id, status: "Missed" })
          .populate("medication", "name dosage")
          .sort({ scheduledDate: -1, scheduledTime: -1 })
          .limit(20),
      ]);

    const activeMeds = medications.filter((m) => m.status === "Active");
    const takenToday = todayDoses.filter((d) => d.status === "Taken").length;
    const missedToday = todayDoses.filter((d) => d.status === "Missed").length;
    const pendingToday = todayDoses.filter((d) => d.status === "Pending").length;
    const lowStock = activeMeds.filter(
      (m) => m.quantityRemaining <= m.lowStockThreshold
    );

    
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const reminders = todayDoses
      .filter((d) => d.status === "Pending" && d.medication?.status === "Active")
      .map((d) => {
        const [h, m] = d.scheduledTime.split(":").map(Number);
        const doseMins = h * 60 + m;
        const diff = doseMins - currentMins;
        return { dose: d, diff };
      })
      .filter(({ diff }) => diff <= 60)
      .sort((a, b) => a.diff - b.diff)
      .map(({ dose, diff }) => ({
        _id: dose._id,
        medicine: dose.medication?.name,
        dosage: dose.medication?.dosage,
        scheduledTime: dose.scheduledTime,
        overdue: diff < 0,
        minutesUntil: diff,
        message:
          diff < 0
            ? `${dose.medication?.name} was due at ${dose.scheduledTime}`
            : `${dose.medication?.name} is due at ${dose.scheduledTime}`,
      }));

    res.json({
      elder: {
        _id: elder._id,
        fullName: elder.fullName,
        age: elder.age,
      },
      summary: {
        totalActive: activeMeds.length,
        dosesScheduledToday: todayDoses.length,
        dosesTakenToday: takenToday,
        dosesMissedToday: missedToday,
        dosesPendingToday: pendingToday,
        lowStockCount: lowStock.length,
      },
      todaySchedule: todayDoses,
      medications,
      history: recentHistory,
      missedHistory,
      lowStock,
      reminders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const listMedications = async (req, res) => {
  try {
    const { id } = req.params;
    const elder = await assertElderOwnership(id, req.user.id);
    if (!elder) return res.status(404).json({ message: "Elder not found" });

    const { status } = req.query;
    const query = { elder: id };
    if (status) query.status = status;

    const meds = await Medication.find(query).sort({ name: 1 });
    res.json(meds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCareMedication = async (req, res) => {
  try {
    const { id } = req.params;
    const elder = await assertElderOwnership(id, req.user.id);
    if (!elder) return res.status(404).json({ message: "Elder not found" });

    const errors = validateMedInput(req.body);
    if (errors.length) return res.status(400).json({ message: errors[0], errors });

    const times =
      Array.isArray(req.body.scheduledTimes) && req.body.scheduledTimes.length
        ? req.body.scheduledTimes
        : defaultTimesForFrequency(req.body.frequency);

    const med = await Medication.create({
      elder: id,
      updatedBy: req.user.id,
      name: req.body.name.trim(),
      dosage: req.body.dosage.trim(),
      frequency: req.body.frequency.trim(),
      scheduledTimes: times,
      startDate: req.body.startDate ? startOfDay(req.body.startDate) : startOfDay(),
      endDate: req.body.endDate ? startOfDay(req.body.endDate) : null,
      instructions: req.body.instructions?.trim() || "",
      quantityRemaining: Number(req.body.quantityRemaining ?? 30),
      quantityUnit: req.body.quantityUnit?.trim() || "pills",
      lowStockThreshold: Number(req.body.lowStockThreshold ?? 5),
      status: req.body.status || "Active",
      notes: req.body.notes?.trim() || "",
    });

    await ensureTodayDoses(id);
    await logActivity({
      elder: id,
      actor: req.user.id,
      message: `Medicine added: ${med.name} (${med.dosage})`,
    });

    res.status(201).json(med);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateCareMedication = async (req, res) => {
  try {
    const { id, medId } = req.params;
    const elder = await assertElderOwnership(id, req.user.id);
    if (!elder) return res.status(404).json({ message: "Elder not found" });

    const errors = validateMedInput(req.body, { partial: true });
    if (errors.length) return res.status(400).json({ message: errors[0], errors });

    const updates = { updatedBy: req.user.id };
    const fields = [
      "name",
      "dosage",
      "frequency",
      "scheduledTimes",
      "instructions",
      "quantityUnit",
      "status",
      "notes",
    ];
    for (const f of fields) {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    }
    if (req.body.startDate !== undefined) {
      updates.startDate = req.body.startDate ? startOfDay(req.body.startDate) : null;
    }
    if (req.body.endDate !== undefined) {
      updates.endDate = req.body.endDate ? startOfDay(req.body.endDate) : null;
    }
    if (req.body.quantityRemaining !== undefined) {
      updates.quantityRemaining = Number(req.body.quantityRemaining);
    }
    if (req.body.lowStockThreshold !== undefined) {
      updates.lowStockThreshold = Number(req.body.lowStockThreshold);
    }
    if (typeof updates.name === "string") updates.name = updates.name.trim();
    if (typeof updates.dosage === "string") updates.dosage = updates.dosage.trim();
    if (typeof updates.frequency === "string") updates.frequency = updates.frequency.trim();

    const med = await Medication.findOneAndUpdate(
      { _id: medId, elder: id },
      updates,
      { new: true, runValidators: true }
    );
    if (!med) return res.status(404).json({ message: "Medication not found" });

    if (med.status === "Active") await ensureTodayDoses(id);

    await logActivity({
      elder: id,
      actor: req.user.id,
      message: `Medication updated: ${med.name}`,
    });

    res.json(med);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteCareMedication = async (req, res) => {
  try {
    const { id, medId } = req.params;
    const elder = await assertElderOwnership(id, req.user.id);
    if (!elder) return res.status(404).json({ message: "Elder not found" });

    const med = await Medication.findOneAndDelete({ _id: medId, elder: id });
    if (!med) return res.status(404).json({ message: "Medication not found" });

    await MedicationDoseLog.deleteMany({ medication: medId });
    await logActivity({
      elder: id,
      actor: req.user.id,
      message: `Medication removed: ${med.name}`,
    });

    res.json({ message: "Medication deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getTodaySchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const elder = await assertElderOwnership(id, req.user.id);
    if (!elder) return res.status(404).json({ message: "Elder not found" });

    await ensureTodayDoses(id);
    const doses = await MedicationDoseLog.find({
      elder: id,
      scheduledDate: { $gte: startOfDay(), $lte: endOfDay() },
    })
      .populate("medication", "name dosage frequency status instructions")
      .sort({ scheduledTime: 1 });

    res.json(doses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDoseHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const elder = await assertElderOwnership(id, req.user.id);
    if (!elder) return res.status(404).json({ message: "Elder not found" });

    const { status, limit = 50 } = req.query;
    const query = {
      elder: id,
      status: { $in: ["Taken", "Missed", "Skipped"] },
    };
    if (status) query.status = status;

    const history = await MedicationDoseLog.find(query)
      .populate("medication", "name dosage")
      .populate("markedBy", "name")
      .sort({ scheduledDate: -1, scheduledTime: -1 })
      .limit(Math.min(100, Number(limit) || 50));

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateDoseStatus = async (req, res) => {
  try {
    const { id, doseId } = req.params;
    const { status, notes } = req.body;
    const elder = await assertElderOwnership(id, req.user.id);
    if (!elder) return res.status(404).json({ message: "Elder not found" });

    if (!["Taken", "Missed", "Skipped", "Pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid dose status." });
    }

    const dose = await MedicationDoseLog.findOne({ _id: doseId, elder: id });
    if (!dose) return res.status(404).json({ message: "Dose not found" });

    const previous = dose.status;
    dose.status = status;
    dose.markedAt = status === "Pending" ? null : new Date();
    dose.markedBy = status === "Pending" ? null : req.user.id;
    if (notes !== undefined) dose.notes = notes;
    await dose.save();

    
    if (status === "Taken" && previous !== "Taken") {
      const med = await Medication.findById(dose.medication);
      if (med && med.quantityRemaining > 0) {
        med.quantityRemaining -= 1;
        med.updatedBy = req.user.id;
        await med.save();
      }
    }
    
    if (previous === "Taken" && status !== "Taken") {
      const med = await Medication.findById(dose.medication);
      if (med) {
        med.quantityRemaining += 1;
        med.updatedBy = req.user.id;
        await med.save();
      }
    }

    const populated = await MedicationDoseLog.findById(dose._id)
      .populate("medication", "name dosage quantityRemaining lowStockThreshold quantityUnit status")
      .populate("markedBy", "name");

    res.json({
      message: `Dose marked as ${status}`,
      dose: populated,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateInventory = async (req, res) => {
  try {
    const { id, medId } = req.params;
    const elder = await assertElderOwnership(id, req.user.id);
    if (!elder) return res.status(404).json({ message: "Elder not found" });

    const { quantityRemaining, lowStockThreshold, quantityUnit } = req.body;
    if (quantityRemaining === undefined || Number(quantityRemaining) < 0) {
      return res.status(400).json({ message: "Valid quantity is required." });
    }

    const updates = {
      quantityRemaining: Number(quantityRemaining),
      updatedBy: req.user.id,
    };
    if (lowStockThreshold !== undefined) {
      updates.lowStockThreshold = Number(lowStockThreshold);
    }
    if (quantityUnit !== undefined) updates.quantityUnit = quantityUnit;

    const med = await Medication.findOneAndUpdate(
      { _id: medId, elder: id },
      updates,
      { new: true, runValidators: true }
    );
    if (!med) return res.status(404).json({ message: "Medication not found" });

    await logActivity({
      elder: id,
      actor: req.user.id,
      message: `Inventory updated for ${med.name}: ${med.quantityRemaining} ${med.quantityUnit}`,
    });

    res.json(med);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
