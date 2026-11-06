"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Clock, AlertTriangle, FileText, CheckCircle2, Trash2 } from "lucide-react";
import type { NotificationItem } from "@/lib/types";
import { useToast } from "@/components/toast-context";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const { success } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/projects");
        const projects = await response.json();
        const generated: NotificationItem[] = [
          {
            id: "n1",
            title: "New project submitted",
            description: "Trading Bells submitted a new reel request.",
            type: "project",
            createdAt: new Date().toISOString(),
            read: false,
          },
          {
            id: "n2",
            title: "Invoice generated",
            description: "INV-2026-004 is drafted and ready for review.",
            type: "invoice",
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            read: true,
          },
          {
            id: "n3",
            title: "Deadline approaching",
            description: projects.length ? `${projects[0].projectName} delivery expected soon.` : "Upcoming delivery checkpoint.",
            type: "deadline",
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            read: false,
          },
        ];
        setNotifications(generated);
      } catch {
        setNotifications([]);
      }
    };
    load();
  }, []);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    success("All marked read", "Notifications updated");
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    return true;
  });

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "project":
        return <CheckCircle2 className="h-4 w-4 text-violet-400" />;
      case "invoice":
        return <FileText className="h-4 w-4 text-sky-400" />;
      case "deadline":
        return <Clock className="h-4 w-4 text-amber-400" />;
      default:
        return <Bell className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-[28px] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-heading">Operational Alerts</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
              Studio Notification Center
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-2xl border border-white/8 bg-slate-900/60 p-1 text-xs">
              <button
                onClick={() => setFilter("all")}
                className={[
                  "rounded-xl px-3 py-1 font-medium transition",
                  filter === "all" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white",
                ].join(" ")}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={[
                  "rounded-xl px-3 py-1 font-medium transition",
                  filter === "unread" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white",
                ].join(" ")}
              >
                Unread ({notifications.filter((n) => !n.read).length})
              </button>
            </div>

            <button
              onClick={markAllAsRead}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              Mark All Read
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((notification) => (
            <motion.div
              key={notification.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={[
                "glass-card rounded-[24px] p-4.5 border transition-colors flex items-start justify-between gap-4",
                notification.read
                  ? "border-white/6 bg-slate-900/35"
                  : "border-violet-400/30 bg-violet-600/10 shadow-[0_0_20px_rgba(139,92,246,0.1)]",
              ].join(" ")}
            >
              <div className="flex items-start gap-3.5">
                <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-2.5 shrink-0 mt-0.5">
                  {getIcon(notification.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{notification.title}</h3>
                    {!notification.read && (
                      <span className="h-2 w-2 rounded-full bg-violet-400" />
                    )}
                    <span className="rounded-full border border-white/8 bg-slate-800/80 px-2 py-0.2 text-[9px] font-mono uppercase tracking-wider text-slate-300">
                      {notification.type}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                    {notification.description}
                  </p>
                  <p className="mt-2 text-[10px] font-mono text-slate-500">
                    {new Date(notification.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!notification.read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-white/10 transition"
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(notification.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-white/10 transition"
                  title="Dismiss notification"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-xs text-slate-400">
            No alerts to display in this category.
          </div>
        )}
      </div>
    </div>
  );
}
