"use client";

import { useRef, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useBrewLogs, type BrewLogRow } from "@/lib/coffee/useBrewLogs";
import { formatLong, parseDateOnly, today, formatDateOnly } from "@/lib/coffee/dateUtils";
import { useToday } from "@/lib/coffee/useToday";
import { optionalNumber, validDate, ValidationError } from "@/lib/coffee/validation";
import { ResourceError } from "@/components/ui/ResourceError";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, baseInputClasses } from "@/components/ui/Field";

function emptyForm() {
  return {
    brewedAt: formatDateOnly(today()),
    brewMethod: "",
    grindSetting: "",
    doseG: "",
    waterG: "",
    drawdown: "",
    rating: "",
    tastingNotes: "",
    notes: "",
    locked: false,
  };
}

function BrewLogItem({ log }: { log: BrewLogRow }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border py-3 text-sm last:border-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{formatLong(parseDateOnly(log.brewed_at))}</span>
        {log.locked && (
          <span className="rounded-full border border-status-drinkable-border bg-status-drinkable-bg px-2 py-0.5 text-xs font-medium text-status-drinkable-text">
            Locked
          </span>
        )}
        {log.rating && <span className="text-foreground-muted">{"★".repeat(log.rating)}</span>}
      </div>
      <p className="text-foreground-muted">
        {[log.brew_method, log.grind_setting, log.dose_g && log.water_g ? `${log.dose_g}g:${log.water_g}g` : null, log.drawdown]
          .filter(Boolean)
          .join(" · ")}
      </p>
      {log.tasting_notes && <p className="text-foreground">{log.tasting_notes}</p>}
      {log.notes && <p className="text-foreground-muted">{log.notes}</p>}
    </div>
  );
}

export function BrewLogSection({ coffeeId }: { coffeeId: string }) {
  const now = useToday();
  const { logs, loading, error: loadError, refresh } = useBrewLogs(coffeeId);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const draftId = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ReturnType<typeof emptyForm>>(key: K, value: ReturnType<typeof emptyForm>[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setError(null);
    setSaving(true);
    try {
      const values = {
        brewed_at: validDate(form.brewedAt, "Brew date", formatDateOnly(today())),
        dose_g: optionalNumber(form.doseG, "Dose", 0.1, 9999.9),
        water_g: optionalNumber(form.waterG, "Water", 0.1, 99999.9),
        rating: optionalNumber(form.rating, "Rating", 1, 5, true),
      };
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setError("Couldn't verify your session. Your draft is preserved; please try again.");
        return;
      }
      const { data, error } = await supabase.from("brew_logs").upsert({
        ...values,
        id: draftId.current ??= crypto.randomUUID(),
        coffee_id: coffeeId,
        user_id: user.id,
        brew_method: form.brewMethod.trim() || null,
        grind_setting: form.grindSetting.trim() || null,
        drawdown: form.drawdown.trim() || null,
        tasting_notes: form.tastingNotes.trim() || null,
        notes: form.notes.trim() || null,
        locked: form.locked,
      }, { onConflict: "id" }).select("id").single();
      if (error || !data) throw new Error("Save not confirmed");
      draftId.current = null;
      setForm(emptyForm());
      setShowForm(false);
      await refresh();
    } catch (cause) {
      setError(cause instanceof ValidationError ? cause.message : "Couldn't confirm the save. Your draft is preserved; check the brew log before retrying.");
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Brew log</h2>
        <Button variant="secondary" size="sm" disabled={saving} onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ Log a brew"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-surface-muted p-4">
          <fieldset disabled={saving} className="contents">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Date" htmlFor="bl-date">
              <input id="bl-date" type="date" required className={baseInputClasses} value={form.brewedAt} onChange={(e) => set("brewedAt", e.target.value)} max={formatDateOnly(now)} />
            </Field>
            <Field label="Brew method" htmlFor="bl-method">
              <input id="bl-method" className={baseInputClasses} value={form.brewMethod} onChange={(e) => set("brewMethod", e.target.value)} placeholder="V60" />
            </Field>
            <Field label="Grind setting" htmlFor="bl-grind">
              <input id="bl-grind" className={baseInputClasses} value={form.grindSetting} onChange={(e) => set("grindSetting", e.target.value)} placeholder="7.0" />
            </Field>
            <Field label="Dose (g)" htmlFor="bl-dose">
              <input id="bl-dose" type="number" min={0.1} max={9999.9} inputMode="decimal" step="0.1" className={baseInputClasses} value={form.doseG} onChange={(e) => set("doseG", e.target.value)} />
            </Field>
            <Field label="Water (g)" htmlFor="bl-water">
              <input id="bl-water" type="number" min={0.1} max={99999.9} inputMode="decimal" step="0.1" className={baseInputClasses} value={form.waterG} onChange={(e) => set("waterG", e.target.value)} />
            </Field>
            <Field label="Drawdown" htmlFor="bl-drawdown">
              <input id="bl-drawdown" className={baseInputClasses} value={form.drawdown} onChange={(e) => set("drawdown", e.target.value)} placeholder="3:20" />
            </Field>
          </div>
          <Field label="Tasting notes" htmlFor="bl-tasting">
            <input id="bl-tasting" className={baseInputClasses} value={form.tastingNotes} onChange={(e) => set("tastingNotes", e.target.value)} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Rating (1–5)" htmlFor="bl-rating">
              <input id="bl-rating" type="number" min={1} max={5} className={baseInputClasses} value={form.rating} onChange={(e) => set("rating", e.target.value)} />
            </Field>
            <label className="flex items-center gap-2 pt-6 text-sm font-medium">
              <input type="checkbox" checked={form.locked} onChange={(e) => set("locked", e.target.checked)} className="h-4 w-4 rounded border-border" />
              Locked (matches a prior rep)
            </label>
          </div>
          <Field label="Notes" htmlFor="bl-notes">
            <textarea id="bl-notes" rows={2} className={baseInputClasses} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </Field>
          </fieldset>
          {error && (
            <p role="alert" className="text-sm font-medium text-status-not-ready-text">
              {error}
            </p>
          )}
          <Button type="submit" disabled={saving} className="self-start">
            {saving ? "Saving…" : "Save brew"}
          </Button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-foreground-muted">Loading brew log…</p>
      ) : loadError ? (
        <ResourceError message={loadError} retry={refresh} />
      ) : logs.length === 0 ? (
        <p className="text-sm text-foreground-muted">No brews logged yet for this coffee.</p>
      ) : (
        <div>
          {logs.map((log) => (
            <BrewLogItem key={log.id} log={log} />
          ))}
        </div>
      )}
    </Card>
  );
}
