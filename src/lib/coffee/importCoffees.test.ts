import { expect, it } from "vitest";
import { destinationId, parseCoffeeImport } from "./importCoffees";
import { ValidationError } from "./validation";

const owner = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const source = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const row = {
  id: source,
  user_id: owner,
  name: "Test Coffee",
  roaster: "Test Roaster",
  origin: "Ethiopia",
  roast_date: "2026-09-01",
  process: "washed",
  roast_level: "light",
  remaining_percent: 40,
  share_token: "old-public-token",
  notes: "Private note",
};

it("validates an export and drops ownership, timestamps and share links from inserts", () => {
  const imported = parseCoffeeImport(JSON.stringify([row]), owner);
  expect(imported).toHaveLength(1);
  expect(imported[0].values).toMatchObject({ user_id: owner, name: "Test Coffee", remaining_percent: 40, notes: "Private note" });
  expect(imported[0].values).not.toHaveProperty("share_token");
  expect(imported[0].values).not.toHaveProperty("id");
});

it("rejects the whole file when a later coffee is invalid", () => {
  expect(() => parseCoffeeImport(JSON.stringify([row, { ...row, id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", remaining_percent: 101 }]), owner))
    .toThrow(/Coffee 2: Remaining percentage must be between 0 and 100/);
  expect(() => parseCoffeeImport(JSON.stringify([{ ...row, id: "not a UUID" }]), owner)).toThrow(ValidationError);
  expect(() => parseCoffeeImport(JSON.stringify([row, row]), owner)).toThrow(/repeats an export ID/);
});

it("maps each exported ID to a stable UUID for safe retries", async () => {
  const first = await destinationId(owner, source);
  expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  expect(await destinationId(owner, source)).toBe(first);
  expect(await destinationId("dddddddd-dddd-4ddd-8ddd-dddddddddddd", source)).not.toBe(first);
});
