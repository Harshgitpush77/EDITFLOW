"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink,
  Search,
  Clock,
  Sparkles,
  ChevronRight,
  Filter,
  Eye,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import type { Project, ProjectStatus, Priority } from "@/lib/types";
import { ProjectDetailModal } from "@/components/project-modal";
import { useToast } from "@/components/toast-context";
import { calculateProjectPrice, formatCurrency } from "@/lib/pricing";

const columns: { status: ProjectStatus; label: string; accent: string }[] = [
  { status: "New Request", label: "New Requests", accent: "from-violet-500 to-indigo-500" },
  { status: "Pending", label: "Pending Intake", accent: "from-blue-500 to-cyan-500" },
  { status: "In Progress", label: "In Production", accent: "from-sky-500 to-teal-500" },
  { status: "Awaiting Client Feedback", label: "Client Review", accent: "from-amber-500 to-orange-500" },
  { status: "Revision Requested", label: "Revisions", accent: "from-rose-500 to-pink-500" },
  { status: "Completed", label: "Delivered", accent: "from-emerald-500 to-green-500" },
  { status: "On Hold", label: "On Hold", accent: "from-slate-500 to-zinc-500" },
  { status: "Cancelled", label: "Archived", accent: "from-red-600 to-stone-600" },
];

export default function KanbanPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const { success, error } = useToast();

  const loadProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch {
      setProjects([]);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const moveProject = async (projectId: string, newStatus: ProjectStatus) => {
    setMovingId(projectId);
    try {
      // Optimistic update
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
      );

      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      const updated = await res.json();
      if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      success(`Moved to ${newStatus}`, `Project status updated`);
    } catch {
      error("Update failed", "Could not persist status change");
      await loadProjects();
    } finally {
      setMovingId(null);
    }
  };

  const toggleBillable = async (projectId: string, billable: boolean) => {
    try {
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, billable } : p))
      );
      await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billable }),
      });
      if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject((prev) => (prev ? { ...prev, billable } : null));
      }
      success(billable ? "Marked as billable" : "Marked as non-billable");
    } catch {
      error("Update failed");
      await loadProjects();
    }
  };

  const togglePaid = async (projectId: string, paid: boolean) => {
    try {
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, paid } : p))
      );
      await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid }),
      });
      if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject((prev) => (prev ? { ...prev, paid } : null));
      }
      success(paid ? "Marked as paid" : "Marked as unpaid");
    } catch {
      error("Update failed");
      await loadProjects();
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchSearch = `${project.projectName} ${project.clientName} ${project.projectId}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchPriority = priorityFilter === "all" || project.priority === priorityFilter;
      return matchSearch && matchPriority;
    });
  }, [projects, search, priorityFilter]);

  // Determine next status helper
  const getNextStatus = (current: ProjectStatus): ProjectStatus | null => {
    const sequence: ProjectStatus[] = [
      "New Request",
      "Pending",
      "In Progress",
      "Awaiting Client Feedback",
      "Completed",
    ];
    const idx = sequence.indexOf(current);
    if (idx !== -1 && idx < sequence.length - 1) {
      return sequence[idx + 1];
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="glass-panel rounded-[28px] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="section-heading">Creative Flow</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
              Project Pipeline Board
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 focus-within:border-violet-400/40">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search pipeline..."
                className="w-40 sm:w-52 bg-transparent text-xs sm:text-sm text-white outline-none placeholder:text-slate-400"
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

            {/* Priority Filter */}
            <div className="flex items-center rounded-2xl border border-white/8 bg-slate-900/60 p-1 text-xs">
              {["all", "Urgent", "Normal"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={[
                    "rounded-xl px-3 py-1.5 font-medium transition",
                    priorityFilter === p
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200",
                  ].join(" ")}
                >
                  {p === "all" ? "All Priority" : p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {columns.map(({ status, label, accent }) => {
          const colProjects = filteredProjects.filter((p) => p.status === status);

          return (
            <div
              key={status}
              className="glass-panel flex flex-col rounded-[26px] p-4 min-h-[460px] border border-white/8 bg-slate-900/40"
            >
              {/* Column Header */}
              <div className="mb-4 flex items-center justify-between pb-3 border-b border-white/6">
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${accent}`} />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    {label}
                  </h3>
                </div>
                <span className="rounded-full border border-white/10 bg-slate-950/60 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
                  {colProjects.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                <AnimatePresence mode="popLayout">
                  {colProjects.map((project) => {
                    const nextStatus = getNextStatus(project.status);

                    return (
                      <motion.div
                        layout
                        key={project.id}
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        whileHover={{ y: -3, transition: { duration: 0.2 } }}
                        transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        className="glass-card group relative rounded-[22px] border border-white/8 p-4 shadow-[0_10px_25px_rgba(0,0,0,0.3)] hover:border-violet-400/35 transition-colors cursor-pointer"
                        onClick={() => setSelectedProject(project)}
                      >
                        {/* Priority Badge & ID */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono font-medium text-slate-400">
                            {project.projectId}
                          </span>
                          <span
                            className={[
                              "rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                              project.priority === "Urgent"
                                ? "bg-amber-500/15 border border-amber-400/30 text-amber-300"
                                : "bg-slate-800 text-slate-400",
                            ].join(" ")}
                          >
                            {project.priority}
                          </span>
                        </div>

                        {/* Title & Client */}
                        <h4 className="mt-2 text-sm font-bold text-white group-hover:text-violet-200 transition-colors line-clamp-1">
                          {project.projectName}
                        </h4>
                        <p className="text-xs text-slate-400 line-clamp-1">
                          {project.clientName}
                        </p>

                        {/* Meta Specs */}
                        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2.5 border-t border-white/6">
                          <span className="flex items-center gap-1 font-mono text-slate-300">
                            <Clock className="h-3 w-3 text-sky-400" />
                            {project.rawFootageDuration || project.expectedDuration}
                          </span>
                          <span className="font-semibold text-slate-200">
                            {formatCurrency(calculateProjectPrice(project))}
                          </span>
                        </div>

                        {/* Interactive Action Footer */}
                        <div className="mt-3 flex items-center justify-between gap-1 pt-2">
                          <a
                            href={project.driveLink}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                            title="Open Google Drive folder"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>

                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {nextStatus && (
                              <button
                                disabled={movingId === project.id}
                                onClick={() => moveProject(project.id, nextStatus)}
                                className="flex items-center gap-1 rounded-xl bg-violet-500/15 border border-violet-400/30 px-2.5 py-1 text-[10px] font-semibold text-violet-200 hover:bg-violet-500 hover:text-white transition"
                              >
                                <span>Advance</span>
                                <ChevronRight className="h-3 w-3" />
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedProject(project)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                              title="View details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {colProjects.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/6 py-10 px-4 text-center">
                    <p className="text-xs text-slate-500">No projects here</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Project Detail Modal */}
      <ProjectDetailModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        onStatusChange={moveProject}
        onToggleBillable={toggleBillable}
        onTogglePaid={togglePaid}
      />
    </div>
  );
}
