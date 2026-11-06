"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Clock,
  Film,
  FolderOpen,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  ChevronLeft,
} from "lucide-react";

import { calculatePriceFromText, formatCurrency } from "@/lib/pricing";
import { defaultPricingSettings } from "@/lib/mock-data";
import { useToast } from "@/components/toast-context";

const initialForm = {
  clientName: "",
  companyName: "",
  email: "",
  phone: "",
  projectName: "",
  description: "",
  requirements: "",
  driveLink: "",
  rawFootageDuration: "",
  referenceLink: "",
  expectedDuration: "",
  videoFormat: "",
  editingType: "",
  requiredDeliverables: "",
  expectedDeliveryDate: "",
  priority: "Normal" as "Normal" | "Urgent",
  additionalInstructions: "",
};

const formatOptions = [
  { id: "9:16", label: "9:16 (Reels/Shorts)" },
  { id: "16:9", label: "16:9 (YouTube/Landscape)" },
  { id: "1:1", label: "1:1 (Square)" },
  { id: "Custom", label: "Custom Ratio" },
];

const editingTypeOptions = [
  "Reels",
  "YouTube Video",
  "Promotional Video",
  "UGC",
  "Educational",
  "Other",
];

const durationPresets = ["1:00", "1:30", "2:00", "3:00", "5:00"];

export default function NewProjectPage() {
  const [form, setForm] = useState(initialForm);
  const [pricing, setPricing] = useState(defaultPricingSettings);
  const [error, setError] = useState("");
  const [submittedProject, setSubmittedProject] = useState<{ id: string; projectId: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { success: toastSuccess, error: toastError } = useToast();

  useEffect(() => {
    const loadPricing = async () => {
      try {
        const response = await fetch("/api/pricing");
        const data = await response.json();
        setPricing({ ...defaultPricingSettings, ...data });
      } catch {
        setPricing(defaultPricingSettings);
      }
    };
    loadPricing();
  }, []);

  const estimatedPrice = useMemo(() => {
    if (!/^\d+:[0-5]\d$/.test(form.rawFootageDuration)) {
      return 0;
    }
    return calculatePriceFromText(form.rawFootageDuration, pricing);
  }, [form.rawFootageDuration, pricing]);

  const isValidDriveLink = useMemo(() => {
    const driveUrl = form.driveLink.trim().toLowerCase();
    return driveUrl.startsWith("http") && driveUrl.includes("drive.google.com");
  }, [form.driveLink]);

  const handleChange = (field: string, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const copyProjectId = async () => {
    if (submittedProject?.projectId) {
      await navigator.clipboard.writeText(submittedProject.projectId);
      setCopied(true);
      toastSuccess("Copied to clipboard", submittedProject.projectId);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!form.clientName || !form.email || !form.projectName || !form.driveLink || !form.rawFootageDuration) {
      setError("Please complete all required fields (*).");
      return;
    }

    if (!isValidDriveLink) {
      setError("Please enter a valid Google Drive sharing link (https://drive.google.com/...).");
      return;
    }

    if (!/^\d+:[0-5]\d$/.test(form.rawFootageDuration)) {
      setError("Raw footage duration must be in MM:SS format (e.g. 02:30).");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          estimatedPrice,
          additionalInstructions: form.additionalInstructions,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Project submission failed");
      }

      setSubmittedProject(result.project);
      toastSuccess("Project Submitted Successfully", `Reference ID: ${result.project.projectId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to submit project right now.";
      setError(msg);
      toastError("Submission Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setSubmittedProject(null);
    setError("");
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 text-slate-100">
      <div className="ambient-orb left-4 top-20 h-80 w-80 bg-violet-600/20" />
      <div className="ambient-orb right-8 bottom-0 h-96 w-96 bg-cyan-500/15" />

      <div className="relative mx-auto max-w-6xl">
        {/* Navigation & Header */}
        <header className="glass-panel mb-8 rounded-[30px] p-5 sm:p-6 border border-white/8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/60 text-slate-300 hover:text-white hover:bg-white/10 transition"
                title="Back to Homepage"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <div>
                <div className="kicker">Intake Portal</div>
                <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Submit Editing Project
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/admin" className="btn-secondary text-xs py-2 px-4">
                Admin Login
              </Link>
            </div>
          </div>
        </header>

        {/* Success State Celebration Card */}
        <AnimatePresence mode="wait">
          {submittedProject ? (
            <motion.div
              key="success-card"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel mx-auto max-w-2xl rounded-[32px] p-8 sm:p-10 text-center border border-emerald-500/30 bg-slate-900/90 shadow-[0_30px_90px_rgba(16,185,129,0.15)]"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 shadow-[0_0_40px_rgba(16,185,129,0.35)]">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <h2 className="mt-6 text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Project Intake Received!
              </h2>
              <p className="mt-2 text-sm text-slate-300 max-w-md mx-auto">
                Your footage and editing directions are queued. Our creative timeline is now in motion.
              </p>

              {/* Reference ID Pill */}
              <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-3 pr-4">
                <span className="text-xs uppercase tracking-wider text-slate-400 pl-2">Reference ID:</span>
                <span className="font-mono text-base font-bold text-violet-300">
                  {submittedProject.projectId}
                </span>
                <button
                  onClick={copyProjectId}
                  className="rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition flex items-center gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button onClick={resetForm} className="btn-primary w-full sm:w-auto">
                  Submit Another Project
                </button>
                <Link href="/" className="btn-secondary w-full sm:w-auto">
                  Return to Home
                </Link>
              </div>
            </motion.div>
          ) : (
            /* Main Intake Form */
            <motion.form
              key="intake-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSubmit}
              className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]"
            >
              <div className="space-y-6">
                {/* Section 1: Client Information */}
                <div className="glass-panel rounded-[28px] p-6 border border-white/8 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-white/6">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300">
                      1
                    </span>
                    <h2 className="text-lg font-bold text-white">Client Information</h2>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Full Name" required>
                      <input
                        value={form.clientName}
                        onChange={(e) => handleChange("clientName", e.target.value)}
                        className="input text-sm"
                        placeholder="John Doe"
                        required
                      />
                    </Field>
                    <Field label="Company / Brand Name">
                      <input
                        value={form.companyName}
                        onChange={(e) => handleChange("companyName", e.target.value)}
                        className="input text-sm"
                        placeholder="Trading Bells / Creator Co."
                      />
                    </Field>
                    <Field label="Email Address" required>
                      <input
                        value={form.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        className="input text-sm"
                        type="email"
                        placeholder="john@example.com"
                        required
                      />
                    </Field>
                    <Field label="Phone / WhatsApp">
                      <input
                        value={form.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        className="input text-sm"
                        placeholder="+91 98765 43210"
                      />
                    </Field>
                  </div>
                </div>

                {/* Section 2: Creative Specifications */}
                <div className="glass-panel rounded-[28px] p-6 border border-white/8 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-white/6">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300">
                      2
                    </span>
                    <h2 className="text-lg font-bold text-white">Project & Editing Scope</h2>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Project Title / Campaign" required>
                      <input
                        value={form.projectName}
                        onChange={(e) => handleChange("projectName", e.target.value)}
                        className="input text-sm"
                        placeholder="Ep 4: Market Breakdown"
                        required
                      />
                    </Field>

                    <Field label="Type of Content">
                      <select
                        value={form.editingType}
                        onChange={(e) => handleChange("editingType", e.target.value)}
                        className="input text-sm"
                      >
                        {editingTypeOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  {/* Video Aspect Ratio Selector */}
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Video Format / Aspect Ratio
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {formatOptions.map((opt) => {
                        const isSelected = form.videoFormat === opt.id;
                        return (
                          <button
                            type="button"
                            key={opt.id}
                            onClick={() => handleChange("videoFormat", opt.id)}
                            className={[
                              "rounded-2xl border p-2.5 text-xs font-medium text-center transition",
                              isSelected
                                ? "bg-violet-600/30 border-violet-400 text-white shadow-md font-semibold"
                                : "bg-slate-900/50 border-white/8 text-slate-400 hover:text-white hover:bg-slate-800/60",
                            ].join(" ")}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Priority Selector */}
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Priority Level
                    </label>
                    <div className="flex gap-3">
                      {(["Normal", "Urgent"] as const).map((p) => {
                        const isSelected = form.priority === p;
                        return (
                          <button
                            type="button"
                            key={p}
                            onClick={() => handleChange("priority", p)}
                            className={[
                              "flex-1 rounded-2xl border py-2 text-xs font-semibold transition text-center",
                              isSelected
                                ? p === "Urgent"
                                  ? "bg-amber-500/20 border-amber-400 text-amber-200"
                                  : "bg-violet-600/25 border-violet-400 text-white"
                                : "bg-slate-900/50 border-white/8 text-slate-400 hover:text-white",
                            ].join(" ")}
                          >
                            {p === "Urgent" ? "⚡ Urgent Turnaround" : "Standard Timeline (Normal)"}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Field label="Editing Requirements & Creative Style" required>
                    <textarea
                      value={form.requirements}
                      onChange={(e) => handleChange("requirements", e.target.value)}
                      className="input text-sm min-h-[90px]"
                      placeholder="Pacing, typography preference, sound design cues, B-roll suggestions, etc."
                      required
                    />
                  </Field>

                  <Field label="Deliverables Checklist">
                    <textarea
                      value={form.requiredDeliverables}
                      onChange={(e) => handleChange("requiredDeliverables", e.target.value)}
                      className="input text-sm min-h-[70px]"
                      placeholder="e.g. 1x 9:16 Reel with captions, 1x clean version without subtitles, thumbnail preview"
                    />
                  </Field>
                </div>

                {/* Section 3: Media Links & Footage Duration */}
                <div className="glass-panel rounded-[28px] p-6 border border-white/8 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-white/6">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300">
                      3
                    </span>
                    <h2 className="text-lg font-bold text-white">Footage & Delivery</h2>
                  </div>

                  {/* Google Drive Link with instant validation */}
                  <Field label="Google Drive Folder / Asset Link" required>
                    <div className="relative">
                      <input
                        value={form.driveLink}
                        onChange={(e) => handleChange("driveLink", e.target.value)}
                        className={`input text-sm ${
                          form.driveLink
                            ? isValidDriveLink
                              ? "border-emerald-500/50 focus:border-emerald-400"
                              : "border-amber-500/50 focus:border-amber-400"
                            : ""
                        }`}
                        placeholder="https://drive.google.com/drive/folders/..."
                        required
                      />
                      {form.driveLink && (
                        <div className="absolute right-3 top-2.5">
                          {isValidDriveLink ? (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                              <ShieldCheck className="h-4 w-4" /> Valid Link
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                              <AlertCircle className="h-4 w-4" /> Check URL
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Ensure link access is set to &quot;Anyone with the link can view&quot;.
                    </p>
                  </Field>

                  {/* Footage Duration with presets */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Raw Footage Duration (MM:SS) *
                      </label>
                      <span className="text-[11px] text-violet-300">Affects base pricing</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        value={form.rawFootageDuration}
                        onChange={(e) => handleChange("rawFootageDuration", e.target.value)}
                        className="input text-sm font-mono w-32 text-center font-bold text-white"
                        placeholder="02:30"
                        required
                      />

                      <div className="flex flex-wrap gap-1.5">
                        {durationPresets.map((preset) => (
                          <button
                            type="button"
                            key={preset}
                            onClick={() => handleChange("rawFootageDuration", preset)}
                            className={[
                              "rounded-xl border px-2.5 py-1 text-xs font-mono transition",
                              form.rawFootageDuration === preset
                                ? "bg-violet-600 border-violet-400 text-white font-bold"
                                : "bg-slate-900/60 border-white/8 text-slate-400 hover:text-white",
                            ].join(" ")}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Target Delivery Date">
                      <input
                        value={form.expectedDeliveryDate}
                        onChange={(e) => handleChange("expectedDeliveryDate", e.target.value)}
                        className="input text-sm"
                        type="date"
                      />
                    </Field>
                    <Field label="Reference Video / Inspiration Link">
                      <input
                        value={form.referenceLink}
                        onChange={(e) => handleChange("referenceLink", e.target.value)}
                        className="input text-sm"
                        placeholder="https://instagram.com/reel/..."
                      />
                    </Field>
                  </div>
                </div>
              </div>

              {/* Sidebar Live Summary & Submit */}
              <aside className="space-y-5">
                <div className="glass-panel rounded-[28px] p-6 border border-violet-500/25 bg-gradient-to-b from-slate-900/90 to-slate-950/90 sticky top-6">
                  {/* Real-time Pricing Preview */}
                  <div className="rounded-[22px] border border-violet-400/25 bg-gradient-to-br from-violet-600/20 via-indigo-600/10 to-sky-600/15 p-5 shadow-[0_10px_30px_rgba(139,92,246,0.18)]">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-300">
                      Estimated Project Investment
                    </p>
                    <motion.h3
                      key={estimatedPrice}
                      initial={{ scale: 0.95, opacity: 0.7 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="mt-1 text-4xl font-extrabold tracking-tight text-white"
                    >
                      {formatCurrency(estimatedPrice)}
                    </motion.h3>
                    <p className="mt-2 text-xs text-slate-300">
                      Based on {form.rawFootageDuration || "—"} footage duration at standard rate formula.
                    </p>
                  </div>

                  {/* Checklist */}
                  <div className="mt-5 rounded-2xl border border-white/6 bg-slate-950/40 p-4 space-y-2.5 text-xs text-slate-300">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
                      Submission Checklist
                    </p>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`h-4 w-4 ${form.projectName ? "text-emerald-400" : "text-slate-600"}`} />
                      <span>Project title specified</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`h-4 w-4 ${isValidDriveLink ? "text-emerald-400" : "text-slate-600"}`} />
                      <span>Valid Google Drive folder link</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`h-4 w-4 ${form.requirements ? "text-emerald-400" : "text-slate-600"}`} />
                      <span>Creative directions provided</span>
                    </div>
                  </div>

                  {error && (
                    <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                      <span>{error}</span>
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="btn-primary mt-5 w-full py-3.5 text-sm font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Queueing Project..." : "Submit Project Intake"}
                  </motion.button>

                  <p className="text-center text-[11px] text-slate-400 mt-3">
                    Your request is recorded immediately in the EditFlow timeline.
                  </p>
                </div>
              </aside>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
      <span className="mb-1.5 block">
        {label}
        {required && <span className="ml-1 text-violet-400">*</span>}
      </span>
      {children}
    </label>
  );
}
