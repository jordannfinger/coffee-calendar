import type { CoffeeInsert, CoffeeRow } from "./coffeeTypes";
import type { TablesInsert } from "@/lib/supabase/database.types";
import { formValuesToInsert, rowToFormValues } from "./coffeeTypes";
import { optionalNumber, validDate, ValidationError } from "./validation";

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

export interface ImportBrewLog {
  sourceId: string;
  sourceUserId: string;
  sourceCoffeeId: string;
  values: Omit<TablesInsert<"brew_logs">, "id" | "coffee_id" | "user_id">;
}

export interface ParsedBackup {
  coffees: ImportCoffee[];
  brewLogs: ImportBrewLog[];
  legacy: boolean;
}

function parseJson(text: string): unknown {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ValidationError("This file is not valid JSON.");
  }
  return parsed;
}

function parseCoffeeRows(parsed: unknown, userId: string, allowEmpty = false): ImportCoffee[] {
  if (!Array.isArray(parsed) || (!allowEmpty && parsed.length === 0) || parsed.length > 5000) {
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

function optionalText(value: unknown): string | null {
  return typeof value === "string" ? value.trim() || null : null;
}

function logNumber(value: unknown, label: string, min: number, max: number, integer = false): number | null {
  if (value !== undefined && value !== null && (typeof value !== "number" || !Number.isFinite(value))) {
    throw new ValidationError(`${label} must be a number.`);
  }
  return optionalNumber(value === undefined || value === null ? "" : String(value), label, min, max, integer);
}

function parseBrewLogs(parsed: unknown, coffees: ImportCoffee[]): ImportBrewLog[] {
  if (!Array.isArray(parsed) || parsed.length > 25000) {
    throw new ValidationError("The backup must contain no more than 25,000 brew logs.");
  }
  const owners = new Map(coffees.map(coffee => [coffee.sourceId, coffee.sourceUserId]));
  const seen = new Set<string>();
  return parsed.map((item: unknown, index): ImportBrewLog => {
    const rowNumber = index + 1;
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new ValidationError(`Brew ${rowNumber} is not a record.`);
    }
    const record = item as Record<string, unknown>;
    if (typeof record.id !== "string" || !UUID.test(record.id) ||
        typeof record.coffee_id !== "string" || !UUID.test(record.coffee_id) ||
        typeof record.user_id !== "string" || !UUID.test(record.user_id)) {
      throw new ValidationError(`Brew ${rowNumber} is missing valid export IDs.`);
    }
    const sourceId = record.id.toLowerCase();
    const sourceCoffeeId = record.coffee_id.toLowerCase();
    const sourceUserId = record.user_id.toLowerCase();
    if (seen.has(sourceId)) throw new ValidationError(`Brew ${rowNumber} repeats an export ID.`);
    seen.add(sourceId);
    if (owners.get(sourceCoffeeId) !== sourceUserId) {
      throw new ValidationError(`Brew ${rowNumber} does not belong to a coffee in this backup.`);
    }
    if (typeof record.brewed_at !== "string" || typeof record.locked !== "boolean") {
      throw new ValidationError(`Brew ${rowNumber} has an invalid date or locked value.`);
    }
    for (const key of ["brew_method", "grind_setting", "drawdown", "tasting_notes", "notes"]) {
      if (record[key] !== undefined && record[key] !== null && typeof record[key] !== "string") {
        throw new ValidationError(`Brew ${rowNumber} has an invalid ${key}.`);
      }
    }
    try {
      const values = {
        brewed_at: validDate(record.brewed_at, "Brew date"),
        brew_method: optionalText(record.brew_method),
        grind_setting: optionalText(record.grind_setting),
        dose_g: logNumber(record.dose_g, "Dose", 0.1, 9999.9),
        water_g: logNumber(record.water_g, "Water", 0.1, 99999.9),
        drawdown: optionalText(record.drawdown),
        rating: logNumber(record.rating, "Rating", 1, 5, true),
        tasting_notes: optionalText(record.tasting_notes),
        notes: optionalText(record.notes),
        locked: record.locked,
      };
      return { sourceId, sourceUserId, sourceCoffeeId, values };
    } catch (error) {
      if (error instanceof ValidationError) throw new ValidationError(`Brew ${rowNumber}: ${error.message}`);
      throw error;
    }
  });
}

/** Version 2 includes brews; older coffee-only JSON arrays remain valid. */
export function parseFullBackup(text: string, userId: string): ParsedBackup {
  const parsed = parseJson(text);
  if (Array.isArray(parsed)) return { coffees: parseCoffeeRows(parsed, userId), brewLogs: [], legacy: true };
  if (!parsed || typeof parsed !== "object" ||
      (parsed as Record<string, unknown>).format !== "coffee-calendar-backup" ||
      (parsed as Record<string, unknown>).version !== 2) {
    throw new ValidationError("Choose a Coffee Calendar JSON export or full backup.");
  }
  const backup = parsed as Record<string, unknown>;
  const coffees = parseCoffeeRows(backup.coffees, userId, true);
  const brewLogs = parseBrewLogs(backup.brew_logs, coffees);
  return { coffees, brewLogs, legacy: false };
}

/** A stable destination ID makes retries safe even across browsers and accounts. */
export async function destinationId(userId: string, sourceId: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${userId}:${sourceId}`)));
  bytes[6] = (bytes[6] & 0x0f) | 0x80; // UUID version 8 (application-defined hash)
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes.slice(0, 16), byte => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
