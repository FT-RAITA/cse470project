import mongoose from "mongoose";

const handoverLogSchema = new mongoose.Schema(
  {
    summary: { type: String, trim: true, maxlength: 1000, default: "" },
    attentionNeeded: { type: String, trim: true, maxlength: 1000, default: "" },
    submittedAt: { type: Date, default: null },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { _id: false }
);

const shiftCoverageSchema = new mongoose.Schema(
  {
    swapRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CaregiverSwapRequest",
      required: true,
      index: true,
    },
    elder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Elder",
      required: true,
      index: true,
    },
    originalCaregiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coveringCaregiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    handoverLog: { type: handoverLogSchema, default: () => ({}) },
  },
  { timestamps: true }
);

shiftCoverageSchema.index({ swapRequest: 1, elder: 1 }, { unique: true });


shiftCoverageSchema.index({ coveringCaregiver: 1, startAt: 1, endAt: 1 });

export default mongoose.model("ShiftCoverage", shiftCoverageSchema);