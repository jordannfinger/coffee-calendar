import type { Tables, TablesInsert } from "@/lib/supabase/database.types";
import type { Process, RoastLevel } from "./types";
import { optionalNumber, requiredText, validDate, ValidationError } from "./validation";
import { formatDateOnly, today } from "./dateUtils";
import { PROCESS_OPTIONS, ROAST_LEVEL_OPTIONS } from "./options";

export type CoffeeRow = Tables<"coffees">;
export type CoffeeInsert = TablesInsert<"coffees">;

/** Unknown quantities remain eligible; a finished bag stays in history only. */
export function hasCoffeeRemaining(coffee: Pick<CoffeeRow, "remaining_percent">): boolean {
  return coffee.remaining_percent !== 0;
}

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

function toTextOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function formValuesToInsert(values: CoffeeFormValues, userId: string): CoffeeInsert {
  if (!PROCESS_OPTIONS.some(option => option.value === values.process)) throw new ValidationError("Choose a valid process.");
  if (!ROAST_LEVEL_OPTIONS.some(option => option.value === values.roastLevel)) throw new ValidationError("Choose a valid roast level.");
  return {
    user_id: userId,
    name: requiredText(values.name, "Coffee name"),
    roaster: requiredText(values.roaster, "Roaster"),
    origin: requiredText(values.origin, "Origin"),
    roast_date: validDate(values.roastDate, "Roast date", formatDateOnly(today())),
    process: values.process,
    process_subtype: toTextOrNull(values.processSubtype),
    roast_level: values.roastLevel,
    order_date: values.orderDate.trim() ? validDate(values.orderDate, "Date ordered") : null,
    variety: toTextOrNull(values.variety),
    producer: toTextOrNull(values.producer),
    region: toTextOrNull(values.region),
    elevation_m: optionalNumber(values.elevationM, "Elevation", 0, 2147483647, true),
    lot: toTextOrNull(values.lot),
    harvest_year: optionalNumber(values.harvestYear, "Harvest year", 1, 9999, true),
    tasting_notes: toTextOrNull(values.tastingNotes),
    brew_method: toTextOrNull(values.brewMethod),
    grind_setting: toTextOrNull(values.grindSetting),
    recipe: toTextOrNull(values.recipe),
    dose_g: optionalNumber(values.doseG, "Dose", 0.1, 9999.9),
    water_g: optionalNumber(values.waterG, "Water", 0.1, 99999.9),
    notes: toTextOrNull(values.notes),
    rating: optionalNumber(values.rating, "Rating", 1, 5, true),
    bag_size_g: optionalNumber(values.bagSizeG, "Bag size", 0.1, 99999.9),
    remaining_percent: optionalNumber(values.remainingPercent, "Remaining percentage", 0, 100, true),
    storage_method: toTextOrNull(values.storageMethod),
    bag_opened_date: values.bagOpenedDate.trim() ? validDate(values.bagOpenedDate, "Bag opened date") : null,
  };
}
