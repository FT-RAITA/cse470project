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

const DURATIONS = [30, 60, 90, 120];
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

const combineDateAndTime = (date, time) => {
  const [hours, minutes] = time.split(":").map(Number);
  const combined = new Date(date);
  combined.setHours(hours, minutes, 0, 0);
  return combined;
};

const validateCreateInput = (body) => {
  const errors = [];

  if (!body.elder) errors.push("Please select an elder.");
  if (!body.purpose?.trim()) errors.push("Purpose of visit is required.");
  if (!body.date) errors.push("Preferred date is required.");
  else if (isPastDate(body.date)) errors.push("Date cannot be in the past.");
  if (!body.time) errors.push("Preferred time is required.");
  else if (!TIME_SLOTS.includes(body.time)) {
    errors.push("Please select a valid time slot.");
  }
  if (body.durationMinutes && !DURATIONS.includes(Number(body.durationMinutes))) {
    errors.push("Please select a valid duration.");
  }

  return errors;
};

const findSlotConflict = async ({ elder, appointmentDateTime, excludeId = null }) => {
  const query = {
    elder,
    appointmentDateTime,
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

const withCountdown = (appointment) => {
  const obj = appointment.toObject ? appointment.toObject() : appointment;
  const visitDate = startOfDay(obj.appointmentDateTime);
  const now = startOfDay(new Date());
  const diffDays = Math.round((visitDate - now) / (1000 * 60 * 60 * 24));
  obj.countdown =
    obj.status === "Approved" || obj.status === "Pending"
      ? diffDays > 0
        ? `Your visit is in ${diffDays} day${diffDays === 1 ? "" : "s"}`
        : diffDays === 0
          ? "Your visit is today"
          : "Visit date has passed"
      : null;
  return obj;
};

export const getBookableElders = async (req, res) => {
  try {
    let elders;

    if (req.user.role === "caregiver") {
      elders = await Elder.find({ caregiver: req.user.id })
        .select("fullName age gender")
        .sort({ fullName: 1 });
    } else {
      elders = await Elder.find({ "familyMembers.user": req.user.id })
        .select("fullName age gender")
        .sort({ fullName: 1 });
    }

    res.json(elders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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
      appointmentDateTime: { $gte: startOfDay(date), $lte: endOfDay(date) },
      status: { $in: ACTIVE_SLOT_STATUSES },
    }).select("appointmentDateTime status");

    const bookedTimes = new Set(
      booked.map((a) => {
        const d = new Date(a.appointmentDateTime);
        return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      })
    );

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

export const createAppointment = async (req, res) => {
  try {
    const errors = validateCreateInput(req.body);
    if (errors.length) {
      return res.status(400).json({ message: errors[0], errors });
    }

    const elder = await Elder.findById(req.body.elder);
    if (!elder) {
      return res.status(404).json({ message: "Elder not found." });
    }

    if (req.user.role === "caregiver") {
      if (elder.caregiver.toString() !== req.user.id) {
        return res.status(403).json({ message: "You can only book visits for your elders." });
      }
    } else {
      const connected = elder.familyMembers.some(
        (m) => m.user.toString() === req.user.id
      );
      if (!connected) {
        return res.status(403).json({ message: "You're not connected to this elder." });
      }
    }

    const appointmentDateTime = combineDateAndTime(req.body.date, req.body.time);

    const conflict = await findSlotConflict({ elder: req.body.elder, appointmentDateTime });
    if (conflict) {
      return res.status(409).json({
        message: "This slot is already occupied.",
      });
    }

    const duplicate = await Appointment.findOne({
      visitor: req.user.id,
      elder: req.body.elder,
      appointmentDateTime,
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
      purpose: req.body.purpose.trim(),
      appointmentDateTime,
      durationMinutes: req.body.durationMinutes || 60,
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
      query.appointmentDateTime = { $gte: todayStart, $lte: todayEnd };
    } else if (filter === "upcoming") {
      query.appointmentDateTime = { $gte: todayStart };
      query.status = { $in: ["Pending", "Approved"] };
    }

    let appointments = await populateAppointment(
      Appointment.find(query).sort({ appointmentDateTime: 1 })
    );

    if (search?.trim()) {
      const q = search.trim().toLowerCase();
      appointments = appointments.filter((a) => {
        const dateStr = new Date(a.appointmentDateTime).toISOString().slice(0, 10);
        return (
          a.purpose?.toLowerCase().includes(q) ||
          a.status?.toLowerCase().includes(q) ||
          a.elder?.fullName?.toLowerCase().includes(q) ||
          a.visitor?.name?.toLowerCase().includes(q) ||
          dateStr.includes(q)
        );
      });
    }

    const withMeta = await Promise.all(
      appointments.map(async (a) => {
        const obj = withCountdown(a);
        obj.visitorBadge = await getVisitorBadge(a.visitor?._id || a.visitor);
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

    const obj = withCountdown(appointment);
    obj.visitorBadge = await getVisitorBadge(appointment.visitor._id);

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
        appointmentDateTime: { $gte: todayStart, $lte: todayEnd },
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
    const { status, caregiverResponse, rejectionReason } = req.body;
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
      if (status !== "Cancelled" || appointment.status !== "Pending") {
        return res.status(403).json({
          message: "You can only cancel your own pending requests.",
        });
      }
    } else {
      return res.status(403).json({ message: "Access denied." });
    }

    if (status === "Approved") {
      const conflict = await findSlotConflict({
        elder: appointment.elder._id,
        appointmentDateTime: appointment.appointmentDateTime,
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

    if (status === "Cancelled") {
      appointment.cancelledBy = isCaregiver ? "Caregiver" : "Visitor";
    }
    if (status === "Rejected" && rejectionReason) {
      appointment.rejectionReason = rejectionReason.trim();
    }
    if (caregiverResponse) {
      appointment.caregiverResponse = caregiverResponse.trim();
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

    if (req.body.purpose !== undefined) {
      appointment.purpose = req.body.purpose.trim();
    }
    if (req.body.durationMinutes !== undefined) {
      if (!DURATIONS.includes(Number(req.body.durationMinutes))) {
        return res.status(400).json({ message: "Please select a valid duration." });
      }
      appointment.durationMinutes = Number(req.body.durationMinutes);
    }
    if (req.body.specialNotes !== undefined) {
      appointment.specialNotes = req.body.specialNotes.trim();
    }
    if (req.body.elder !== undefined) {
      appointment.elder = req.body.elder;
    }

    if (req.body.date || req.body.time) {
      if (!req.body.date || !req.body.time) {
        return res.status(400).json({
          message: "Provide both date and time together to reschedule.",
        });
      }
      if (isPastDate(req.body.date)) {
        return res.status(400).json({ message: "Date cannot be in the past." });
      }
      if (!TIME_SLOTS.includes(req.body.time)) {
        return res.status(400).json({ message: "Please select a valid time slot." });
      }

      const newDateTime = combineDateAndTime(req.body.date, req.body.time);
      const conflict = await findSlotConflict({
        elder: req.body.elder || appointment.elder._id,
        appointmentDateTime: newDateTime,
        excludeId: appointment._id,
      });

      if (conflict) {
        return res.status(409).json({
          message: "This slot is already occupied.",
        });
      }

      appointment.appointmentDateTime = newDateTime;
    }

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
