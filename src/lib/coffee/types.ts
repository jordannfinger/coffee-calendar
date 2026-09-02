/**
 * Core domain types for the Coffee Calendar development/peak model.
 * Filter coffee only — no espresso.
 */

export const PROCESSES = [
  "washed",
  "natural",
  "honey",
  "anaerobic",
  "anaerobic_natural",
  "anaerobic_washed",
  "carbonic_maceration",
  "carbonic_maceration_natural",
  "thermal_shock",
  "koji",
  "lactic",
  "yeast_inoculated",
  "extended_fermentation",
  "wet_hulled",
  "experimental",
] as const;

export type Process = (typeof PROCESSES)[number];

/** Optional finer-grained subtype within a process, e.g. honey colour grade. */
export const PROCESS_SUBTYPES: Partial<Record<Process, string[]>> = {
  honey: ["White Honey", "Yellow Honey", "Red Honey", "Black Honey"],
  natural: ["Dry Process", "Extended Dry Fermentation"],
  anaerobic: ["Anaerobic Fermentation", "Double Anaerobic"],
  lactic: ["Lactic Fermentation", "Lactic Acid Co-Ferment"],
  experimental: ["Co-Ferment", "Barrel Aged", "Other Experimental"],
};

export const ROAST_LEVELS = ["light", "light_medium", "medium", "medium_dark"] as const;

export type RoastLevel = (typeof ROAST_LEVELS)[number];

export type Confidence = "high" | "medium" | "low";

/**
 * A resolved development profile expressed in whole days relative to roast date
 * (day 0 = roast date). Mirrors the `process_profiles` table shape.
 */
export interface DevelopmentProfile {
  minRestDays: number;
  peakStartDays: number;
  peakEndDays: number;
  drinkableEndDays: number;
  tooOldDays: number;
  confidence: Confidence;
  notes: string;
  source: "override" | "formula";
}

export type CoffeeStatus = "not_ready" | "drinkable" | "peak" | "out_of_peak" | "too_old";

export interface CoffeeWindow {
  roastDate: Date;
  drinkableFrom: Date;
  peakFrom: Date;
  peakUntil: Date;
  drinkableUntil: Date;
  tooOldFrom: Date;
  confidence: Confidence;
  notes: string;
  source: "override" | "formula";
}

export interface CalculateWindowInput {
  roastDate: Date;
  process: Process;
  processSubtype?: string | null;
  roastLevel: RoastLevel;
  /** Explicit override profile, typically loaded from the `process_profiles` table. */
  overrideProfile?: DevelopmentProfile | null;
}
