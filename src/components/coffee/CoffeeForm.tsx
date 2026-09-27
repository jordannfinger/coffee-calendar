"use client";

import { useState, type FormEvent } from "react";
import { PROCESS_OPTIONS, ROAST_LEVEL_OPTIONS, subtypesFor } from "@/lib/coffee/options";
import type { CoffeeFormValues } from "@/lib/coffee/coffeeTypes";
import type { Process, RoastLevel } from "@/lib/coffee/types";
import { formatDateOnly } from "@/lib/coffee/dateUtils";
import { useToday } from "@/lib/coffee/useToday";
import { Field, baseInputClasses } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

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

  function set<K extends keyof CoffeeFormValues>(key: K, value: CoffeeFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await onSubmit(values);
    setLoading(false);
    if (result?.error) setError(result.error);
  }

  const subtypeOptions = subtypesFor(values.process);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8" noValidate>
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 font-display text-lg font-semibold">The basics</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Coffee name" htmlFor="f-name">
            <input
              id="f-name"
              required
              className={baseInputClasses}
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Ethiopia Guji"
            />
          </Field>
          <Field label="Roaster" htmlFor="f-roaster">
            <input
              id="f-roaster"
              required
              className={baseInputClasses}
              value={values.roaster}
              onChange={(e) => set("roaster", e.target.value)}
              placeholder="Sample Roasters"
            />
          </Field>
          <Field label="Origin" htmlFor="f-origin">
            <input
              id="f-origin"
              required
              className={baseInputClasses}
              value={values.origin}
              onChange={(e) => set("origin", e.target.value)}
              placeholder="Ethiopia"
            />
          </Field>
          <Field label="Roast date" htmlFor="f-roast-date">
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
          <Field label="Date ordered" htmlFor="f-order-date" hint="Optional — doesn't affect the estimate.">
            <input id="f-order-date" type="date" className={baseInputClasses} value={values.orderDate} onChange={(e) => set("orderDate", e.target.value)} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 font-display text-lg font-semibold">Origin detail (optional)</legend>
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
          <Field label="Elevation (m)" htmlFor="f-elevation">
            <input id="f-elevation" type="number" inputMode="numeric" className={baseInputClasses} value={values.elevationM} onChange={(e) => set("elevationM", e.target.value)} />
          </Field>
          <Field label="Lot" htmlFor="f-lot">
            <input id="f-lot" className={baseInputClasses} value={values.lot} onChange={(e) => set("lot", e.target.value)} />
          </Field>
          <Field label="Harvest year" htmlFor="f-harvest-year">
            <input id="f-harvest-year" type="number" inputMode="numeric" className={baseInputClasses} value={values.harvestYear} onChange={(e) => set("harvestYear", e.target.value)} />
          </Field>
        </div>
        <Field label="Tasting notes" htmlFor="f-tasting-notes">
          <input id="f-tasting-notes" className={baseInputClasses} value={values.tastingNotes} onChange={(e) => set("tastingNotes", e.target.value)} placeholder="Blueberry, jasmine, brown sugar" />
        </Field>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 font-display text-lg font-semibold">Brewing (optional)</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Brew method" htmlFor="f-brew-method">
            <input id="f-brew-method" className={baseInputClasses} value={values.brewMethod} onChange={(e) => set("brewMethod", e.target.value)} placeholder="V60" />
          </Field>
          <Field label="Grind setting" htmlFor="f-grind-setting">
            <input id="f-grind-setting" className={baseInputClasses} value={values.grindSetting} onChange={(e) => set("grindSetting", e.target.value)} />
          </Field>
          <Field label="Dose (g)" htmlFor="f-dose">
            <input id="f-dose" type="number" inputMode="decimal" step="0.1" className={baseInputClasses} value={values.doseG} onChange={(e) => set("doseG", e.target.value)} />
          </Field>
          <Field label="Water (g)" htmlFor="f-water">
            <input id="f-water" type="number" inputMode="decimal" step="0.1" className={baseInputClasses} value={values.waterG} onChange={(e) => set("waterG", e.target.value)} />
          </Field>
        </div>
        <Field label="Recipe" htmlFor="f-recipe">
          <textarea id="f-recipe" rows={2} className={baseInputClasses} value={values.recipe} onChange={(e) => set("recipe", e.target.value)} />
        </Field>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 font-display text-lg font-semibold">Personal (optional)</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Rating (1–5)" htmlFor="f-rating">
            <input id="f-rating" type="number" min={1} max={5} className={baseInputClasses} value={values.rating} onChange={(e) => set("rating", e.target.value)} />
          </Field>
          <Field label="Bag size (g)" htmlFor="f-bag-size">
            <input id="f-bag-size" type="number" inputMode="decimal" step="0.1" className={baseInputClasses} value={values.bagSizeG} onChange={(e) => set("bagSizeG", e.target.value)} />
          </Field>
          <Field label="Remaining (%)" htmlFor="f-remaining">
            <input id="f-remaining" type="number" min={0} max={100} className={baseInputClasses} value={values.remainingPercent} onChange={(e) => set("remainingPercent", e.target.value)} />
          </Field>
        </div>
        <Field label="Notes" htmlFor="f-notes">
          <textarea id="f-notes" rows={3} className={baseInputClasses} value={values.notes} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 font-display text-lg font-semibold">Storage (optional)</legend>
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
          <Field label="Bag opened date" htmlFor="f-bag-opened">
            <input id="f-bag-opened" type="date" className={baseInputClasses} value={values.bagOpenedDate} onChange={(e) => set("bagOpenedDate", e.target.value)} />
          </Field>
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm font-medium text-status-not-ready-text">
          {error}
        </p>
      )}

      <Button type="submit" disabled={loading} size="lg" className="self-start">
        {loading ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
