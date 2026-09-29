"use client";

import { useState } from "react";
import { calculateCoffeeWindow, getCoffeeStatus } from "@/lib/coffee/engine";
import { formatDateOnly, formatLong, parseDateOnly } from "@/lib/coffee/dateUtils";
import { useToday } from "@/lib/coffee/useToday";
import { PROCESS_OPTIONS, ROAST_LEVEL_OPTIONS, subtypesFor } from "@/lib/coffee/options";
import type { Process, RoastLevel } from "@/lib/coffee/types";
import { useProfileOverrides } from "@/lib/coffee/useProfileOverrides";
import { resolveOverride } from "@/lib/coffee/profileOverrides";
import { Timeline } from "./Timeline";
import { StatusBadge } from "@/lib/coffee/statusIcons";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { Field, baseInputClasses } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";

export function CoffeeCalculator() {
  const now = useToday();
  const [selectedDate, setRoastDateStr] = useState<string | null>(null);
  const roastDateStr = selectedDate ?? formatDateOnly(now);
  const [process, setProcess] = useState<Process>("washed");
  const [roastLevel, setRoastLevel] = useState<RoastLevel>("light");
  const [subtype, setSubtype] = useState<string>("");

  const overrides = useProfileOverrides();
  const subtypeOptions = subtypesFor(process);

  const roastDate = parseDateOnly(roastDateStr || formatDateOnly(now));
  const overrideProfile = resolveOverride(overrides, process, subtype || null, roastLevel);
  const window = calculateCoffeeWindow({ roastDate, process, processSubtype: subtype || null, roastLevel, overrideProfile });

  const status = getCoffeeStatus(window, now);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,350px)_1fr]">
      <Card className="flex flex-col gap-4">
        <div className="border-b border-border pb-4">
          <p className="text-sm font-semibold">Coffee details</p>
          <p className="mt-1 text-sm text-foreground-muted">Use the information on the bag.</p>
        </div>
        <Field label="Roast date" htmlFor="calc-roast-date">
          <input
            id="calc-roast-date"
            type="date"
            className={baseInputClasses}
            value={roastDateStr}
            onChange={(e) => setRoastDateStr(e.target.value)}
            max={formatDateOnly(now)}
          />
        </Field>

        <Field label="Process" htmlFor="calc-process">
          <select
            id="calc-process"
            className={baseInputClasses}
            value={process}
            onChange={(e) => {
              setProcess(e.target.value as Process);
              setSubtype("");
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
          <Field label="Fermentation / subtype" htmlFor="calc-subtype" hint="Optional — doesn't change the estimate yet, but helps you track the lot.">
            <select id="calc-subtype" className={baseInputClasses} value={subtype} onChange={(e) => setSubtype(e.target.value)}>
              <option value="">Not specified</option>
              {subtypeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Roast level" htmlFor="calc-roast-level">
          <select id="calc-roast-level" className={baseInputClasses} value={roastLevel} onChange={(e) => setRoastLevel(e.target.value as RoastLevel)}>
            {ROAST_LEVEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
      </Card>

      <Card className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-5">
          <div>
            <p className="eyebrow mb-2">Estimated peak</p>
            <h3 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {formatLong(window.peakFrom)} <span className="font-normal text-foreground-muted">to</span> {formatLong(window.peakUntil)}
            </h3>
            <p className="mt-2 text-sm text-foreground-muted">Ready to drink from {formatLong(window.drinkableFrom)}</p>
          </div>
          <StatusBadge status={status} />
        </div>
        <Timeline window={window} className="pt-6" />
        <div className="flex flex-wrap items-start justify-between gap-3 border-t border-border pt-4">
          <p className="max-w-xl text-sm leading-6 text-foreground-muted">{window.notes}</p>
          <ConfidenceBadge confidence={window.confidence} />
        </div>
      </Card>
    </div>
  );
}
