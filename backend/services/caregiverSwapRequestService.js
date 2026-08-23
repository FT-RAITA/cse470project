import CaregiverSchedule from "../models/caregiverSchedule.js";
import CaregiverSwapRequest from "../models/caregiverSwapRequest.js";
import User from "../models/user.js";
import { dateKeyToScheduleStart } from "./caregiverScheduleService.js";
import Elder from "../models/elder.js";
import { createCoverageForAcceptedSwap } from "./shiftCoverageService.js";

const serializeId = (value) => {
  if (!value) return null;
  return String(value?._id || value);
};

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const populateRequest = (query) =>
  query
    .populate("requester", "name email")
    .populate("receiver", "name email");

const validateSlotIndex = (value) =>
  Number.isInteger(value) && value >= 0 && value <= 5;

const getSchedule = async (dateKey) => {
  const scheduleDate = dateKeyToScheduleStart(dateKey);
  if (!scheduleDate) {
    throw createError("A valid schedule date is required.");
  }

  const schedule = await CaregiverSchedule.findOne({ scheduleDate });
  if (!schedule) {
    throw createError("Schedule not found.", 404);
  }

  if (schedule.scheduleDate <= new Date()) {
    throw createError("This schedule is no longer open for swap requests.");
  }

  return schedule;
};

const ensureCaregiver = async (userId) => {
  const caregiver = await User.findOne({ _id: userId, role: "caregiver" })
    .select("_id")
    .lean();

  if (!caregiver) {
    throw createError("Caregiver account not found.", 403);
  }

  return caregiver;
};

export const createSwapRequest = async ({
  dateKey,
  requesterId,
  expectedReceiverId,
  requesterSlotIndex,
  receiverSlotIndex,
}) => {
  if (
    !validateSlotIndex(requesterSlotIndex) ||
    !validateSlotIndex(receiverSlotIndex) ||
    requesterSlotIndex === receiverSlotIndex
  ) {
    throw createError("Choose two different valid schedule slots.");
  }

  await ensureCaregiver(requesterId);
  const schedule = await getSchedule(dateKey);

  const requesterSlot = schedule.slots[requesterSlotIndex];
  const receiverSlot = schedule.slots[receiverSlotIndex];

  if (serializeId(requesterSlot?.caregiver) !== String(requesterId)) {
    throw createError("You can only offer one of your own assigned slots.");
  }

  if (!receiverSlot?.caregiver) {
    throw createError("Swap requests can only be sent for another caregiver's assigned slot.");
  }

  const receiverId = serializeId(receiverSlot.caregiver);
  if (receiverId === String(requesterId)) {
    throw createError("Choose a slot assigned to another caregiver.");
  }

  if (!expectedReceiverId || receiverId !== String(expectedReceiverId)) {
    throw createError(
      "That slot changed ownership before your request was sent. Refresh the schedule and try again.",
      409
    );
  }

  await ensureCaregiver(receiverId);

  // Wait for the model index so the one-request-per-recipient rule is also
  // enforced at the database level under concurrent clicks.
  await CaregiverSwapRequest.init();

  try {
    const request = await CaregiverSwapRequest.create({
      schedule: schedule._id,
      scheduleDate: schedule.scheduleDate,
      requester: requesterId,
      receiver: receiverId,
      requesterSlotIndex,
      receiverSlotIndex,
      status: "pending",
    });

    return populateRequest(
      CaregiverSwapRequest.findById(request._id)
    ).lean();
  } catch (error) {
    if (error?.code === 11000) {
      throw createError(
        "You have already sent a swap request to this caregiver for this schedule.",
        409
      );
    }
    throw error;
  }
};

const requestIsStillValid = (request, schedule) => {
  const requesterSlot = schedule.slots[request.requesterSlotIndex];
  const receiverSlot = schedule.slots[request.receiverSlotIndex];

  return (
    serializeId(requesterSlot?.caregiver) === serializeId(request.requester) &&
    serializeId(receiverSlot?.caregiver) === serializeId(request.receiver)
  );
};

const recoverStaleProcessingRequests = async (caregiverId) => {
  const staleBefore = new Date(Date.now() - 2 * 60_000);

  await CaregiverSwapRequest.updateMany(
    {
      status: "processing",
      processingAt: { $lte: staleBefore },
      $or: [{ requester: caregiverId }, { receiver: caregiverId }],
    },
    {
      $set: { status: "pending", processingAt: null },
    }
  );
};

const expireInvalidPendingRequests = async (requests) => {
  if (!requests.length) return;

  const scheduleIds = [...new Set(requests.map((request) => String(request.schedule)))];
  const schedules = await CaregiverSchedule.find({ _id: { $in: scheduleIds } }).lean();
  const scheduleMap = new Map(
    schedules.map((schedule) => [String(schedule._id), schedule])
  );

  const staleIds = requests
    .filter((request) => {
      const schedule = scheduleMap.get(String(request.schedule));
      return (
        !schedule ||
        schedule.scheduleDate <= new Date() ||
        !requestIsStillValid(request, schedule)
      );
    })
    .map((request) => request._id);

  if (staleIds.length) {
    await CaregiverSwapRequest.updateMany(
      { _id: { $in: staleIds }, status: "pending" },
      { $set: { status: "expired", processingAt: null, respondedAt: new Date() } }
    );
  }
};

export const getSwapRequestsForCaregiver = async ({
  caregiverId,
  dateKey = null,
}) => {
  await ensureCaregiver(caregiverId);
  await recoverStaleProcessingRequests(caregiverId);

  const dateFilter = {};
  if (dateKey) {
    const scheduleDate = dateKeyToScheduleStart(dateKey);
    if (!scheduleDate) {
      throw createError("A valid schedule date is required.");
    }
    dateFilter.scheduleDate = scheduleDate;
  }

  const pendingForValidation = await CaregiverSwapRequest.find({
    ...dateFilter,
    status: "pending",
    $or: [{ requester: caregiverId }, { receiver: caregiverId }],
  }).lean();

  await expireInvalidPendingRequests(pendingForValidation);

  const [incoming, sent] = await Promise.all([
    populateRequest(
      CaregiverSwapRequest.find({
        ...dateFilter,
        receiver: caregiverId,
      }).sort({ createdAt: -1 })
    ).lean(),
    populateRequest(
      CaregiverSwapRequest.find({
        ...dateFilter,
        requester: caregiverId,
      }).sort({ createdAt: -1 })
    ).lean(),
  ]);

  return { incoming, sent };
};

export const acceptSwapRequest = async ({ requestId, receiverId }) => {
  await ensureCaregiver(receiverId);

  // Lock the request first. This means even two simultaneous Accept clicks
  // for the same request cannot both continue to the schedule update.
  const request = await CaregiverSwapRequest.findOneAndUpdate(
    {
      _id: requestId,
      receiver: receiverId,
      status: "pending",
    },
    {
      $set: { status: "processing", processingAt: new Date() },
    },
    { new: true }
  );

  if (!request) {
    const current = await CaregiverSwapRequest.findById(requestId).lean();
    if (!current) throw createError("Swap request not found.", 404);
    if (serializeId(current.receiver) !== String(receiverId)) {
      throw createError("You cannot respond to this swap request.", 403);
    }
    throw createError(
      current.status === "accepted"
        ? "This swap request was already accepted."
        : current.status === "rejected"
          ? "This swap request was already rejected."
          : current.status === "expired"
            ? "This swap request is no longer valid."
            : "This swap request is already being processed.",
      409
    );
  }

  try {
    const schedule = await CaregiverSchedule.findById(request.schedule);

    if (!schedule || schedule.scheduleDate <= new Date()) {
      await CaregiverSwapRequest.updateOne(
        { _id: request._id, status: "processing" },
        { $set: { status: "expired", processingAt: null, respondedAt: new Date() } }
      );
      throw createError("This swap request is no longer valid.", 409);
    }

    const requesterId = serializeId(request.requester);
    const lockedReceiverId = serializeId(request.receiver);

    const requesterSlot = schedule.slots[request.requesterSlotIndex];
    const receiverSlot = schedule.slots[request.receiverSlotIndex];

    if (
      serializeId(requesterSlot?.caregiver) !== requesterId ||
      serializeId(receiverSlot?.caregiver) !== lockedReceiverId
    ) {
      await CaregiverSwapRequest.updateOne(
        { _id: request._id, status: "processing" },
        { $set: { status: "expired", processingAt: null, respondedAt: new Date() } }
      );
      throw createError(
        "The schedule changed after this request was sent, so the request has expired.",
        409
      );
    }

    const nextSlots = schedule.slots.map((slot) => ({ ...slot.toObject() }));
    const nextRequesterSlot = nextSlots[request.requesterSlotIndex];
    const nextReceiverSlot = nextSlots[request.receiverSlotIndex];

    nextRequesterSlot.caregiver = lockedReceiverId;
    nextReceiverSlot.caregiver = requesterId;
    nextRequesterSlot.switchCount = Number(nextRequesterSlot.switchCount || 0) + 1;
    nextReceiverSlot.switchCount = Number(nextReceiverSlot.switchCount || 0) + 1;

    const expectedVersion = schedule.__v;

    // This is the race-condition guard. The update succeeds only if:
    // 1) the schedule version is unchanged,
    // 2) the requester still owns the offered slot, and
    // 3) the receiver still owns the requested slot.
    // Therefore two accepted requests cannot silently overwrite one another.
    const updatedSchedule = await CaregiverSchedule.findOneAndUpdate(
      {
        _id: schedule._id,
        __v: expectedVersion,
        $and: [
          {
            slots: {
              $elemMatch: {
                slotIndex: request.requesterSlotIndex,
                caregiver: request.requester,
              },
            },
          },
          {
            slots: {
              $elemMatch: {
                slotIndex: request.receiverSlotIndex,
                caregiver: request.receiver,
              },
            },
          },
        ],
      },
      {
        $set: {
          slots: nextSlots,
          status: nextSlots.every((slot) => slot.caregiver)
            ? "generated"
            : "needs-caregivers",
        },
        $push: {
          switchHistory: {
            fromSlotIndex: request.requesterSlotIndex,
            toSlotIndex: request.receiverSlotIndex,
            actorCaregiver: request.requester,
            fromCaregiver: request.requester,
            toCaregiver: request.receiver,
          },
        },
        $inc: { __v: 1 },
      },
      { new: true }
    );

    if (!updatedSchedule) {
      await CaregiverSwapRequest.updateOne(
        { _id: request._id, status: "processing" },
        { $set: { status: "expired", processingAt: null, respondedAt: new Date() } }
      );
      throw createError(
        "Another schedule change happened first. This request has expired; refresh the schedule.",
        409
      );
    }
   //turn the requester's elders into "temporary elders" for the duration of shift
    await createCoverageForAcceptedSwap({
      swapRequestId: request._id,
      requesterId,
      receiverId: lockedReceiverId,
      slotStartAt: requesterSlot.startAt,
      slotEndAt: requesterSlot.endAt,
      Elder,
    });

    await CaregiverSwapRequest.updateOne(
      { _id: request._id, status: "processing" },
      {
        $set: {
          status: "accepted",
          processingAt: null,
          respondedAt: new Date(),
        },
      }
    );
    await CaregiverSwapRequest.updateOne(
      { _id: request._id, status: "processing" },
      {
        $set: {
          status: "accepted",
          processingAt: null,
          respondedAt: new Date(),
        },
      }
    );

    // Any other pending request involving either changed physical slot was
    // based on ownership that is no longer true, so expire it immediately.
    await CaregiverSwapRequest.updateMany(
      {
        _id: { $ne: request._id },
        schedule: schedule._id,
        status: "pending",
        $or: [
          { requesterSlotIndex: { $in: [request.requesterSlotIndex, request.receiverSlotIndex] } },
          { receiverSlotIndex: { $in: [request.requesterSlotIndex, request.receiverSlotIndex] } },
        ],
      },
      { $set: { status: "expired", processingAt: null, respondedAt: new Date() } }
    );

    return {
      request: await populateRequest(
        CaregiverSwapRequest.findById(request._id)
      ).lean(),
      schedule: updatedSchedule,
    };
  } catch (error) {
    // Only release a processing lock for unexpected failures where the
    // request has not already been deliberately accepted/expired.
    if (!error?.statusCode) {
      await CaregiverSwapRequest.updateOne(
        { _id: request._id, status: "processing" },
        { $set: { status: "pending", processingAt: null } }
      );
    }
    throw error;
  }
};

export const rejectSwapRequest = async ({ requestId, receiverId }) => {
  await ensureCaregiver(receiverId);

  const request = await populateRequest(
    CaregiverSwapRequest.findOneAndUpdate(
      {
        _id: requestId,
        receiver: receiverId,
        status: "pending",
      },
      {
        $set: {
          status: "rejected",
          processingAt: null,
          respondedAt: new Date(),
        },
      },
      { new: true }
    )
  ).lean();

  if (!request) {
    const current = await CaregiverSwapRequest.findById(requestId).lean();
    if (!current) throw createError("Swap request not found.", 404);
    if (serializeId(current.receiver) !== String(receiverId)) {
      throw createError("You cannot respond to this swap request.", 403);
    }
    throw createError("This swap request has already been handled.", 409);
  }

  return request;
};
export const submitHandoverLog = async ({ requestId, requesterId, summary, attentionNeeded }) => {
  const request = await CaregiverSwapRequest.findOne({
    _id: requestId,
    requester: requesterId,
  });

  if (!request) throw createError("Swap request not found.", 404);
  if (request.status !== "accepted") {
    throw createError("A handover log can only be added once the swap is accepted.");
  }

  request.handoverLog = {
    summary: summary?.trim() || "",
    attentionNeeded: attentionNeeded?.trim() || "",
    submittedAt: new Date(),
    submittedBy: requesterId,
  };
  await request.save();

  return populateRequest(CaregiverSwapRequest.findById(request._id)).lean();
};