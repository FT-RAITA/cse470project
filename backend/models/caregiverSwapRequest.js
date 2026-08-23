import mongoose from "mongoose";

const caregiverSwapRequestSchema = new mongoose.Schema(
  {
    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CaregiverSchedule",
      required: true,
      index: true,
    },
    scheduleDate: {
      type: Date,
      required: true,
      index: true,
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    requesterSlotIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
    receiverSlotIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "accepted", "rejected", "expired"],
      default: "pending",
      index: true,
    },
    processingAt: {
      type: Date,
      default: null,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// A caregiver may send many requests on the same schedule, but never more
// than one request to the same caregiver for that schedule.
caregiverSwapRequestSchema.index(
  { schedule: 1, requester: 1, receiver: 1 },
  { unique: true }
);

export default mongoose.model("CaregiverSwapRequest", caregiverSwapRequestSchema);
