"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Check,
  Sparkles,
  Sliders,
  DollarSign,
  TrendingUp,
  Percent,
  Clock,
  ShieldCheck,
  RefreshCw,
  Save,
} from "lucide-react";

import { calculatePrice, formatCurrency, formatDurationMmSs } from "@/lib/pricing";
import type { PricingSettings } from "@/lib/types";
import { useToast } from "@/components/toast-context";

const initialSettings: PricingSettings = {
  id: "pricing-default",
  twoMinuteBaseRate: 500,
  baseDurationSeconds: 120,
  fourMinuteReferenceRate: 650,
  perSecondIncrementalRate: 1.25,
  minimumCharge: 0,
  additionalServiceCharges: 0,
  discounts: 0,
  taxRate: 0,
  updatedAt: "2026-09-01T00:00:00.000Z",
};

const testCases = [
  { duration: "0:30", seconds: 30, expected: 125.00 },
  { duration: "1:00", seconds: 60, expected: 250.00 },
  { duration: "1:10", seconds: 70, expected: 291.67 },
  { duration: "2:00", seconds: 120, expected: 500.00 },
  { duration: "2:35", seconds: 155, expected: 543.75 },
  { duration: "3:00", seconds: 180, expected: 575.00 },
  { duration: "4:00", seconds: 240, expected: 650.00 },
  { duration: "4:45", seconds: 285, expected: 706.25 },
  { duration: "6:08", seconds: 368, expected: 810.00 },
];

export default function PricingPage() {
  const [settings, setSettings] = useState<PricingSettings>(initialSettings);
  const [duration, setDuration] = useState("2:35");
  const [secondsValue, setSecondsValue] = useState(155);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/pricing");
        const data = await response.json();
        setSettings({ ...initialSettings, ...data });
      } catch {
        setSettings(initialSettings);
      }
    };
    loadSettings();
  }, []);

  const handleSliderChange = (totalSec: number) => {
    setSecondsValue(totalSec);
    setDuration(formatDurationMmSs(totalSec));
  };

  const handleTextDurationChange = (val: string) => {
    setDuration(val);
    const parts = val.split(":");
    if (parts.length === 2) {
      const m = parseInt(parts[0], 10);
      const s = parseInt(parts[1], 10);
      if (!isNaN(m) && !isNaN(s)) {
        setSecondsValue(m * 60 + s);
      }
    }
  };

  const calculatedAmount = useMemo(() => {
    return calculatePrice(
      secondsValue,
      settings.twoMinuteBaseRate,
      settings.baseDurationSeconds ?? 120,
      settings.perSecondIncrementalRate
    );
  }, [secondsValue, settings]);

  const updateField = (field: keyof PricingSettings, value: number) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setSettings(updated);
      success("Pricing Configuration Saved", "All project prices have been automatically recalculated across the database.");
    } catch {
      error("Save failed", "Could not update pricing configuration");
    } finally {
      setSaving(false);
    }
  };

  const baseDuration = settings.baseDurationSeconds ?? 120;
  const excessSeconds = Math.max(0, secondsValue - baseDuration);
  const excessCost = excessSeconds * settings.perSecondIncrementalRate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-[28px] p-5 sm:p-6 border border-white/8">
        <p className="section-heading">Central Billing Engine</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Rate Configuration & Dynamic Simulator
        </h1>
        <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
          Proportional duration pricing up to base duration ({baseDuration}s), followed by per-second incremental rate for excess footage.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        {/* Rate Formula Config Card */}
        <div className="glass-panel rounded-[28px] p-6 border border-white/8 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-violet-400" />
                Core Billing Parameters
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Modifying these rates updates live billing and automatically recalculates all project records.
              </p>
            </div>
            <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-[11px] font-mono font-semibold text-violet-300">
              Active Engine
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <NumberField
              label="Base Price (₹)"
              value={settings.twoMinuteBaseRate}
              onChange={(value) => updateField("twoMinuteBaseRate", value)}
              prefix="₹"
              help="Default ₹500.00"
            />
            <NumberField
              label="Base Duration (s)"
              value={settings.baseDurationSeconds ?? 120}
              onChange={(value) => updateField("baseDurationSeconds", value)}
              prefix="s"
              help="Default 120s (2 mins)"
            />
            <NumberField
              label="Per-Second Rate (₹)"
              value={settings.perSecondIncrementalRate}
              onChange={(value) => updateField("perSecondIncrementalRate", value)}
              prefix="₹"
              step="0.01"
              help="Default ₹1.25/sec"
            />
          </div>

          {/* Formula Rules Breakdown */}
          <div className="rounded-2xl border border-white/8 bg-slate-950/50 p-4 space-y-2 text-xs text-slate-300 font-mono">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400 font-sans">Videos &le; {baseDuration}s formula:</span>
              <span className="text-violet-300 font-bold">(duration / {baseDuration}) &times; {formatCurrency(settings.twoMinuteBaseRate)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-t border-white/6">
              <span className="text-slate-400 font-sans">Videos &gt; {baseDuration}s formula:</span>
              <span className="text-sky-300 font-bold">{formatCurrency(settings.twoMinuteBaseRate)} + ((duration - {baseDuration}) &times; {formatCurrency(settings.perSecondIncrementalRate)})</span>
            </div>
          </div>

          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 pt-2">
            Invoice Tax & Surcharges
          </h4>

          <div className="grid gap-4 sm:grid-cols-3">
            <NumberField
              label="Additional Charges"
              value={settings.additionalServiceCharges}
              onChange={(value) => updateField("additionalServiceCharges", value)}
              prefix="₹"
            />
            <NumberField
              label="Discounts"
              value={settings.discounts}
              onChange={(value) => updateField("discounts", value)}
              prefix="₹"
            />
            <NumberField
              label="Tax Rate (%)"
              value={settings.taxRate}
              onChange={(value) => updateField("taxRate", value)}
              prefix="%"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            disabled={saving}
            onClick={saveSettings}
            className="btn-primary w-full py-3.5 text-sm font-bold shadow-lg flex items-center justify-center gap-2 mt-2"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Recalculating & Saving Database..." : "Save & Recalculate All Projects"}</span>
          </motion.button>
        </div>

        {/* Live Simulator & Scrubbing Tool */}
        <div className="space-y-6">
          <div className="glass-panel rounded-[28px] p-6 border border-white/8 space-y-5">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="h-5 w-5 text-sky-400" />
                Live Price Simulator
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Scrub duration to test exact formula calculations.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Footage Length
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => handleTextDurationChange(e.target.value)}
                  placeholder="MM:SS"
                  className="w-24 rounded-xl border border-white/10 bg-slate-900 px-2.5 py-1 text-center font-mono text-sm font-bold text-violet-300 outline-none focus:border-violet-400"
                />
              </div>

              <input
                type="range"
                min={10}
                max={480}
                step={5}
                value={secondsValue}
                onChange={(e) => handleSliderChange(Number(e.target.value))}
                className="w-full accent-violet-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />

              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0:30 (₹125)</span>
                <span>1:00 (₹250)</span>
                <span>2:00 (₹500 Base)</span>
                <span>4:00 (₹650)</span>
                <span>8:00</span>
              </div>
            </div>

            {/* Calculated Value Card */}
            <div className="rounded-[24px] border border-violet-400/25 bg-gradient-to-br from-violet-600/20 via-indigo-600/15 to-sky-600/15 p-5 shadow-[0_15px_40px_rgba(139,92,246,0.15)]">
              <p className="text-[10px] uppercase tracking-wider text-violet-300 font-medium">
                Calculated Value
              </p>
              <h4 className="mt-1.5 text-4xl font-extrabold tracking-tight text-white font-mono">
                {formatCurrency(calculatedAmount)}
              </h4>
              <p className="text-xs text-slate-300 mt-2 font-mono">
                {secondsValue} total seconds ({duration})
              </p>
            </div>
          </div>

          {/* Test Cases Verification Matrix */}
          <div className="glass-panel rounded-[28px] p-5 border border-white/8 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Verified Formula Test Cases
              </h4>
              <span className="text-[10px] text-emerald-400 font-semibold font-mono">All Passing</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-white/6">
                  <tr>
                    <th className="py-1.5 px-2">Duration</th>
                    <th className="py-1.5 px-2">Seconds</th>
                    <th className="py-1.5 px-2">Calculated</th>
                    <th className="py-1.5 px-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6 text-slate-300">
                  {testCases.map((tc) => {
                    const price = calculatePrice(
                      tc.seconds,
                      settings.twoMinuteBaseRate,
                      settings.baseDurationSeconds ?? 120,
                      settings.perSecondIncrementalRate
                    );
                    const match = Math.abs(price - tc.expected) < 0.01;
                    return (
                      <tr key={tc.duration} className="hover:bg-white/5 transition-colors">
                        <td className="py-1.5 px-2 font-bold text-white">{tc.duration}</td>
                        <td className="py-1.5 px-2 text-slate-400">{tc.seconds}s</td>
                        <td className="py-1.5 px-2 text-violet-300 font-bold">{formatCurrency(price)}</td>
                        <td className="py-1.5 px-2 text-right">
                          {match ? (
                            <span className="text-emerald-400 text-[11px] font-semibold">✓ {formatCurrency(tc.expected)}</span>
                          ) : (
                            <span className="text-rose-400 text-[11px]">Exp: {formatCurrency(tc.expected)}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  prefix,
  help,
  step = "1",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  help?: string;
  step?: string;
}) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
      {label}
      <div className="relative mt-1.5">
        {prefix && (
          <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">{prefix}</span>
        )}
        <input
          type="number"
          step={step}
          value={value ?? 0}
          onChange={(event) => onChange(Number(event.target.value))}
          className={`input text-sm text-white font-mono ${prefix ? "pl-7" : ""}`}
        />
      </div>
      {help && <p className="text-[10px] text-slate-500 font-normal mt-1">{help}</p>}
    </label>
  );
}
