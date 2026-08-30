import { useEffect, useState, useRef, useMemo } from "react";
import toast from "react-hot-toast";
import { Send, MessageCircle } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { getMessages, sendMessage } from "../services/messageService";
import {
  socket,
  connectSocket,
} from "../services/socket";

function resolveOtherUserId(elder, user) {
  if (!elder || !user) return null;

  if (user.role === "caregiver") {
    const member = elder.familyMembers?.[0];
    return member?.user?._id || member?.user || null;
  }

  // family_member
  return elder.caregiver?._id || elder.caregiver?.id || elder.caregiver || null;
}

export default function Chat({ elder }) {
  const { token, user } = useAuth();
  const elderId = elder?._id;
  const otherUserId = useMemo(() => resolveOtherUserId(elder, user), [elder, user]);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  // -----------------------------------------
  // Load existing messages + connect socket
  // -----------------------------------------
  useEffect(() => {
    if (!token || !elderId || !otherUserId) {
      setLoading(false);
      return;
    }

    loadMessages();

    connectSocket(token);

    const handleNewMessage = (message) => {
      // Only add messages belonging to this elder's conversation
      if (String(message.elder) !== String(elderId)) {
        return;
      }

      setMessages((prev) => {
        // Prevent duplicate messages
        if (
          prev.some(
            (existing) => String(existing._id) === String(message._id)
          )
        ) {
          return prev;
        }

        return [...prev, message];
      });
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [elderId, otherUserId, token]);

  // -----------------------------------------
  // Load previous messages
  // -----------------------------------------
  const loadMessages = async () => {
    try {
      setLoading(true);

      const response = await getMessages(elderId, otherUserId, token);

      setMessages(response.data);
    } catch (error) {
      console.error("LOAD MESSAGES ERROR:", error);

      toast.error(
        error.response?.data?.message ||
          "Could not load messages."
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------
  // Scroll to newest message
  // -----------------------------------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // -----------------------------------------
  // Send message
  // -----------------------------------------
  const handleSend = async (e) => {
    e.preventDefault();

    const trimmedText = text.trim();

    if (!trimmedText || sending || !otherUserId) return;

    try {
      setSending(true);

      const response = await sendMessage(
        elderId,
        otherUserId,
        trimmedText,
        token
      );

      /*
       * If your backend emits the message through Socket.IO,
       * we DON'T manually add it here.
       *
       * The "newMessage" socket event will add it.
       */

      // If backend does NOT emit through socket,
      // the response still lets us display it.
      if (response.data) {
        setMessages((prev) => {
          if (
            prev.some(
              (message) =>
                String(message._id) ===
                String(response.data._id)
            )
          ) {
            return prev;
          }

          return [...prev, response.data];
        });
      }

      setText("");
    } catch (error) {
      console.error("SEND MESSAGE ERROR:", error);

      toast.error(
        error.response?.data?.message ||
          "Could not send message."
      );
    } finally {
      setSending(false);
    }
  };

  if (!otherUserId) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center rounded-xl border border-border bg-paper-card text-center">
        <MessageCircle size={32} className="mb-3 text-ink-soft" />
        <p className="text-sm font-medium text-ink">
          {user?.role === "caregiver"
            ? "No family member connected yet"
            : "No caregiver found for this elder"}
        </p>
        <p className="mt-1 text-xs text-ink-soft">
          {user?.role === "caregiver"
            ? "Once a family member connects using this elder's ID, you can message them here."
            : "Something's off with this elder's record — try again later."}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-xl border border-border bg-paper-card">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-[600px] flex-col overflow-hidden rounded-xl border border-border bg-paper-card">

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <MessageCircle
            size={20}
            className="text-primary"
          />
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold text-ink">
            Family Communication
          </h2>

          <p className="text-xs text-ink-soft">
            Caregiver ↔ Family Member
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">

        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <MessageCircle
                size={40}
                className="mx-auto mb-3 text-ink-soft"
              />

              <p className="text-sm text-ink-soft">
                No messages yet.
              </p>

              <p className="mt-1 text-xs text-ink-soft">
                Start the conversation.
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const senderId =
              message.sender?._id ||
              message.sender;

            const isMine =
              String(senderId) === String(user?.id);

            return (
              <div
                key={message._id}
                className={`flex ${
                  isMine
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    isMine
                      ? "rounded-br-sm bg-primary text-white"
                      : "rounded-bl-sm bg-paper text-ink"
                  }`}
                >
                  {!isMine && message.sender?.name && (
                    <p className="mb-1 text-xs font-semibold">
                      {message.sender.name}
                    </p>
                  )}

                  <p className="text-sm">
                    {message.text}
                  </p>

                  <p
                    className={`mt-1 text-[10px] ${
                      isMine
                        ? "text-white/70"
                        : "text-ink-soft"
                    }`}
                  >
                    {message.createdAt
                      ? new Date(
                          message.createdAt
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </p>
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex gap-2 border-t border-border p-4"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message..."
          disabled={sending}
          className="flex-1 rounded-lg border border-border bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-primary"
        />

        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
