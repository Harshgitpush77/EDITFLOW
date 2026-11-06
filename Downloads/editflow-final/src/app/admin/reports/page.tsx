"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, DollarSign, FolderCheck, Wallet, PieChart } from "lucide-react";

import type { Invoice, Project } from "@/lib/types";
import { calculateProjectPrice, formatCurrency } from "@/lib/pricing";

export default function ReportsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [projectsResponse, invoicesResponse] = await Promise.all([
          fetch("/api/projects"),
          fetch("/api/invoices"),
        ]);
        const pData = await projectsResponse.json();
        const iData = await invoicesResponse.json();
        setProjects(Array.isArray(pData) ? pData : []);
        setInvoices(Array.isArray(iData) ? iData : []);
      } catch {
        setProjects([]);
        setInvoices([]);
      }
    };

    load();
  }, []);

  const summary = useMemo(() => {
    const totalBilled = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const totalReceived = invoices.reduce((sum, invoice) => sum + invoice.paymentReceived, 0);
    const outstanding = Math.max(totalBilled - totalReceived, 0);
    const completedProjects = projects.filter((project) => project.status === "Completed").length;
    const billableProjects = projects.filter((project) => project.billable);
    const averageProjectValue = billableProjects.length
      ? billableProjects.reduce((sum, project) => sum + calculateProjectPrice(project), 0) /
        billableProjects.length
      : 0;

    return { totalBilled, totalReceived, outstanding, completedProjects, averageProjectValue };
  }, [projects, invoices]);

  const clientRevenue = useMemo(() => {
    const clients = [...new Set(projects.map((p) => p.clientName))];
    const data = clients.map((client) => {
      const clientProjects = projects.filter((p) => p.clientName === client && p.billable);
      const total = clientProjects.reduce((sum, p) => sum + calculateProjectPrice(p), 0);
      const count = clientProjects.length;
      return { client, total, count };
    });
    return data.sort((a, b) => b.total - a.total);
  }, [projects]);

  const maxClientRevenue = Math.max(1, ...clientRevenue.map((c) => c.total));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-[28px] p-5">
        <p className="section-heading">Analytics & Intelligence</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
          Studio Revenue & Financial Analytics
        </h2>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricBox
          label="Total Billed"
          value={formatCurrency(summary.totalBilled)}
          icon={Wallet}
          subtext="Invoiced to clients"
        />
        <MetricBox
          label="Payments Received"
          value={formatCurrency(summary.totalReceived)}
          icon={TrendingUp}
          tone="emerald"
          subtext="Directly settled"
        />
        <MetricBox
          label="Pending Outstanding"
          value={formatCurrency(summary.outstanding)}
          icon={DollarSign}
          tone="amber"
          subtext="Awaiting client payment"
        />
        <MetricBox
          label="Average Project Value"
          value={formatCurrency(summary.averageProjectValue)}
          icon={PieChart}
          tone="violet"
          subtext="Across all billable edits"
        />
      </div>

      {/* Client Revenue Contribution Distribution */}
      <div className="glass-panel rounded-[28px] p-6 border border-white/8 space-y-5">
        <div>
          <h3 className="text-base font-bold text-white">Revenue Contribution by Client</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Breakdown of billable project totals per creator/brand
          </p>
        </div>

        <div className="space-y-4">
          {clientRevenue.map((c) => {
            const pct = Math.round((c.total / maxClientRevenue) * 100);

            return (
              <div key={c.client} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-white flex items-center gap-2">
                    {c.client}
                    <span className="text-[10px] font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                      {c.count} videos
                    </span>
                  </span>
                  <span className="font-mono text-violet-300">{formatCurrency(c.total)}</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-800/80 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 via-indigo-500 to-sky-400"
                  />
                </div>
              </div>
            );
          })}

          {clientRevenue.length === 0 && (
            <div className="py-10 text-center text-xs text-slate-400">
              No billable projects on record yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricBox({
  label,
  value,
  icon: Icon,
  subtext,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  subtext?: string;
  tone?: "emerald" | "amber" | "violet";
}) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      className="glass-card rounded-[24px] p-5 border border-white/8"
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <div className="rounded-xl border border-white/10 bg-slate-800/80 p-2 text-slate-300">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <h3
        className={[
          "mt-2 text-2xl font-extrabold tracking-tight",
          tone === "emerald"
            ? "text-emerald-300"
            : tone === "amber"
            ? "text-amber-300"
            : tone === "violet"
            ? "text-violet-300"
            : "text-white",
        ].join(" ")}
      >
        {value}
      </h3>
      {subtext && <p className="mt-1 text-[11px] text-slate-400">{subtext}</p>}
    </motion.div>
  );
}
