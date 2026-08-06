import Appointment from "../models/appointment.js";
import Elder from "../models/elder.js";

export const TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const PHONE_REGEX = /^[0-9+\-\s()]{8,15}$/;
const MAX_VISITORS = 5;
const ACTIVE_SLOT_STATUSES = ["Pending", "Approved"];

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const isPastDate = (date) => {
  const today = startOfDay(new Date());
  return startOfDay(date) < today;
};

const validateAppointmentInput = (body) => {
  const errors = [];

  if (!body.elder) errors.push("Please select an elder.");
  if (!body.visitorName?.trim()) errors.push("Visitor name is required.");
  if (!body.visitorEmail?.trim()) errors.push("Visitor email is required.");
  else if (!EMAIL_REGEX.test(body.visitorEmail)) errors.push("Email format is invalid.");
  if (!body.visitorPhone?.trim()) errors.push("Visitor phone is required.");
  else if (!PHONE_REGEX.test(body.visitorPhone)) errors.push("Phone format is invalid.");
  if (!body.relation) errors.push("Relation to elder is required.");
  if (!body.purpose?.trim()) errors.push("Purpose of visit is required.");
  if (!body.preferredDate) errors.push("Preferred date is required.");
  else if (isPastDate(body.preferredDate)) errors.push("Date cannot be in the past.");
  if (!body.preferredTime) errors.push("Preferred time is required.");
  else if (!TIME_SLOTS.includes(body.preferredTime)) {
    errors.push("Please select a valid time slot.");
  }
  if (!body.expectedDuration) errors.push("Expected duration is required.");
  if (!body.numberOfVisitors) errors.push("Number of visitors is required.");
  else if (body.numberOfVisitors < 1 || body.numberOfVisitors > MAX_VISITORS) {
    errors.push(`Number of visitors must be between 1 and ${MAX_VISITORS}.`);
  }

  return errors;
};

const findSlotConflict = async ({ elder, preferredDate, preferredTime, excludeId = null }) => {
  const query = {
    elder,
    preferredTime,
    preferredDate: {
      $gte: startOfDay(preferredDate),
      $lte: endOfDay(preferredDate),
    },
    status: { $in: ACTIVE_SLOT_STATUSES },
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return Appointment.findOne(query);
};

const getVisitorBadge = async (visitorId) => {
  const completedCount = await Appointment.countDocuments({
    visitor: visitorId,
    status: { $in: ["Completed", "Approved"] },
  });

  if (completedCount === 0) return "First Visit";
  if (completedCount <= 3) return "Returning Visitor";
  return "Frequent Visitor";
};

const populateAppointment = (query) =>
  query
    .populate("elder", "fullName age gender caregiver")
    .populate("visitor", "name email phone role")
    .populate("approvedBy", "name email");

const caregiverElderIds = async (caregiverId) => {
  const elders = await Elder.find({ caregiver: caregiverId }).select("_id");
  return elders.map((e) => e._id);
};

// Elders available for booking dropdown (id + name only)
export const getBookableElders = async (req, res) => {
  try {
    let elders;

    if (req.user.role === "caregiver") {
      elders = await Elder.find({ caregiver: req.user.id })
        .select("fullName age gender")
        .sort({ fullName: 1 });
    } else {
      // Visitors can book visits with any elder in the system
      elders = await Elder.find()
        .select("fullName age gender")
        .sort({ fullName: 1 });
    }

    res.json(elders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Available time slots for an elder on a date
export const getAvailableSlots = async (req, res) => {
  try {
    const { elderId, date } = req.query;

    if (!elderId || !date) {
      return res.status(400).json({ message: "Elder and date are required." });
    }

    if (isPastDate(date)) {
      return res.status(400).json({ message: "Date cannot be in the past." });
    }

    const elder = await Elder.findById(elderId);
    if (!elder) {
      return res.status(404).json({ message: "Elder not found." });
    }

    const booked = await Appointment.find({
      elder: elderId,
      preferredDate: { $gte: startOfDay(date), $lte: endOfDay(date) },
      status: { $in: ACTIVE_SLOT_STATUSES },
    }).select("preferredTime status");

    const bookedTimes = new Set(booked.map((a) => a.preferredTime));

    const slots = TIME_SLOTS.map((time) => ({
      time,
      available: !bookedTimes.has(time),
      status: bookedTimes.has(time) ? "Booked" : "Available",
    }));

    res.json({ date, elderId, slots });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create appointment (visitor or caregiver on behalf)
export const createAppointment = async (req, res) => {
  try {
    const errors = validateAppointmentInput(req.body);
    if (errors.length) {
      return res.status(400).json({ message: errors[0], errors });
    }

    const elder = await Elder.findById(req.body.elder);
    if (!elder) {
      return res.status(404).json({ message: "Elder not found." });
    }

    // Caregivers may only book for their own elders
    if (
      req.user.role === "caregiver" &&
      elder.caregiver.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "You can only book visits for your elders." });
    }

    const conflict = await findSlotConflict({
      elder: req.body.elder,
      preferredDate: req.body.preferredDate,
      preferredTime: req.body.preferredTime,
    });

    if (conflict) {
      return res.status(409).json({
        message: "This slot is already occupied.",
      });
    }

    // Prevent exact duplicate pending request by same visitor
    const duplicate = await Appointment.findOne({
      visitor: req.user.id,
      elder: req.body.elder,
      preferredTime: req.body.preferredTime,
      preferredDate: {
        $gte: startOfDay(req.body.preferredDate),
        $lte: endOfDay(req.body.preferredDate),
      },
      status: { $in: ACTIVE_SLOT_STATUSES },
    });

    if (duplicate) {
      return res.status(409).json({
        message: "You already have a request for this slot.",
      });
    }

    const appointment = await Appointment.create({
      visitor: req.user.id,
      elder: req.body.elder,
      visitorName: req.body.visitorName.trim(),
      visitorEmail: req.body.visitorEmail.trim().toLowerCase(),
      visitorPhone: req.body.visitorPhone.trim(),
      relation: req.body.relation,
      purpose: req.body.purpose.trim(),
      priority: req.body.priority || "Normal",
      preferredDate: startOfDay(req.body.preferredDate),
      preferredTime: req.body.preferredTime,
      expectedDuration: req.body.expectedDuration,
      numberOfVisitors: Number(req.body.numberOfVisitors),
      specialNotes: req.body.specialNotes?.trim() || "",
      status: "Pending",
    });

    const populated = await populateAppointment(Appointment.findById(appointment._id));
    const badge = await getVisitorBadge(req.user.id);

    res.status(201).json({
      message: "Appointment request submitted. Waiting for caregiver approval.",
      appointment: populated,
      visitorBadge: badge,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// List appointments (role-scoped) with optional filters
export const getAppointments = async (req, res) => {
  try {
    const { status, search, filter } = req.query;
    const query = {};

    if (req.user.role === "caregiver") {
      const elderIds = await caregiverElderIds(req.user.id);
      query.elder = { $in: elderIds };
    } else {
      query.visitor = req.user.id;
    }

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    if (status && status !== "All") {
      query.status = status;
    }

    if (filter === "today") {
      query.preferredDate = { $gte: todayStart, $lte: todayEnd };
    } else if (filter === "upcoming") {
      query.preferredDate = { $gte: todayStart };
      query.status = { $in: ["Pending", "Approved"] };
    }

    let appointments = await populateAppointment(
      Appointment.find(query).sort({ preferredDate: 1, preferredTime: 1 })
    );

    if (search?.trim()) {
      const q = search.trim().toLowerCase();
      appointments = appointments.filter((a) => {
        const dateStr = new Date(a.preferredDate).toISOString().slice(0, 10);
        return (
          a.visitorName?.toLowerCase().includes(q) ||
          a.purpose?.toLowerCase().includes(q) ||
          a.status?.toLowerCase().includes(q) ||
          a.elder?.fullName?.toLowerCase().includes(q) ||
          dateStr.includes(q)
        );
      });
    }

    const withMeta = await Promise.all(
      appointments.map(async (a) => {
        const obj = a.toObject();
        obj.visitorBadge = await getVisitorBadge(a.visitor?._id || a.visitor);
        const visitDate = startOfDay(a.preferredDate);
        const now = startOfDay(new Date());
        const diffDays = Math.round((visitDate - now) / (1000 * 60 * 60 * 24));
        obj.countdown =
          a.status === "Approved" || a.status === "Pending"
            ? diffDays > 0
              ? `Your visit is in ${diffDays} day${diffDays === 1 ? "" : "s"}`
              : diffDays === 0
                ? "Your visit is today"
                : "Visit date has passed"
            : null;
        return obj;
      })
    );

    res.json(withMeta);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await populateAppointment(
      Appointment.findById(req.params.id)
    );

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    if (req.user.role === "caregiver") {
      const elderIds = await caregiverElderIds(req.user.id);
      if (!elderIds.some((id) => id.toString() === appointment.elder._id.toString())) {
        return res.status(403).json({ message: "Access denied." });
      }
    } else if (appointment.visitor._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied." });
    }

    const obj = appointment.toObject();
    obj.visitorBadge = await getVisitorBadge(appointment.visitor._id);

    const visitDate = startOfDay(appointment.preferredDate);
    const now = startOfDay(new Date());
    const diffDays = Math.round((visitDate - now) / (1000 * 60 * 60 * 24));
    obj.countdown =
      appointment.status === "Approved" || appointment.status === "Pending"
        ? diffDays > 0
          ? `Your visit is in ${diffDays} day${diffDays === 1 ? "" : "s"}`
          : diffDays === 0
            ? "Your visit is today"
            : "Visit date has passed"
        : null;

    res.json(obj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAppointmentStats = async (req, res) => {
  try {
    const query = {};

    if (req.user.role === "caregiver") {
      const elderIds = await caregiverElderIds(req.user.id);
      query.elder = { $in: elderIds };
    } else {
      query.visitor = req.user.id;
    }

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const [pending, todayVisits, approvedToday, completed] = await Promise.all([
      Appointment.countDocuments({ ...query, status: "Pending" }),
      Appointment.countDocuments({
        ...query,
        preferredDate: { $gte: todayStart, $lte: todayEnd },
        status: { $in: ["Pending", "Approved"] },
      }),
      Appointment.countDocuments({
        ...query,
        status: "Approved",
        approvalTime: { $gte: todayStart, $lte: todayEnd },
      }),
      Appointment.countDocuments({ ...query, status: "Completed" }),
    ]);

    res.json({ pending, todayVisits, approvedToday, completed });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["Approved", "Rejected", "Completed", "Cancelled"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const appointment = await Appointment.findById(req.params.id).populate(
      "elder",
      "caregiver fullName"
    );

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    const isCaregiver = req.user.role === "caregiver";
    const isOwnerVisitor =
      appointment.visitor.toString() === req.user.id &&
      req.user.role === "family_member";

    if (isCaregiver) {
      if (appointment.elder.caregiver.toString() !== req.user.id) {
        return res.status(403).json({ message: "Access denied." });
      }
    } else if (isOwnerVisitor) {
      // Visitors may only cancel their own pending requests
      if (status !== "Cancelled" || appointment.status !== "Pending") {
        return res.status(403).json({
          message: "You can only cancel your own pending requests.",
        });
      }
    } else {
      return res.status(403).json({ message: "Access denied." });
    }

    // Conflict check when approving
    if (status === "Approved") {
      const conflict = await findSlotConflict({
        elder: appointment.elder._id,
        preferredDate: appointment.preferredDate,
        preferredTime: appointment.preferredTime,
        excludeId: appointment._id,
      });

      if (conflict) {
        return res.status(409).json({
          message: "This slot is already occupied.",
        });
      }

      appointment.approvedBy = req.user.id;
      appointment.approvalTime = new Date();
    }

    appointment.status = status;
    await appointment.save();

    const populated = await populateAppointment(
      Appointment.findById(appointment._id)
    );

    const messages = {
      Approved: "Appointment approved successfully.",
      Rejected: "Appointment has been rejected.",
      Completed: "Visit marked as completed.",
      Cancelled: "Appointment cancelled.",
    };

    res.json({
      message: messages[status],
      appointment: populated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Caregiver edit of appointment details
export const updateAppointment = async (req, res) => {
  try {
    if (req.user.role !== "caregiver") {
      return res.status(403).json({ message: "Only caregivers can edit appointments." });
    }

    const appointment = await Appointment.findById(req.params.id).populate(
      "elder",
      "caregiver"
    );

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    if (appointment.elder.caregiver.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied." });
    }

    if (["Completed", "Cancelled"].includes(appointment.status)) {
      return res.status(400).json({
        message: "Completed or cancelled appointments cannot be edited.",
      });
    }

    const editable = [
      "visitorName",
      "visitorEmail",
      "visitorPhone",
      "relation",
      "purpose",
      "priority",
      "preferredDate",
      "preferredTime",
      "expectedDuration",
      "numberOfVisitors",
      "specialNotes",
      "elder",
    ];

    const updates = {};
    for (const key of editable) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const merged = { ...appointment.toObject(), ...updates };
    const errors = validateAppointmentInput(merged);
    if (errors.length) {
      return res.status(400).json({ message: errors[0], errors });
    }

    if (updates.preferredDate || updates.preferredTime || updates.elder) {
      const conflict = await findSlotConflict({
        elder: updates.elder || appointment.elder._id,
        preferredDate: updates.preferredDate || appointment.preferredDate,
        preferredTime: updates.preferredTime || appointment.preferredTime,
        excludeId: appointment._id,
      });

      if (conflict) {
        return res.status(409).json({
          message: "This slot is already occupied.",
        });
      }
    }

    if (updates.preferredDate) {
      updates.preferredDate = startOfDay(updates.preferredDate);
    }

    Object.assign(appointment, updates);
    await appointment.save();

    const populated = await populateAppointment(
      Appointment.findById(appointment._id)
    );

    res.json({
      message: "Appointment updated successfully.",
      appointment: populated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
