import { NextResponse } from "next/server";

import { getProjects, loadStore, saveStore } from "@/lib/data-store";
import {
  calculateDurationSecondsFromMm,
  calculatePriceForSeconds,
  calculateProjectPrice,
  createInvoiceNumber,
  formatDurationMmSs,
  getProjectCalculatedPrice,
  getProjectDurationSeconds,
} from "@/lib/pricing";
import type { Project } from "@/lib/types";

export async function GET() {
  const projects = await getProjects();
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const store = await loadStore();
    const settings = store.pricingSettings;

    const rawDuration = String(payload.rawFootageDuration || payload.expectedDuration || "0:00").trim();
    const durationSeconds =
      typeof payload.finalDurationSeconds === "number" && payload.finalDurationSeconds > 0
        ? payload.finalDurationSeconds
        : calculateDurationSecondsFromMm(rawDuration);

    const isTrial = Boolean(payload.isTrial);
    const billable = typeof payload.billable === "boolean" ? payload.billable : !isTrial;

    const manualOverride =
      payload.manualPriceOverride !== undefined && payload.manualPriceOverride !== null && payload.manualPriceOverride !== ""
        ? Number(payload.manualPriceOverride)
        : null;

    const projectId = payload.projectId || `EF-${new Date().toISOString().slice(2, 7).replace("-", "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const tempProject = {
      finalDurationSeconds: durationSeconds,
      rawFootageDuration: rawDuration,
      expectedDuration: payload.expectedDuration || rawDuration,
      manualPriceOverride: manualOverride,
      billable,
      isTrial,
    };

    const calculatedPrice = getProjectCalculatedPrice(tempProject, settings);
    const finalAmount = calculateProjectPrice(tempProject, settings);

    const project: Project = {
      id: crypto.randomUUID(),
      projectId,
      clientName: payload.clientName || "Trading Bells",
      companyName: payload.companyName || "",
      email: payload.email || "",
      phone: payload.phone || "",
      projectName: payload.projectName || "Untitled Project",
      description: payload.description || "",
      requirements: payload.requirements || "",
      driveLink: payload.driveLink || "",
      referenceLink: payload.referenceLink || "",
      expectedDuration: payload.expectedDuration || formatDurationMmSs(durationSeconds),
      rawFootageDuration: payload.rawFootageDuration || formatDurationMmSs(durationSeconds),
      estimatedPrice: finalAmount,
      calculatedPrice,
      manualPriceOverride: manualOverride,
      videoFormat: payload.videoFormat || "16:9",
      editingType: payload.editingType || "Other",
      requiredDeliverables: payload.requiredDeliverables || "",
      expectedDeliveryDate: payload.expectedDeliveryDate || new Date().toISOString().slice(0, 10),
      priority: payload.priority || "Normal",
      submissionDate: payload.submissionDate || new Date().toISOString().slice(0, 10),
      status: payload.status || "New Request",
      adminNotes: payload.adminNotes || "",
      billingMonth: payload.billingMonth || new Date().toISOString().slice(0, 7),
      finalAmount,
      billable,
      isTrial,
      paid: Boolean(payload.paid),
      paidAt: payload.paid ? new Date().toISOString() : undefined,
      finalDurationSeconds: durationSeconds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const clientExists = store.clients.some((client) => client.name.toLowerCase() === project.clientName.toLowerCase());
    if (project.clientName && !clientExists) {
      store.clients.unshift({
        id: crypto.randomUUID(),
        name: project.clientName,
        companyName: project.companyName,
        email: project.email,
        phone: project.phone,
        billingAddress: "",
        createdAt: new Date().toISOString(),
      });
    }

    store.projects.unshift(project);
    store.notifications.unshift({
      id: crypto.randomUUID(),
      title: "New project created",
      description: `${project.projectName} (${project.projectId}) was added to ${project.billingMonth || "pipeline"}.`,
      type: "project",
      read: false,
      createdAt: new Date().toISOString(),
    });
    store.activityLogs.unshift({
      id: crypto.randomUUID(),
      title: "Project created",
      detail: `${project.projectName} recorded with duration ${formatDurationMmSs(durationSeconds)} (₹${finalAmount})`,
      createdAt: new Date().toISOString(),
    });

    await saveStore(store);
    return NextResponse.json({ project, invoiceReference: createInvoiceNumber(project.billingMonth) });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to create project" }, { status: 400 });
  }
}
