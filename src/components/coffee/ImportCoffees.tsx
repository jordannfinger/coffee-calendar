"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { destinationId, parseCoffeeImport, type ImportCoffee } from "@/lib/coffee/importCoffees";
import { fetchAllPages } from "@/lib/coffee/fetchAllPages";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function ImportCoffees({ userId, refresh, disabled = false }: { userId: string; refresh: () => void | Promise<void>; disabled?: boolean }) {
  const [selected, setSelected] = useState<{ name: string; coffees: ImportCoffee[] } | null>(null);
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
    if (file.size > 8 * 1024 * 1024) {
      setMessage("Choose a JSON export smaller than 8 MB.");
      return;
    }
    try {
      const coffees = parseCoffeeImport(await file.text(), userId);
      if (version === selectionVersion.current) setSelected({ name: file.name, coffees });
    } catch (error) {
      if (version === selectionVersion.current) setMessage(error instanceof Error ? error.message : "Couldn't read that export.");
    }
  }

  async function importSelected() {
    if (!selected || pending.current || disabled) return;
    pending.current = true;
    setBusy(true);
    setMessage(null);
    let imported = 0;
    let skipped = 0;
    try {
      const supabase = createClient();
      const existing = await fetchAllPages<{ id: string }>(async (from, to) => {
        const { data, count, error } = await supabase.from("coffees")
          .select("id", { count: "exact" }).eq("user_id", userId).order("id").range(from, to);
        return { data, count, error };
      });
      const existingIds = new Set(existing.map(row => row.id.toLowerCase()));
      const ready = await Promise.all(selected.coffees.map(async coffee => ({
        ...coffee,
        destinationId: await destinationId(userId, coffee.sourceId),
      })));
      const inserts = [];
      for (const coffee of ready) {
        if ((existingIds.has(coffee.sourceId) && coffee.sourceUserId === userId) ||
            existingIds.has(coffee.destinationId)) {
          skipped++;
        } else {
          inserts.push({ ...coffee.values, id: coffee.destinationId });
        }
      }
      for (let index = 0; index < inserts.length; index += 50) {
        const batch = inserts.slice(index, index + 50);
        const { error } = await supabase.from("coffees").insert(batch);
        if (error) throw new Error("The import stopped before all coffees were saved. You can retry the same file safely.");
        imported += batch.length;
      }
      setMessage(`${imported} coffee${imported === 1 ? "" : "s"} imported; ${skipped} already present. Brew logs and old share links are not included in JSON exports.`);
      setSelected(null);
      if (input.current) input.current.value = "";
    } catch (error) {
      setMessage(`${imported} imported before an error. ${error instanceof Error ? error.message : "Please try again."}`);
    } finally {
      if (imported > 0) await refresh();
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <Card className="mb-6 flex flex-col gap-3" aria-labelledby="import-coffees-heading">
      <div>
        <h2 id="import-coffees-heading" className="font-display text-lg font-semibold">Restore from JSON</h2>
        <p className="mt-1 text-sm text-foreground-muted">Add coffees from a Coffee Calendar JSON export. Existing coffees stay as they are; repeat imports are skipped. Brew logs and share links are not restored.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="coffee-import-file" className="text-sm font-medium">JSON export</label>
        <input ref={input} id="coffee-import-file" type="file" accept=".json,application/json" disabled={busy || disabled}
          onChange={event => void chooseFile(event.target.files?.[0])}
          className="max-w-full text-sm file:mr-3 file:rounded-lg file:border file:border-border file:bg-background file:px-3 file:py-2" />
        {selected && <Button onClick={() => void importSelected()} disabled={busy || disabled}>
          {busy ? "Importing…" : `Import ${selected.coffees.length} coffee${selected.coffees.length === 1 ? "" : "s"}`}
        </Button>}
      </div>
      {selected && <p className="text-sm text-foreground-muted">Ready to add from {selected.name}. Nothing is saved until you choose Import.</p>}
      {message && <p role="status" className="text-sm">{message}</p>}
    </Card>
  );
}
