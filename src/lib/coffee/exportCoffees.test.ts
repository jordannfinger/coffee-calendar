import { expect, it } from "vitest";
import { coffeesToCsv, fullBackupJson } from "./exportCoffees";
import type { CoffeeRow } from "./coffeeTypes";
import type { BrewLogRow } from "./useBrewLogs";

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

it("includes brew history without exporting active share links", () => {
  const coffee = { id: "coffee-id", user_id: "owner-id", name: "Coffee", share_token: "active-link" } as CoffeeRow;
  const brew = { id: "brew-id", coffee_id: "coffee-id", notes: "Sweet cup" } as BrewLogRow;
  const backup = JSON.parse(fullBackupJson([coffee], [brew]));
  expect(backup).toMatchObject({ format: "coffee-calendar-backup", version: 2 });
  expect(backup.coffees[0]).not.toHaveProperty("share_token");
  expect(backup.brew_logs[0]).toMatchObject({ coffee_id: "coffee-id", notes: "Sweet cup" });
});
