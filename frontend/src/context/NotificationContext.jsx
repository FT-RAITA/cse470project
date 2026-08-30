import { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";
import { socket, connectSocket, disconnectSocket } from "../services/socket";
import { getMyNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "../services/notificationService";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await getMyNotifications(token);
      setNotifications(res.data || []);
    } catch {
      // Notifications must not interfere with the rest of the application.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setNotifications([]);
      disconnectSocket();
      return;
    }

    refresh();
    connectSocket(token);

    const onNew = (notification) => {
      setNotifications((prev) => prev.some((n) => n._id === notification._id) ? prev : [notification, ...prev]);
      const text = notification.message || notification.title || "New notification";
      if (notification.severity === "critical") toast.error(text, { duration: Infinity });
      else toast(text);
    };

    socket.on("notification:new", onNew);
    return () => socket.off("notification:new", onNew);
  }, [isAuthenticated, token]);

  const markRead = async (id) => {
    if (!token) return;
    await markNotificationAsRead(id, token);
    setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n));
  };

  const markAllRead = async () => {
    if (!token) return;
    await markAllNotificationsAsRead(token);
    const readAt = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt })));
  };

  const value = useMemo(() => ({
    notifications,
    unreadCount: notifications.filter((n) => !n.isRead).length,
    loading,
    refresh,
    markRead,
    markAllRead,
  }), [notifications, loading]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
}
