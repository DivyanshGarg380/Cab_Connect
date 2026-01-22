import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { socket } from "@/lib/socket";

type NotificationType = {
  _id: string;
  message: string;
  read: boolean;
  createdAt: string;
  type?: string;
  meta?: any;
};

type NotificationContextType = {
  notifications: NotificationType[];
  unreadCount: number;
  fetchInbox: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const fetchInbox = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const res = await fetch("http://localhost:5000/notifications/inbox?limit=10", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    setNotifications(data.notifications || []);
  };

  const markAsRead = async (id: string) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    await fetch(`http://localhost:5000/notifications/${id}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });

    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    await fetch(`http://localhost:5000/notifications/read-all`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  useEffect(() => {
    const onNew = (notif: NotificationType) => {
      setNotifications((prev) => [notif, ...prev].slice(0, 10));
    };

    socket.on("notification:new", onNew);
    socket.on("user-notification", onNew);
    socket.on("admin-notification", onNew);

    return () => {
      socket.off("notification:new", onNew);
      socket.off("user-notification", onNew);
      socket.off("admin-notification", onNew);
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, fetchInbox, markAsRead, markAllAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
