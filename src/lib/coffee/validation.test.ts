import { expect, it } from "vitest";
import { EMPTY_COFFEE_FORM, formValuesToInsert } from "./coffeeTypes";

const valid = { ...EMPTY_COFFEE_FORM, name: "Coffee", roaster: "Roaster", origin: "Origin", roastDate: "2026-09-01" };

it.each([
  { name: "   " }, { roastDate: "2026-02-30" }, { roastDate: "2999-01-01" },
  { orderDate: "invalid" }, { bagOpenedDate: "2026-13-01" },
  { doseG: "12junk" }, { doseG: "Infinity" }, { doseG: "-1" }, { doseG: "0" },
  { waterG: "1e999" }, { bagSizeG: "100000" }, { elevationM: "1.5" },
  { harvestYear: "2026x" }, { rating: "3.5" }, { rating: "6" }, { remainingPercent: "101" },
])("rejects invalid coffee values before producing a write payload: %j", (change) => {
  expect(() => formValuesToInsert({ ...valid, ...change }, "owner")).toThrow();
});

it("preserves optional blanks as null and accepts complete decimal values", () => {
  const row = formValuesToInsert({ ...valid, doseG: " 18.5 ", waterG: "3e2", remainingPercent: "0" }, "owner");
  expect(row).toMatchObject({ dose_g: 18.5, water_g: 300, remaining_percent: 0, rating: null, order_date: null });
});
