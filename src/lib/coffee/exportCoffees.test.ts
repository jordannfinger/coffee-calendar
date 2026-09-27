import { expect, it } from "vitest";
import { coffeesToCsv } from "./exportCoffees";
import type { CoffeeRow } from "./coffeeTypes";

it("keeps formula-like text literal while preserving numbers and CSV punctuation", () => {
  const row = {
    name: "=1+1",
    roaster: "+SUM(1,2)",
    origin: "-4",
    region: "@cmd",
    producer: "  \t=2+2",
    variety: "A,B",
    elevation_m: 1234,
    lot: 'He said "hi"',
    tasting_notes: "line\rbreak",
    notes: "line\nbreak",
    storage_method: "＝1+1",
  } as CoffeeRow;

  expect(coffeesToCsv([row])).toBe(
    'Name,Roaster,Origin,Region,Producer,Variety,Elevation (m),Lot,Tasting notes,Notes,Storage method\r\n' +
    '"\t=1+1","\t+SUM(1,2)","\t-4","\t@cmd","\t  \t=2+2","A,B",1234,"He said ""hi""","line\rbreak","line\nbreak","\t＝1+1"',
  );
});
