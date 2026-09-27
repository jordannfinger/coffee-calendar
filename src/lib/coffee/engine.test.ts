import { describe, expect, it } from "vitest";
import { calculateCoffeeWindow, daysFromIdealPoint, getCoffeeStatus, rankForDate, reverseCalculate } from "./engine";
import { formatDateOnly, parseDateOnly } from "./dateUtils";
import { computeProfile } from "./model";
import type { CalculateWindowInput, DevelopmentProfile } from "./types";

describe("calculateCoffeeWindow", () => {
  it("derives an ordered set of milestones from a roast date", () => {
    const window = calculateCoffeeWindow({
      roastDate: parseDateOnly("2026-09-12"),
      process: "washed",
      roastLevel: "light",
    });

    expect(window.roastDate.getTime()).toBeLessThan(window.drinkableFrom.getTime());
    expect(window.drinkableFrom.getTime()).toBeLessThanOrEqual(window.peakFrom.getTime());
    expect(window.peakFrom.getTime()).toBeLessThan(window.peakUntil.getTime());
    expect(window.peakUntil.getTime()).toBeLessThan(window.drinkableUntil.getTime());
    expect(window.drinkableUntil.getTime()).toBeLessThan(window.tooOldFrom.getTime());
  });

  it("handles a roast date that crosses a month boundary", () => {
    const window = calculateCoffeeWindow({
      roastDate: parseDateOnly("2026-09-28"),
      process: "washed",
      roastLevel: "light",
    });
    // minRestDays=7 for baseline washed/light -> Oct 5
    expect(formatDateOnly(window.drinkableFrom)).toBe("2026-10-05");
  });

  it("handles a roast date that crosses a year boundary", () => {
    const window = calculateCoffeeWindow({
      roastDate: parseDateOnly("2026-12-28"),
      process: "washed",
      roastLevel: "light",
    });
    expect(window.peakUntil.getFullYear()).toBe(2027);
  });

  it("handles roasting on a leap day", () => {
    const window = calculateCoffeeWindow({
      roastDate: parseDateOnly("2028-02-29"),
      process: "natural",
      roastLevel: "medium",
    });
    expect(formatDateOnly(window.drinkableFrom).startsWith("2028-03")).toBe(true);
  });

  it("prefers an explicit override profile over the formula", () => {
    const override: DevelopmentProfile = {
      minRestDays: 1,
      peakStartDays: 2,
      peakEndDays: 3,
      drinkableEndDays: 4,
      tooOldDays: 5,
      confidence: "high",
      notes: "test override",
      source: "override",
    };
    const window = calculateCoffeeWindow({
      roastDate: parseDateOnly("2026-09-12"),
      process: "washed",
      roastLevel: "light",
      overrideProfile: override,
    });
    expect(formatDateOnly(window.drinkableFrom)).toBe("2026-09-13");
    expect(window.source).toBe("override");
  });

  it("produces a wider, later-shifted window for more intense fermentation", () => {
    const washed = calculateCoffeeWindow({ roastDate: parseDateOnly("2026-09-12"), process: "washed", roastLevel: "light" });
    const extended = calculateCoffeeWindow({
      roastDate: parseDateOnly("2026-09-12"),
      process: "extended_fermentation",
      roastLevel: "light",
    });
    expect(extended.peakFrom.getTime()).toBeGreaterThanOrEqual(washed.peakFrom.getTime());
    expect(extended.drinkableUntil.getTime()).toBeGreaterThan(washed.drinkableUntil.getTime());
  });

  it("wet-hulled develops faster than washed at the same roast level", () => {
    const washed = computeProfile("washed", "light");
    const wetHulled = computeProfile("wet_hulled", "light");
    expect(wetHulled.minRestDays).toBeLessThan(washed.minRestDays);
  });

  it("darker roasts reach drinkable sooner than lighter roasts of the same process", () => {
    const light = computeProfile("washed", "light");
    const mediumDark = computeProfile("washed", "medium_dark");
    expect(mediumDark.minRestDays).toBeLessThan(light.minRestDays);
    expect(mediumDark.drinkableEndDays).toBeLessThan(light.drinkableEndDays);
  });
});

describe("getCoffeeStatus", () => {
  const roastDate = parseDateOnly("2026-09-12");
  const window = calculateCoffeeWindow({ roastDate, process: "washed", roastLevel: "light" });

  it("is not_ready before drinkableFrom", () => {
    expect(getCoffeeStatus(window, parseDateOnly("2026-09-13"))).toBe("not_ready");
  });

  it("is not_ready on the roast date itself", () => {
    expect(getCoffeeStatus(window, roastDate)).toBe("not_ready");
  });

  it("is drinkable on drinkableFrom", () => {
    expect(getCoffeeStatus(window, window.drinkableFrom)).toBe("drinkable");
  });

  it("is peak on peakFrom and peakUntil (inclusive boundaries)", () => {
    expect(getCoffeeStatus(window, window.peakFrom)).toBe("peak");
    expect(getCoffeeStatus(window, window.peakUntil)).toBe("peak");
  });

  it("is out_of_peak the day after peakUntil", () => {
    const dayAfter = parseDateOnly(formatDateOnly(window.peakUntil));
    dayAfter.setDate(dayAfter.getDate() + 1);
    expect(getCoffeeStatus(window, dayAfter)).toBe("out_of_peak");
  });

  it("is too_old on and after tooOldFrom", () => {
    expect(getCoffeeStatus(window, window.tooOldFrom)).toBe("too_old");
  });

  it("handles a far-future date", () => {
    expect(getCoffeeStatus(window, parseDateOnly("2030-01-01"))).toBe("too_old");
  });

  it("handles a date before the roast date (order placed ahead of roast)", () => {
    expect(getCoffeeStatus(window, parseDateOnly("2026-09-01"))).toBe("not_ready");
  });
});

describe("rankForDate (date search)", () => {
  interface TestCoffee {
    name: string;
    roastDate: string;
    process: CalculateWindowInput["process"];
    roastLevel: CalculateWindowInput["roastLevel"];
  }

  const coffees: TestCoffee[] = [
    { name: "Washed Light - just right", roastDate: "2026-09-15", process: "washed", roastLevel: "light" },
    { name: "Natural Light - drinkable", roastDate: "2026-09-15", process: "natural", roastLevel: "light" },
    { name: "Anaerobic - too fresh", roastDate: "2026-09-21", process: "anaerobic", roastLevel: "light" },
    { name: "Washed Medium - out of peak", roastDate: "2026-09-05", process: "washed", roastLevel: "medium" },
  ];

  const targetDate = parseDateOnly("2026-09-25");

  const ranked = rankForDate(
    coffees,
    (c) => ({ roastDate: parseDateOnly(c.roastDate), process: c.process, roastLevel: c.roastLevel }),
    targetDate,
  );

  it("ranks peak/drinkable ahead of not_ready and too_old/out_of_peak", () => {
    expect(ranked.map((r) => r.status)).toEqual(["peak", "drinkable", "out_of_peak", "not_ready"]);
  });

  it("marks the freshly-roasted anaerobic coffee as not_ready", () => {
    const anaerobic = ranked.find((r) => r.item.name.includes("Anaerobic"));
    expect(anaerobic?.status).toBe("not_ready");
  });

  it("returns all items", () => {
    expect(ranked).toHaveLength(coffees.length);
  });
});

describe("reverseCalculate", () => {
  it("recommends an earlier roast date for processes needing more settling time", () => {
    const target = parseDateOnly("2026-10-01");
    const [washedResult, extendedResult] = reverseCalculate(target, [
      { process: "washed", roastLevel: "light" },
      { process: "extended_fermentation", roastLevel: "light" },
    ]);

    expect(extendedResult.recommendedRoastDate.getTime()).toBeLessThanOrEqual(washedResult.recommendedRoastDate.getTime());
  });

  it("produces a window whose peak midpoint lands near the target date", () => {
    const target = parseDateOnly("2026-10-01");
    const [result] = reverseCalculate(target, [{ process: "washed", roastLevel: "light" }]);
    const midpointOffset = daysFromIdealPoint(result.window, target);
    expect(Math.abs(midpointOffset)).toBeLessThanOrEqual(1);
  });

  it("handles a target date crossing a year boundary", () => {
    const target = parseDateOnly("2027-01-03");
    const [result] = reverseCalculate(target, [{ process: "washed", roastLevel: "light" }]);
    expect(result.recommendedRoastDate.getFullYear()).toBe(2026);
  });
});
