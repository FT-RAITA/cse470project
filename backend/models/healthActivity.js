import mongoose from "mongoose";

const healthActivitySchema = new mongoose.Schema(
  {
    elder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Elder",
      required: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "record_added",
        "record_updated",
        "medication_added",
        "medication_updated",
        "allergy_added",
        "diagnosis_added",
        "vitals_updated",
        "report_uploaded",
        "report_deleted",
        "general",
      ],
      default: "general",
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

healthActivitySchema.index({ elder: 1, createdAt: -1 });

export default mongoose.model("HealthActivity", healthActivitySchema);
