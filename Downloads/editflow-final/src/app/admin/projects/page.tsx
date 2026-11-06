"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink,
  Search,
  Filter,
  Eye,
  Check,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  PlusCircle,
  Edit3,
  Trash2,
} from "lucide-react";

import { calculateProjectPrice, formatCurrency, formatDurationMmSs, getProjectCalculatedPrice, getProjectDurationSeconds } from "@/lib/pricing";
import type { PricingSettings, Project, ProjectStatus } from "@/lib/types";
import { ProjectDetailModal } from "@/components/project-modal";
import { CreateProjectModal } from "@/components/create-project-modal";
import { useToast } from "@/components/toast-context";

const statuses: ProjectStatus[] = [
  "New Request",
  "Pending",
  "In Progress",
  "Awaiting Client Feedback",
  "Revision Requested",
  "Completed",
  "On Hold",
  "Cancelled",
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pricingSettings, setPricingSettings] = useState<PricingSettings | undefined>();
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { success, error } = useToast();

  const loadProjects = async () => {
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
    loadProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesStatus = statusFilter === "all" || project.status === statusFilter;
      const matchesMonth = monthFilter === "all" || project.billingMonth === monthFilter;
      const matchesSearch = `${project.projectName} ${project.clientName} ${project.projectId}`
        .toLowerCase()
        .includes(search.toLowerCase());
      return matchesStatus && matchesMonth && matchesSearch;
    });
  }, [projects, search, statusFilter, monthFilter]);

  const updateStatus = async (projectId: string, status: ProjectStatus) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status } : p))
    );
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
      if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject(updated);
      }
      success(`Updated to ${status}`);
    } catch {
      error("Status update failed");
      await loadProjects();
    }
  };

  const toggleBillable = async (projectId: string, billable: boolean) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, billable, isTrial: billable ? false : p.isTrial } : p))
    );
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billable, isTrial: billable ? false : undefined }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
      if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject(updated);
      }
      success(billable ? "Project marked billable" : "Marked non-billable");
    } catch {
      error("Update failed");
      await loadProjects();
    }
  };

  const togglePaid = async (projectId: string, paid: boolean) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, paid } : p))
    );
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
      if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject(updated);
      }
      success(paid ? "Payment marked received" : "Marked unpaid");
    } catch {
      error("Payment update failed");
      await loadProjects();
    }
  };

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
      success("Project Updated", `${saved.projectName} saved successfully`);
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

  const summary = useMemo(() => {
    const totalCount = projects.length;
    const completedBillable = projects.filter((p) => p.billable && !p.isTrial && p.status === "Completed").length;
    const billableTotal = projects
      .filter((p) => p.billable && !p.isTrial)
      .reduce((sum, p) => sum + calculateProjectPrice(p, pricingSettings), 0);
    const paidTotal = projects
      .filter((p) => p.billable && !p.isTrial && p.paid)
      .reduce((sum, p) => sum + calculateProjectPrice(p, pricingSettings), 0);
    return {
      totalCount,
      completedBillable,
      billableTotal: Math.round((billableTotal + Number.EPSILON) * 100) / 100,
      paidTotal: Math.round((paidTotal + Number.EPSILON) * 100) / 100,
    };
  }, [projects, pricingSettings]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="glass-panel rounded-[24px] p-4 border border-white/8">
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Total Projects</p>
          <p className="mt-1 text-2xl font-bold text-white">{summary.totalCount}</p>
        </div>
        <div className="glass-panel rounded-[24px] p-4 border border-white/8">
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Completed Billable</p>
          <p className="mt-1 text-2xl font-bold text-violet-300">{summary.completedBillable}</p>
        </div>
        <div className="glass-panel rounded-[24px] p-4 border border-white/8">
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Billable Revenue</p>
          <p className="mt-1 text-2xl font-bold text-sky-300">{formatCurrency(summary.billableTotal)}</p>
        </div>
        <div className="glass-panel rounded-[24px] p-4 border border-white/8">
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Settled Realized</p>
          <p className="mt-1 text-2xl font-bold text-emerald-300">{formatCurrency(summary.paidTotal)}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-[28px] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="section-heading">Project Directory</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
              Client Editing Records
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-slate-900/60 px-3.5 py-2 text-sm text-slate-200 focus-within:border-violet-400/40">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by project, client, ID..."
                className="w-48 sm:w-64 bg-transparent text-xs sm:text-sm text-white outline-none placeholder:text-slate-400"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Month Filter Tabs */}
            <div className="flex items-center gap-1.5 rounded-2xl border border-white/8 bg-slate-900/60 p-1">
              {[
                { id: "all", label: "All" },
                { id: "2026-09", label: "Sep 2026" },
                { id: "2026-10", label: "Oct 2026" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMonthFilter(m.id)}
                  className={[
                    "rounded-xl px-2.5 py-1 text-xs font-semibold transition",
                    monthFilter === m.id
                      ? "bg-violet-600 text-white"
                      : "text-slate-400 hover:text-white",
                  ].join(" ")}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCreateModalOpen(true)}
              className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-md"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>+ Project</span>
            </button>
          </div>
        </div>

        {/* Quick Status Filter Pills */}
        <div className="mt-4 flex flex-wrap gap-1.5 pt-3 border-t border-white/6 overflow-x-auto">
          {["all", ...statuses].map((st) => {
            const count =
              st === "all" ? projects.length : projects.filter((p) => p.status === st).length;
            const isSelected = statusFilter === st;

            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={[
                  "flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-medium transition",
                  isSelected
                    ? "bg-violet-600 text-white shadow-sm"
                    : "bg-slate-900/40 text-slate-400 hover:text-white hover:bg-slate-800/60",
                ].join(" ")}
              >
                <span>{st === "all" ? "All" : st}</span>
                <span
                  className={[
                    "rounded-full px-1.5 py-0.2 text-[10px]",
                    isSelected ? "bg-violet-700/60 text-white" : "bg-white/6 text-slate-400",
                  ].join(" ")}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Projects Table */}
      <div className="glass-panel overflow-hidden rounded-[28px] border border-white/8 shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="border-b border-white/8 bg-slate-900/60 text-[10px] uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Project Info</th>
                <th className="px-4 py-3.5">Month</th>
                <th className="px-4 py-3.5">Duration</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-center">Category</th>
                <th className="px-4 py-3.5">Formula Price</th>
                <th className="px-4 py-3.5">Final Value</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6 text-xs">
              {filteredProjects.map((project) => {
                const durationSeconds = getProjectDurationSeconds(project);
                const durationFormatted = project.rawFootageDuration || formatDurationMmSs(durationSeconds);
                const calculated = getProjectCalculatedPrice(project, pricingSettings);
                const effective = calculateProjectPrice(project, pricingSettings);
                const hasOverride = project.manualPriceOverride !== null && project.manualPriceOverride !== undefined;

                return (
                  <motion.tr
                    key={project.id}
                    whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.02)" }}
                    className="transition-colors group"
                  >
                    {/* Project Info */}
                    <td className="px-5 py-4 max-w-[260px]">
                      <button
                        onClick={() => setSelectedProject(project)}
                        className="text-left group/btn"
                      >
                        <p className="font-semibold text-white group-hover/btn:text-violet-300 transition truncate">
                          {project.projectName}
                        </p>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {project.projectId} • {project.videoFormat}
                        </p>
                      </button>
                    </td>

                    {/* Month */}
                    <td className="px-4 py-4 font-mono text-slate-300">
                      <span className="rounded-lg bg-slate-900/80 px-2 py-1 border border-white/6 text-[11px]">
                        {project.billingMonth || "—"}
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="px-4 py-4 font-mono">
                      <span className="font-bold text-white">{durationFormatted}</span>
                      <span className="text-[10px] text-slate-500 ml-1">({durationSeconds}s)</span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <select
                        value={project.status}
                        onChange={(e) => updateStatus(project.id, e.target.value as ProjectStatus)}
                        className="rounded-xl border border-white/10 bg-slate-900/90 py-1 px-2.5 text-xs text-white outline-none focus:border-violet-400"
                      >
                        {statuses.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-4 text-center">
                      {project.isTrial ? (
                        <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-200">
                          Trial Reel
                        </span>
                      ) : (
                        <button
                          onClick={() => toggleBillable(project.id, !project.billable)}
                          className={[
                            "rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition border",
                            project.billable
                              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                              : "border-slate-700 bg-slate-800 text-slate-400",
                          ].join(" ")}
                        >
                          {project.billable ? "✓ Billable" : "Non-Billable"}
                        </button>
                      )}
                    </td>

                    {/* Formula Calculated */}
                    <td className="px-4 py-4 font-mono text-slate-400">
                      {formatCurrency(calculated)}
                    </td>

                    {/* Final Value */}
                    <td className="px-4 py-4">
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
                          <span className="text-[9px] px-1 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
                            Override
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedProject(project)}
                          className="rounded-xl border border-white/10 bg-slate-800/80 p-1.5 text-slate-300 hover:text-white hover:bg-violet-600 transition"
                          title="Edit Project"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="rounded-xl border border-white/10 bg-slate-800/80 p-1.5 text-slate-400 hover:text-rose-300 hover:bg-rose-500/20 transition"
                          title="Delete Project"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* Modals */}
      <ProjectDetailModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        onSave={handleSaveProject}
        onDelete={handleDeleteProject}
        onStatusChange={updateStatus}
        onToggleBillable={toggleBillable}
        onTogglePaid={togglePaid}
      />

      <CreateProjectModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(newP) => {
          setProjects((prev) => [newP, ...prev]);
          success("Project Created", `${newP.projectName} created successfully`);
        }}
      />
    </div>
  );
}
