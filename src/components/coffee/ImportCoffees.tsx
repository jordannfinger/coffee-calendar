"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { destinationId, parseFullBackup, type ParsedBackup } from "@/lib/coffee/importCoffees";
import { fetchAllPages } from "@/lib/coffee/fetchAllPages";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

function quantity(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function ImportCoffees({ userId, refresh, disabled = false }: { userId: string; refresh: () => void | Promise<void>; disabled?: boolean }) {
  const [selected, setSelected] = useState<{ name: string; backup: ParsedBackup } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const selectionVersion = useRef(0);

  async function chooseFile(file: File | undefined) {
    const version = ++selectionVersion.current;
    setSelected(null);
    setMessage(null);
    if (!file) return;
    if (file.size > 32 * 1024 * 1024) {
      setMessage("Choose a JSON backup smaller than 32 MB.");
      return;
    }
    try {
      const backup = parseFullBackup(await file.text(), userId);
      if (version === selectionVersion.current) setSelected({ name: file.name, backup });
    } catch (error) {
      if (version === selectionVersion.current) setMessage(error instanceof Error ? error.message : "Couldn't read that export.");
    }
  }

  async function importSelected() {
    if (!selected || pending.current || disabled) return;
    pending.current = true;
    setBusy(true);
    setMessage(null);
    let importedCoffees = 0;
    let skippedCoffees = 0;
    let importedBrews = 0;
    let skippedBrews = 0;
    try {
      const supabase = createClient();
      const existing = await fetchAllPages<{ id: string }>(async (from, to) => {
        const { data, count, error } = await supabase.from("coffees")
          .select("id", { count: "exact" }).eq("user_id", userId).order("id").range(from, to);
        return { data, count, error };
      });
      const existingIds = new Set(existing.map(row => row.id.toLowerCase()));
      const ready = await Promise.all(selected.backup.coffees.map(async coffee => ({
        ...coffee,
        destinationId: await destinationId(userId, coffee.sourceId),
      })));
      const coffeeIds = new Map<string, string>();
      const inserts = [];
      for (const coffee of ready) {
        if (existingIds.has(coffee.sourceId) && coffee.sourceUserId === userId) {
          coffeeIds.set(coffee.sourceId, coffee.sourceId);
          skippedCoffees++;
        } else if (existingIds.has(coffee.destinationId)) {
          coffeeIds.set(coffee.sourceId, coffee.destinationId);
          skippedCoffees++;
        } else {
          coffeeIds.set(coffee.sourceId, coffee.destinationId);
          inserts.push({ ...coffee.values, id: coffee.destinationId });
        }
      }
      for (let index = 0; index < inserts.length; index += 50) {
        const batch = inserts.slice(index, index + 50);
        const { error } = await supabase.from("coffees").insert(batch);
        if (error) throw new Error("The import stopped before all coffees were saved. You can retry the same file safely.");
        importedCoffees += batch.length;
      }

      if (selected.backup.brewLogs.length > 0) {
        const existingBrews = await fetchAllPages<{ id: string }>(async (from, to) => {
          const { data, count, error } = await supabase.from("brew_logs")
            .select("id", { count: "exact" }).eq("user_id", userId).order("id").range(from, to);
          return { data, count, error };
        });
        const existingBrewIds = new Set(existingBrews.map(row => row.id.toLowerCase()));
        const readyBrews = await Promise.all(selected.backup.brewLogs.map(async brew => ({
          ...brew,
          destinationId: await destinationId(userId, brew.sourceId),
        })));
        const brewInserts = [];
        for (const brew of readyBrews) {
          const coffeeId = coffeeIds.get(brew.sourceCoffeeId);
          if (!coffeeId) throw new Error("A brew's coffee could not be restored. You can retry this file safely.");
          if ((brew.sourceUserId === userId && existingBrewIds.has(brew.sourceId)) ||
              existingBrewIds.has(brew.destinationId)) {
            skippedBrews++;
          } else {
            brewInserts.push({ ...brew.values, id: brew.destinationId, coffee_id: coffeeId, user_id: userId });
          }
        }
        for (let index = 0; index < brewInserts.length; index += 50) {
          const batch = brewInserts.slice(index, index + 50);
          const { error } = await supabase.from("brew_logs").insert(batch);
          if (error) throw new Error("The import stopped before all brews were saved. You can retry this file safely.");
          importedBrews += batch.length;
        }
      }
      const summary = `${quantity(importedCoffees, "coffee", "coffees")} and ${quantity(importedBrews, "brew", "brews")} imported; ${quantity(skippedCoffees, "coffee", "coffees")} and ${quantity(skippedBrews, "brew", "brews")} already present.`;
      setMessage(selected.backup.legacy ? `${summary} Older coffee-only exports do not contain brew logs.` : `${summary} Old share links are not restored.`);
      setSelected(null);
      if (input.current) input.current.value = "";
    } catch (error) {
      setMessage(`${quantity(importedCoffees, "coffee", "coffees")} and ${quantity(importedBrews, "brew", "brews")} imported before an error. ${error instanceof Error ? error.message : "Please try again."}`);
    } finally {
      if (importedCoffees > 0) await refresh();
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <Card className="mb-6 flex flex-col gap-3" aria-labelledby="import-coffees-heading">
      <div>
        <h2 id="import-coffees-heading" className="font-display text-lg font-semibold">Restore from JSON</h2>
        <p className="mt-1 text-sm text-foreground-muted">Add coffees and brew history from a Coffee Calendar backup, or use an older coffee-only JSON export. Existing records stay as they are; repeat imports are skipped. Old share links are not restored.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="coffee-import-file" className="text-sm font-medium">JSON backup or export</label>
        <input ref={input} id="coffee-import-file" type="file" accept=".json,application/json" disabled={busy || disabled}
          onChange={event => void chooseFile(event.target.files?.[0])}
          className="max-w-full text-sm file:mr-3 file:rounded-lg file:border file:border-border file:bg-background file:px-3 file:py-2" />
        {selected && <Button onClick={() => void importSelected()} disabled={busy || disabled}>
          {busy ? "Importing…" : `Import ${quantity(selected.backup.coffees.length, "coffee", "coffees")} and ${quantity(selected.backup.brewLogs.length, "brew", "brews")}`}
        </Button>}
      </div>
      {selected && <p className="text-sm text-foreground-muted">Ready to add from {selected.name}. Nothing is saved until you choose Import.</p>}
      {message && <p role="status" className="text-sm">{message}</p>}
    </Card>
  );
}
