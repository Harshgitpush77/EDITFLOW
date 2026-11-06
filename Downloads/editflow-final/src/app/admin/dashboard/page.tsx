"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  CalendarRange,
  CreditCard,
  FolderKanban,
  FolderOpen,
  TimerReset,
  Clock,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  Search,
  Filter,
  PlusCircle,
  Download,
  Edit3,
  Trash2,
  ExternalLink,
  ChevronRight,
  ArrowUpDown,
  Check,
  AlertCircle,
  ShieldCheck,
  Film,
} from "lucide-react";
import Link from "next/link";

import { StatCard } from "@/components/stat-card";
import {
  calculateProjectPrice,
  formatCurrency,
  formatDurationMmSs,
  getProjectCalculatedPrice,
  getProjectDurationSeconds,
} from "@/lib/pricing";
import type { PricingSettings, Project, ProjectStatus } from "@/lib/types";
import { ProjectDetailModal } from "@/components/project-modal";
import { CreateProjectModal } from "@/components/create-project-modal";
import { useToast } from "@/components/toast-context";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pricingSettings, setPricingSettings] = useState<PricingSettings | undefined>();
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "price" | "duration">("date");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { success, error } = useToast();

  const loadData = async () => {
    try {
      const [projRes, priceRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/pricing"),
      ]);
      const projData = await projRes.json();
      const priceData = await priceRes.json();
      setProjects(Array.isArray(projData) ? projData : []);
      setPricingSettings(priceData);
    } catch {
      setProjects([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // -------------------------------------------------------------
  // ACCURATE METRIC CALCULATIONS
  // -------------------------------------------------------------
  const metrics = useMemo(() => {
    const totalProjects = projects.length;
    const completedBillable = projects.filter(
      (p) => p.billable && !p.isTrial && p.status === "Completed"
    ).length;
    const trialProjects = projects.filter((p) => p.isTrial || !p.billable).length;

    // September Earnings (Multi Bagger Stock trial reel excluded)
    const septemberEarnings = projects
      .filter((p) => p.billingMonth === "2026-09" && p.billable && !p.isTrial)
      .reduce((sum, p) => sum + calculateProjectPrice(p, pricingSettings), 0);

    // October Earnings (All 8 videos billable)
    const octoberEarnings = projects
      .filter((p) => p.billingMonth === "2026-10" && p.billable && !p.isTrial)
      .reduce((sum, p) => sum + calculateProjectPrice(p, pricingSettings), 0);

    // Total Earnings (September + October billable)
    const totalEarnings = projects
      .filter((p) => p.billable && !p.isTrial)
      .reduce((sum, p) => sum + calculateProjectPrice(p, pricingSettings), 0);

    return {
      totalProjects,
      completedBillable,
      trialProjects,
      septemberEarnings: Math.round((septemberEarnings + Number.EPSILON) * 100) / 100,
      octoberEarnings: Math.round((octoberEarnings + Number.EPSILON) * 100) / 100,
      totalEarnings: Math.round((totalEarnings + Number.EPSILON) * 100) / 100,
    };
  }, [projects, pricingSettings]);

  // -------------------------------------------------------------
  // FILTERING & SORTING
  // -------------------------------------------------------------
  const filteredProjects = useMemo(() => {
    let result = projects.filter((project) => {
      const matchesSearch = `${project.projectName} ${project.projectId} ${project.clientName}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesMonth = monthFilter === "all" || project.billingMonth === monthFilter;
      const matchesStatus = statusFilter === "all" || project.status === statusFilter;
      return matchesSearch && matchesMonth && matchesStatus;
    });

    result.sort((a, b) => {
      if (sortBy === "name") return a.projectName.localeCompare(b.projectName);
      if (sortBy === "price") {
        return calculateProjectPrice(b, pricingSettings) - calculateProjectPrice(a, pricingSettings);
      }
      if (sortBy === "duration") {
        return getProjectDurationSeconds(b) - getProjectDurationSeconds(a);
      }
      // default: date desc
      return new Date(b.createdAt || b.submissionDate).getTime() - new Date(a.createdAt || a.submissionDate).getTime();
    });

    return result;
  }, [projects, search, monthFilter, statusFilter, sortBy, pricingSettings]);

  // Separate project batches for September, October, and other cycles
  const septemberProjects = useMemo(
    () => filteredProjects.filter((p) => p.billingMonth === "2026-09"),
    [filteredProjects]
  );

  const octoberProjects = useMemo(
    () => filteredProjects.filter((p) => p.billingMonth === "2026-10"),
    [filteredProjects]
  );

  const otherProjects = useMemo(
    () => filteredProjects.filter((p) => p.billingMonth !== "2026-09" && p.billingMonth !== "2026-10"),
    [filteredProjects]
  );

  // -------------------------------------------------------------
  // PROJECT MUTATIONS
  // -------------------------------------------------------------
  const handleSaveProject = async (updated: Project) => {
    try {
      const res = await fetch(`/api/projects/${updated.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error("Update failed");
      const saved = await res.json();
      setProjects((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
      setSelectedProject(saved);
      success("Project Saved", `${saved.projectName} updated successfully`);
    } catch {
      error("Save Error", "Failed to update project");
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setProjects((prev) => prev.filter((p) => p.id !== id));
      success("Project Deleted", "Record removed from database");
    } catch {
      error("Delete Error", "Failed to delete project");
    }
  };

  const handleCreated = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
    success("Project Created", `${newProject.projectName} added to ${newProject.billingMonth}`);
  };

  const exportDataCsv = () => {
    const headers = [
      "Project ID",
      "Project Name",
      "Client",
      "Month",
      "Duration",
      "Seconds",
      "Status",
      "Billable",
      "Calculated Price",
      "Override Price",
      "Final Price",
    ];

    const rows = filteredProjects.map((p) => [
      p.projectId,
      `"${p.projectName.replace(/"/g, '""')}"`,
      p.clientName,
      p.billingMonth,
      p.rawFootageDuration || formatDurationMmSs(getProjectDurationSeconds(p)),
      getProjectDurationSeconds(p),
      p.status,
      p.isTrial ? "Trial" : p.billable ? "Billable" : "Non-billable",
      getProjectCalculatedPrice(p, pricingSettings).toFixed(2),
      p.manualPriceOverride !== null && p.manualPriceOverride !== undefined ? p.manualPriceOverride.toFixed(2) : "None",
      calculateProjectPrice(p, pricingSettings).toFixed(2),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `editflow-projects-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    success("Export Ready", "Projects data downloaded as CSV");
  };

  return (
    <div className="space-y-8">
      {/* Overview Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="kicker">Admin Command Center</span>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Database Connected
            </span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Studio Financials & Project Pipeline
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Complete management of September and October 2026 creative deliverables and billing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={exportDataCsv}
            className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
            title="Download CSV export"
          >
            <Download className="h-3.5 w-3.5 text-slate-300" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-lg"
          >
            <PlusCircle className="h-4 w-4" />
            <span>+ New Project</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 6 PROFESSIONAL SUMMARY CARDS                                  */}
      {/* ------------------------------------------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total Projects"
          value={String(metrics.totalProjects)}
          trend="13 in records"
          icon={FolderOpen}
        />
        <StatCard
          label="Completed Billable"
          value={String(metrics.completedBillable)}
          trend="12 settled & ready"
          icon={CheckCircle2}
        />
        <StatCard
          label="Trial Projects"
          value={String(metrics.trialProjects)}
          trend="Multi Bagger (₹0)"
          icon={Sparkles}
        />
        <StatCard
          label="September Earnings"
          value={formatCurrency(metrics.septemberEarnings)}
          trend="4 billable videos"
          icon={CalendarRange}
        />
        <StatCard
          label="October Earnings"
          value={formatCurrency(metrics.octoberEarnings)}
          trend="8 billable videos"
          icon={TrendingUp}
        />
        <StatCard
          label="Total Earnings"
          value={formatCurrency(metrics.totalEarnings)}
          trend="Grand total ₹6,176.67"
          icon={CreditCard}
        />
      </div>

      {/* Search, Filter & Controls Bar */}
      <div className="glass-panel rounded-[26px] p-4 sm:p-5 border border-white/8 space-y-3.5">
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
          {/* Search Input */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 text-xs py-2 text-white"
              placeholder="Search by project name, ID (EF-...), or client..."
            />
          </div>

          {/* Month Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-start sm:justify-end">
            {[
              { id: "all", label: "All Months" },
              { id: "2026-09", label: "Sep 2026" },
              { id: "2026-10", label: "Oct 2026" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMonthFilter(tab.id)}
                className={[
                  "rounded-xl px-3 py-1.5 text-xs font-semibold transition border",
                  monthFilter === tab.id
                    ? "bg-violet-600 border-violet-400 text-white shadow-md"
                    : "bg-slate-900/60 border-white/8 text-slate-400 hover:text-white hover:bg-slate-800/80",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/6 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
              Filter:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-900/80 px-2.5 py-1 text-xs text-slate-200 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending">Pending</option>
              <option value="New Request">New Request</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
              Sort By:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-white/10 bg-slate-900/80 px-2.5 py-1 text-xs text-slate-200 outline-none"
            >
              <option value="date">Date Created (Newest)</option>
              <option value="price">Highest Value</option>
              <option value="duration">Duration (Longest)</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SEPARATE PROJECT SECTIONS: SEPTEMBER & OCTOBER                */}
      {/* ------------------------------------------------------------- */}

      {/* September 2026 Batch Section */}
      {(monthFilter === "all" || monthFilter === "2026-09") && (
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-violet-500/20 text-xs font-bold text-violet-300">
                09
              </span>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  September 2026 Project Batch
                </h2>
                <p className="text-xs text-slate-400">
                  5 projects • 4 Completed & Billable • 1 Trial Reel Excluded
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">Batch Settlement:</span>
              <span className="rounded-xl border border-violet-400/30 bg-violet-500/15 px-3 py-1 text-sm font-extrabold text-violet-200 font-mono">
                {formatCurrency(metrics.septemberEarnings)}
              </span>
            </div>
          </div>

          <ProjectTable
            projects={septemberProjects}
            pricingSettings={pricingSettings}
            onSelectProject={(p) => setSelectedProject(p)}
            onDeleteProject={handleDeleteProject}
          />
        </section>
      )}

      {/* October 2026 Batch Section */}
      {(monthFilter === "all" || monthFilter === "2026-10") && (
        <section className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-sky-500/20 text-xs font-bold text-sky-300">
                10
              </span>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  October 2026 Project Batch
                </h2>
                <p className="text-xs text-slate-400">
                  8 projects • All Completed & Billable (Proportional under 2m rate applied)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">Batch Settlement:</span>
              <span className="rounded-xl border border-sky-400/30 bg-sky-500/15 px-3 py-1 text-sm font-extrabold text-sky-200 font-mono">
                {formatCurrency(metrics.octoberEarnings)}
              </span>
            </div>
          </div>

          <ProjectTable
            projects={octoberProjects}
            pricingSettings={pricingSettings}
            onSelectProject={(p) => setSelectedProject(p)}
            onDeleteProject={handleDeleteProject}
          />
        </section>
      )}

      {/* Additional / Other Months Section (dynamically handles new projects) */}
      {otherProjects.length > 0 && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/20 text-xs font-bold text-emerald-300">
                +
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Additional Pipeline Batches
              </h2>
            </div>
          </div>

          <ProjectTable
            projects={otherProjects}
            pricingSettings={pricingSettings}
            onSelectProject={(p) => setSelectedProject(p)}
            onDeleteProject={handleDeleteProject}
          />
        </section>
      )}

      {/* Modals */}
      <ProjectDetailModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        onSave={handleSaveProject}
        onDelete={handleDeleteProject}
      />

      <CreateProjectModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}

// -------------------------------------------------------------
// REUSABLE PROJECT TABLE ROW COMPONENT
// -------------------------------------------------------------
function ProjectTable({
  projects,
  pricingSettings,
  onSelectProject,
  onDeleteProject,
}: {
  projects: Project[];
  pricingSettings?: PricingSettings;
  onSelectProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
}) {
  if (projects.length === 0) {
    return (
      <div className="glass-panel rounded-[24px] p-8 text-center text-xs text-slate-400 border border-white/6">
        No projects match the selected criteria in this batch.
      </div>
    );
  }

  return (
    <div className="glass-panel overflow-hidden rounded-[26px] border border-white/8 shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/60 uppercase tracking-wider text-[10px] text-slate-400 font-semibold border-b border-white/6">
            <tr>
              <th className="py-3 px-4">Project Name & ID</th>
              <th className="py-3 px-3">Duration</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Billing Category</th>
              <th className="py-3 px-3">Auto Calculated</th>
              <th className="py-3 px-3">Override / Billed</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/6">
            {projects.map((project) => {
              const seconds = getProjectDurationSeconds(project);
              const durationFormatted = project.rawFootageDuration || formatDurationMmSs(seconds);
              const calculated = getProjectCalculatedPrice(project, pricingSettings);
              const effective = calculateProjectPrice(project, pricingSettings);
              const hasOverride = project.manualPriceOverride !== null && project.manualPriceOverride !== undefined;

              return (
                <motion.tr
                  key={project.id}
                  whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.02)" }}
                  className="transition-colors group"
                >
                  {/* Name & ID */}
                  <td className="py-3.5 px-4 font-medium text-white max-w-[240px]">
                    <div className="flex items-center gap-2">
                      <div className="truncate">
                        <p className="font-semibold text-white truncate group-hover:text-violet-300 transition-colors">
                          {project.projectName}
                        </p>
                        <p className="font-mono text-[10px] text-slate-400">
                          {project.projectId} • {project.videoFormat}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Duration */}
                  <td className="py-3.5 px-3 font-mono">
                    <span className="font-bold text-slate-200">{durationFormatted}</span>
                    <span className="ml-1 text-[10px] text-slate-500">({seconds}s)</span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3">
                    <span
                      className={[
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                        project.status === "Completed"
                          ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : project.status === "In Progress"
                          ? "border border-sky-500/30 bg-sky-500/10 text-sky-300"
                          : "border border-slate-700 bg-slate-800 text-slate-300",
                      ].join(" ")}
                    >
                      {project.status === "Completed" && <Check className="h-2.5 w-2.5" />}
                      {project.status}
                    </span>
                  </td>

                  {/* Billing Status */}
                  <td className="py-3.5 px-3">
                    {project.isTrial ? (
                      <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-200">
                        Trial / Non-billable
                      </span>
                    ) : project.billable ? (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                        Billable
                      </span>
                    ) : (
                      <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                        Non-Billable
                      </span>
                    )}
                  </td>

                  {/* Auto Calculated */}
                  <td className="py-3.5 px-3 font-mono text-slate-400">
                    {formatCurrency(calculated)}
                  </td>

                  {/* Effective / Override Price */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-1.5 font-mono">
                      <span
                        className={[
                          "text-sm font-bold",
                          project.isTrial || !project.billable
                            ? "text-slate-400"
                            : "text-white",
                        ].join(" ")}
                      >
                        {formatCurrency(effective)}
                      </span>
                      {hasOverride && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 border border-sky-400/30 text-sky-200 font-sans">
                          Manual
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectProject(project)}
                        className="rounded-xl border border-white/10 bg-slate-800/80 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-violet-600 hover:border-violet-400 hover:text-white transition flex items-center gap-1"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
