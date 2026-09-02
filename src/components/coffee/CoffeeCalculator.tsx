"use client";

import { useState } from "react";
import { calculateCoffeeWindow, getCoffeeStatus } from "@/lib/coffee/engine";
import { formatDateOnly, parseDateOnly, today } from "@/lib/coffee/dateUtils";
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
  const [roastDateStr, setRoastDateStr] = useState(formatDateOnly(today()));
  const [process, setProcess] = useState<Process>("washed");
  const [roastLevel, setRoastLevel] = useState<RoastLevel>("light");
  const [subtype, setSubtype] = useState<string>("");

  const overrides = useProfileOverrides();
  const subtypeOptions = subtypesFor(process);

  const roastDate = parseDateOnly(roastDateStr || formatDateOnly(today()));
  const overrideProfile = resolveOverride(overrides, process, subtype || null, roastLevel);
  const window = calculateCoffeeWindow({ roastDate, process, processSubtype: subtype || null, roastLevel, overrideProfile });

  const status = getCoffeeStatus(window, today());

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
      <Card className="flex flex-col gap-4">
        <Field label="Roast date" htmlFor="calc-roast-date">
          <input
            id="calc-roast-date"
            type="date"
            className={baseInputClasses}
            value={roastDateStr}
            onChange={(e) => setRoastDateStr(e.target.value)}
            max={formatDateOnly(today())}
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

      <Card className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-xl font-semibold">Your coffee</h3>
          <div className="flex items-center gap-2">
            <StatusBadge status={status} />
            <ConfidenceBadge confidence={window.confidence} />
          </div>
        </div>

        <Timeline window={window} className="pt-6" />

        <p className="text-sm text-foreground-muted">{window.notes}</p>
      </Card>
    </div>
  );
}
