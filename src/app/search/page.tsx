"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCoffees } from "@/lib/coffee/useCoffees";
import { useProfileOverrides } from "@/lib/coffee/useProfileOverrides";
import { resolveOverride } from "@/lib/coffee/profileOverrides";
import { rankForDate, reverseCalculate } from "@/lib/coffee/engine";
import { formatDateOnly, formatLong, parseDateOnly } from "@/lib/coffee/dateUtils";
import { useToday } from "@/lib/coffee/useToday";
import { PROCESS_OPTIONS, ROAST_LEVEL_OPTIONS } from "@/lib/coffee/options";
import { StatusBadge } from "@/lib/coffee/statusIcons";
import { ConfidenceBadge } from "@/components/coffee/ConfidenceBadge";
import { statusLine } from "@/components/coffee/CoffeeCard";
import { PROCESS_OFFSETS } from "@/lib/coffee/model";
import { Card } from "@/components/ui/Card";
import { ResourceError } from "@/components/ui/ResourceError";
import { Field, baseInputClasses } from "@/components/ui/Field";
import { hasCoffeeRemaining, type CoffeeRow } from "@/lib/coffee/coffeeTypes";
import type { Process, RoastLevel } from "@/lib/coffee/types";

export default function SearchPage() {
  const { coffees, loading, error, refresh } = useCoffees();
  const overrides = useProfileOverrides();

  const now = useToday();
  const [selectedDate, setDateStr] = useState<string | null>(null);
  const dateStr = selectedDate ?? formatDateOnly(now);
  const [peakOnly, setPeakOnly] = useState(false);
  const [processFilter, setProcessFilter] = useState<Process | "all">("all");
  const [guidanceRoastLevel, setGuidanceRoastLevel] = useState<RoastLevel>("light");

  const targetDate = useMemo(() => parseDateOnly(dateStr || formatDateOnly(now)), [dateStr, now]);

  const rankedCoffees = useMemo(() => {
    let results = rankForDate(
      coffees.filter(hasCoffeeRemaining),
      (c: CoffeeRow) => ({
        roastDate: parseDateOnly(c.roast_date),
        process: c.process,
        processSubtype: c.process_subtype,
        roastLevel: c.roast_level,
        overrideProfile: resolveOverride(overrides, c.process, c.process_subtype, c.roast_level),
      }),
      targetDate,
    );
    if (peakOnly) results = results.filter((r) => r.status === "peak");
    if (processFilter !== "all") results = results.filter((r) => r.item.process === processFilter);
    return results;
  }, [coffees, overrides, targetDate, peakOnly, processFilter]);

  const guidance = useMemo(() => {
    const combos = PROCESS_OPTIONS.map((opt) => ({
      process: opt.value,
      roastLevel: guidanceRoastLevel,
      overrideProfile: resolveOverride(overrides, opt.value, null, guidanceRoastLevel),
    }));
    return reverseCalculate(targetDate, combos).sort((a, b) => a.recommendedRoastDate.getTime() - b.recommendedRoastDate.getTime());
  }, [targetDate, guidanceRoastLevel, overrides]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold">When do you want coffee?</h1>
      <p className="mt-1 text-foreground-muted">Pick a date — we’ll rank what you should drink and tell you when to order.</p>

      <Card className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
        <Field label="Drink date" htmlFor="search-date">
          <input id="search-date" type="date" className={baseInputClasses} value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
        </Field>
        <Field label="Process" htmlFor="search-process">
          <select id="search-process" className={baseInputClasses} value={processFilter} onChange={(e) => setProcessFilter(e.target.value as Process | "all")}>
            <option value="all">All processes</option>
            {PROCESS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
        <label className="flex items-center gap-2 pb-2.5 text-sm font-medium">
          <input type="checkbox" checked={peakOnly} onChange={(e) => setPeakOnly(e.target.checked)} className="h-4 w-4 rounded border-border" />
          Peak only
        </label>
      </Card>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-xl font-semibold">Best options from your coffees</h2>
        {loading ? <p className="text-sm text-foreground-muted">Loading your coffees…</p> : error ? (
          <ResourceError message={error} retry={refresh} />
        ) : coffees.length === 0 ? (
          <p className="text-sm text-foreground-muted">
            You haven’t saved any coffees yet.{" "}
            <Link href="/coffee/new" className="underline decoration-border underline-offset-2">
              Add one
            </Link>{" "}
            to see it ranked here.
          </p>
        ) : rankedCoffees.length === 0 ? (
          <p className="text-sm text-foreground-muted">No saved coffees match those filters for {formatLong(targetDate)}.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {rankedCoffees.map((result) => (
              <li key={result.item.id}>
                <Link href={`/coffee/${result.item.id}`}>
                  <Card className="flex flex-wrap items-center justify-between gap-3 transition-shadow hover:shadow-md">
                    <div>
                      <p className="font-semibold">{result.item.name}</p>
                      <p className="text-sm text-foreground-muted">
                        {result.item.roaster} · {PROCESS_OFFSETS[result.item.process].label} · roasted {formatLong(parseDateOnly(result.item.roast_date))}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={result.status} size="sm" />
                      <span className="text-sm text-foreground-muted">{statusLine(result.window, targetDate)}</span>
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold">Ordering guidance</h2>
          <Field label="Roast level" htmlFor="guidance-roast-level">
            <select
              id="guidance-roast-level"
              className={baseInputClasses}
              value={guidanceRoastLevel}
              onChange={(e) => setGuidanceRoastLevel(e.target.value as RoastLevel)}
            >
              {ROAST_LEVEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <p className="mb-4 text-sm text-foreground-muted">
          If you want coffee on {formatLong(targetDate)}, here’s roughly when to have it roasted for each process, at{" "}
          {ROAST_LEVEL_OPTIONS.find((o) => o.value === guidanceRoastLevel)?.label.toLowerCase()} roast.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-foreground-muted">
                <th scope="col" className="px-4 py-3 font-medium">
                  Process
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Recommended roast date
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Peak window
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Confidence
                </th>
              </tr>
            </thead>
            <tbody>
              {guidance
                .filter((g) => processFilter === "all" || g.input.process === processFilter)
                .map((g) => (
                  <tr key={g.input.process} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{PROCESS_OFFSETS[g.input.process].label}</td>
                    <td className="px-4 py-3">{formatLong(g.recommendedRoastDate)}</td>
                    <td className="px-4 py-3">
                      {formatLong(g.window.peakFrom)} – {formatLong(g.window.peakUntil)}
                    </td>
                    <td className="px-4 py-3">
                      <ConfidenceBadge confidence={g.window.confidence} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
