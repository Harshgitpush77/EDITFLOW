"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import {
  FileText,
  Download,
  CheckCircle2,
  Calendar,
  DollarSign,
  Plus,
  Clock,
  Sparkles,
  FileSpreadsheet,
  Trash2,
  Check,
  AlertCircle,
  Eye,
} from "lucide-react";

import type { Invoice, PricingSettings, Project } from "@/lib/types";
import {
  calculateProjectPrice,
  formatCurrency,
  formatDurationMmSs,
  getProjectDurationSeconds,
} from "@/lib/pricing";
import { useToast } from "@/components/toast-context";

export default function InvoicesPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pricingSettings, setPricingSettings] = useState<PricingSettings | undefined>();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [clientName, setClientName] = useState("Trading Bells");
  const [billingMonth, setBillingMonth] = useState("2026-10");
  const [generating, setGenerating] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const { success, error } = useToast();

  const loadData = async () => {
    try {
      const [projectResponse, invoiceResponse, priceResponse] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/invoices"),
        fetch("/api/pricing"),
      ]);
      const projectData = await projectResponse.json();
      setProjects(Array.isArray(projectData) ? projectData : []);
      const invoiceData = await invoiceResponse.json();
      setInvoices(Array.isArray(invoiceData) ? invoiceData : []);
      const priceData = await priceResponse.json();
      setPricingSettings(priceData);
    } catch {
      setProjects([]);
      setInvoices([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Exclude trial or non-billable projects from invoice generation
  const billableProjects = useMemo(
    () => projects.filter((project) => project.billable && !project.isTrial && project.status === "Completed"),
    [projects]
  );

  const availableClients = useMemo(
    () => [...new Set(projects.map((project) => project.clientName).filter(Boolean))],
    [projects]
  );

  const clientProjects = useMemo(() => {
    if (!clientName) return billableProjects;
    return billableProjects.filter((p) => p.clientName === clientName);
  }, [billableProjects, clientName]);

  const toggleProject = (projectId: string) => {
    setSelectedIds((current) =>
      current.includes(projectId)
        ? current.filter((id) => id !== projectId)
        : [...current, projectId]
    );
  };

  const selectAllClientProjects = () => {
    const ids = clientProjects.map((p) => p.id);
    setSelectedIds(ids);
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const selectedTotal = useMemo(() => {
    return projects
      .filter((p) => selectedIds.includes(p.id))
      .reduce((sum, p) => sum + calculateProjectPrice(p, pricingSettings), 0);
  }, [projects, selectedIds, pricingSettings]);

  const generateInvoice = async () => {
    if (!clientName || selectedIds.length === 0) {
      error("Missing selection", "Please select a client and at least one billable project.");
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          clientEmail: projects.find((p) => p.clientName === clientName)?.email || "contact@tradingbells.com",
          projectIds: selectedIds,
          billingMonth,
          invoiceDate: new Date().toISOString().slice(0, 10),
          dueDate: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10),
          status: "Paid",
          notes: `Itemized billing for ${selectedIds.length} completed video edits.`,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Invoice generation failed");
      }

      const invoice: Invoice = await response.json();
      await loadData();
      setSelectedIds([]);
      success(`Invoice ${invoice.invoiceNumber} created!`, `Amount: ${formatCurrency(invoice.total)}`);
      exportAsPdf(invoice);
    } catch (err) {
      error("Error generating invoice", err instanceof Error ? err.message : "Failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    try {
      const res = await fetch(`/api/invoices?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
      if (viewingInvoice?.id === id) setViewingInvoice(null);
      success("Invoice Removed", "Invoice record deleted");
    } catch {
      error("Delete failed");
    }
  };

  const exportAsPdf = (invoice: Invoice) => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(30);
      doc.text("EDITFLOW INVOICE", 14, 22);

      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text("Creative Video Operations & Billing Management", 14, 28);
      doc.text("support@editflow.io • www.editflow.io", 14, 33);

      doc.setDrawColor(220);
      doc.line(14, 37, 196, 37);

      doc.setFontSize(10);
      doc.setTextColor(40);
      doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 14, 46);
      doc.text(`Invoice Date: ${invoice.invoiceDate}`, 14, 52);
      doc.text(`Due Date: ${invoice.dueDate}`, 14, 58);
      doc.text(`Billing Cycle: ${invoice.billingMonth}`, 14, 64);
      doc.text(`Status: ${invoice.status.toUpperCase()}`, 14, 70);

      doc.text(`Billed To: ${invoice.clientName}`, 120, 46);
      doc.text(`Email: ${invoice.clientEmail || "contact@tradingbells.com"}`, 120, 52);

      doc.line(14, 76, 196, 76);

      // Table Header
      doc.setFontSize(9);
      doc.setTextColor(80);
      doc.text("Item / Video Name", 14, 83);
      doc.text("Duration", 130, 83);
      doc.text("Amount (INR)", 165, 83);

      doc.line(14, 86, 196, 86);

      let yPos = 94;
      doc.setTextColor(30);
      (invoice.lineItems || []).forEach((item, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        const durText = item.durationText || formatDurationMmSs(item.durationSeconds);
        doc.text(`${index + 1}. ${item.projectName}`, 14, yPos);
        doc.text(`${durText} (${item.durationSeconds}s)`, 130, yPos);
        doc.text(formatCurrency(item.price), 165, yPos);
        yPos += 8;
      });

      doc.line(14, yPos + 2, 196, yPos + 2);
      yPos += 10;

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Total Amount Due: ${formatCurrency(invoice.total)}`, 120, yPos);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120);
      doc.text("Proportional pricing formula applied. Thank you for partnering with EditFlow.", 14, yPos + 20);

      doc.save(`${invoice.invoiceNumber}.pdf`);
      success("PDF Downloaded", `${invoice.invoiceNumber}.pdf`);
    } catch {
      error("PDF export failed");
    }
  };

  const exportAsExcel = (invoice: Invoice) => {
    try {
      const rows = invoice.lineItems.map((item, idx) => ({
        "No.": idx + 1,
        "Invoice #": invoice.invoiceNumber,
        Client: invoice.clientName,
        "Video Title": item.projectName,
        "Duration (MM:SS)": item.durationText || formatDurationMmSs(item.durationSeconds),
        "Duration (Seconds)": item.durationSeconds,
        Amount: item.price,
      }));

      const workbook = XLSX.utils.book_new();
      const sheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, sheet, "Invoice Line Items");
      XLSX.writeFile(workbook, `${invoice.invoiceNumber}.xlsx`);
      success("Excel Downloaded", `${invoice.invoiceNumber}.xlsx`);
    } catch {
      error("Excel export failed");
    }
  };

  const allInvoicesTotal = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + inv.total, 0);
  }, [invoices]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-[28px] p-5 sm:p-6 border border-white/8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="section-heading">Financial Operations</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Invoice & Billing Settlement Hub
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Itemized invoices generated automatically using the proportional billing formula.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-violet-400/25 bg-violet-500/15 p-3 text-right">
            <span className="text-[10px] uppercase tracking-wider text-violet-300 font-semibold block">
              Total Invoiced
            </span>
            <span className="text-xl font-extrabold text-white font-mono">
              {formatCurrency(allInvoicesTotal)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Invoice Generator Card */}
        <div className="glass-panel rounded-[28px] p-6 border border-white/8 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-violet-400" />
                Generate New Batch Invoice
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Trial reels and non-billable projects are strictly excluded.
              </p>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-400/30 text-emerald-300">
              Verified Rates
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Client
              </label>
              <select
                value={clientName}
                onChange={(event) => {
                  setClientName(event.target.value);
                  setSelectedIds([]);
                }}
                className="input text-xs text-white"
              >
                {availableClients.map((client) => (
                  <option key={client} value={client}>
                    {client}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Billing Cycle
              </label>
              <input
                value={billingMonth}
                onChange={(event) => setBillingMonth(event.target.value)}
                placeholder="2026-10"
                className="input text-xs text-white"
              />
            </div>
          </div>

          {/* Selectable Projects List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Completed Billable Videos ({clientProjects.length})
              </label>
              {clientProjects.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={selectAllClientProjects}
                    className="text-violet-300 hover:underline font-semibold"
                  >
                    Select All
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-slate-400 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {clientProjects.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {clientProjects.map((project) => {
                  const isSelected = selectedIds.includes(project.id);
                  const price = calculateProjectPrice(project, pricingSettings);
                  const seconds = getProjectDurationSeconds(project);
                  const durationMm = project.rawFootageDuration || formatDurationMmSs(seconds);

                  return (
                    <motion.div
                      key={project.id}
                      whileHover={{ scale: 1.005 }}
                      onClick={() => toggleProject(project.id)}
                      className={[
                        "flex items-center justify-between rounded-2xl border p-3 cursor-pointer transition select-none",
                        isSelected
                          ? "bg-violet-600/20 border-violet-400/40 text-white shadow-md"
                          : "bg-slate-900/40 border-white/6 text-slate-300 hover:bg-slate-800/40",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by parent onClick
                          className="h-4 w-4 rounded accent-violet-500 cursor-pointer"
                        />
                        <div>
                          <p className="text-xs sm:text-sm font-semibold text-white">
                            {project.projectName}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {durationMm} ({seconds}s) • {project.billingMonth}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-violet-200 font-mono">
                        {formatCurrency(price)}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/8 p-6 text-center text-xs text-slate-400">
                No completed billable projects available for {clientName}.
              </div>
            )}
          </div>

          {/* Running Subtotal Pill */}
          <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-r from-violet-500/15 to-sky-500/10 p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-violet-300 font-semibold">
                Selected Total ({selectedIds.length} projects)
              </p>
              <p className="text-3xl font-extrabold text-white font-mono mt-0.5">
                {formatCurrency(selectedTotal)}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={generating || selectedIds.length === 0}
              onClick={generateInvoice}
              className="btn-primary py-3 px-5 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
            >
              {generating ? "Generating..." : "Generate Invoice"}
            </motion.button>
          </div>
        </div>

        {/* Invoice History Card */}
        <div className="glass-panel rounded-[28px] p-6 border border-white/8 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/8">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-300" />
              Issued Invoices ({invoices.length})
            </h3>
            <span className="text-xs text-slate-400">
              Verified Settlement
            </span>
          </div>

          <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
            <AnimatePresence mode="popLayout">
              {invoices.map((invoice) => (
                <motion.div
                  key={invoice.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl border border-white/8 bg-slate-900/50 p-4 hover:border-violet-400/30 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm">
                          {invoice.invoiceNumber}
                        </span>
                        <span className="rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 px-2 py-0.2 text-[9px] font-semibold uppercase tracking-wider">
                          {invoice.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {invoice.clientName} • Cycle: {invoice.billingMonth}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {invoice.lineItems?.length || 0} line items
                      </p>
                    </div>

                    <div className="flex flex-col sm:items-end gap-2">
                      <span className="text-lg font-bold text-white font-mono">
                        {formatCurrency(invoice.total)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setViewingInvoice(invoice)}
                          className="btn-secondary px-2 py-1 text-xs flex items-center gap-1"
                          title="View Details"
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => exportAsPdf(invoice)}
                          className="btn-secondary px-2.5 py-1 text-xs flex items-center gap-1"
                          title="Download PDF"
                        >
                          <Download className="h-3 w-3" /> PDF
                        </button>
                        <button
                          onClick={() => exportAsExcel(invoice)}
                          className="btn-secondary px-2.5 py-1 text-xs flex items-center gap-1"
                          title="Export Excel"
                        >
                          <FileSpreadsheet className="h-3 w-3" /> Excel
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-1.5 text-rose-300 hover:bg-rose-500/20 transition"
                          title="Delete Invoice"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {invoices.length === 0 && (
              <div className="py-16 text-center text-slate-400 text-xs">
                No invoices have been generated yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[30px] p-6 sm:p-8 border border-white/12 bg-slate-900/95 space-y-4">
            <div className="flex items-center justify-between border-b border-white/8 pb-4">
              <div>
                <span className="font-mono font-bold text-white text-lg">
                  {viewingInvoice.invoiceNumber}
                </span>
                <p className="text-xs text-slate-400">
                  {viewingInvoice.clientName} • Cycle: {viewingInvoice.billingMonth}
                </p>
              </div>
              <button
                onClick={() => setViewingInvoice(null)}
                className="rounded-full p-2 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl border border-white/8 bg-slate-950/60 p-4 divide-y divide-white/6 text-xs font-mono">
              {(viewingInvoice.lineItems || []).map((item, idx) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold font-sans">
                      {idx + 1}. {item.projectName}
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      Duration: {item.durationText || formatDurationMmSs(item.durationSeconds)} ({item.durationSeconds}s)
                    </p>
                  </div>
                  <span className="text-sm font-bold text-violet-200">
                    {formatCurrency(item.price)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 text-base font-bold text-white border-t border-white/8 font-mono">
              <span>Total Settled:</span>
              <span className="text-xl text-emerald-300">
                {formatCurrency(viewingInvoice.total)}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => exportAsPdf(viewingInvoice)}
                className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" /> Download PDF
              </button>
              <button
                onClick={() => setViewingInvoice(null)}
                className="btn-secondary py-2 px-4 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
