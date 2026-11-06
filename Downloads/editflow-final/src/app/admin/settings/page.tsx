"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Bell, Mail, Shield, Save, Check } from "lucide-react";
import { useToast } from "@/components/toast-context";

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [browserAlerts, setBrowserAlerts] = useState(true);
  const [adminEmail, setAdminEmail] = useState(process.env.NEXT_PUBLIC_ADMIN_EMAIL || "");
  const [saving, setSaving] = useState(false);
  const { success } = useToast();

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      success("Settings Saved", "Admin preferences updated successfully");
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-[28px] p-5">
        <p className="section-heading">Workspace Configuration</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
          Studio Preferences & Alerts
        </h2>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Email & Alert Preferences */}
        <div className="glass-panel rounded-[28px] p-6 border border-white/8 space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-white/6">
            <Bell className="h-4 w-4 text-violet-400" />
            <h3 className="text-base font-bold text-white">Alert Preferences</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-white/6 bg-slate-900/40 p-4">
              <div>
                <p className="text-sm font-semibold text-white">Email Notifications</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Receive email updates on new intake submissions and invoice payments.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={[
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  emailNotifications ? "bg-violet-600" : "bg-slate-800",
                ].join(" ")}
              >
                <span
                  className={[
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                    emailNotifications ? "translate-x-5" : "translate-x-0",
                  ].join(" ")}
                />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-white/6 bg-slate-900/40 p-4">
              <div>
                <p className="text-sm font-semibold text-white">In-App Browser Alerts</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Show reactive floating toasts when status changes or projects update.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBrowserAlerts(!browserAlerts)}
                className={[
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  browserAlerts ? "bg-violet-600" : "bg-slate-800",
                ].join(" ")}
              >
                <span
                  className={[
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                    browserAlerts ? "translate-x-5" : "translate-x-0",
                  ].join(" ")}
                />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Admin Notification Email
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                <input
                  value={adminEmail}
                  onChange={(event) => setAdminEmail(event.target.value)}
                  className="input pl-11 text-sm text-white"
                  type="email"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving}
              className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 mt-2"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Preferences"}
            </motion.button>
          </div>
        </div>

        {/* Studio Operating Principles */}
        <div className="glass-panel rounded-[28px] p-6 border border-white/8 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/6">
            <Shield className="h-4 w-4 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Default Workflow Rules</h3>
          </div>

          <div className="space-y-3 text-xs leading-relaxed text-slate-300">
            <div className="rounded-2xl border border-white/6 bg-slate-900/40 p-3.5">
              <strong className="text-white block mb-0.5">Automatic Intake Queueing</strong>
              New requests submitted through the client intake portal appear instantly in the pipeline board.
            </div>

            <div className="rounded-2xl border border-white/6 bg-slate-900/40 p-3.5">
              <strong className="text-white block mb-0.5">Immutable Invoices</strong>
              Issued invoice numbers lock their financial snapshot to preserve audit integrity.
            </div>

            <div className="rounded-2xl border border-white/6 bg-slate-900/40 p-3.5">
              <strong className="text-white block mb-0.5">Drive Share Verification</strong>
              Google Drive links must maintain public view access for editor assembly.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
