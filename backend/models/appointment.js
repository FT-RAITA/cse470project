import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    visitor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    elder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Elder",
      required: true,
    },

    purpose: {
      type: String,
      required: true,
      trim: true,
    },

    appointmentDateTime: {
      type: Date,
      required: true,
    },

    durationMinutes: {
      type: Number,
      default: 60,
      enum: [30, 60, 90, 120],
    },

    specialNotes: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Rejected",
        "Completed",
        "Cancelled",
      ],
      default: "Pending",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvalTime: {
      type: Date,
      default: null,
    },

    caregiverResponse: {
      type: String,
      default: "",
      trim: true,
    },

    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },

    cancelledBy: {
      type: String,
      enum: ["Visitor", "Caregiver", null],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

appointmentSchema.index({
  elder: 1,
  appointmentDateTime: 1,
});

appointmentSchema.index({
  visitor: 1,
  createdAt: -1,
});

appointmentSchema.index({
  status: 1,
  appointmentDateTime: 1,
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;