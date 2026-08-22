import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Message from "../models/Message.js";
import {
  canCommunicate,
} from "../controllers/messageController.js";

// --------------------------------------------------
// Authenticate Socket.IO connection using JWT
// --------------------------------------------------
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(
        new Error("Authentication required.")
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(
      decoded.id
    ).select("-password");

    if (!user) {
      return next(
        new Error("User not found.")
      );
    }

    socket.user = user;

    next();
  } catch (error) {
    console.error(
      "SOCKET AUTH ERROR:",
      error.message
    );

    next(
      new Error("Invalid authentication token.")
    );
  }
};

// --------------------------------------------------
// Generate unique room for two users + elder
// --------------------------------------------------
const getConversationRoom = (
  elderId,
  userA,
  userB
) => {
  const users = [
    String(userA),
    String(userB),
  ].sort();

  return `chat:${elderId}:${users[0]}:${users[1]}`;
};

// --------------------------------------------------
// Initialize Socket.IO
// --------------------------------------------------
export const initializeSocket = (io) => {
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    console.log(
      `Socket connected: ${socket.user.name}`
    );

    // ----------------------------------------------
    // Join a conversation
    // ----------------------------------------------
    socket.on(
      "join_conversation",
      async ({ elderId, otherUserId }) => {
        try {
          if (!elderId || !otherUserId) {
            socket.emit("chat_error", {
              message:
                "Elder ID and other user ID are required.",
            });

            return;
          }

          const access =
            await canCommunicate(
              elderId,
              socket.user._id,
              otherUserId
            );

          if (!access.allowed) {
            socket.emit("chat_error", {
              message: access.message,
            });

            return;
          }

          const room =
            getConversationRoom(
              elderId,
              socket.user._id,
              otherUserId
            );

          socket.join(room);

          socket.currentRoom = room;
          socket.currentElderId = elderId;
          socket.currentOtherUserId =
            otherUserId;

          console.log(
            `${socket.user.name} joined ${room}`
          );

          socket.emit(
            "conversation_joined",
            {
              room,
            }
          );
        } catch (error) {
          console.error(
            "JOIN CONVERSATION ERROR:",
            error
          );

          socket.emit("chat_error", {
            message:
              "Could not join conversation.",
          });
        }
      }
    );

    // ----------------------------------------------
    // Send message
    // ----------------------------------------------
    socket.on(
      "send_message",
      async ({
        elderId,
        receiverId,
        text,
      }) => {
        try {
          if (!elderId || !receiverId) {
            socket.emit("chat_error", {
              message:
                "Elder and receiver are required.",
            });

            return;
          }

          if (
            !text ||
            !text.trim()
          ) {
            socket.emit("chat_error", {
              message:
                "Message cannot be empty.",
            });

            return;
          }

          const cleanText =
            text.trim();

          // ----------------------------------------
          // SECURITY CHECK
          // ----------------------------------------
          const access =
            await canCommunicate(
              elderId,
              socket.user._id,
              receiverId
            );

          if (!access.allowed) {
            socket.emit("chat_error", {
              message: access.message,
            });

            return;
          }

          // ----------------------------------------
          // Save message
          // ----------------------------------------
          const message =
            await Message.create({
              elder: elderId,
              sender: socket.user._id,
              receiver: receiverId,
              text: cleanText,
            });

          // ----------------------------------------
          // Populate sender/receiver
          // ----------------------------------------
          const populatedMessage =
            await Message.findById(
              message._id
            )
              .populate(
                "sender",
                "name email role"
              )
              .populate(
                "receiver",
                "name email role"
              );

          // ----------------------------------------
          // Get conversation room
          // ----------------------------------------
          const room =
            getConversationRoom(
              elderId,
              socket.user._id,
              receiverId
            );

          // ----------------------------------------
          // Send to everyone in conversation
          // ----------------------------------------
          io.to(room).emit(
            "new_message",
            populatedMessage
          );

          console.log(
            `Message sent by ${socket.user.name}`
          );
        } catch (error) {
          console.error(
            "SEND MESSAGE ERROR:",
            error
          );

          socket.emit("chat_error", {
            message:
              "Could not send message.",
          });
        }
      }
    );

    // ----------------------------------------------
    // Typing indicator
    // ----------------------------------------------
    socket.on(
      "typing",
      ({ elderId, receiverId }) => {
        if (!elderId || !receiverId) {
          return;
        }

        const room =
          getConversationRoom(
            elderId,
            socket.user._id,
            receiverId
          );

        socket.to(room).emit(
          "user_typing",
          {
            userId: socket.user._id,
          }
        );
      }
    );

    // ----------------------------------------------
    // Stop typing
    // ----------------------------------------------
    socket.on(
      "stop_typing",
      ({ elderId, receiverId }) => {
        if (!elderId || !receiverId) {
          return;
        }

        const room =
          getConversationRoom(
            elderId,
            socket.user._id,
            receiverId
          );

        socket.to(room).emit(
          "user_stopped_typing",
          {
            userId: socket.user._id,
          }
        );
      }
    );

    // ----------------------------------------------
    // Disconnect
    // ----------------------------------------------
    socket.on("disconnect", () => {
      console.log(
        `Socket disconnected: ${socket.user.name}`
      );
    });
  });
};