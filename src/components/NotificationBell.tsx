"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./AuthContext";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
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
} from "lucide-react";

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
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }, [user?.id, role]);

  useEffect(() => {
    fetchNotifs();
    // Poll every 30 seconds for live updates
    const timer = setInterval(fetchNotifs, 30000);
    return () => clearInterval(timer);
  }, [fetchNotifs]);

  // Close on outside click
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
    await markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await markAllNotificationsAsRead(user?.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } finally {
      setLoading(false);
    }
  };

  const filtered = notifications.filter((n) =>
    filter === "unread" ? !n.is_read : true
  );

  const getIcon = (type: string) => {
    switch (type) {
      case "donation_received":
        return <Heart className="w-4 h-4 text-emerald-600" />;
      case "case_approved":
        return <ShieldCheck className="w-4 h-4 text-blue-600" />;
      case "case_rejected":
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case "case_submitted":
        return <Info className="w-4 h-4 text-amber-600" />;
      default:
        return <CheckCircle className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-700 hover:text-blue-700 hover:bg-slate-100 rounded-full transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-600/30"
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
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-900 text-[10px] font-extrabold uppercase tracking-wider rounded-full">
                {role === "admin" ? "Admin Desk" : role === "beneficiary" ? "Beneficiary" : "Donor"}
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-xs font-bold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={loading}
                  className="text-xs text-blue-700 hover:text-blue-900 font-medium flex items-center gap-1 hover:underline"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-slate-100 bg-white px-3 py-1.5 text-xs font-semibold">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-lg transition-colors ${
                filter === "all"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`ml-2 px-3 py-1 rounded-lg transition-colors ${
                filter === "unread"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <CheckCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">
                  {filter === "unread"
                    ? "No unread notifications"
                    : "No notifications yet"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Updates on verified cases and direct transfers will show up here.
                </p>
              </div>
            ) : (
              filtered.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.is_read) handleMarkAsRead(notif.id);
                    if (notif.link_url) setIsOpen(false);
                  }}
                  className={`p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3 cursor-pointer ${
                    !notif.is_read ? "bg-blue-50/40" : ""
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4
                        className={`text-xs truncate ${
                          !notif.is_read
                            ? "font-bold text-slate-900"
                            : "font-medium text-slate-700"
                        }`}
                      >
                        {notif.title}
                      </h4>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/60">
                      <span className="text-[10px] text-slate-400">
                        {notif.created_at}
                      </span>
                      {notif.link_url && (
                        <Link
                          href={notif.link_url}
                          className="text-[11px] font-semibold text-blue-700 hover:underline flex items-center gap-1"
                        >
                          View Details
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-slate-700 hover:text-blue-700 transition-colors"
            >
              Open Complete Activity Dashboard →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
