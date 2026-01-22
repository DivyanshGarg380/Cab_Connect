import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Plane, LogOut, User, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Bell } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";
import { socket } from "@/lib/socket";


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
              <div className="absolute right-0 mt-2 w-96 bg-white border rounded-xl shadow-lg overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <p className="font-semibold text-gray-900">Inbox</p>

                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-teal-600 hover:underline"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="max-h-96 overflow-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-gray-500">
                      No notifications
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n._id}
                        onClick={() => markAsRead(n._id)}
                        className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 ${
                          !n.read ? "bg-teal-50/40" : ""
                        }`}
                      >
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                          {n.message}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-1">
                          {new Date(n.createdAt).toLocaleString("en-IN")}
                        </p>
                      </button>
                    ))
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
