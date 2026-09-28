import type { CoffeeInsert, CoffeeRow } from "./coffeeTypes";
import { formValuesToInsert, rowToFormValues } from "./coffeeTypes";
import { ValidationError } from "./validation";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REQUIRED_TEXT = ["name", "roaster", "origin", "roast_date", "process", "roast_level"] as const;
const OPTIONAL_TEXT = [
  "region", "producer", "variety", "lot", "process_subtype", "order_date", "tasting_notes",
  "brew_method", "grind_setting", "recipe", "notes", "storage_method", "bag_opened_date",
] as const;
const OPTIONAL_NUMBER = [
  "elevation_m", "harvest_year", "dose_g", "water_g", "bag_size_g", "remaining_percent", "rating",
] as const;

export interface ImportCoffee {
  sourceId: string;
  sourceUserId: string;
  values: CoffeeInsert;
}

/** Accept only the JSON array produced by Coffee Calendar's coffee export. */
export function parseCoffeeImport(text: string, userId: string): ImportCoffee[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ValidationError("This file is not valid JSON.");
  }
  if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 5000) {
    throw new ValidationError("Choose a Coffee Calendar JSON export containing 1–5,000 coffees.");
  }

  const seen = new Set<string>();
  return parsed.map((item: unknown, index): ImportCoffee => {
    const rowNumber = index + 1;
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new ValidationError(`Coffee ${rowNumber} is not a record.`);
    }
    const record = item as Record<string, unknown>;
    if (typeof record.id !== "string" || !UUID.test(record.id) ||
        typeof record.user_id !== "string" || !UUID.test(record.user_id)) {
      throw new ValidationError(`Coffee ${rowNumber} is missing a valid export ID.`);
    }
    const sourceId = record.id.toLowerCase();
    if (seen.has(sourceId)) throw new ValidationError(`Coffee ${rowNumber} repeats an export ID.`);
    seen.add(sourceId);

    for (const key of REQUIRED_TEXT) {
      if (typeof record[key] !== "string") throw new ValidationError(`Coffee ${rowNumber} has an invalid ${key}.`);
    }
    for (const key of OPTIONAL_TEXT) {
      if (record[key] !== undefined && record[key] !== null && typeof record[key] !== "string") {
        throw new ValidationError(`Coffee ${rowNumber} has an invalid ${key}.`);
      }
    }
    for (const key of OPTIONAL_NUMBER) {
      if (record[key] !== undefined && record[key] !== null &&
          (typeof record[key] !== "number" || !Number.isFinite(record[key]))) {
        throw new ValidationError(`Coffee ${rowNumber} has an invalid ${key}.`);
      }
    }

    try {
      // The ordinary form validator enforces dates, enum values and numeric ranges.
      // IDs, ownership, timestamps and share tokens from the file are never trusted as insert values.
      const values = formValuesToInsert(rowToFormValues(record as CoffeeRow), userId);
      return { sourceId, sourceUserId: record.user_id.toLowerCase(), values };
    } catch (error) {
      if (error instanceof ValidationError) throw new ValidationError(`Coffee ${rowNumber}: ${error.message}`);
      throw error;
    }
  });
}

/** A stable destination ID makes retries safe even across browsers and accounts. */
export async function destinationId(userId: string, sourceId: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${userId}:${sourceId}`)));
  bytes[6] = (bytes[6] & 0x0f) | 0x80; // UUID version 8 (application-defined hash)
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes.slice(0, 16), byte => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
