"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { TrendingUp } from "lucide-react";

export function StatCard({
  label,
  value,
  trend,
  icon: Icon,
}: {
  label: string;
  value: string;
  trend: string;
  icon: LucideIcon;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="glass-card group relative overflow-hidden rounded-[26px] p-5 shadow-[0_16px_40px_rgba(15,23,42,0.4)] border border-white/8 hover:border-violet-500/30 transition-colors"
    >
      <div className="absolute top-0 right-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl group-hover:bg-violet-500/20 transition-all duration-500 pointer-events-none" />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="section-heading text-[0.66rem] font-medium text-slate-400 group-hover:text-violet-300 transition-colors">
            {label}
          </p>
          <h3 className="mt-2.5 text-3xl font-bold tracking-tight text-white">
            {value}
          </h3>
        </div>
        <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/15 to-sky-400/10 p-2.5 text-violet-200 shadow-[0_10px_22px_rgba(139,92,246,0.12)] group-hover:scale-110 group-hover:border-violet-400/40 transition-transform">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
          <TrendingUp className="h-3 w-3" />
          {trend}
        </div>
      </div>
    </motion.div>
  );
}
