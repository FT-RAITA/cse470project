import mongoose from "mongoose";

const medicationDoseLogSchema = new mongoose.Schema(
  {
    elder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Elder",
      required: true,
    },
    medication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medication",
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    scheduledTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Taken", "Missed", "Skipped"],
      default: "Pending",
    },
    markedAt: {
      type: Date,
      default: null,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

medicationDoseLogSchema.index(
  { medication: 1, scheduledDate: 1, scheduledTime: 1 },
  { unique: true }
);
medicationDoseLogSchema.index({ elder: 1, scheduledDate: -1 });
medicationDoseLogSchema.index({ elder: 1, status: 1 });

export default mongoose.model("MedicationDoseLog", medicationDoseLogSchema);
