import mongoose from "mongoose";

const medicalRecordSchema = new mongoose.Schema(
  {
    elder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Elder",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      enum: ["Vitals", "Diagnosis", "Allergy", "Checkup", "Medication", "General"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["Active", "Resolved", "Monitoring", "Critical"],
      default: "Active",
    },
    bpSystolic: Number,
    bpDiastolic: Number,
    weight: Number,
    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

medicalRecordSchema.index({ elder: 1, recordedAt: -1 });
medicalRecordSchema.index({ elder: 1, category: 1 });

export default mongoose.model("MedicalRecord", medicalRecordSchema);
