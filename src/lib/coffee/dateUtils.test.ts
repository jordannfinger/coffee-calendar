import { describe, expect, it } from "vitest";
import {
  addCalendarDays,
  differenceInCalendarDays,
  formatDateOnly,
  isAfterDay,
  isBeforeDay,
  isSameDay,
  parseDateOnly,
} from "./dateUtils";

describe("parseDateOnly / formatDateOnly", () => {
  it("round-trips a plain date string", () => {
    expect(formatDateOnly(parseDateOnly("2026-09-12"))).toBe("2026-09-12");
  });

  it("pads single-digit months and days", () => {
    expect(formatDateOnly(parseDateOnly("2026-01-05"))).toBe("2026-01-05");
  });
});

describe("addCalendarDays", () => {
  it("adds days within a month", () => {
    expect(formatDateOnly(addCalendarDays(parseDateOnly("2026-09-12"), 5))).toBe("2026-09-17");
  });

  it("rolls over a month boundary", () => {
    expect(formatDateOnly(addCalendarDays(parseDateOnly("2026-09-28"), 5))).toBe("2026-10-03");
  });

  it("rolls over a year boundary", () => {
    expect(formatDateOnly(addCalendarDays(parseDateOnly("2026-12-29"), 5))).toBe("2027-01-03");
  });

  it("handles subtracting days (negative input)", () => {
    expect(formatDateOnly(addCalendarDays(parseDateOnly("2026-09-03"), -5))).toBe("2026-08-29");
  });

  it("handles the Feb 29 leap day correctly (2028 is a leap year)", () => {
    expect(formatDateOnly(addCalendarDays(parseDateOnly("2028-02-27"), 3))).toBe("2028-03-01");
    expect(formatDateOnly(addCalendarDays(parseDateOnly("2028-02-25"), 4))).toBe("2028-02-29");
  });

  it("skips Feb 29 correctly in a non-leap year (2026)", () => {
    expect(formatDateOnly(addCalendarDays(parseDateOnly("2026-02-27"), 3))).toBe("2026-03-02");
  });
});

describe("differenceInCalendarDays", () => {
  it("computes a simple forward difference", () => {
    expect(differenceInCalendarDays(parseDateOnly("2026-09-12"), parseDateOnly("2026-09-19"))).toBe(7);
  });

  it("computes a negative difference when b is before a", () => {
    expect(differenceInCalendarDays(parseDateOnly("2026-09-19"), parseDateOnly("2026-09-12"))).toBe(-7);
  });

  it("is zero for the same day", () => {
    expect(differenceInCalendarDays(parseDateOnly("2026-09-12"), parseDateOnly("2026-09-12"))).toBe(0);
  });

  it("spans a leap day correctly", () => {
    expect(differenceInCalendarDays(parseDateOnly("2028-02-28"), parseDateOnly("2028-03-01"))).toBe(2);
  });

  it("spans a year boundary", () => {
    expect(differenceInCalendarDays(parseDateOnly("2026-12-30"), parseDateOnly("2027-01-02"))).toBe(3);
  });
});

describe("isBeforeDay / isAfterDay / isSameDay", () => {
  it("compares two dates correctly", () => {
    const a = parseDateOnly("2026-09-12");
    const b = parseDateOnly("2026-09-19");
    expect(isBeforeDay(a, b)).toBe(true);
    expect(isAfterDay(b, a)).toBe(true);
    expect(isSameDay(a, a)).toBe(true);
    expect(isBeforeDay(a, a)).toBe(false);
  });
});
