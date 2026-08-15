import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    elder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Elder",
      required: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    activity: {
      type: String,
      required: true,
      trim: true,
    },

    duration: {
      type: Number,
      required: true,
      min: 1,
    },

    schedule: {
      type: Date,
      required: true,
    },

    completed: {
      type: Boolean,
      default: false,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Mirrors the complete_ex(): boolean operation in the Activity class diagram.
activitySchema.methods.complete_ex = function () {
  this.completed = true;
  this.completedAt = new Date();
  return this.completed;
};

activitySchema.index({ elder: 1, schedule: 1 });

const Activity = mongoose.model("Activity", activitySchema);

export default Activity;
