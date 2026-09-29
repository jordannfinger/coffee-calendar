import type { CoffeeRow } from "./coffeeTypes";
import type { BrewLogRow } from "./useBrewLogs";
import { createClient } from "@/lib/supabase/client";
import { fetchAllPages } from "./fetchAllPages";

const EXPORT_COLUMNS: Array<{ key: keyof CoffeeRow; header: string }> = [
  { key: "name", header: "Name" },
  { key: "roaster", header: "Roaster" },
  { key: "origin", header: "Origin" },
  { key: "region", header: "Region" },
  { key: "producer", header: "Producer" },
  { key: "variety", header: "Variety" },
  { key: "elevation_m", header: "Elevation (m)" },
  { key: "lot", header: "Lot" },
  { key: "harvest_year", header: "Harvest year" },
  { key: "process", header: "Process" },
  { key: "process_subtype", header: "Process subtype" },
  { key: "roast_level", header: "Roast level" },
  { key: "roast_date", header: "Roast date" },
  { key: "order_date", header: "Order date" },
  { key: "tasting_notes", header: "Tasting notes" },
  { key: "brew_method", header: "Brew method" },
  { key: "grind_setting", header: "Grind setting" },
  { key: "recipe", header: "Recipe" },
  { key: "dose_g", header: "Dose (g)" },
  { key: "water_g", header: "Water (g)" },
  { key: "bag_size_g", header: "Bag size (g)" },
  { key: "remaining_percent", header: "Remaining (%)" },
  { key: "rating", header: "Rating" },
  { key: "notes", header: "Notes" },
  { key: "storage_method", header: "Storage method" },
  { key: "bag_opened_date", header: "Bag opened date" },
];

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  // Excel can re-activate single-quote-escaped formulas after save/reopen.
  // A quoted leading tab keeps formula-like text literal in spreadsheet exports.
  const formula = typeof value === "string" && /^[\s\x00-\x1f]*[=+\-@＝＋－＠]/u.test(text);
  const literal = formula ? `\t${text}` : text;
  return formula || /[",\r\n]/.test(literal) ? `"${literal.replace(/"/g, '""')}"` : literal;
}

export function coffeesToCsv(coffees: CoffeeRow[]): string {
  const columns = EXPORT_COLUMNS.filter((col) => coffees.some((c) => col.key in c));
  const header = columns.map((col) => csvCell(col.header)).join(",");
  const rows = coffees.map((coffee) => columns.map((col) => csvCell(coffee[col.key])).join(","));
  return [header, ...rows].join("\r\n");
}

export function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  // Keep the anchor and its blob URL alive while the browser starts the download.
  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 60_000);
}

export function exportCoffeesAsCsv(coffees: CoffeeRow[]) {
  downloadTextFile(`coffee-calendar-export-${new Date().toISOString().slice(0, 10)}.csv`, coffeesToCsv(coffees), "text/csv;charset=utf-8");
}

export function fullBackupJson(coffees: CoffeeRow[], brewLogs: BrewLogRow[]): string {
  return JSON.stringify({
    format: "coffee-calendar-backup",
    version: 2,
    exported_at: new Date().toISOString(),
    coffees: coffees.map(coffee => ({ ...coffee, share_token: undefined })),
    brew_logs: brewLogs,
  }, null, 2);
}

/** Fetch fresh, complete owner data before downloading, so stale UI state cannot truncate a backup. */
export async function downloadFullBackup(userId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || user?.id !== userId) throw new Error("Couldn't verify your session. Please try again.");

  const coffees = await fetchAllPages<CoffeeRow>(async (from, to) => {
    const { data, count, error } = await supabase.from("coffees")
      .select("*", { count: "exact" }).eq("user_id", userId).order("id").range(from, to);
    return { data, count, error };
  });
  const brewLogs = await fetchAllPages<BrewLogRow>(async (from, to) => {
    const { data, count, error } = await supabase.from("brew_logs")
      .select("*", { count: "exact" }).eq("user_id", userId).order("id").range(from, to);
    return { data, count, error };
  });
  const coffeeIds = new Set(coffees.map(coffee => coffee.id));
  if (brewLogs.some(log => !coffeeIds.has(log.coffee_id))) {
    throw new Error("The backup data changed while downloading. Please try again.");
  }
  const { data: { user: currentUser }, error: finalAuthError } = await supabase.auth.getUser();
  if (finalAuthError || currentUser?.id !== userId) {
    throw new Error("Your session changed while downloading. Please try again.");
  }
  downloadTextFile(`coffee-calendar-backup-${new Date().toISOString().slice(0, 10)}.json`, fullBackupJson(coffees, brewLogs), "application/json");
}
