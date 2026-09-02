import type { Tables, TablesInsert } from "@/lib/supabase/database.types";
import type { Process, RoastLevel } from "./types";

export type CoffeeRow = Tables<"coffees">;
export type CoffeeInsert = TablesInsert<"coffees">;

/** Form-friendly shape: every optional field is a string (possibly empty) for controlled inputs. */
export interface CoffeeFormValues {
  name: string;
  roaster: string;
  origin: string;
  roastDate: string;
  process: Process;
  processSubtype: string;
  roastLevel: RoastLevel;
  orderDate: string;
  variety: string;
  producer: string;
  region: string;
  elevationM: string;
  lot: string;
  harvestYear: string;
  tastingNotes: string;
  brewMethod: string;
  grindSetting: string;
  recipe: string;
  doseG: string;
  waterG: string;
  notes: string;
  rating: string;
  bagSizeG: string;
  remainingPercent: string;
  storageMethod: string;
  bagOpenedDate: string;
}

export const EMPTY_COFFEE_FORM: CoffeeFormValues = {
  name: "",
  roaster: "",
  origin: "",
  roastDate: "",
  process: "washed",
  processSubtype: "",
  roastLevel: "light",
  orderDate: "",
  variety: "",
  producer: "",
  region: "",
  elevationM: "",
  lot: "",
  harvestYear: "",
  tastingNotes: "",
  brewMethod: "",
  grindSetting: "",
  recipe: "",
  doseG: "",
  waterG: "",
  notes: "",
  rating: "",
  bagSizeG: "",
  remainingPercent: "",
  storageMethod: "",
  bagOpenedDate: "",
};

function toStr(value: string | number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

export function rowToFormValues(row: CoffeeRow): CoffeeFormValues {
  return {
    name: row.name,
    roaster: row.roaster,
    origin: row.origin,
    roastDate: row.roast_date,
    process: row.process,
    processSubtype: row.process_subtype ?? "",
    roastLevel: row.roast_level,
    orderDate: row.order_date ?? "",
    variety: row.variety ?? "",
    producer: row.producer ?? "",
    region: row.region ?? "",
    elevationM: toStr(row.elevation_m),
    lot: row.lot ?? "",
    harvestYear: toStr(row.harvest_year),
    tastingNotes: row.tasting_notes ?? "",
    brewMethod: row.brew_method ?? "",
    grindSetting: row.grind_setting ?? "",
    recipe: row.recipe ?? "",
    doseG: toStr(row.dose_g),
    waterG: toStr(row.water_g),
    notes: row.notes ?? "",
    rating: toStr(row.rating),
    bagSizeG: toStr(row.bag_size_g),
    remainingPercent: toStr(row.remaining_percent),
    storageMethod: row.storage_method ?? "",
    bagOpenedDate: row.bag_opened_date ?? "",
  };
}

function toIntOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNumberOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function toTextOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function formValuesToInsert(values: CoffeeFormValues, userId: string): CoffeeInsert {
  return {
    user_id: userId,
    name: values.name.trim(),
    roaster: values.roaster.trim(),
    origin: values.origin.trim(),
    roast_date: values.roastDate,
    process: values.process,
    process_subtype: toTextOrNull(values.processSubtype),
    roast_level: values.roastLevel,
    order_date: toTextOrNull(values.orderDate),
    variety: toTextOrNull(values.variety),
    producer: toTextOrNull(values.producer),
    region: toTextOrNull(values.region),
    elevation_m: toIntOrNull(values.elevationM),
    lot: toTextOrNull(values.lot),
    harvest_year: toIntOrNull(values.harvestYear),
    tasting_notes: toTextOrNull(values.tastingNotes),
    brew_method: toTextOrNull(values.brewMethod),
    grind_setting: toTextOrNull(values.grindSetting),
    recipe: toTextOrNull(values.recipe),
    dose_g: toNumberOrNull(values.doseG),
    water_g: toNumberOrNull(values.waterG),
    notes: toTextOrNull(values.notes),
    rating: toIntOrNull(values.rating),
    bag_size_g: toNumberOrNull(values.bagSizeG),
    remaining_percent: toIntOrNull(values.remainingPercent),
    storage_method: toTextOrNull(values.storageMethod),
    bag_opened_date: toTextOrNull(values.bagOpenedDate),
  };
}
