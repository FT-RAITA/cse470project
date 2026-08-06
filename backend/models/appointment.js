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

    visitorName: {
      type: String,
      required: true,
      trim: true,
    },

    visitorEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    visitorPhone: {
      type: String,
      required: true,
      trim: true,
    },

    relation: {
      type: String,
      required: true,
      enum: [
        "Son",
        "Daughter",
        "Spouse",
        "Sibling",
        "Grandchild",
        "Friend",
        "Relative",
        "Other",
      ],
    },

    purpose: {
      type: String,
      required: true,
      trim: true,
    },

    priority: {
      type: String,
      enum: ["Normal", "Important", "Emergency Request"],
      default: "Normal",
    },

    preferredDate: {
      type: Date,
      required: true,
    },

    preferredTime: {
      type: String,
      required: true,
    },

    expectedDuration: {
      type: String,
      required: true,
      enum: ["30 minutes", "1 hour", "1.5 hours", "2 hours"],
    },

    numberOfVisitors: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    specialNotes: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Completed", "Cancelled"],
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
  },
  { timestamps: true }
);

appointmentSchema.index({ elder: 1, preferredDate: 1, preferredTime: 1, status: 1 });
appointmentSchema.index({ visitor: 1, createdAt: -1 });
appointmentSchema.index({ status: 1, preferredDate: 1 });

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
