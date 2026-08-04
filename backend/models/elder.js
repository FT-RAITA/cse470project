import mongoose from 'mongoose';

const medicalHistorySchema = new mongoose.Schema({
    condition: {
        type: String,
        required: true,
    },
    diagnosisDate: Date,
    notes: String,
});

const emergencyContactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    relation: String,
    phone: {
        type: String,
        required: true,
    },
});

const nutritionPlanSchema = new mongoose.Schema({
  dietType: String,
  calorieGoal: Number,
  waterGoal: Number,
  proteinGoal: Number,
  restrictions: [String],
  supplements: [String],
});

const elderSchema = new mongoose.Schema(
{
    caregiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    fullName: {
        type: String,
        required: true,
    },

    age: Number,
    dateOfBirth: Date,

    gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
    },

    bloodGroup: {
        type: String,
        enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },

    phone: String,
    address: String,

    medicalHistory: [medicalHistorySchema],

    allergies: [String],

    chronicDiseases: [String],

    emergencyContacts: [emergencyContactSchema],

   
    nutritionPlan: nutritionPlanSchema,
},
{
    timestamps: true,
});

const Elder = mongoose.model("Elder", elderSchema);

export default Elder;