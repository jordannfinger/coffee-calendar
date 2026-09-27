import { describe, expect, it } from "vitest";
import { getPeakAlerts } from "./alerts";
import { calculateCoffeeWindow, getCoffeeStatus } from "./engine";
import { parseDateOnly } from "./dateUtils";

describe("getPeakAlerts", () => {
  const today = parseDateOnly("2026-09-02");

  it("flags a coffee entering peak tomorrow", () => {
    // washed/light: peakStart 10 -> roasted 2026-08-24 puts peakFrom on 2026-09-03 (tomorrow)
    const window = calculateCoffeeWindow({ roastDate: parseDateOnly("2026-08-24"), process: "washed", roastLevel: "light" });
    const alerts = getPeakAlerts([{ item: "coffee-a", window }], today);
    expect(alerts).toEqual([{ item: "coffee-a", type: "entering_peak_tomorrow" }]);
  });

  it("flags a coffee leaving peak tomorrow", () => {
    // The final peak day is Sep 3; the first day outside peak is Sep 4.
    const window = calculateCoffeeWindow({ roastDate: parseDateOnly("2026-08-13"), process: "washed", roastLevel: "light" });
    expect(getPeakAlerts([{ item: "coffee-b", window }], today)).toEqual([]);
    expect(getCoffeeStatus(window, parseDateOnly("2026-09-03"))).toBe("peak");
    expect(getCoffeeStatus(window, parseDateOnly("2026-09-04"))).toBe("out_of_peak");
    const alerts = getPeakAlerts([{ item: "coffee-b", window }], parseDateOnly("2026-09-03"));
    expect(alerts).toEqual([{ item: "coffee-b", type: "leaving_peak_tomorrow" }]);
  });

  it("returns nothing for a coffee mid-peak or far from any transition", () => {
    const window = calculateCoffeeWindow({ roastDate: parseDateOnly("2026-08-01"), process: "washed", roastLevel: "light" });
    expect(getPeakAlerts([{ item: "coffee-c", window }], today)).toEqual([]);
  });

  it("handles a transition across a month boundary", () => {
    // peakFrom lands 2026-10-01 when tomorrow is 2026-10-01 relative to today 2026-09-30
    const window = calculateCoffeeWindow({ roastDate: parseDateOnly("2026-09-21"), process: "washed", roastLevel: "light" });
    const alerts = getPeakAlerts([{ item: "coffee-d", window }], parseDateOnly("2026-09-30"));
    expect(alerts).toEqual([{ item: "coffee-d", type: "entering_peak_tomorrow" }]);
  });
});
