import type { PricingSettings } from "@/lib/types";

export const DEFAULT_BASE_PRICE = 500;
export const DEFAULT_BASE_DURATION_SECONDS = 120;
export const DEFAULT_INCREMENTAL_RATE_PER_SECOND = 1.25;

/**
 * Core billing formula:
 * - Up to and including 120 seconds: price = (durationSeconds / 120) * 500
 * - Beyond 120 seconds: price = 500 + ((durationSeconds - 120) * 1.25)
 * - Rounded to two decimal places
 */
export function calculatePrice(
  durationSeconds: number,
  basePrice: number = DEFAULT_BASE_PRICE,
  baseDuration: number = DEFAULT_BASE_DURATION_SECONDS,
  incrementalRate: number = DEFAULT_INCREMENTAL_RATE_PER_SECOND
): number {
  const duration = Number.isFinite(durationSeconds) ? Math.max(0, durationSeconds) : 0;
  if (duration === 0) return 0;

  let price: number;
  if (duration <= baseDuration) {
    price = (duration / baseDuration) * basePrice;
  } else {
    price = basePrice + (duration - baseDuration) * incrementalRate;
  }

  return Math.round((price + Number.EPSILON) * 100) / 100;
}

/**
 * Converts MM:SS or M:SS to total seconds.
 */
export function calculateDurationSecondsFromMm(value: string | undefined | null): number {
  if (!value) return 0;
  const trimmed = String(value).trim();
  const match = trimmed.match(/^(\d+):([0-5]?\d)$/);
  if (!match) return 0;

  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return 0;
  return minutes * 60 + seconds;
}

/**
 * Converts seconds to MM:SS format.
 */
export function formatDurationMmSs(totalSeconds: number | undefined | null): string {
  if (!totalSeconds || !Number.isFinite(totalSeconds) || totalSeconds <= 0) return "0:00";
  const sec = Math.round(totalSeconds);
  const minutes = Math.floor(sec / 60);
  const remainingSeconds = sec % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

/**
 * Calculates price for raw duration in seconds using pricing settings.
 */
export function calculatePriceForSeconds(durationSeconds: number, settings?: PricingSettings): number {
  const basePrice = settings?.twoMinuteBaseRate ?? DEFAULT_BASE_PRICE;
  const baseDuration = settings?.baseDurationSeconds ?? DEFAULT_BASE_DURATION_SECONDS;
  const incrementalRate = settings?.perSecondIncrementalRate ?? DEFAULT_INCREMENTAL_RATE_PER_SECOND;
  return calculatePrice(durationSeconds, basePrice, baseDuration, incrementalRate);
}

/**
 * Backward compatibility alias for calculatePriceForSeconds.
 */
export function calculateVideoPrice(durationInSeconds: number): number {
  return calculatePriceForSeconds(durationInSeconds);
}

/**
 * Calculates price from an MM:SS text duration using pricing settings.
 */
export function calculatePriceFromText(durationText: string, settings?: PricingSettings): number {
  const seconds = calculateDurationSecondsFromMm(durationText);
  return calculatePriceForSeconds(seconds, settings);
}

/**
 * Resolves project duration in seconds from available fields.
 */
export function getProjectDurationSeconds(project: {
  finalDurationSeconds?: number;
  rawFootageDuration?: string;
  expectedDuration?: string;
}): number {
  if (Number.isFinite(project.finalDurationSeconds) && (project.finalDurationSeconds ?? 0) > 0) {
    return Number(project.finalDurationSeconds);
  }

  return calculateDurationSecondsFromMm(project.rawFootageDuration || project.expectedDuration || "");
}

/**
 * Calculates automatic formula price for reference, regardless of overrides or trial status.
 */
export function getProjectCalculatedPrice(
  project: {
    finalDurationSeconds?: number;
    rawFootageDuration?: string;
    expectedDuration?: string;
  },
  settings?: PricingSettings
): number {
  const seconds = getProjectDurationSeconds(project);
  return calculatePriceForSeconds(seconds, settings);
}

/**
 * Centralized project price resolution:
 * 1. If trial or non-billable: ₹0.00
 * 2. If manual price override exists: manual price override
 * 3. Otherwise: automatic formula price based on duration
 */
export function calculateProjectPrice(
  project: {
    finalDurationSeconds?: number;
    rawFootageDuration?: string;
    expectedDuration?: string;
    manualPriceOverride?: number | null;
    billable?: boolean;
    isTrial?: boolean;
  },
  settings?: PricingSettings
): number {
  // Non-billable or trial projects are strictly excluded from billable earnings (₹0.00)
  if (project.billable === false || project.isTrial) {
    return 0;
  }

  // Admin manual price override takes precedence when set
  if (
    project.manualPriceOverride !== undefined &&
    project.manualPriceOverride !== null &&
    Number.isFinite(Number(project.manualPriceOverride))
  ) {
    return Math.round((Number(project.manualPriceOverride) + Number.EPSILON) * 100) / 100;
  }

  return getProjectCalculatedPrice(project, settings);
}

/**
 * Standard Indian Rupee currency formatting with two decimal places.
 */
export function formatCurrency(value: number | undefined | null): string {
  const num = Number.isFinite(value) ? Number(value) : 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatMonthLabel(value: string): string {
  if (!value) return "Not assigned";
  const date = new Date(`${value}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

export function createInvoiceNumber(billingMonth?: string): string {
  const prefix = billingMonth ? `EF-${billingMonth.replace("-", "")}` : `EF-${new Date().toISOString().slice(2, 7).replace("-", "")}`;
  return `${prefix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
