"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  PlusCircle,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useToast } from "@/components/toast-context";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/projects", label: "Projects", icon: BriefcaseBusiness },
  { href: "/admin/kanban", label: "Kanban Board", icon: BriefcaseBusiness },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/invoices", label: "Invoices", icon: FileText },
  { href: "/admin/pricing", label: "Pricing Calculator", icon: CreditCard },
  { href: "/admin/reports", label: "Revenue Reports", icon: BarChart3 },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { success } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; title: string; desc: string; time: string; unread: boolean }[]>([]);

  const notifRef = useRef<HTMLDivElement>(null);

  const [ready] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.localStorage.getItem("editflow-admin-auth"));
  });

  useEffect(() => {
    if (!ready) {
      router.replace("/admin");
    }
  }, [ready, router]);

  // Close notifications popover on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    if (notificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notificationsOpen]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/60 px-6 py-4 shadow-xl"
        >
          <div className="h-4 w-4 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <span className="text-sm font-medium">Authenticating EditFlow...</span>
        </motion.div>
      </div>
    );
  }

  const handleLogout = () => {
    window.localStorage.removeItem("editflow-admin-auth");
    success("Logged out", "Session terminated safely");
    router.replace("/admin");
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  const currentNav = navItems.find((item) => item.href === pathname) || {
    label: "Admin Workspace",
    icon: LayoutDashboard,
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1800px] gap-6 px-3 py-4 sm:px-5 lg:px-6">
        <div className="ambient-orb left-[-6rem] top-10 h-72 w-72 bg-violet-600/20" />
        <div className="ambient-orb right-10 top-24 h-72 w-72 bg-cyan-500/15" />

        {/* Desktop Sidebar */}
        <aside className="glass-panel hidden w-[270px] shrink-0 flex-col rounded-[28px] p-5 md:flex sticky top-4 h-[calc(100vh-2rem)]">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-500/15 text-sm font-bold text-violet-200 shadow-[0_0_25px_rgba(139,92,246,0.25)] group-hover:scale-105 transition-transform">
                EF
              </div>
              <div>
                <div className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-violet-300">
                  EditFlow
                </div>
                <h2 className="text-xl font-semibold text-white tracking-tight">Admin OS</h2>
              </div>
            </Link>
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </div>
          </div>

          <nav className="space-y-1 overflow-y-auto pr-1 flex-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={[
                    "relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-colors duration-200",
                    active ? "text-white" : "text-slate-400 hover:text-slate-100 hover:bg-white/5",
                  ].join(" ")}
                >
                  {active && (
                    <motion.div
                      layoutId="activeSidebarIndicator"
                      className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-600/30 to-sky-500/20 border border-violet-400/35 shadow-[0_8px_24px_rgba(139,92,246,0.18)]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span
                    className={[
                      "relative z-10 p-1 rounded-xl transition-colors",
                      active ? "text-violet-300" : "text-slate-400",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="relative z-10">{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 pt-4 border-t border-white/8 space-y-3">
            <Link
              href="/new-project"
              target="_blank"
              className="flex items-center justify-between rounded-2xl border border-violet-500/25 bg-violet-500/10 px-3.5 py-2.5 text-xs font-semibold text-violet-200 hover:bg-violet-500/20 transition group"
            >
              <span className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" /> Client Portal
              </span>
              <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
            </Link>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-2xl border border-white/6 px-3.5 py-2.5 text-xs font-medium text-slate-400 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-300 transition"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Mobile Header / Drawer Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-md md:hidden"
              />
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className="fixed left-0 top-0 bottom-0 z-50 w-72 glass-panel border-r border-white/10 bg-slate-900/95 p-5 flex flex-col md:hidden"
              >
                <div className="flex items-center justify-between pb-4 border-b border-white/8">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/20 text-sm font-bold text-violet-200">
                      EF
                    </div>
                    <span className="font-semibold text-white">EditFlow Admin</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="mt-4 space-y-1 flex-1 overflow-y-auto">
                  {navItems.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href;
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={[
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                          active
                            ? "bg-violet-600/25 border border-violet-400/30 text-white font-semibold"
                            : "text-slate-300 hover:bg-white/5 hover:text-white",
                        ].join(" ")}
                      >
                        <Icon className="h-4 w-4 text-violet-300" />
                        {label}
                      </Link>
                    );
                  })}
                </nav>

                <div className="pt-4 border-t border-white/8">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2.5 text-sm font-medium text-rose-300"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top Header Bar */}
          <header className="glass-panel mb-6 rounded-[28px] px-4 py-3.5 shadow-[0_18px_55px_rgba(15,23,42,0.45)] sm:px-6 sticky top-4 z-30">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="rounded-xl border border-white/10 bg-slate-900/60 p-2 text-slate-200 md:hidden hover:bg-white/10 transition"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span>Admin</span>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-violet-300 font-medium">{currentNav.label}</span>
                  </div>
                  <h1 className="text-lg font-bold text-white sm:text-xl tracking-tight">
                    {currentNav.label}
                  </h1>
                </div>
              </div>

              {/* Notification Popover & Actions */}
              <div className="flex items-center gap-2.5" ref={notifRef}>
                <div className="relative">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="relative rounded-2xl border border-white/10 bg-slate-900/60 p-2.5 text-slate-200 transition hover:bg-white/10 hover:border-violet-400/40"
                    aria-label="View notifications"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-[9px] font-bold text-white shadow-md">
                        {unreadCount}
                      </span>
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {notificationsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        className="glass-panel absolute right-0 mt-3 w-80 sm:w-96 rounded-[24px] border border-white/12 bg-slate-900/95 p-4 shadow-[0_25px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl z-50"
                      >
                        <div className="flex items-center justify-between pb-3 border-b border-white/8">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-sm">Notifications</span>
                            {unreadCount > 0 && (
                              <span className="rounded-full bg-violet-500/20 border border-violet-400/30 px-2 py-0.2 text-[10px] font-semibold text-violet-200">
                                {unreadCount} new
                              </span>
                            )}
                          </div>
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-xs text-violet-300 hover:text-violet-200 transition"
                            >
                              Mark read
                            </button>
                          )}
                        </div>

                        <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
                          {notifications.map((item) => (
                            <div
                              key={item.id}
                              className={[
                                "rounded-xl p-3 border transition-colors",
                                item.unread
                                  ? "bg-violet-500/10 border-violet-400/25"
                                  : "bg-slate-950/30 border-white/6",
                              ].join(" ")}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-semibold text-white">{item.title}</p>
                                <span className="text-[10px] text-slate-400 shrink-0">{item.time}</span>
                              </div>
                              <p className="mt-1 text-xs text-slate-300 leading-normal">{item.desc}</p>
                            </div>
                          ))}
                        </div>

                        <div className="mt-3 pt-2 border-t border-white/8 text-center">
                          <Link
                            href="/admin/notifications"
                            onClick={() => setNotificationsOpen(false)}
                            className="text-xs text-violet-300 hover:underline"
                          >
                            View all alerts →
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link
                  href="/admin/kanban"
                  className="btn-secondary hidden sm:inline-flex items-center gap-2 text-xs py-2 px-3.5"
                >
                  Kanban
                </Link>

                <Link
                  href="/new-project"
                  target="_blank"
                  className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>+ Project</span>
                </Link>
              </div>
            </div>
          </header>

          <main className="flex-1 pb-16 md:pb-6">{children}</main>
        </div>
      </div>

      {/* Mobile Bottom Quick Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-white/10 bg-slate-950/85 backdrop-blur-xl py-2.5 px-3 md:hidden">
        {[
          { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/admin/projects", label: "Projects", icon: BriefcaseBusiness },
          { href: "/admin/kanban", label: "Kanban", icon: BriefcaseBusiness },
          { href: "/admin/invoices", label: "Invoices", icon: FileText },
          { href: "/admin/pricing", label: "Pricing", icon: CreditCard },
        ].map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex flex-col items-center gap-1 text-[10px] font-medium transition py-1 px-2.5 rounded-xl",
                active ? "text-violet-300 bg-violet-500/15 font-semibold" : "text-slate-400 hover:text-white",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
