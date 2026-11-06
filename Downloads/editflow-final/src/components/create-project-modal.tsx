"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, PlusCircle, Clock, Calendar, Film, Sparkles, DollarSign, ExternalLink } from "lucide-react";
import type { Project, ProjectStatus } from "@/lib/types";
import { calculateDurationSecondsFromMm, calculatePrice, formatCurrency, formatDurationMmSs } from "@/lib/pricing";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (project: Project) => void;
}

export function CreateProjectModal({ isOpen, onClose, onCreated }: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState("");
  const [durationText, setDurationText] = useState("2:00");
  const [billingMonth, setBillingMonth] = useState("2026-10");
  const [status, setStatus] = useState<ProjectStatus>("Completed");
  const [isTrial, setIsTrial] = useState(false);
  const [billable, setBillable] = useState(true);
  const [enableOverride, setEnableOverride] = useState(false);
  const [overrideValue, setOverrideValue] = useState("");
  const [driveLink, setDriveLink] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [clientName, setClientName] = useState("Trading Bells");
  const [videoFormat, setVideoFormat] = useState("16:9");
  const [editingType, setEditingType] = useState("Educational");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const durationSeconds = calculateDurationSecondsFromMm(durationText);
  const calculatedPrice = calculatePrice(durationSeconds);
  const effectivePrice = isTrial || !billable
    ? 0
    : enableOverride && overrideValue !== "" && !isNaN(Number(overrideValue))
    ? Number(overrideValue)
    : calculatedPrice;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setError("Project name is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: projectName.trim(),
          clientName: clientName.trim(),
          rawFootageDuration: durationText,
          expectedDuration: durationText,
          finalDurationSeconds: durationSeconds,
          billingMonth,
          status,
          isTrial,
          billable: isTrial ? false : billable,
          manualPriceOverride: enableOverride && overrideValue !== "" ? Number(overrideValue) : null,
          driveLink: driveLink.trim() || "https://drive.google.com",
          adminNotes: adminNotes.trim(),
          videoFormat,
          editingType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create project");

      onCreated(data.project);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating project");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: "spring", stiffness: 350, damping: 26 }}
          className="glass-panel relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-[32px] border border-white/12 bg-slate-900/95 p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.7)] z-10"
        >
          <div className="flex items-center justify-between border-b border-white/8 pb-4">
            <div>
              <span className="kicker mb-1">Admin Ops</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Add New Project
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Project Name *
              </label>
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="input text-sm text-white"
                placeholder="e.g. Ep 5: Technical Analysis Deep Dive"
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Duration (MM:SS) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    value={durationText}
                    onChange={(e) => setDurationText(e.target.value)}
                    className="input font-mono text-center text-sm font-bold text-white w-28"
                    placeholder="2:30"
                    required
                  />
                  <span className="text-xs text-slate-400 font-mono">
                    {durationSeconds}s
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Billing Month (YYYY-MM) *
                </label>
                <input
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(e.target.value)}
                  className="input text-sm text-white"
                  placeholder="2026-10"
                  required
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Format
                </label>
                <select
                  value={videoFormat}
                  onChange={(e) => setVideoFormat(e.target.value)}
                  className="input text-xs text-white"
                >
                  <option value="16:9">16:9 Landscape</option>
                  <option value="9:16">9:16 Vertical Reel</option>
                  <option value="1:1">1:1 Square</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Content Type
                </label>
                <select
                  value={editingType}
                  onChange={(e) => setEditingType(e.target.value)}
                  className="input text-xs text-white"
                >
                  <option value="Educational">Educational</option>
                  <option value="UGC">UGC</option>
                  <option value="Reels">Reels</option>
                  <option value="Promotional">Promotional</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  className="input text-xs text-white"
                >
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="New Request">New Request</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            {/* Price Preview Card */}
            <div className="rounded-2xl border border-violet-500/20 bg-violet-600/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-violet-300 font-semibold">
                    Calculated Billing Value
                  </span>
                  <div className="text-2xl font-bold text-white mt-0.5">
                    {formatCurrency(effectivePrice)}
                  </div>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <span>Formula: {formatCurrency(calculatedPrice)}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/6 flex flex-wrap gap-4 text-xs">
                <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isTrial}
                    onChange={(e) => {
                      setIsTrial(e.target.checked);
                      if (e.target.checked) setBillable(false);
                    }}
                    className="accent-amber-500 h-4 w-4"
                  />
                  <span>Trial Reel (₹0)</span>
                </label>

                <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableOverride}
                    onChange={(e) => setEnableOverride(e.target.checked)}
                    className="accent-violet-500 h-4 w-4"
                  />
                  <span>Manual Price Override</span>
                </label>

                {enableOverride && (
                  <input
                    type="number"
                    step="0.01"
                    value={overrideValue}
                    onChange={(e) => setOverrideValue(e.target.value)}
                    placeholder="Enter ₹ override"
                    className="input py-0.5 px-2 text-xs w-32 font-mono text-white"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Google Drive Asset Link
              </label>
              <input
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value)}
                className="input text-xs font-mono text-white"
                placeholder="https://drive.google.com/drive/folders/..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Admin Notes
              </label>
              <input
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="input text-xs text-white"
                placeholder="Internal notes on footage or billing..."
              />
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">
                {error}
              </div>
            )}

            <div className="pt-3 border-t border-white/8 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary px-4 py-2 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary px-5 py-2 text-xs font-bold shadow-lg"
              >
                {saving ? "Creating Project..." : "+ Create Project"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
