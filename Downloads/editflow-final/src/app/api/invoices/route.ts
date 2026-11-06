import { NextResponse } from "next/server";

import { addInvoice, deleteInvoice, getInvoices, loadStore, saveStore } from "@/lib/data-store";
import {
  calculateProjectPrice,
  createInvoiceNumber,
  formatDurationMmSs,
  formatMonthLabel,
  getProjectDurationSeconds,
} from "@/lib/pricing";
import type { Invoice } from "@/lib/types";

export async function GET() {
  const invoices = await getInvoices();
  return NextResponse.json(invoices);
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const store = await loadStore();
    const selectedIds = payload.projectIds || [];
    // Only completed & billable projects can be included in invoices (trials strictly excluded)
    const projects = store.projects.filter(
      (project) => selectedIds.includes(project.id) && project.billable && !project.isTrial
    );

    if (projects.length === 0) {
      return NextResponse.json(
        { error: "No billable projects selected. Trial and non-billable projects cannot be invoiced." },
        { status: 400 }
      );
    }

    const settings = store.pricingSettings;

    const lineItems = projects.map((project) => {
      const durationSeconds = getProjectDurationSeconds(project);
      return {
        id: crypto.randomUUID(),
        projectId: project.id,
        projectName: project.projectName,
        durationSeconds,
        durationText: formatDurationMmSs(durationSeconds),
        price: calculateProjectPrice(project, settings),
        rateSnapshot: settings,
      };
    });

    const subtotal = Math.round((lineItems.reduce((sum, item) => sum + item.price, 0) + Number.EPSILON) * 100) / 100;
    const adjustments = Number(payload.adjustments || 0);
    const tax = Math.round((subtotal * (settings.taxRate / 100) + Number.EPSILON) * 100) / 100;
    const total = Math.round((subtotal + adjustments + tax + Number.EPSILON) * 100) / 100;

    const billingMonthLabel = payload.billingMonth || projects[0]?.billingMonth || "Current Cycle";

    const invoice: Invoice = {
      id: crypto.randomUUID(),
      invoiceNumber: payload.invoiceNumber || createInvoiceNumber(projects[0]?.billingMonth),
      clientName: payload.clientName || projects[0]?.clientName || "Trading Bells",
      clientEmail: payload.clientEmail || projects[0]?.email || "contact@tradingbells.com",
      billingMonth: billingMonthLabel,
      invoiceDate: payload.invoiceDate || new Date().toISOString().slice(0, 10),
      dueDate: payload.dueDate || new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10),
      status: payload.status || "Paid",
      notes: payload.notes || `Itemized billing for ${projects.length} completed video edits.`,
      subtotal,
      adjustments,
      tax,
      total,
      paymentReceived: payload.status === "Paid" ? total : 0,
      lineItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Mark projects as paid if invoice is paid
    if (invoice.status === "Paid") {
      store.projects = store.projects.map((p) =>
        selectedIds.includes(p.id) ? { ...p, paid: true, paidAt: new Date().toISOString() } : p
      );
    }

    await addInvoice(invoice);

    store.activityLogs.unshift({
      id: crypto.randomUUID(),
      title: "Invoice generated",
      detail: `${invoice.invoiceNumber} created for ${invoice.clientName} (₹${invoice.total.toFixed(2)})`,
      createdAt: new Date().toISOString(),
    });

    store.notifications.unshift({
      id: crypto.randomUUID(),
      title: "Invoice generated",
      description: `${invoice.invoiceNumber} (₹${invoice.total.toFixed(2)}) issued for ${invoice.clientName}.`,
      type: "invoice",
      createdAt: new Date().toISOString(),
      read: false,
    });

    await saveStore(store);
    return NextResponse.json(invoice);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to create invoice" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing invoice ID" }, { status: 400 });
  const ok = await deleteInvoice(id);
  return NextResponse.json({ success: ok });
}
