import { afterEach, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Timeline } from "@/components/coffee/Timeline";
import { statusLine } from "@/components/coffee/CoffeeCard";
import { calculateCoffeeWindow, getCoffeeStatus, rankForDate } from "./engine";
import { hasCoffeeRemaining } from "./coffeeTypes";
import { parseDateOnly } from "./dateUtils";
import { buildOverrideIndex, resolveOverride, type ProfileOverrideRow } from "./profileOverrides";
import { watchCurrentDay } from "./useToday";

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it("keeps unknown quantities eligible and preserves finished bags in the original inventory", () => {
  const coffees = [{ remaining_percent: 0 }, { remaining_percent: null }, { remaining_percent: 25 }];
  const results = rankForDate(coffees.filter(hasCoffeeRemaining), () => ({
    roastDate: parseDateOnly("2026-09-01"), process: "washed", roastLevel: "light",
  }), parseDateOnly("2026-09-15"));
  expect(results.map(r => r.item.remaining_percent)).toEqual([null, 25]);
  expect(coffees).toHaveLength(3);
});

it("resolves subtype and wildcard overrides before falling back to the formula", () => {
  const row: ProfileOverrideRow = {
    id: "profile", created_at: "2026-09-01", updated_at: "2026-09-01", process: "washed", roast_level: "light", subtype: null,
    min_rest_days: 2, peak_start_days: 4, peak_end_days: 8, drinkable_end_days: 12, too_old_days: 15,
    confidence: "low", notes: "Override evidence",
  };
  const index = buildOverrideIndex([row, { ...row, subtype: "special", peak_start_days: 5 }]);
  const input = { roastDate: parseDateOnly("2026-09-01"), process: "washed" as const, roastLevel: "light" as const };
  const wildcard = calculateCoffeeWindow({ ...input, overrideProfile: resolveOverride(index, "washed", null, "light") });
  const exact = calculateCoffeeWindow({ ...input, overrideProfile: resolveOverride(index, "washed", "special", "light") });
  expect(wildcard.peakFrom).toEqual(parseDateOnly("2026-09-05"));
  expect(exact.peakFrom).toEqual(parseDateOnly("2026-09-06"));
  expect(exact).toMatchObject({ confidence: "low", notes: "Override evidence", source: "override" });
  expect(resolveOverride(index, "natural", null, "light")).toBeUndefined();
});

it("renders inclusive timeline durations and only shows Today within the plotted dates", () => {
  vi.useFakeTimers();
  const window = calculateCoffeeWindow({ roastDate: parseDateOnly("2026-09-01"), process: "washed", roastLevel: "light" });
  for (const date of ["2026-09-01", "2026-09-11", "2026-09-22", "2026-10-06"]) {
    vi.setSystemTime(parseDateOnly(date));
    const html = renderToStaticMarkup(createElement(Timeline, { window }));
    expect(html).toContain("Peak 12 days");
    expect(html).toContain(">Today</span>");
  }
  for (const date of ["2026-08-31", "2026-10-07", "2026-10-11", "2026-10-20"]) {
    vi.setSystemTime(parseDateOnly(date));
    expect(renderToStaticMarkup(createElement(Timeline, { window }))).not.toContain(">Today</span>");
  }
  expect(getCoffeeStatus(window, parseDateOnly("2026-09-22"))).toBe("peak");
  expect(statusLine(window, parseDateOnly("2026-09-23"))).toBe("Out of peak since Sep 23");
  expect(statusLine(window, parseDateOnly("2026-09-22"))).toBe("Day 12 of 12 in peak — 0 days left");
});

it.each(["2026-12-31", "2028-02-28"])("refreshes at local midnight and after a suspended tab resumes (%s)", (date) => {
  vi.useFakeTimers();
  const doc = Object.assign(new EventTarget(), { visibilityState: "visible" });
  vi.stubGlobal("document", doc);
  vi.setSystemTime(new Date(`${date}T23:59:59`));
  const onDay = vi.fn();
  const stop = watchCurrentDay(onDay);
  expect(onDay).toHaveBeenLastCalledWith(date);
  vi.advanceTimersByTime(1000);
  expect(onDay).toHaveBeenLastCalledWith(date === "2026-12-31" ? "2027-01-01" : "2028-02-29");
  vi.setSystemTime(new Date("2028-03-05T12:00:00"));
  doc.dispatchEvent(new Event("visibilitychange"));
  expect(onDay).toHaveBeenLastCalledWith("2028-03-05");
  expect(vi.getTimerCount()).toBe(1);
  stop();
  expect(vi.getTimerCount()).toBe(0);
  onDay.mockClear();
  doc.dispatchEvent(new Event("visibilitychange"));
  expect(onDay).not.toHaveBeenCalled();
});
