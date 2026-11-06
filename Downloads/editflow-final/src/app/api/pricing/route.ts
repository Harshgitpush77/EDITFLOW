import { NextResponse } from "next/server";

import { getPricingSettings, updatePricingSettings } from "@/lib/data-store";
import type { PricingSettings } from "@/lib/types";

export async function GET() {
  const settings = await getPricingSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  try {
    const payload = await request.json();
    const settings: PricingSettings = {
      id: "pricing-default",
      twoMinuteBaseRate: Number(payload.twoMinuteBaseRate ?? 500),
      baseDurationSeconds: Number(payload.baseDurationSeconds ?? 120),
      fourMinuteReferenceRate: Number(payload.fourMinuteReferenceRate ?? 650),
      perSecondIncrementalRate: Number(payload.perSecondIncrementalRate ?? 1.25),
      minimumCharge: Number(payload.minimumCharge ?? 0),
      additionalServiceCharges: Number(payload.additionalServiceCharges ?? 0),
      discounts: Number(payload.discounts ?? 0),
      taxRate: Number(payload.taxRate ?? 0),
      updatedAt: new Date().toISOString(),
    };
    const saved = await updatePricingSettings(settings);
    return NextResponse.json(saved);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to update pricing settings" }, { status: 400 });
  }
}
