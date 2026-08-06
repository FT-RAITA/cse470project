import mongoose from "mongoose";

const medicalReportSchema = new mongoose.Schema(
  {
    elder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Elder",
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    reportType: {
      type: String,
      enum: ["Prescription", "Blood Report", "ECG", "X-Ray", "PDF"],
      required: true,
    },
    originalName: String,
    fileName: {
      type: String,
      required: true,
    },
    mimeType: String,
    size: Number,
  },
  { timestamps: true }
);

medicalReportSchema.index({ elder: 1, createdAt: -1 });

export default mongoose.model("MedicalReport", medicalReportSchema);
