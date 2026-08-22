import mongoose from "mongoose";

const caregiverScheduleSettingsSchema = new mongoose.Schema(
  {
    caregiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    schedulerAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("CaregiverScheduleSettings", caregiverScheduleSettingsSchema);
