import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Plane, LogOut, User, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useNotifications } from "@/contexts/NotificationContext";
import { socket } from "@/lib/socket";
import { Bell, Car, ShieldAlert, Ban } from "lucide-react";

type NotificationType = {
  _id: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export function Header() {
  const { user, logout, isAdmin, isLoading } = useAuth();
  const location = useLocation();
  if(isLoading) return null;

  const [openInbox, setOpenInbox] = useState(false);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const inboxRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getDisplayName = (email: string) => {
    const localPart = email.split('mit')[0];

    return localPart
      .replace(/\d+/g, '')               
      .replace(/[._]/g, ' ')            
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const fetchInbox = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const res = await fetch(
        "http://localhost:5000/notifications/inbox?limit=10",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.log("Inbox fetch error:", err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      await fetch(`http://localhost:5000/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.log("markAsRead error:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      await fetch("http://localhost:5000/notifications/read-all", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.log("markAllAsRead error:", err);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (!inboxRef.current) return;
      if (!inboxRef.current.contains(e.target as Node)) {
        setOpenInbox(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    const onNotification = (payload: any) => {
      let notif = payload;

      if (payload?.notificationPayload?.message) {
        notif = {
          _id: `legacy-${Date.now()}`, 
          message: payload.notificationPayload.message,
          read: false,
          createdAt: new Date().toISOString(),
        };
      }

      if (!notif?.message) return;

      setNotifications((prev) => {
        const exists = notif._id && prev.some((n) => n._id === notif._id);
        if (exists) return prev;

        return [notif, ...prev].slice(0, 10);
      });
    };

    socket.on("notification:new", onNotification);
    socket.on("user-notification", onNotification);
    socket.on("admin-notification", onNotification);

    return () => {
      socket.off("notification:new", onNotification);
      socket.off("user-notification", onNotification);
      socket.off("admin-notification", onNotification);
    };
  }, []);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getNotifMeta = (msg: string) => {
    const m = msg.toLowerCase();

    if (m.includes("removed") || m.includes("ride") || m.includes("expired")) {
      return {
        title: "Ride Update",
        Icon: Car,
        ring: "ring-teal-600/20",
        bg: "bg-teal-50",
        color: "text-teal-700",
      };
    }

    if (m.includes("report")) {
      return {
        title: "Report Update",
        Icon: ShieldAlert,
        ring: "ring-amber-600/20",
        bg: "bg-amber-50",
        color: "text-amber-700",
      };
    }

    if (m.includes("banned") || m.includes("ban")) {
      return {
        title: "Account Action",
        Icon: Ban,
        ring: "ring-red-600/20",
        bg: "bg-red-50",
        color: "text-red-700",
      };
    }

    return {
      title: "Notification",
      Icon: Bell,
      ring: "ring-gray-600/20",
      bg: "bg-gray-50",
      color: "text-gray-700",
    };
  };

  const getNotifTitle = (msg: string) => {
    const m = msg.toLowerCase();
    if (m.includes("removed")) return "Ride Update";
    if (m.includes("expired")) return "Ride Expired";
    if (m.includes("banned")) return "Account Action";
    if (m.includes("report")) return "Report Update";
    return "Notification";
  };

  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-slate-800 rounded-lg flex items-center justify-center">
            <Plane className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">CabShare</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center space-x-6">
          <Link
            to="/dashboard"
            className={`text-sm font-medium transition-colors ${
              location.pathname === '/'
                ? 'text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Dashboard
          </Link>
          
          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                location.pathname === '/admin'
                  ? 'text-red-600'
                  : 'text-red-500 hover:text-red-600'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin</span>
            </Link>
          )}
        </div>

        {/* User Info & Inbox & Logout */}
        <div className="flex items-center space-x-4">
          {/* Inbox */}
          <div className="relative" ref={inboxRef}>
            <button
              onClick={() => {
                setOpenInbox((v) => !v);
                if (!openInbox) fetchInbox();
              }}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <Bell className="w-5 h-5 text-gray-700" />

              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>

            {openInbox && (
              <div className="absolute right-0 mt-2 w-[420px] bg-white border rounded-2xl shadow-xl overflow-hidden z-50">
                {/* Header */}
                <div className="px-4 pt-4 pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900 text-lg">Inbox</p>

                    <button
                      onClick={markAllAsRead}
                      className="text-xs font-medium text-teal-700 hover:text-teal-800 hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>

                  {/* Filter pills */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setFilter("all")}
                      className={`px-3 py-1 text-xs rounded-full border transition ${
                        filter === "all"
                          ? "bg-teal-600 text-white border-teal-600"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      All
                    </button>

                    <button
                      onClick={() => setFilter("unread")}
                      className={`px-3 py-1 text-xs rounded-full border transition ${
                        filter === "unread"
                          ? "bg-teal-600 text-white border-teal-600"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      Unread ({unreadCount})
                    </button>
                  </div>
                </div>

                {/* List */}
                <div className="max-h-[420px] overflow-auto">
                  {filteredNotifications.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                      <p className="text-sm font-medium text-gray-900">No notifications</p>
                      <p className="text-xs text-gray-500 mt-1">
                        You’re all caught up ✨
                      </p>
                    </div>
                  ) : (
                    filteredNotifications.map((n) => {
                      const meta = getNotifMeta(n.message);
                      const Icon = meta.Icon;
                      const isExpanded = expandedId === n._id;

                      return (
                        <div
                          key={n._id}
                          className={`px-4 py-3 border-b hover:bg-gray-50 transition ${
                            !n.read ? "bg-teal-50/40" : ""
                          }`}
                        >
                          <button
                            className="w-full text-left"
                            onClick={async () => {
                              await markAsRead(n._id);
                              setExpandedId((prev) => (prev === n._id ? null : n._id));
                            }}
                          >
                            <div className="flex items-start gap-3">
                              {/* Icon */}
                              <div
                                className={`w-10 h-10 rounded-xl ${meta.bg} ring-1 ${meta.ring} flex items-center justify-center shrink-0`}
                              >
                                <Icon className={`w-5 h-5 ${meta.color}`} />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="font-semibold text-sm text-gray-900">
                                    {meta.title}
                                  </p>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {!n.read && (
                                      <span className="w-2 h-2 rounded-full bg-teal-600" />
                                    )}

                                    <span className="text-[11px] text-gray-500">
                                      {formatTime(n.createdAt)}
                                    </span>
                                  </div>
                                </div>

                                {/* Preview */}
                                <p
                                  className={`text-sm text-gray-700 mt-1 whitespace-pre-wrap ${
                                    isExpanded ? "" : "line-clamp-2"
                                  }`}
                                >
                                  {n.message}
                                </p>

                                <p className="text-[11px] text-gray-400 mt-2">
                                  Click to {isExpanded ? "collapse" : "expand"}
                                </p>
                              </div>
                            </div>
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-2 text-sm">
            <User className="w-4 h-4 text-gray-600" />
            <span className="text-gray-700 font-medium">
              {user?.email ? getDisplayName(user.email) : "User"}
            </span>
          </div>

          {/* Logout */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
