import type { DevelopmentProfile, Process, RoastLevel } from "./types";
import type { Tables } from "@/lib/supabase/database.types";

export type ProfileOverrideRow = Tables<"process_profiles">;

/** Index keyed by `process|subtype|roastLevel`, with `subtype` empty for wildcard rows. */
export type ProfileOverrideIndex = Map<string, DevelopmentProfile>;

function key(process: string, subtype: string | null | undefined, roastLevel: string): string {
  return `${process}|${subtype ?? ""}|${roastLevel}`;
}

export function buildOverrideIndex(rows: ProfileOverrideRow[]): ProfileOverrideIndex {
  const index: ProfileOverrideIndex = new Map();
  for (const row of rows) {
    index.set(key(row.process, row.subtype, row.roast_level), {
      minRestDays: row.min_rest_days,
      peakStartDays: row.peak_start_days,
      peakEndDays: row.peak_end_days,
      drinkableEndDays: row.drinkable_end_days,
      tooOldDays: row.too_old_days,
      confidence: row.confidence,
      notes: row.notes ?? "",
      source: "override",
    });
  }
  return index;
}

/** Looks up an override, preferring an exact subtype match over the subtype-wildcard row. */
export function resolveOverride(
  index: ProfileOverrideIndex | undefined,
  process: Process,
  subtype: string | null | undefined,
  roastLevel: RoastLevel,
): DevelopmentProfile | undefined {
  if (!index) return undefined;
  if (subtype) {
    const exact = index.get(key(process, subtype, roastLevel));
    if (exact) return exact;
  }
  return index.get(key(process, null, roastLevel));
}
