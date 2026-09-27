/**
 * The Coffee Calendar development model.
 *
 * This is the ONE place that encodes assumptions about how filter coffee
 * develops after roasting. Nothing else in the app should hard-code rest/peak
 * day counts — everything goes through `computeProfile()` (or an override
 * profile loaded from the `process_profiles` table).
 *
 * How it works
 * ------------
 * 1. Start from a roast-level baseline schedule (days since roast) for the
 *    washed process — the best-documented, most consensus-backed case.
 * 2. Apply a per-process day OFFSET on top of that baseline. Offsets are not
 *    guesses: they were derived from published roaster/practitioner guidance
 *    and a small independent cupping study, documented with citations in
 *    /docs/coffee-development-research.md. Washed = 0 offset (the anchor);
 *    heavier/longer fermentation processes get a larger positive offset
 *    (more time needed for fermentation aromatics to settle, and a wider,
 *    later peak); wet-hulled gets a negative offset (low density/acidity,
 *    consistently described as best enjoyed fresh).
 * 3. Clamp the result so milestones stay in order even for edge-case
 *    roast-level/process combinations.
 *
 * Every number here is a *starting point*, not a scientific constant — see
 * the research doc for sourcing, disagreement between sources, and the
 * confidence rating returned alongside every profile.
 *
 * This model can be overridden per process/subtype/roast-level combination
 * via the `process_profiles` database table without any code changes —
 * see `calculateCoffeeWindow()` in engine.ts, which prefers `overrideProfile`
 * when one is supplied.
 */

import type { Confidence, DevelopmentProfile, Process, RoastLevel } from "./types";

interface MilestoneDays {
  minRestDays: number;
  peakStartDays: number;
  peakEndDays: number;
  drinkableEndDays: number;
  tooOldDays: number;
}

/**
 * Roast-level baselines for the washed process (days since roast).
 * Source: docs/coffee-development-research.md §5 "Roast-level baselines".
 */
export const ROAST_LEVEL_BASELINE: Record<RoastLevel, MilestoneDays & { label: string }> = {
  light: { label: "Light", minRestDays: 7, peakStartDays: 10, peakEndDays: 21, drinkableEndDays: 35, tooOldDays: 49 },
  light_medium: { label: "Light-Medium", minRestDays: 6, peakStartDays: 8, peakEndDays: 18, drinkableEndDays: 30, tooOldDays: 44 },
  medium: { label: "Medium", minRestDays: 5, peakStartDays: 6, peakEndDays: 15, drinkableEndDays: 26, tooOldDays: 38 },
  medium_dark: { label: "Medium-Dark", minRestDays: 4, peakStartDays: 5, peakEndDays: 12, drinkableEndDays: 21, tooOldDays: 30 },
};

interface ProcessOffset extends MilestoneDays {
  label: string;
  description: string;
  /** Confidence at Light/Light-Medium/Medium roast levels. Medium-Dark is handled separately (see baseRoastConfidence). */
  confidence: Confidence;
}

/**
 * Per-process day offsets applied on top of the roast-level (washed)
 * baseline. Source: docs/coffee-development-research.md §5 "How the offsets
 * were derived" — grouped exactly as documented there, including which
 * processes were bucketed together due to a shared evidence gap rather than
 * independently researched numbers.
 */
export const PROCESS_OFFSETS: Record<Process, ProcessOffset> = {
  washed: {
    label: "Washed",
    confidence: "high",
    description:
      "Fruit pulp removed before drying, minimal fermentation. The most predictable, best-documented case — the model's baseline.",
    minRestDays: 0,
    peakStartDays: 0,
    peakEndDays: 0,
    drinkableEndDays: 0,
    tooOldDays: 0,
  },
  honey: {
    label: "Honey / Pulped Natural",
    confidence: "medium",
    description: "Some or all mucilage left on during drying — a modest step up in settling time from washed.",
    minRestDays: 1,
    peakStartDays: 1,
    peakEndDays: 2,
    drinkableEndDays: 3,
    tooOldDays: 3,
  },
  natural: {
    label: "Natural / Dry Process",
    confidence: "medium",
    description:
      "Whole cherry dried intact, retaining more CO2 and soluble compounds. A cupping study found naturals kept improving through 22 days while washed plateaued early.",
    minRestDays: 2,
    peakStartDays: 3,
    peakEndDays: 4,
    drinkableEndDays: 6,
    tooOldDays: 7,
  },
  wet_hulled: {
    label: "Wet-Hulled",
    confidence: "medium",
    description:
      "Hulled at high moisture. Low density and low acidity — the one process consistently described as best enjoyed fresh rather than rested.",
    minRestDays: -3,
    peakStartDays: -4,
    peakEndDays: -6,
    drinkableEndDays: -10,
    tooOldDays: -14,
  },
  anaerobic_washed: {
    label: "Anaerobic Washed",
    confidence: "medium",
    description: "A sealed anaerobic soak layered onto an otherwise standard washed process — a moderate step up.",
    minRestDays: 2,
    peakStartDays: 3,
    peakEndDays: 4,
    drinkableEndDays: 5,
    tooOldDays: 6,
  },
  anaerobic: {
    label: "Anaerobic",
    confidence: "medium",
    description: "Sealed, oxygen-free fermentation. Fermentation aromatics that read as \"funky\" out of the bag anecdotally need real settling time.",
    minRestDays: 3,
    peakStartDays: 4,
    peakEndDays: 6,
    drinkableEndDays: 7,
    tooOldDays: 9,
  },
  yeast_inoculated: {
    label: "Yeast Inoculated",
    confidence: "medium",
    description: "Fermented with a deliberately added yeast strain. Modeled at the same intensity as generic anaerobic.",
    minRestDays: 3,
    peakStartDays: 4,
    peakEndDays: 6,
    drinkableEndDays: 7,
    tooOldDays: 9,
  },
  anaerobic_natural: {
    label: "Anaerobic Natural",
    confidence: "low",
    description: "Whole-cherry, sealed anaerobic fermentation — intense and plausible, but with little published day-range data.",
    minRestDays: 4,
    peakStartDays: 5,
    peakEndDays: 8,
    drinkableEndDays: 9,
    tooOldDays: 12,
  },
  carbonic_maceration: {
    label: "Carbonic Maceration",
    confidence: "low",
    description: "Whole-cherry CO2-flush fermentation borrowed from winemaking. Intense, producer-dependent, thinly documented.",
    minRestDays: 4,
    peakStartDays: 5,
    peakEndDays: 8,
    drinkableEndDays: 9,
    tooOldDays: 12,
  },
  koji: {
    label: "Koji",
    confidence: "low",
    description: "Inoculated with Aspergillus oryzae (as in sake/miso production). Novel technique, sparsely documented.",
    minRestDays: 4,
    peakStartDays: 5,
    peakEndDays: 8,
    drinkableEndDays: 9,
    tooOldDays: 12,
  },
  lactic: {
    label: "Lactic / Lactic Fermentation",
    confidence: "low",
    description: "Encourages lactic-acid bacteria for a tangy character. Intense, producer-dependent fermentation with little resting-specific data.",
    minRestDays: 4,
    peakStartDays: 5,
    peakEndDays: 8,
    drinkableEndDays: 9,
    tooOldDays: 12,
  },
  carbonic_maceration_natural: {
    label: "Carbonic Maceration Natural",
    confidence: "low",
    description: "Carbonic maceration stacked on a full natural dry-down — among the most fermentation-intense categories modeled.",
    minRestDays: 5,
    peakStartDays: 6,
    peakEndDays: 9,
    drinkableEndDays: 11,
    tooOldDays: 14,
  },
  extended_fermentation: {
    label: "Extended Fermentation",
    confidence: "low",
    description: "Fermentation deliberately prolonged well past typical duration — the most intense case modeled.",
    minRestDays: 5,
    peakStartDays: 6,
    peakEndDays: 9,
    drinkableEndDays: 11,
    tooOldDays: 14,
  },
  thermal_shock: {
    label: "Thermal Shock",
    confidence: "low",
    description: "Rapid temperature cycling to rupture cell walls and accelerate/alter fermentation. Essentially no published resting guidance.",
    minRestDays: 4,
    peakStartDays: 5,
    peakEndDays: 7,
    drinkableEndDays: 8,
    tooOldDays: 11,
  },
  experimental: {
    label: "Experimental / Other",
    confidence: "low",
    description: "Catch-all for novel or producer-specific processing — treated as a moderately intense, thinly documented ferment by default.",
    minRestDays: 4,
    peakStartDays: 5,
    peakEndDays: 8,
    drinkableEndDays: 9,
    tooOldDays: 12,
  },
};

/** Kept for callers that just want process metadata without the day offsets. */
export const PROCESS_CONFIG: Record<Process, { label: string; description: string; confidence: Confidence }> = Object.fromEntries(
  Object.entries(PROCESS_OFFSETS).map(([key, value]) => [key, { label: value.label, description: value.description, confidence: value.confidence }]),
) as Record<Process, { label: string; description: string; confidence: Confidence }>;

export const ROAST_LEVEL_FACTORS: Record<RoastLevel, { label: string }> = {
  light: { label: "Light" },
  light_medium: { label: "Light-Medium" },
  medium: { label: "Medium" },
  medium_dark: { label: "Medium-Dark" },
};

const CONFIDENCE_RANK: Record<Confidence, number> = { high: 2, medium: 1, low: 0 };

function weakerConfidence(a: Confidence, b: Confidence): Confidence {
  return CONFIDENCE_RANK[a] <= CONFIDENCE_RANK[b] ? a : b;
}

/**
 * Computes a development profile from first principles (roast-level
 * baseline + process offset). This is the fallback used whenever no
 * explicit override exists in the `process_profiles` table.
 */
export function computeProfile(process: Process, roastLevel: RoastLevel): DevelopmentProfile {
  const baseline = ROAST_LEVEL_BASELINE[roastLevel];
  const offset = PROCESS_OFFSETS[process];

  const minRestDays = Math.max(1, baseline.minRestDays + offset.minRestDays);
  const peakStartDays = Math.max(minRestDays + 1, baseline.peakStartDays + offset.peakStartDays);
  const peakEndDays = Math.max(peakStartDays + 3, baseline.peakEndDays + offset.peakEndDays);
  const drinkableEndDays = Math.max(peakEndDays + 5, baseline.drinkableEndDays + offset.drinkableEndDays);
  const tooOldDays = Math.max(drinkableEndDays + 7, baseline.tooOldDays + offset.tooOldDays);

  // Research §5: lighter wet-hulled pairings have especially sparse evidence.
  let roastConfidence: Confidence = "high";
  if (roastLevel === "medium_dark" && process === "washed") roastConfidence = "medium";
  if (process === "wet_hulled" && (roastLevel === "light" || roastLevel === "light_medium")) roastConfidence = "low";

  return {
    minRestDays,
    peakStartDays,
    peakEndDays,
    drinkableEndDays,
    tooOldDays,
    confidence: weakerConfidence(offset.confidence, roastConfidence),
    notes: `${baseline.label} roast, ${offset.label.toLowerCase()} process. ${offset.description}`,
    source: "formula",
  };
}
