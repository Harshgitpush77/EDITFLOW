"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lock, Mail, ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/toast-context";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { success } = useToast();

  // If already authenticated, redirect straight to dashboard
  useEffect(() => {
    try {
      const auth = window.localStorage.getItem("editflow-admin-auth");
      if (auth) {
        router.replace("/admin/dashboard");
      }
    } catch {
      // ignore
    }
  }, [router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Authentication failed. Check credentials.");
      }

      window.localStorage.setItem(
        "editflow-admin-auth",
        JSON.stringify({ email: data.email || email, timestamp: Date.now() })
      );
      success("Welcome back", "Authenticated as EditFlow Admin");
      router.push("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-y-auto px-4 py-10 sm:py-16 bg-[#040816]">
      {/* Background Ambient Orbs - constrained with negative z-index */}
      <div className="ambient-orb -z-10 left-1/4 top-16 h-72 w-72 sm:h-96 sm:w-96 bg-violet-600/20" />
      <div className="ambient-orb -z-10 right-1/4 bottom-12 h-72 w-72 sm:h-96 sm:w-96 bg-sky-500/15" />

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 26 }}
        className="glass-panel relative z-10 my-auto w-full max-w-md rounded-[32px] p-6 sm:p-9 shadow-[0_30px_90px_rgba(15,23,42,0.7)] border border-white/10"
      >
        <div className="mb-6 text-center">
          <div className="kicker mx-auto mb-3">
            <ShieldCheck className="h-3.5 w-3.5 text-violet-300" />
            EditFlow Secure
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Admin Workspace
          </h1>
          <p className="mt-1.5 text-xs text-slate-300">
            Sign in to manage client pipelines, deadlines, and billing.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Admin Email
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none z-10" />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="input pl-11 text-sm text-white"
                type="email"
                placeholder="Enter admin email"
                required
                autoComplete="off"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none z-10" />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="input pl-11 pr-11 text-sm text-white"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                required
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-white transition p-1 rounded-lg z-10"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-200"
            >
              {error}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-sm font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
          >
            <span>{loading ? "Authenticating..." : "Sign In to Admin OS"}</span>
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        </form>

        <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/6 text-xs text-slate-400">
          <Link href="/" className="hover:text-white transition">
            ← Back to Home
          </Link>
          <Link href="/new-project" className="text-violet-300 hover:underline">
            Client Intake Form →
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
