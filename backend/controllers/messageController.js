import Message from "../models/Message.js";
import Elder from "../models/elder.js";

// --------------------------------------------------
// Check whether two users are allowed to communicate
// through a specific elder
// --------------------------------------------------
export const canCommunicate = async (
  elderId,
  userId,
  otherUserId
) => {
  const elder = await Elder.findById(elderId);

  if (!elder) {
    return {
      allowed: false,
      message: "Elder not found.",
    };
  }

  const currentUserId = String(userId);
  const otherId = String(otherUserId);

  // ---------------------------------------------
  // Current user is the caregiver
  // ---------------------------------------------
  if (String(elder.caregiver) === currentUserId) {
    const familyMember = elder.familyMembers?.some(
      (member) =>
        String(member.user) === otherId
    );

    if (!familyMember) {
      return {
        allowed: false,
        message:
          "This family member is not connected to this elder.",
      };
    }

    return {
      allowed: true,
      elder,
    };
  }

  // ---------------------------------------------
  // Current user is a family member
  // ---------------------------------------------
  const currentFamilyMember =
    elder.familyMembers?.some(
      (member) =>
        String(member.user) === currentUserId
    );

  if (!currentFamilyMember) {
    return {
      allowed: false,
      message:
        "You are not connected to this elder.",
    };
  }

  // Family member can only communicate with
  // the elder's caregiver.
  if (String(elder.caregiver) !== otherId) {
    return {
      allowed: false,
      message:
        "You can only communicate with this elder's caregiver.",
    };
  }

  return {
    allowed: true,
    elder,
  };
};

// --------------------------------------------------
// Get previous messages
// GET /api/messages/:elderId/:otherUserId
// --------------------------------------------------
export const getMessages = async (req, res) => {
  try {
    const { elderId, otherUserId } = req.params;

    const access = await canCommunicate(
      elderId,
      req.user.id,
      otherUserId
    );

    if (!access.allowed) {
      return res.status(403).json({
        message: access.message,
      });
    }

    const messages = await Message.find({
      elder: elderId,

      $or: [
        {
          sender: req.user.id,
          receiver: otherUserId,
        },
        {
          sender: otherUserId,
          receiver: req.user.id,
        },
      ],
    })
      .populate("sender", "name email role")
      .populate("receiver", "name email role")
      .sort({ createdAt: 1 });

    return res.status(200).json(messages);
  } catch (error) {
    console.error("GET MESSAGES ERROR:", error);

    return res.status(500).json({
      message: "Failed to load messages.",
    });
  }
};

// --------------------------------------------------
// Send a message
// POST /api/messages
// body: { elder, receiver, text }
// --------------------------------------------------
export const sendMessage = async (req, res) => {
  try {
    const { elder: elderId, receiver, text } = req.body;

    if (!elderId || !receiver || !text?.trim()) {
      return res.status(400).json({
        message: "Elder, receiver, and message text are all required.",
      });
    }

    const access = await canCommunicate(elderId, req.user.id, receiver);

    if (!access.allowed) {
      return res.status(403).json({
        message: access.message,
      });
    }

    const message = await Message.create({
      elder: elderId,
      sender: req.user.id,
      receiver,
      text: text.trim(),
    });

    const populated = await Message.findById(message._id)
      .populate("sender", "name email role")
      .populate("receiver", "name email role");

    // If a Socket.IO instance is attached to the app, emit for real-time delivery.
    // This only fires if server.js/socket.js wires req.app.get("io") — safe no-op otherwise.
    const io = req.app.get("io");
    if (io) {
      io.emit("newMessage", populated);
    }

    return res.status(201).json(populated);
  } catch (error) {
    console.error("SEND MESSAGE ERROR:", error);

    return res.status(500).json({
      message: "Failed to send message.",
    });
  }
};