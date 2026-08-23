import {
  acceptSwapRequest,
  createSwapRequest,
  getSwapRequestsForCaregiver,
  rejectSwapRequest,
} from "../services/caregiverSwapRequestService.js";

const normalizeDate = (value) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : null;

const sendError = (res, error) =>
  res.status(error.statusCode || 400).json({ message: error.message });

export const getMySwapRequests = async (req, res) => {
  try {
    const date = req.query.date ? normalizeDate(req.query.date) : null;
    if (req.query.date && !date) {
      return res.status(400).json({ message: "A valid schedule date is required." });
    }

    const requests = await getSwapRequestsForCaregiver({
      caregiverId: req.user._id,
      dateKey: date,
    });

    res.json(requests);
  } catch (error) {
    sendError(res, error);
  }
};

export const createCaregiverSwapRequest = async (req, res) => {
  try {
    const date = normalizeDate(req.body.date);
    if (!date) {
      return res.status(400).json({ message: "A valid schedule date is required." });
    }

    const request = await createSwapRequest({
      dateKey: date,
      requesterId: req.user._id,
      expectedReceiverId: req.body.receiverId,
      requesterSlotIndex: Number(req.body.requesterSlotIndex),
      receiverSlotIndex: Number(req.body.receiverSlotIndex),
    });

    res.status(201).json({ request });
  } catch (error) {
    sendError(res, error);
  }
};

export const acceptCaregiverSwapRequest = async (req, res) => {
  try {
    const result = await acceptSwapRequest({
      requestId: req.params.id,
      receiverId: req.user._id,
    });

    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
};

export const rejectCaregiverSwapRequest = async (req, res) => {
  try {
    const request = await rejectSwapRequest({
      requestId: req.params.id,
      receiverId: req.user._id,
    });

    res.json({ request });
  } catch (error) {
    sendError(res, error);
  }
};
