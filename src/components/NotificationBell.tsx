"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./AuthContext";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
} from "@/lib/actions/notifications";
import { Notification } from "@/types/database";
import Link from "next/link";
import {
  Bell,
  CheckCircle,
  Heart,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCheck,
  ExternalLink,
  X,
  Trash2,
} from "lucide-react";

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Recently";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 45) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

export default function NotificationBell() {
  const { user, role } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifs = useCallback(async () => {
    try {
      const data = await getNotifications({
        userId: user?.id,
        role: role || "all",
      });

      let localReadIds = new Set<string>();
      try {
        const stored = typeof window !== "undefined" ? localStorage.getItem("apni_madad_read_notifs") : null;
        if (stored) {
          localReadIds = new Set(JSON.parse(stored));
        }
      } catch {
        // ignore JSON parse error
      }

      const merged = (data || []).map((n) => ({
        ...n,
        is_read: n.is_read || localReadIds.has(n.id),
      }));

      setNotifications(merged);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }, [user?.id, role]);

  useEffect(() => {
    fetchNotifs();
    const timer = setInterval(fetchNotifs, 30000);
    return () => clearInterval(timer);
  }, [fetchNotifs]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // 1. Save to local storage for instant persistent read state
    try {
      const stored = localStorage.getItem("apni_madad_read_notifs");
      const readSet = new Set(stored ? JSON.parse(stored) : []);
      readSet.add(id);
      localStorage.setItem("apni_madad_read_notifs", JSON.stringify(Array.from(readSet).slice(-200)));
    } catch (err) {
      console.warn("localStorage error:", err);
    }

    // 2. Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );

    // 3. Database update
    await markNotificationAsRead(id);
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    const allIds = notifications.map((n) => n.id);

    // 1. Immediately store in localStorage so any page refresh keeps them read
    try {
      const stored = localStorage.getItem("apni_madad_read_notifs");
      const readSet = new Set(stored ? JSON.parse(stored) : []);
      allIds.forEach((id) => readSet.add(id));
      localStorage.setItem("apni_madad_read_notifs", JSON.stringify(Array.from(readSet).slice(-200)));
    } catch (err) {
      console.warn("localStorage error:", err);
    }

    // 2. Optimistically mark all in state
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    // 3. Persist to Supabase database
    try {
      await markAllNotificationsAsRead(user?.id, role || "all", allIds);
    } catch (err) {
      console.error("Failed to mark all as read in DB:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Clear all notifications?")) return;
    setLoading(true);
    const allIds = notifications.map((n) => n.id);
    try {
      await clearAllNotifications(user?.id, role || "all", allIds);
      try {
        localStorage.removeItem("apni_madad_read_notifs");
      } catch {}
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = notifications.filter((n) =>
    filter === "unread" ? !n.is_read : true
  );

  const getMeta = (type: string) => {
    switch (type) {
      case "donation_received":
        return {
          icon: <Heart className="w-4 h-4 text-emerald-600 shrink-0" />,
          bg: "bg-emerald-50 border-emerald-100",
          tag: "Donation",
          tagColor: "bg-emerald-100 text-emerald-800",
        };
      case "case_approved":
        return {
          icon: <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />,
          bg: "bg-blue-50 border-blue-100",
          tag: "Verified",
          tagColor: "bg-blue-100 text-blue-800",
        };
      case "case_rejected":
        return {
          icon: <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />,
          bg: "bg-rose-50 border-rose-100",
          tag: "Rejected",
          tagColor: "bg-rose-100 text-rose-800",
        };
      case "case_submitted":
        return {
          icon: <Info className="w-4 h-4 text-amber-600 shrink-0" />,
          bg: "bg-amber-50 border-amber-100",
          tag: "Review",
          tagColor: "bg-amber-100 text-amber-800",
        };
      default:
        return {
          icon: <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />,
          bg: "bg-indigo-50 border-indigo-100",
          tag: "System",
          tagColor: "bg-indigo-100 text-indigo-800",
        };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-700 hover:text-blue-700 hover:bg-slate-100 rounded-full transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-600/30 cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 sm:right-0 mt-2 w-84 sm:w-96 max-w-[calc(100vw-20px)] bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Notifications</h3>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-900 text-[10px] font-extrabold uppercase tracking-wider rounded-full shrink-0">
                {role === "admin" ? "Admin" : role === "beneficiary" ? "User" : "Donor"}
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 text-[11px] font-bold rounded-full shrink-0">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={loading}
                  title="Clear all notifications"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Subheader: Filter Tabs & Mark All Read */}
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-100 bg-white text-xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                  filter === "all"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("unread")}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                  filter === "unread"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={loading}
                className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification Items List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100/90 overscroll-contain">
            {filtered.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {filter === "unread" ? "All caught up!" : "No notifications"}
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto leading-relaxed">
                  Real-time updates on case verifications, approvals, and direct transfers will appear here.
                </p>
              </div>
            ) : (
              filtered.map((notif) => {
                const meta = getMeta(notif.type);
                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.is_read) handleMarkAsRead(notif.id);
                      if (notif.link_url) setIsOpen(false);
                    }}
                    className={`p-3.5 hover:bg-slate-50/90 transition-all flex items-start gap-3 cursor-pointer relative group ${
                      !notif.is_read ? "bg-blue-50/35 border-l-4 border-l-blue-600" : "border-l-4 border-l-transparent"
                    }`}
                  >
                    {/* Icon Column */}
                    <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${meta.bg}`}>
                      {meta.icon}
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 min-w-0">
                      {/* Top Row: Type Tag & Time */}
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${meta.tagColor}`}>
                          {meta.tag}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">
                          {formatRelativeTime(notif.created_at)}
                        </span>
                      </div>

                      {/* Title */}
                      <h4
                        className={`text-xs leading-snug line-clamp-1 mb-0.5 ${
                          !notif.is_read
                            ? "font-extrabold text-slate-900"
                            : "font-semibold text-slate-700"
                        }`}
                      >
                        {notif.title}
                      </h4>

                      {/* Body Message */}
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Action Links */}
                      {notif.link_url && (
                        <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between">
                          <Link
                            href={notif.link_url}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 hover:underline"
                          >
                            <span>Open Details</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                          {!notif.is_read && (
                            <button
                              type="button"
                              onClick={(e) => handleMarkAsRead(notif.id, e)}
                              className="text-[10px] font-medium text-slate-400 hover:text-slate-700 hover:underline"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <Link
              href={role === "admin" ? "/admin" : "/dashboard"}
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-slate-700 hover:text-blue-700 transition"
            >
              {role === "admin" ? "Open Administrator Desk →" : "View Complete Activity Dashboard →"}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
