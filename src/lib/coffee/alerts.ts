import type { CoffeeWindow } from "./types";
import { addCalendarDays, differenceInCalendarDays } from "./dateUtils";

export type PeakAlertType = "entering_peak_tomorrow" | "leaving_peak_tomorrow";

export interface PeakAlert<T> {
  item: T;
  type: PeakAlertType;
}

/**
 * Coffees entering or leaving peak tomorrow, relative to `onDate`.
 * This is the in-app equivalent of a "your coffee enters peak tomorrow"
 * notification — there's no email/push infrastructure wired up yet (see
 * README), so this surfaces the same signal directly in the UI instead.
 */
export function getPeakAlerts<T>(items: Array<{ item: T; window: CoffeeWindow }>, onDate: Date): Array<PeakAlert<T>> {
  const tomorrow = addCalendarDays(onDate, 1);
  const alerts: Array<PeakAlert<T>> = [];

  for (const { item, window } of items) {
    if (differenceInCalendarDays(window.peakFrom, tomorrow) === 0) {
      alerts.push({ item, type: "entering_peak_tomorrow" });
    } else if (differenceInCalendarDays(addCalendarDays(window.peakUntil, 1), tomorrow) === 0) {
      alerts.push({ item, type: "leaving_peak_tomorrow" });
    }
  }

  return alerts;
}
