import { describe, expect, it } from "vitest";
import { fetchAllPages } from "./fetchAllPages";

describe("fetchAllPages", () => {
  it("loads every row when the API caps responses below the requested range", async () => {
    const source = Array.from({ length: 1203 }, (_, id) => id);
    const ranges: Array<[number, number]> = [];
    const rows = await fetchAllPages(async (from, to) => {
      ranges.push([from, to]);
      return { data: source.slice(from, Math.min(to + 1, from + 200)), count: source.length, error: null };
    });

    expect(rows).toEqual(source);
    expect(ranges[0]).toEqual([0, 499]);
    expect(ranges.at(-1)).toEqual([1200, 1699]);
  });

  it("rejects a failed later page instead of returning an incomplete inventory", async () => {
    await expect(fetchAllPages(async (from) => from === 0
      ? { data: [1], count: 2, error: null }
      : { data: null, count: null, error: new Error("network") }, 1)).rejects.toThrow("network");
  });

  it("rejects an empty page when the exact count says rows remain", async () => {
    await expect(fetchAllPages(async () => ({ data: [], count: 1, error: null }))).rejects.toThrow("Incomplete inventory response");
  });
});
