/**
 * The single calculation engine for Coffee Calendar.
 *
 * Every feature (calculator, calendar, date search, reverse calculator, My
 * Coffee, Drink Today) computes coffee windows through `calculateCoffeeWindow`
 * and reads status through `getCoffeeStatus`. Do not duplicate this logic
 * elsewhere.
 */

import { computeProfile } from "./model";
import { addCalendarDays, differenceInCalendarDays, toDateOnly } from "./dateUtils";
import type { CalculateWindowInput, CoffeeStatus, CoffeeWindow, DevelopmentProfile } from "./types";

export function calculateCoffeeWindow(input: CalculateWindowInput): CoffeeWindow {
  const roastDate = toDateOnly(input.roastDate);
  const profile: DevelopmentProfile = input.overrideProfile ?? computeProfile(input.process, input.roastLevel);

  return {
    roastDate,
    drinkableFrom: addCalendarDays(roastDate, profile.minRestDays),
    peakFrom: addCalendarDays(roastDate, profile.peakStartDays),
    peakUntil: addCalendarDays(roastDate, profile.peakEndDays),
    drinkableUntil: addCalendarDays(roastDate, profile.drinkableEndDays),
    tooOldFrom: addCalendarDays(roastDate, profile.tooOldDays),
    confidence: profile.confidence,
    notes: profile.notes,
    source: profile.source,
  };
}

/** Determines status of a coffee window on a given date (defaults to today). */
export function getCoffeeStatus(window: CoffeeWindow, onDate: Date): CoffeeStatus {
  const date = toDateOnly(onDate);

  if (differenceInCalendarDays(window.drinkableFrom, date) < 0) return "not_ready";
  if (differenceInCalendarDays(window.peakFrom, date) < 0) return "drinkable";
  if (differenceInCalendarDays(window.peakUntil, date) <= 0) return "peak";
  if (differenceInCalendarDays(window.tooOldFrom, date) < 0) return "out_of_peak";
  return "too_old";
}

export const STATUS_ORDER: CoffeeStatus[] = ["peak", "drinkable", "out_of_peak", "not_ready", "too_old"];

export const STATUS_META: Record<CoffeeStatus, { label: string; emoji: string; description: string }> = {
  peak: { label: "In Peak", emoji: "⭐", description: "Estimated optimal drinking window." },
  drinkable: { label: "Drinkable", emoji: "🟢", description: "Should brew well, but not necessarily at its best yet." },
  not_ready: { label: "Not Yet Drinkable", emoji: "🔴", description: "Still resting — considered too fresh." },
  out_of_peak: { label: "Out of Peak", emoji: "🟠", description: "Past the estimated peak, but can still be enjoyable." },
  too_old: { label: "Too Old", emoji: "⚫", description: "Well past the estimated window — not recommended to order for a future date." },
};

/**
 * Signed distance (in days) from `date` to the "ideal point" of a window —
 * the midpoint of the peak. Used to rank results within a status tier: for
 * example, negative means the ideal point hasn't arrived yet.
 */
export function daysFromIdealPoint(window: CoffeeWindow, date: Date): number {
  const peakLengthDays = differenceInCalendarDays(window.peakFrom, window.peakUntil);
  const idealPoint = addCalendarDays(window.peakFrom, Math.round(peakLengthDays / 2));
  return differenceInCalendarDays(idealPoint, toDateOnly(date));
}

/** How many days into its peak window a coffee is (1-indexed), and the peak's total length. */
export function peakProgress(window: CoffeeWindow, date: Date): { dayOfPeak: number; peakLengthDays: number } | null {
  const status = getCoffeeStatus(window, date);
  if (status !== "peak") return null;
  const peakLengthDays = differenceInCalendarDays(window.peakFrom, window.peakUntil) + 1;
  const dayOfPeak = differenceInCalendarDays(window.peakFrom, toDateOnly(date)) + 1;
  return { dayOfPeak, peakLengthDays };
}

export interface RankedResult<T> {
  item: T;
  window: CoffeeWindow;
  status: CoffeeStatus;
  rankScore: number;
}

/**
 * Ranks a set of items (coffees, or process/roast combinations) for a target
 * date: peak first, then drinkable, then out-of-peak, then not-yet-ready,
 * then too-old — and within each tier, closest to the ideal point first.
 */
export function rankForDate<T>(
  items: T[],
  getInput: (item: T) => CalculateWindowInput,
  targetDate: Date,
): RankedResult<T>[] {
  const date = toDateOnly(targetDate);

  return items
    .map((item) => {
      const window = calculateCoffeeWindow(getInput(item));
      const status = getCoffeeStatus(window, date);
      return { item, window, status, rankScore: Math.abs(daysFromIdealPoint(window, date)) };
    })
    .sort((a, b) => {
      const tierDiff = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
      if (tierDiff !== 0) return tierDiff;
      return a.rankScore - b.rankScore;
    });
}

export interface ReverseCalculationResult {
  input: CalculateWindowInput extends infer I ? Omit<I, "roastDate" | "overrideProfile"> : never;
  recommendedRoastDate: Date;
  window: CoffeeWindow;
}

/**
 * Given a target drink date and a set of process/roast-level combinations,
 * finds the roast date that puts each combination's peak midpoint as close
 * as possible to the target date.
 */
export function reverseCalculate(
  targetDate: Date,
  combos: Array<Omit<CalculateWindowInput, "roastDate">>,
): ReverseCalculationResult[] {
  const date = toDateOnly(targetDate);

  return combos.map((combo) => {
    const profile = combo.overrideProfile ?? computeProfile(combo.process, combo.roastLevel);
    const peakMidpointDays = Math.round((profile.peakStartDays + profile.peakEndDays) / 2);
    const recommendedRoastDate = addCalendarDays(date, -peakMidpointDays);
    const window = calculateCoffeeWindow({ ...combo, roastDate: recommendedRoastDate });
    return { input: combo as ReverseCalculationResult["input"], recommendedRoastDate, window };
  });
}
