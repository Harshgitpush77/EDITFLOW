"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, Mail, Building, Briefcase, DollarSign, ArrowUpRight } from "lucide-react";
import Link from "next/link";

import type { Client, Project } from "@/lib/types";
import { calculateProjectPrice, formatCurrency } from "@/lib/pricing";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [clientsResponse, projectsResponse] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/projects"),
        ]);
        const cData = await clientsResponse.json();
        const pData = await projectsResponse.json();
        setClients(Array.isArray(cData) ? cData : []);
        setProjects(Array.isArray(pData) ? pData : []);
      } catch {
        setClients([]);
        setProjects([]);
      }
    };

    load();
  }, []);

  const clientRows = useMemo(() => {
    return clients.map((client) => {
      const relatedProjects = projects.filter(
        (project) => project.email.toLowerCase() === client.email.toLowerCase()
      );
      return {
        ...client,
        totalProjects: relatedProjects.length,
        completedProjects: relatedProjects.filter((project) => project.status === "Completed").length,
        pendingProjects: relatedProjects.filter((project) => project.status !== "Completed").length,
        totalBilled: relatedProjects
          .filter((project) => project.billable)
          .reduce((sum, project) => sum + calculateProjectPrice(project), 0),
      };
    });
  }, [clients, projects]);

  const filteredClients = useMemo(() => {
    return clientRows.filter((client) =>
      `${client.name} ${client.companyName || ""} ${client.email}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [clientRows, search]);

  const totalRevenue = useMemo(() => {
    return clientRows.reduce((sum, client) => sum + client.totalBilled, 0);
  }, [clientRows]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-[28px] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="section-heading">Client Directory</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
              Client Portfolio & Value
            </h2>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-slate-900/60 px-3.5 py-2 text-sm text-slate-200">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients or brands..."
              className="w-48 sm:w-60 bg-transparent text-xs sm:text-sm text-white outline-none placeholder:text-slate-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-xs text-slate-400 hover:text-white">
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricBox label="Total Active Clients" value={String(clients.length)} icon={Users} />
        <MetricBox
          label="Total Value Delivered"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
          tone="emerald"
        />
        <MetricBox
          label="Active In-Flight Videos"
          value={String(projects.filter((p) => p.status !== "Completed").length)}
          icon={Briefcase}
          tone="violet"
        />
      </div>

      {/* Clients Table */}
      <div className="glass-panel overflow-hidden rounded-[28px] border border-white/8">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="border-b border-white/8 bg-slate-900/60 text-[10px] uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Client Name</th>
                <th className="px-4 py-3.5">Company / Channel</th>
                <th className="px-4 py-3.5 text-center">Total Projects</th>
                <th className="px-4 py-3.5 text-center">Completed</th>
                <th className="px-4 py-3.5 text-center">In Progress</th>
                <th className="px-4 py-3.5 text-right">Lifetime Billed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              <AnimatePresence mode="popLayout">
                {filteredClients.map((client) => (
                  <motion.tr
                    key={client.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white">{client.name}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Mail className="h-3 w-3 text-slate-500" />
                        <span>{client.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      {client.companyName ? (
                        <div className="flex items-center gap-1.5">
                          <Building className="h-3.5 w-3.5 text-slate-500" />
                          <span>{client.companyName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center font-mono font-medium text-white">
                      {client.totalProjects}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="rounded-full bg-emerald-500/15 border border-emerald-400/25 px-2.5 py-0.5 text-xs font-mono font-semibold text-emerald-300">
                        {client.completedProjects}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="rounded-full bg-sky-500/15 border border-sky-400/25 px-2.5 py-0.5 text-xs font-mono font-semibold text-sky-300">
                        {client.pendingProjects}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-white">
                      {formatCurrency(client.totalBilled)}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filteredClients.length === 0 && (
          <div className="p-12 text-center text-slate-400 text-sm">
            No clients matched your search.
          </div>
        )}
      </div>
    </div>
  );
}

function MetricBox({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "emerald" | "violet";
}) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      className="glass-card rounded-[24px] p-5 border border-white/8 relative overflow-hidden"
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <div className="rounded-xl border border-white/10 bg-slate-800/80 p-2 text-slate-300">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <h3
        className={[
          "mt-2 text-2xl font-extrabold tracking-tight",
          tone === "emerald"
            ? "text-emerald-300"
            : tone === "violet"
            ? "text-violet-300"
            : "text-white",
        ].join(" ")}
      >
        {value}
      </h3>
    </motion.div>
  );
}
