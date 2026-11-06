import { NextResponse } from "next/server";

import { loadStore, saveStore } from "@/lib/data-store";
import {
  calculateDurationSecondsFromMm,
  calculateProjectPrice,
  formatDurationMmSs,
  getProjectCalculatedPrice,
  getProjectDurationSeconds,
} from "@/lib/pricing";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await loadStore();
  const project = store.projects.find((item) => item.id === id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const settings = store.pricingSettings;
  const seconds = getProjectDurationSeconds(project);
  const calculatedPrice = getProjectCalculatedPrice(project, settings);
  const finalAmount = calculateProjectPrice(project, settings);
  return NextResponse.json({
    ...project,
    finalDurationSeconds: seconds,
    calculatedPrice,
    finalAmount,
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const store = await loadStore();
    const index = store.projects.findIndex((item) => item.id === id);
    if (index < 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const current = store.projects[index];
    const settings = store.pricingSettings;

    // Resolve durations
    let rawDuration = data.rawFootageDuration !== undefined ? data.rawFootageDuration : current.rawFootageDuration;
    let expectedDuration = data.expectedDuration !== undefined ? data.expectedDuration : current.expectedDuration;
    let durationSeconds =
      typeof data.finalDurationSeconds === "number" && data.finalDurationSeconds > 0
        ? data.finalDurationSeconds
        : calculateDurationSecondsFromMm(rawDuration || expectedDuration || "");

    // If duration changed by text
    if (data.rawFootageDuration && !data.finalDurationSeconds) {
      durationSeconds = calculateDurationSecondsFromMm(data.rawFootageDuration);
    } else if (data.finalDurationSeconds && !data.rawFootageDuration) {
      rawDuration = formatDurationMmSs(data.finalDurationSeconds);
      expectedDuration = rawDuration;
    }

    // Resolve trial & billable
    const isTrial = typeof data.isTrial === "boolean" ? data.isTrial : current.isTrial ?? false;
    let billable = typeof data.billable === "boolean" ? data.billable : current.billable;
    if (isTrial) {
      billable = false;
    }

    // Resolve manual override
    let manualPriceOverride = current.manualPriceOverride;
    if (data.manualPriceOverride !== undefined) {
      manualPriceOverride =
        data.manualPriceOverride === null || data.manualPriceOverride === "" || isNaN(Number(data.manualPriceOverride))
          ? null
          : Number(data.manualPriceOverride);
    }

    // Resolve paid
    const paid = billable && typeof data.paid === "boolean" ? data.paid : billable ? (current.paid ?? false) : false;
    const paidAt = paid ? current.paidAt || new Date().toISOString() : undefined;

    const tempProject = {
      ...current,
      ...data,
      finalDurationSeconds: durationSeconds,
      rawFootageDuration: rawDuration,
      expectedDuration,
      billable,
      isTrial,
      manualPriceOverride,
    };

    const calculatedPrice = getProjectCalculatedPrice(tempProject, settings);
    const finalAmount = calculateProjectPrice(tempProject, settings);

    const updated = {
      ...current,
      ...data,
      finalDurationSeconds: durationSeconds,
      rawFootageDuration: rawDuration,
      expectedDuration,
      billable,
      isTrial,
      manualPriceOverride,
      calculatedPrice,
      finalAmount,
      paid,
      paidAt,
      updatedAt: new Date().toISOString(),
    };

    store.projects[index] = updated;
    await saveStore(store);

    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Update failed" }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await loadStore();
  const project = store.projects.find((item) => item.id === id);
  store.projects = store.projects.filter((item) => item.id !== id);

  if (project) {
    store.activityLogs.unshift({
      id: crypto.randomUUID(),
      title: "Project deleted",
      detail: `${project.projectName} (${project.projectId}) was removed by admin`,
      createdAt: new Date().toISOString(),
    });
  }

  await saveStore(store);
  return NextResponse.json({ success: true });
}
