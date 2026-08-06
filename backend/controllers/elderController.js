import Elder from '../models/elder.js';

// Create a new elder
export const createElder = async (req, res) => {
  try {
    const { fullName, age, dateOfBirth, gender, bloodGroup, phone, address, medicalHistory, allergies, chronicDiseases, emergencyContacts, nutritionPlan } = req.body;
    const caregiver = req.user.id;
    const elderID = `ELD-${Date.now().toString().slice(-6)}`;
    const newElder = new Elder({  elderID, caregiver, fullName, age, dateOfBirth, gender, bloodGroup, phone, address, medicalHistory, allergies, chronicDiseases, emergencyContacts, nutritionPlan });
    const savedElder = await newElder.save();
    res.status(201).json(savedElder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateElder = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedElder = await Elder.findByIdAndUpdate({ _id: id, caregiver: req.user.id }, req.body, { new: true, runValidators: true });
    if (!updatedElder) {
      return res.status(404).json({ message: 'Elder not found' });
    }
    res.json(updatedElder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteElder = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedElder = await Elder.findByIdAndDelete({ _id: id, caregiver: req.user.id });
    if (!deletedElder) {
      return res.status(404).json({ message: 'Elder not found' });
    }
    res.json({ message: 'Elder deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getElderById = async (req, res) => {
  try {
    const { id } = req.params;
    const elder = await Elder.findOne({ _id: id , caregiver: req.user.id }).populate('caregiver', 'name email phone');
    if (!elder) {
      return res.status(404).json({ message: 'Elder not found' });
    }
    res.json(elder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllElders = async (req, res) => {
  try {
    const elders = await Elder.find({ caregiver: req.user.id }).sort({ createdAt: -1 });
    res.json(elders);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
