"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Clock,
  Film,
  Sparkles,
  DollarSign,
  AlertCircle,
  FileText,
  Trash2,
  Save,
  Edit3,
  Sliders,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import type { Project, ProjectStatus } from "@/lib/types";
import {
  calculateDurationSecondsFromMm,
  calculatePrice,
  calculateProjectPrice,
  formatCurrency,
  formatDurationMmSs,
  getProjectCalculatedPrice,
  getProjectDurationSeconds,
} from "@/lib/pricing";

const allStatuses: ProjectStatus[] = [
  "New Request",
  "Pending",
  "In Progress",
  "Awaiting Client Feedback",
  "Revision Requested",
  "Completed",
  "On Hold",
  "Cancelled",
];

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
  onSave?: (updated: Project) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onStatusChange?: (projectId: string, newStatus: ProjectStatus) => Promise<void>;
  onToggleBillable?: (projectId: string, billable: boolean) => Promise<void>;
  onTogglePaid?: (projectId: string, paid: boolean) => Promise<void>;
}

export function ProjectDetailModal({
  project,
  onClose,
  onSave,
  onDelete,
  onStatusChange,
  onToggleBillable,
  onTogglePaid,
}: ProjectModalProps) {
  const [copied, setCopied] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Editable Form State
  const [projectName, setProjectName] = useState("");
  const [durationText, setDurationText] = useState("");
  const [billingMonth, setBillingMonth] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("Completed");
  const [isTrial, setIsTrial] = useState(false);
  const [billable, setBillable] = useState(true);
  const [enableOverride, setEnableOverride] = useState(false);
  const [overrideValue, setOverrideValue] = useState("");
  const [driveLink, setDriveLink] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [requirements, setRequirements] = useState("");
  const [videoFormat, setVideoFormat] = useState("16:9");
  const [editingType, setEditingType] = useState("Educational");
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (project) {
      setProjectName(project.projectName || "");
      const sec = getProjectDurationSeconds(project);
      setDurationText(project.rawFootageDuration || formatDurationMmSs(sec));
      setBillingMonth(project.billingMonth || "");
      setStatus(project.status || "Completed");
      setIsTrial(Boolean(project.isTrial));
      setBillable(Boolean(project.billable && !project.isTrial));
      const hasOverride = project.manualPriceOverride !== undefined && project.manualPriceOverride !== null;
      setEnableOverride(hasOverride);
      setOverrideValue(hasOverride ? String(project.manualPriceOverride) : "");
      setDriveLink(project.driveLink || "");
      setAdminNotes(project.adminNotes || "");
      setRequirements(project.requirements || "");
      setVideoFormat(project.videoFormat || "16:9");
      setEditingType(project.editingType || "Educational");
      setPaid(Boolean(project.paid));
      setIsEditing(false);
      setShowDeleteConfirm(false);
    }
  }, [project]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (project) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [project, onClose]);

  // Live calculation of preview prices while editing
  const previewSeconds = useMemo(() => {
    return calculateDurationSecondsFromMm(durationText);
  }, [durationText]);

  const liveCalculatedPrice = useMemo(() => {
    return calculatePrice(previewSeconds);
  }, [previewSeconds]);

  const liveEffectivePrice = useMemo(() => {
    if (isTrial || !billable) return 0;
    if (enableOverride && overrideValue !== "" && !isNaN(Number(overrideValue))) {
      return Number(overrideValue);
    }
    return liveCalculatedPrice;
  }, [isTrial, billable, enableOverride, overrideValue, liveCalculatedPrice]);

  if (!project) return null;

  const copyDriveLink = async () => {
    if (driveLink || project.driveLink) {
      await navigator.clipboard.writeText(driveLink || project.driveLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStatusSelect = async (newStatus: ProjectStatus) => {
    setStatus(newStatus);
    if (onStatusChange && newStatus !== project.status) {
      setUpdating(true);
      try {
        await onStatusChange(project.id, newStatus);
      } finally {
        setUpdating(false);
      }
    }
  };

  const handleSaveForm = async () => {
    setUpdating(true);
    try {
      const parsedOverride = enableOverride && overrideValue !== "" && !isNaN(Number(overrideValue))
        ? Number(overrideValue)
        : null;

      const updatedData: Project = {
        ...project,
        projectName,
        rawFootageDuration: durationText,
        expectedDuration: durationText,
        finalDurationSeconds: previewSeconds,
        billingMonth,
        status,
        isTrial,
        billable: isTrial ? false : billable,
        manualPriceOverride: parsedOverride,
        calculatedPrice: liveCalculatedPrice,
        finalAmount: liveEffectivePrice,
        driveLink,
        adminNotes,
        requirements,
        videoFormat,
        editingType,
        paid: isTrial || !billable ? false : paid,
        updatedAt: new Date().toISOString(),
      };

      if (onSave) {
        await onSave(updatedData);
      } else {
        // Direct API update fallback
        await fetch(`/api/projects/${project.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData),
        });
      }
      setIsEditing(false);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setUpdating(true);
    try {
      await onDelete(project.id);
      onClose();
    } finally {
      setUpdating(false);
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
          className="glass-panel relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-[32px] border border-white/12 bg-slate-900/95 p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.7)] z-10"
        >
          {/* Header Bar */}
          <div className="flex items-start justify-between gap-4 border-b border-white/8 pb-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-violet-400/25 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-mono uppercase tracking-[0.16em] text-violet-300">
                  {project.projectId}
                </span>
                <span
                  className={[
                    "rounded-full px-2.5 py-0.5 text-[11px] font-medium border",
                    project.priority === "Urgent"
                      ? "border-amber-400/30 bg-amber-500/15 text-amber-300"
                      : "border-slate-700 bg-slate-800/80 text-slate-300",
                  ].join(" ")}
                >
                  {project.priority} Priority
                </span>
                {project.isTrial && (
                  <span className="rounded-full border border-amber-500/40 bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-200">
                    Trial Reel (₹0)
                  </span>
                )}
                {project.manualPriceOverride !== null && project.manualPriceOverride !== undefined && (
                  <span className="rounded-full border border-sky-400/40 bg-sky-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-sky-200">
                    Manual Override
                  </span>
                )}
              </div>

              {isEditing ? (
                <div className="mt-3">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Project Title
                  </label>
                  <input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="input text-base font-bold text-white py-1.5"
                    placeholder="Project Name"
                  />
                </div>
              ) : (
                <h2 className="mt-2 text-2xl font-bold text-white tracking-tight break-words">
                  {projectName || project.projectName}
                </h2>
              )}

              <p className="text-xs text-slate-300 mt-1">
                {project.clientName} {project.companyName ? `• ${project.companyName}` : ""}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className={[
                  "rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition border",
                  isEditing
                    ? "bg-violet-600 border-violet-400 text-white shadow-md"
                    : "bg-slate-800/80 border-white/10 text-slate-200 hover:bg-slate-700 hover:text-white",
                ].join(" ")}
              >
                <Edit3 className="h-3.5 w-3.5" />
                {isEditing ? "Editing Mode" : "Admin Edit"}
              </button>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Quick Specs / Edit Inputs Grid */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="rounded-2xl border border-white/6 bg-slate-950/40 p-3">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-sky-400" /> Duration (MM:SS)
              </span>
              {isEditing ? (
                <input
                  value={durationText}
                  onChange={(e) => setDurationText(e.target.value)}
                  className="input mt-1.5 py-1 text-center font-mono text-sm font-bold text-sky-200"
                  placeholder="2:30"
                />
              ) : (
                <div className="mt-1">
                  <p className="font-semibold text-white text-sm font-mono">
                    {durationText || formatDurationMmSs(project.finalDurationSeconds)}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {previewSeconds}s total
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/6 bg-slate-950/40 p-3">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-emerald-400" /> Billing Month
              </span>
              {isEditing ? (
                <input
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(e.target.value)}
                  className="input mt-1.5 py-1 text-center text-xs font-semibold text-emerald-200"
                  placeholder="2026-10"
                />
              ) : (
                <p className="mt-1 font-semibold text-white text-sm">
                  {billingMonth || project.billingMonth || "Unassigned"}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-white/6 bg-slate-950/40 p-3">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Film className="h-3 w-3 text-violet-400" /> Format
              </span>
              {isEditing ? (
                <select
                  value={videoFormat}
                  onChange={(e) => setVideoFormat(e.target.value)}
                  className="input mt-1.5 py-1 text-xs text-white"
                >
                  <option value="16:9">16:9 Landscape</option>
                  <option value="9:16">9:16 Vertical Reel</option>
                  <option value="1:1">1:1 Square</option>
                  <option value="Custom">Custom</option>
                </select>
              ) : (
                <p className="mt-1 font-semibold text-white text-sm">{videoFormat}</p>
              )}
            </div>

            <div className="rounded-2xl border border-white/6 bg-slate-950/40 p-3">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-cyan-400" /> Type
              </span>
              {isEditing ? (
                <input
                  value={editingType}
                  onChange={(e) => setEditingType(e.target.value)}
                  className="input mt-1.5 py-1 text-xs text-white"
                  placeholder="Educational / UGC"
                />
              ) : (
                <p className="mt-1 font-semibold text-white text-sm">{editingType}</p>
              )}
            </div>
          </div>

          {/* Pricing & Manual Override Control Panel */}
          <div className="mt-5 rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-600/15 via-indigo-600/10 to-sky-600/15 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-violet-300">
                  {isTrial || !billable ? "Non-Billable Video" : enableOverride ? "Manual Price Override" : "Calculated Rate Formula"}
                </span>
                <div className="mt-1 flex items-baseline gap-3">
                  <h3 className="text-3xl font-extrabold text-white">
                    {formatCurrency(liveEffectivePrice)}
                  </h3>
                  {liveEffectivePrice !== liveCalculatedPrice && (
                    <span className="text-xs text-slate-400 line-through">
                      Auto: {formatCurrency(liveCalculatedPrice)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {isTrial
                    ? "Trial reel excluded from all invoices & monthly earnings."
                    : !billable
                    ? "Non-billable project excluded from earnings."
                    : `Based on ${previewSeconds}s duration (${durationText}) at standard formula.`}
                </p>
              </div>

              {isEditing && (
                <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3 space-y-2.5 text-xs min-w-[240px]">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-medium">Manual Override:</label>
                    <input
                      type="checkbox"
                      checked={enableOverride}
                      onChange={(e) => setEnableOverride(e.target.checked)}
                      className="accent-violet-500 h-4 w-4 cursor-pointer"
                    />
                  </div>

                  {enableOverride && (
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-400">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        value={overrideValue}
                        onChange={(e) => setOverrideValue(e.target.value)}
                        placeholder={String(liveCalculatedPrice)}
                        className="input pl-7 py-1 text-sm text-white font-mono"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-white/6">
                    <label className="text-slate-300 font-medium">Trial Reel (₹0):</label>
                    <input
                      type="checkbox"
                      checked={isTrial}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setIsTrial(val);
                        if (val) setBillable(false);
                      }}
                      className="accent-amber-500 h-4 w-4 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Selector */}
          <div className="mt-5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-2">
              Project Status
            </label>
            <div className="flex flex-wrap gap-1.5">
              {allStatuses.map((st) => {
                const isSelected = status === st;
                return (
                  <motion.button
                    key={st}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={updating}
                    onClick={() => handleStatusSelect(st)}
                    className={[
                      "rounded-xl px-3 py-1.5 text-xs font-medium transition duration-200 border",
                      isSelected
                        ? "bg-violet-500 text-white border-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.35)] font-semibold"
                        : "bg-slate-900/60 text-slate-300 border-white/8 hover:bg-slate-800/80 hover:text-white",
                    ].join(" ")}
                  >
                    {st}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Google Drive Link Box */}
          <div className="mt-5 rounded-2xl border border-white/8 bg-slate-950/40 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wider text-violet-300 font-medium">
                  Google Drive Assets Link
                </p>
                {isEditing ? (
                  <input
                    value={driveLink}
                    onChange={(e) => setDriveLink(e.target.value)}
                    className="input text-xs font-mono mt-1 text-white"
                    placeholder="https://drive.google.com/drive/folders/..."
                  />
                ) : (
                  <p className="mt-1 truncate text-xs text-slate-300 font-mono">
                    {driveLink || project.driveLink || "Not specified"}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={copyDriveLink}
                  className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                {driveLink && (
                  <a
                    href={driveLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5"
                  >
                    Open Drive <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Notes & Requirements */}
          <div className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-1">
                Admin Notes
              </label>
              {isEditing ? (
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="input text-xs min-h-[70px] text-white"
                  placeholder="Internal notes on billing, payment, or edit scope..."
                />
              ) : (
                <div className="rounded-2xl border border-white/8 bg-slate-950/40 p-3 text-xs text-slate-300 whitespace-pre-wrap">
                  {adminNotes || project.adminNotes || "No admin notes added."}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-1">
                Editing Requirements & Style Brief
              </label>
              {isEditing ? (
                <textarea
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  className="input text-xs min-h-[70px] text-white"
                  placeholder="Creative style, captions, audio leveling instructions..."
                />
              ) : (
                <div className="rounded-2xl border border-white/8 bg-slate-950/40 p-3 text-xs text-slate-300 whitespace-pre-wrap">
                  {requirements || project.requirements || "Standard editing brief."}
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-6 pt-4 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-rose-300 font-semibold">Confirm delete?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={updating}
                    className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500 transition"
                  >
                    Yes, Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="rounded-xl bg-slate-800 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                onDelete && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition flex items-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete Project
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary px-4 py-2 text-xs"
              >
                Close
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={handleSaveForm}
                  disabled={updating}
                  className="btn-primary px-5 py-2 text-xs font-bold flex items-center gap-1.5 shadow-lg"
                >
                  <Save className="h-4 w-4" />
                  {updating ? "Saving..." : "Save Project Changes"}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
