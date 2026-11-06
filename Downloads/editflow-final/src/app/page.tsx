"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  CircleCheckBig,
  FolderKanban,
  Play,
  Sparkles,
  WalletCards,
  Check,
  Clock,
  Menu,
  X,
  Sliders,
  ShieldCheck,
  TrendingUp,
  Film,
} from "lucide-react";

import { calculateProjectPrice, calculatePriceFromText, formatCurrency } from "@/lib/pricing";
import { defaultPricingSettings } from "@/lib/mock-data";
import type { Project } from "@/lib/types";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "Pipeline", href: "#demo" },
  { label: "Workflow", href: "#workflow" },
  { label: "Calculator", href: "#calculator" },
];

const features = [
  {
    title: "Instant Intake Flow",
    description: "Submit Google Drive assets, editing directions, and pacing notes in a streamlined portal.",
    icon: BriefcaseBusiness,
    accent: "from-violet-500 to-indigo-500",
  },
  {
    title: "Kanban Pipeline",
    description: "Move footage from raw ingest to final cut with real-time status transitions and notifications.",
    icon: FolderKanban,
    accent: "from-sky-500 to-cyan-500",
  },
  {
    title: "Transparent Formula Billing",
    description: "Fair per-second calculation based on actual footage length. Clear invoices in 1 click.",
    icon: WalletCards,
    accent: "from-emerald-500 to-teal-500",
  },
  {
    title: "Multi-Format Delivery",
    description: "Export 9:16 vertical reels, 16:9 landscape cuts, or 1:1 square formats with zero friction.",
    icon: CalendarClock,
    accent: "from-amber-500 to-orange-500",
  },
];

const workflow = [
  {
    step: "01",
    title: "Project Intake",
    desc: "Share your Google Drive folder and editing cues through our client intake form.",
  },
  {
    step: "02",
    title: "Production & Assembly",
    desc: "Editors cut, grade, add captions, and craft sound design based on your brief.",
  },
  {
    step: "03",
    title: "Review & Revisions",
    desc: "Preview draft renders and request precise timeline revisions directly.",
  },
  {
    step: "04",
    title: "Final Delivery & Invoice",
    desc: "Receive master exports and an itemized verified PDF/Excel invoice.",
  },
];

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentMonth, setCurrentMonth] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeHeroTab, setActiveHeroTab] = useState<"pipeline" | "calculator">("pipeline");
  const [demoDuration, setDemoDuration] = useState(150); // 2m 30s
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    setCurrentMonth(new Date().toISOString().slice(0, 7));

    const loadProjects = async () => {
      try {
        const response = await fetch("/api/projects");
        const data = await response.json();
        setProjects(Array.isArray(data) ? data : []);
      } catch {
        setProjects([]);
      }
    };

    loadProjects();
  }, []);

  const latestProject = useMemo(() => {
    return [...projects].sort(
      (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    )[0] ?? null;
  }, [projects]);

  const thisMonthTotal = useMemo(() => {
    return projects
      .filter((project) => project.status === "Completed" && project.billable && !project.isTrial)
      .reduce((sum, project) => sum + calculateProjectPrice(project), 0);
  }, [projects]);

  const projectProgress = useMemo(() => {
    if (!projects.length) return 0;
    const completed = projects.filter((project) => project.status === "Completed").length;
    return Math.min(100, Math.round((completed / projects.length) * 100));
  }, [projects]);

  const demoMinutes = Math.floor(demoDuration / 60);
  const demoSeconds = demoDuration % 60;
  const demoDurationText = `${demoMinutes}:${String(demoSeconds).padStart(2, "0")}`;
  const demoCalculatedPrice = calculatePriceFromText(demoDurationText, defaultPricingSettings);

  return (
    <main className="relative min-h-screen overflow-hidden text-slate-100 bg-[#040816]">
      {/* Background Ambient Orbs */}
      <div className="ambient-orb left-[-8rem] top-10 h-[30rem] w-[30rem] bg-violet-600/20" />
      <div className="ambient-orb right-[-6rem] top-24 h-[32rem] w-[32rem] bg-sky-500/15" />
      <div className="ambient-orb left-1/3 bottom-[-10rem] h-[26rem] w-[26rem] bg-cyan-500/10" />

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Navigation Bar */}
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="glass-panel sticky top-4 z-40 rounded-[28px] px-4 py-3 sm:px-6 border border-white/10"
        >
          <nav className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-400/30 bg-violet-500/20 text-sm font-bold text-violet-100 shadow-[0_0_25px_rgba(139,92,246,0.25)] group-hover:scale-105 transition-transform">
                EF
              </div>
              <div>
                <div className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-violet-300">
                  EditFlow
                </div>
                <div className="text-xs font-semibold text-white tracking-tight">Creative Ops</div>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="transition hover:text-white hover:underline underline-offset-4 font-medium"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/admin" className="btn-secondary hidden sm:inline-flex text-xs py-2 px-4">
                Admin OS
              </Link>
              <Link href="/new-project" className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5">
                <span>Start Project</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-300 hover:text-white md:hidden border border-white/8 bg-slate-900/60"
                aria-label="Toggle Navigation"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </nav>

          {/* Mobile Menu Dropdown */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-4 pb-2 border-t border-white/8 mt-3 space-y-2 md:hidden overflow-hidden"
              >
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white font-medium"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-xl px-3 py-2 text-sm text-violet-300 hover:bg-white/5 font-semibold"
                >
                  Admin Login
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>

        {/* Hero Section */}
        <section className="relative pt-12 sm:pt-16 lg:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="mx-auto max-w-4xl text-center"
          >
            <div className="kicker mx-auto inline-flex items-center gap-2 rounded-full border border-violet-400/35 bg-violet-500/10 px-4 py-1.5 text-[0.72rem] uppercase tracking-[0.26em] text-violet-200">
              <Sparkles className="h-3.5 w-3.5 text-violet-300 animate-pulse" />
              Next-Gen Creative Workflow
            </div>

            <h1 className="hero-title mt-6 text-5xl font-extrabold tracking-[-0.06em] text-white sm:text-7xl lg:text-8xl">
              <span>EDIT</span>
              <span className="text-gradient">FLOW</span>
            </h1>

            <p className="mt-5 text-xl font-semibold tracking-tight text-slate-100 sm:text-2xl">
              Your Vision. Our Timeline. One Seamless Flow.
            </p>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Manage client editing projects, track revision checkpoints, and generate transparent formula-priced invoices effortlessly.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link href="/new-project" className="btn-primary gap-2 py-3 px-6 text-sm font-semibold">
                  Start Your Project
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link href="#calculator" className="btn-secondary gap-2 py-3 px-6 text-sm font-semibold">
                  <Sliders className="h-4 w-4 text-violet-300" />
                  Price Estimator
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Interactive Hero Preview Component */}
          <div id="demo" className="relative mx-auto mt-14 max-w-5xl pb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="glass-panel relative overflow-hidden rounded-[32px] border border-white/12 p-5 sm:p-7 shadow-[0_25px_80px_rgba(15,23,42,0.6)]"
            >
              {/* Tabs Switcher */}
              <div className="flex items-center justify-between pb-4 border-b border-white/8 mb-6">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveHeroTab("pipeline")}
                    className={[
                      "rounded-xl px-3.5 py-1.5 text-xs font-semibold transition",
                      activeHeroTab === "pipeline"
                        ? "bg-violet-600 text-white shadow-md"
                        : "text-slate-400 hover:text-white bg-slate-900/60",
                    ].join(" ")}
                  >
                    Live Pipeline
                  </button>
                  <button
                    onClick={() => setActiveHeroTab("calculator")}
                    className={[
                      "rounded-xl px-3.5 py-1.5 text-xs font-semibold transition flex items-center gap-1.5",
                      activeHeroTab === "calculator"
                        ? "bg-violet-600 text-white shadow-md"
                        : "text-slate-400 hover:text-white bg-slate-900/60",
                    ].join(" ")}
                  >
                    <Sliders className="h-3 w-3" />
                    Live Price Estimator
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-300">
                    Engine Active
                  </span>
                </div>
              </div>

              {/* Tab 1: Live Pipeline Preview */}
              {activeHeroTab === "pipeline" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]"
                >
                  <div className="rounded-[24px] border border-white/8 bg-slate-950/40 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">
                                                {latestProject ? `${latestProject.clientName} Flow` : "Project Flow"}
                      </p>
                      <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-300">
                        In Production
                      </span>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
                        <span>Timeline progress</span>
                        <span className="font-mono font-bold text-white">{projectProgress}%</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-slate-800/80 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${projectProgress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-400 to-sky-400"
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 pt-2">
                      <div className="rounded-2xl border border-white/6 bg-slate-900/60 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Edited</p>
                        <p className="mt-1 text-2xl font-bold text-white">{projects.filter(p => p.status === "Completed").length}</p>
                      </div>
                      <div className="rounded-2xl border border-white/6 bg-slate-900/60 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">In Review</p>
                        <p className="mt-1 text-2xl font-bold text-sky-300">{projects.filter(p => p.status === "Awaiting Client Feedback").length}</p>
                      </div>
                      <div className="rounded-2xl border border-white/6 bg-slate-900/60 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">In Progress</p>
                        <p className="mt-1 text-2xl font-bold text-emerald-300">{projects.filter(p => p.status === "In Progress").length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[24px] border border-white/8 bg-slate-900/50 p-4">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Latest Release</span>
                        <span className="text-violet-300 font-semibold">9:16 Reel</span>
                      </div>
                      <p className="mt-2 text-base font-bold text-white">
                        {latestProject ? latestProject.projectName : "No projects yet"}
                      </p>
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/6">
                        <span>Client</span>
                        <span className="text-slate-200">
                          {latestProject ? latestProject.clientName : "—"}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-violet-500/20 bg-gradient-to-br from-violet-600/15 to-sky-600/10 p-4">
                      <p className="text-xs uppercase tracking-wider text-violet-300 font-semibold">
                        Monthly Settlement
                      </p>
                      <div className="mt-2 flex items-baseline justify-between">
                        <p className="text-3xl font-extrabold text-white">
                          {formatCurrency(thisMonthTotal)}
                        </p>
                        <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-300 font-semibold">
                          Verified Paid
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tab 2: Interactive Pricing Estimator */}
              {activeHeroTab === "calculator" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-[24px] border border-white/8 bg-slate-950/40 p-5 space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-white">Footage Duration Scrubber</h3>
                      <p className="text-xs text-slate-400">
                        Move the slider to estimate video editing cost in real-time.
                      </p>
                    </div>
                    <div className="rounded-xl border border-violet-400/30 bg-violet-500/20 px-3 py-1 font-mono text-sm font-bold text-violet-200">
                      {demoDurationText} ({demoDuration}s)
                    </div>
                  </div>

                  <input
                    type="range"
                    min={30}
                    max={480}
                    step={5}
                    value={demoDuration}
                    onChange={(e) => setDemoDuration(Number(e.target.value))}
                    className="w-full accent-violet-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />

                  <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-r from-violet-600/20 to-sky-600/15 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-violet-300">
                        Estimated Edit Price
                      </p>
                      <p className="text-3xl font-extrabold text-white mt-0.5">
                        {formatCurrency(demoCalculatedPrice)}
                      </p>
                    </div>
                    <Link
                      href="/new-project"
                      className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      Book at this price <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Stats Strip */}
        <section className="py-12 border-y border-white/6 my-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-white">1,200+</p>
              <p className="text-xs uppercase tracking-wider text-slate-400 mt-1">Reels & Videos Cut</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-violet-300">99.4%</p>
              <p className="text-xs uppercase tracking-wider text-slate-400 mt-1">On-Time Delivery</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-sky-300">&lt; 24h</p>
              <p className="text-xs uppercase tracking-wider text-slate-400 mt-1">First Draft Turnaround</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald-300">100%</p>
              <p className="text-xs uppercase tracking-wider text-slate-400 mt-1">Invoice Accuracy</p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="relative pt-12 sm:pt-16">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-heading">Engineered for Creative Precision</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Everything in One Creative Flow.
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Stop juggling WhatsApp messages and lost Drive folders. EditFlow centralizes every frame.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {features.map(({ title, description, icon: Icon, accent }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="glass-card group relative rounded-[28px] p-6 border border-white/8 hover:border-violet-400/35 transition-colors shadow-lg"
              >
                <div
                  className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-md group-hover:scale-105 transition-transform`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-300">
                  {description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Workflow Section */}
        <section id="workflow" className="relative pt-24 sm:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="section-heading">Step-by-step Execution</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              From Raw Ingest to Final Delivery.
            </h2>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {workflow.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                onClick={() => setActiveStep(index)}
                className={[
                  "glass-card cursor-pointer rounded-[26px] p-5 border transition-all duration-300",
                  activeStep === index
                    ? "border-violet-400/50 bg-violet-600/10 shadow-[0_0_30px_rgba(139,92,246,0.2)]"
                    : "border-white/8 hover:border-white/20",
                ].join(" ")}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-sm font-bold text-violet-300">{item.step}</span>
                  <div
                    className={[
                      "flex h-8 w-8 items-center justify-center rounded-full border transition",
                      activeStep === index
                        ? "bg-violet-500 border-violet-400 text-white"
                        : "border-white/10 text-slate-500",
                    ].join(" ")}
                  >
                    <CircleCheckBig className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Pricing Calculator Preview Section */}
        <section id="calculator" className="relative pt-24 pb-12 sm:pt-28">
          <div className="glass-panel relative overflow-hidden rounded-[32px] p-8 sm:p-12 border border-white/12 shadow-[0_30px_90px_rgba(15,23,42,0.7)] text-center max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(139,92,246,0.18),transparent_50%)]" />

            <div className="relative mx-auto max-w-2xl">
              <p className="section-heading">Fair & Transparent Rates</p>
              <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Ready to elevate your timeline?
              </h2>
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-300">
                Submit your footage link today. We handle the cuts, grading, subtitles, and export formatting with zero friction.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-3">
                <Link href="/new-project" className="btn-primary py-3.5 px-8 text-sm font-bold gap-2">
                  Submit a Project
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/admin" className="btn-secondary py-3.5 px-8 text-sm font-semibold">
                  Admin Login
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Minimal Footer */}
        <footer className="mt-12 py-8 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">EditFlow</span>
            <span>• Video Operations & Billing</span>
          </div>
          <p>© 2026 EditFlow Studio. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
