"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { ValidationError } from "@/lib/coffee/validation";
import { PROCESS_OPTIONS, ROAST_LEVEL_OPTIONS, subtypesFor } from "@/lib/coffee/options";
import type { CoffeeFormValues } from "@/lib/coffee/coffeeTypes";
import type { Process, RoastLevel } from "@/lib/coffee/types";
import { formatDateOnly } from "@/lib/coffee/dateUtils";
import { useToday } from "@/lib/coffee/useToday";
import { Field, baseInputClasses } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

function OptionalSection({ title, initialOpen, disabled, children }: {
  title: string;
  initialOpen: boolean;
  disabled: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <details data-optional open={open} onToggle={(event) => setOpen(event.currentTarget.open)} className="group mt-6 border-t border-border pt-5">
      <summary className="flex min-h-11 list-none items-center justify-between gap-3 rounded-md py-1">
        <span className="font-display text-xl font-semibold">{title}</span>
        <span className="flex items-center gap-2 text-xs font-medium text-foreground-muted">
          Optional
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4 transition-transform duration-150 group-open:rotate-180">
            <path d="m4 7 6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </summary>
      <fieldset disabled={disabled} className="mt-4 flex flex-col gap-4">
        <legend className="sr-only">{title}</legend>
        {children}
      </fieldset>
    </details>
  );
}

export function CoffeeForm({
  initialValues,
  onSubmit,
  submitLabel,
}: {
  initialValues: CoffeeFormValues;
  onSubmit: (values: CoffeeFormValues) => Promise<{ error?: string } | void>;
  submitLabel: string;
}) {
  const [values, setValues] = useState(initialValues);
  const now = useToday();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  function set<K extends keyof CoffeeFormValues>(key: K, value: CoffeeFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setError(null);
    setLoading(true);
    try {
      const result = await onSubmit(values);
      if (result?.error) {
        setError(result.error);
        formRef.current?.querySelectorAll<HTMLDetailsElement>("details[data-optional]").forEach((section) => { section.open = true; });
      }
    } catch (cause) {
      setError(cause instanceof ValidationError ? cause.message : "Couldn't confirm the save. Your draft is preserved; check your connection and try again.");
      formRef.current?.querySelectorAll<HTMLDetailsElement>("details[data-optional]").forEach((section) => { section.open = true; });
    } finally {
      pending.current = false;
      setLoading(false);
    }
  }

  const subtypeOptions = subtypesFor(values.process);
  const fieldError = (name: string) => error?.startsWith(`${name} `) ? error : undefined;
  const hasFieldError = ["Coffee name", "Roaster", "Origin", "Roast date", "Date ordered", "Elevation", "Harvest year", "Dose", "Water", "Rating", "Bag size", "Remaining percentage", "Bag opened date"].some((name) => fieldError(name));

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-0">
      <fieldset disabled={loading} className="surface-panel flex flex-col gap-4 p-5 sm:p-7">
        <legend className="sr-only">Coffee details</legend>
        <div>
          <p className="eyebrow mb-1">Start here</p>
          <h2 className="section-title">Coffee details</h2>
          <p className="mt-1 text-sm text-foreground-muted">Name, roaster, origin and roast date are required. Everything else helps describe the bag.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Coffee name" htmlFor="f-name" error={fieldError("Coffee name")}>
            <input
              id="f-name"
              required
              className={baseInputClasses}
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Ethiopia Guji"
            />
          </Field>
          <Field label="Roaster" htmlFor="f-roaster" error={fieldError("Roaster")}>
            <input
              id="f-roaster"
              required
              className={baseInputClasses}
              value={values.roaster}
              onChange={(e) => set("roaster", e.target.value)}
              placeholder="Sample Roasters"
            />
          </Field>
          <Field label="Origin" htmlFor="f-origin" error={fieldError("Origin")}>
            <input
              id="f-origin"
              required
              className={baseInputClasses}
              value={values.origin}
              onChange={(e) => set("origin", e.target.value)}
              placeholder="Ethiopia"
            />
          </Field>
          <Field label="Roast date" htmlFor="f-roast-date" error={fieldError("Roast date")}>
            <input
              id="f-roast-date"
              type="date"
              required
              max={formatDateOnly(now)}
              className={baseInputClasses}
              value={values.roastDate}
              onChange={(e) => set("roastDate", e.target.value)}
            />
          </Field>
          <Field label="Process" htmlFor="f-process">
            <select
              id="f-process"
              className={baseInputClasses}
              value={values.process}
              onChange={(e) => {
                set("process", e.target.value as Process);
                set("processSubtype", "");
              }}
            >
              {PROCESS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
          {subtypeOptions.length > 0 && (
            <Field label="Process subtype" htmlFor="f-subtype">
              <select id="f-subtype" className={baseInputClasses} value={values.processSubtype} onChange={(e) => set("processSubtype", e.target.value)}>
                <option value="">Not specified</option>
                {subtypeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Roast level" htmlFor="f-roast-level">
            <select id="f-roast-level" className={baseInputClasses} value={values.roastLevel} onChange={(e) => set("roastLevel", e.target.value as RoastLevel)}>
              {ROAST_LEVEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date ordered" htmlFor="f-order-date" hint="Optional — doesn't affect the estimate." error={fieldError("Date ordered")}>
            <input id="f-order-date" type="date" className={baseInputClasses} value={values.orderDate} onChange={(e) => set("orderDate", e.target.value)} />
          </Field>
        </div>
      </fieldset>

      <OptionalSection title="Origin detail" initialOpen={Boolean(initialValues.variety || initialValues.producer || initialValues.region || initialValues.elevationM || initialValues.lot || initialValues.harvestYear || initialValues.tastingNotes)} disabled={loading}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Variety" htmlFor="f-variety">
            <input id="f-variety" className={baseInputClasses} value={values.variety} onChange={(e) => set("variety", e.target.value)} placeholder="Heirloom" />
          </Field>
          <Field label="Producer" htmlFor="f-producer">
            <input id="f-producer" className={baseInputClasses} value={values.producer} onChange={(e) => set("producer", e.target.value)} />
          </Field>
          <Field label="Region" htmlFor="f-region">
            <input id="f-region" className={baseInputClasses} value={values.region} onChange={(e) => set("region", e.target.value)} placeholder="Guji" />
          </Field>
          <Field label="Elevation (m)" htmlFor="f-elevation" error={fieldError("Elevation")}>
            <input id="f-elevation" type="number" min={0} max={2147483647} step={1} inputMode="numeric" className={baseInputClasses} value={values.elevationM} onChange={(e) => set("elevationM", e.target.value)} />
          </Field>
          <Field label="Lot" htmlFor="f-lot">
            <input id="f-lot" className={baseInputClasses} value={values.lot} onChange={(e) => set("lot", e.target.value)} />
          </Field>
          <Field label="Harvest year" htmlFor="f-harvest-year" error={fieldError("Harvest year")}>
            <input id="f-harvest-year" type="number" min={1} max={9999} step={1} inputMode="numeric" className={baseInputClasses} value={values.harvestYear} onChange={(e) => set("harvestYear", e.target.value)} />
          </Field>
        </div>
        <Field label="Tasting notes" htmlFor="f-tasting-notes">
          <input id="f-tasting-notes" className={baseInputClasses} value={values.tastingNotes} onChange={(e) => set("tastingNotes", e.target.value)} placeholder="Blueberry, jasmine, brown sugar" />
        </Field>
      </OptionalSection>

      <OptionalSection title="Brewing" initialOpen={Boolean(initialValues.brewMethod || initialValues.grindSetting || initialValues.doseG || initialValues.waterG || initialValues.recipe)} disabled={loading}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Brew method" htmlFor="f-brew-method">
            <input id="f-brew-method" className={baseInputClasses} value={values.brewMethod} onChange={(e) => set("brewMethod", e.target.value)} placeholder="V60" />
          </Field>
          <Field label="Grind setting" htmlFor="f-grind-setting">
            <input id="f-grind-setting" className={baseInputClasses} value={values.grindSetting} onChange={(e) => set("grindSetting", e.target.value)} />
          </Field>
          <Field label="Dose (g)" htmlFor="f-dose" error={fieldError("Dose")}>
            <input id="f-dose" type="number" min={0.1} max={9999.9} inputMode="decimal" step="0.1" className={baseInputClasses} value={values.doseG} onChange={(e) => set("doseG", e.target.value)} />
          </Field>
          <Field label="Water (g)" htmlFor="f-water" error={fieldError("Water")}>
            <input id="f-water" type="number" min={0.1} max={99999.9} inputMode="decimal" step="0.1" className={baseInputClasses} value={values.waterG} onChange={(e) => set("waterG", e.target.value)} />
          </Field>
        </div>
        <Field label="Recipe" htmlFor="f-recipe">
          <textarea id="f-recipe" rows={2} className={baseInputClasses} value={values.recipe} onChange={(e) => set("recipe", e.target.value)} />
        </Field>
      </OptionalSection>

      <OptionalSection title="Personal" initialOpen={Boolean(initialValues.rating || initialValues.bagSizeG || initialValues.remainingPercent || initialValues.notes)} disabled={loading}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Rating (1–5)" htmlFor="f-rating" error={fieldError("Rating")}>
            <input id="f-rating" type="number" min={1} max={5} className={baseInputClasses} value={values.rating} onChange={(e) => set("rating", e.target.value)} />
          </Field>
          <Field label="Bag size (g)" htmlFor="f-bag-size" error={fieldError("Bag size")}>
            <input id="f-bag-size" type="number" min={0.1} max={99999.9} inputMode="decimal" step="0.1" className={baseInputClasses} value={values.bagSizeG} onChange={(e) => set("bagSizeG", e.target.value)} />
          </Field>
          <Field label="Remaining (%)" htmlFor="f-remaining" error={fieldError("Remaining percentage")}>
            <input id="f-remaining" type="number" min={0} max={100} className={baseInputClasses} value={values.remainingPercent} onChange={(e) => set("remainingPercent", e.target.value)} />
          </Field>
        </div>
        <Field label="Notes" htmlFor="f-notes">
          <textarea id="f-notes" rows={3} className={baseInputClasses} value={values.notes} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </OptionalSection>

      <OptionalSection title="Storage" initialOpen={Boolean(initialValues.storageMethod || initialValues.bagOpenedDate)} disabled={loading}>
        <p className="-mt-2 text-xs text-foreground-muted">Tracked for reference only — doesn&rsquo;t change the estimate.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Storage method" htmlFor="f-storage-method">
            <input
              id="f-storage-method"
              list="storage-method-options"
              className={baseInputClasses}
              value={values.storageMethod}
              onChange={(e) => set("storageMethod", e.target.value)}
              placeholder="Sealed bag, room temperature"
            />
            <datalist id="storage-method-options">
              <option value="Sealed bag, room temperature" />
              <option value="Opened bag, room temperature" />
              <option value="Vacuum sealed" />
              <option value="Frozen (whole bag)" />
              <option value="Frozen (individual doses)" />
              <option value="Fellow Atmos / valve canister" />
            </datalist>
          </Field>
          <Field label="Bag opened date" htmlFor="f-bag-opened" error={fieldError("Bag opened date")}>
            <input id="f-bag-opened" type="date" className={baseInputClasses} value={values.bagOpenedDate} onChange={(e) => set("bagOpenedDate", e.target.value)} />
          </Field>
        </div>
      </OptionalSection>

      {error && !hasFieldError && (
        <p role="alert" className="text-sm font-medium text-status-not-ready-text">
          {error}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between gap-4 border-t border-border pt-6">
        <p className="hidden text-xs text-foreground-muted sm:block">You can add the optional details later.</p>
        <Button type="submit" disabled={loading} size="lg" className="w-full sm:ml-auto sm:w-auto">
          {loading ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
