import DoctorAppointment from "../models/DoctorAppointment.js";
import Elder from "../models/elder.js";
import { autoCompleteRelatedTask } from "./taskController.js";
import { createNotification } from "../services/notificationService.js";

const findOwnedElder = (elderId, caregiverId) =>
  Elder.findOne({ _id: elderId, caregiver: caregiverId }).select("_id fullName elderID");

const populateAppointment = (query) =>
  query.populate("elder", "fullName elderID");

export const getDoctorAppointments = async (req, res) => {
  try {
    const elders = await Elder.find({ caregiver: req.user.id }).select("_id");
    const elderIds = elders.map((e) => e._id);

    const appointments = await populateAppointment(
      DoctorAppointment.find({ elder: { $in: elderIds } }).sort({ appointmentDate: 1 })
    );

    return res.json(appointments);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


export const getDoctorAppointmentsByElder = async (req, res) => {
  try {
    const { elderId } = req.params;

    const elder = await findOwnedElder(elderId, req.user.id);
    if (!elder) {
      return res.status(404).json({ message: "Elder not found" });
    }

    const appointments = await populateAppointment(
      DoctorAppointment.find({ elder: elder._id }).sort({ appointmentDate: 1 })
    );

    return res.json(appointments);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


export const createDoctorAppointment = async (req, res) => {
  try {
    const { elder: elderId, doctorName, reason, date, time, notes } = req.body;

    if (!elderId || !doctorName?.trim() || !reason?.trim() || !date || !time) {
      return res.status(400).json({
        message: "Elder, doctor's name, reason, date, and time are all required.",
      });
    }

    const elder = await findOwnedElder(elderId, req.user.id);
    if (!elder) {
      return res.status(404).json({ message: "Elder not found" });
    }

    const [hours, minutes] = time.split(":").map(Number);
    const appointmentDate = new Date(date);
    appointmentDate.setHours(hours, minutes, 0, 0);

    if (Number.isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ message: "Please provide a valid date and time." });
    }

    const created = await DoctorAppointment.create({
      caregiver: req.user.id,
      elder: elder._id,
      doctorName: doctorName.trim(),
      reason: reason.trim(),
      appointmentDate,
      notes: notes?.trim() || "",
    });

    const populated = await populateAppointment(
      DoctorAppointment.findById(created._id)
    );

    return res.status(201).json(populated);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};


export const updateDoctorAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Upcoming", "Completed", "Cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const appointment = await DoctorAppointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const elder = await findOwnedElder(appointment.elder, req.user.id);
    if (!elder) {
      return res.status(403).json({
        message: "You do not have permission to update this appointment.",
      });
    }

    appointment.status = status;
    await appointment.save();
    if (status === "Cancelled") {
      await createNotification({
        recipient: req.user.id,
        elder: elder._id,
        type: "doctor_appointment",
        severity: "warning",
        title: "Doctor appointment cancelled",
        message: `Dr. ${appointment.doctorName} appointment for ${elder.fullName} was cancelled.`,
        relatedType: "DoctorAppointment",
        relatedId: appointment._id,
        actionUrl: "/doctor-appointments",
        actionLabel: "Open appointments",
        dedupeKey: `doctor-${appointment._id}-cancelled`,
      });
    }
     if (status === "Completed") {
      await autoCompleteRelatedTask("DoctorAppointment", appointment._id);
    }

    const populated = await populateAppointment(
      DoctorAppointment.findById(appointment._id)
    );

    return res.json(populated);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};


export const deleteDoctorAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await DoctorAppointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const elder = await findOwnedElder(appointment.elder, req.user.id);
    if (!elder) {
      return res.status(403).json({
        message: "You do not have permission to delete this appointment.",
      });
    }

    await DoctorAppointment.findByIdAndDelete(id);
    return res.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};