import mongoose from 'mongoose';

const moodCheckinSchema = new mongoose.Schema(
  {
    elder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Elder',
      required: true,
    },
    caregiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    overallMood: {
      type: String,
      enum: ['Great', 'Good', 'Okay', 'Low', 'Very Low'],
      required: true,
    },
    physicalCondition: {
      type: String,
      enum: ['Excellent', 'Good', 'Fair', 'Poor'],
      required: true,
    },
    energyLevel: {
      type: String,
      enum: ['High', 'Moderate', 'Low', 'Very Low'],
      required: true,
    },
    appetite: {
      type: String,
      enum: ['Normal', 'Increased', 'Decreased', 'None'],
      required: true,
    },
    issues: [String],
    notes: String,
  },
  { timestamps: true }
);


moodCheckinSchema.index({ elder: 1, date: -1 });

const MoodCheckin = mongoose.model('MoodCheckin', moodCheckinSchema);

export default MoodCheckin;