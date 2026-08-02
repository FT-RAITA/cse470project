import MoodCheckin from '../models/MoodCheckin.js';
import Elder from '../models/elder.js';

//  elder belongs to this caregiver 
const assertElderOwnership = async (elderId, caregiverId) => {
  const elder = await Elder.findOne({ _id: elderId, caregiver: caregiverId });
  return elder;
};

// Create a mood check-in for an elder
export const createMoodCheckin = async (req, res) => {
  try {
    const { id } = req.params; 
    const caregiver = req.user.id;

    const elder = await assertElderOwnership(id, caregiver);
    if (!elder) {
      return res.status(404).json({ message: 'Elder not found' });
    }

    const { date, overallMood, physicalCondition, energyLevel, appetite, issues, notes } = req.body;

    const checkin = new MoodCheckin({
      elder: id,
      caregiver,
      date: date || Date.now(),
      overallMood,
      physicalCondition,
      energyLevel,
      appetite,
      issues,
      notes,
    });

    const saved = await checkin.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// mood check-in history
export const getMoodCheckins = async (req, res) => {
  try {
    const { id } = req.params; 
    const caregiver = req.user.id;

    const elder = await assertElderOwnership(id, caregiver);
    if (!elder) {
      return res.status(404).json({ message: 'Elder not found' });
    }

    const checkins = await MoodCheckin.find({ elder: id }).sort({ date: -1 });
    res.json(checkins);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get a single check-in
export const getMoodCheckinById = async (req, res) => {
  try {
    const { checkinId } = req.params;
    const caregiver = req.user.id;

    const checkin = await MoodCheckin.findOne({ _id: checkinId, caregiver });
    if (!checkin) {
      return res.status(404).json({ message: 'Check-in not found' });
    }
    res.json(checkin);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a check-in
export const deleteMoodCheckin = async (req, res) => {
  try {
    const { checkinId } = req.params;
    const caregiver = req.user.id;

    const deleted = await MoodCheckin.findOneAndDelete({ _id: checkinId, caregiver });
    if (!deleted) {
      return res.status(404).json({ message: 'Check-in not found' });
    }
    res.json({ message: 'Check-in deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};