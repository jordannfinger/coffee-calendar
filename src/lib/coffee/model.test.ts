import { expect, it } from "vitest";
import defaults from "../../../docs/coffee-development-defaults.json";
import { computeProfile } from "./model";
import type { Process, RoastLevel } from "./types";

it("matches all 60 documented milestone and confidence combinations", () => {
  expect(defaults).toHaveLength(60);
  for (const { process, roastLevel, minRestDays, peakStartDays, peakEndDays, drinkableEndDays, tooOldDays, confidence } of defaults) {
    const expected = { minRestDays, peakStartDays, peakEndDays, drinkableEndDays, tooOldDays, confidence };
    expect(computeProfile(process as Process, roastLevel as RoastLevel), `${process}/${roastLevel}`).toMatchObject(expected);
  }
});
