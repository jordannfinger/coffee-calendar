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
    <div className="page-shell">
      <div className="border-b border-border pb-7">
        <p className="eyebrow mb-2">Looking ahead</p>
        <h1 className="page-title">Plan a date</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-muted">Choose a day to see which saved coffees will be ready, or when a new coffee should be roasted.</p>
      </div>

      <div className="surface-panel mt-6 grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
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
        <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={peakOnly} onChange={(e) => setPeakOnly(e.target.checked)} className="size-4 rounded border-border accent-brand" />
          Peak only
        </label>
      </div>

      <section className="mt-10 max-w-4xl">
        <h2 className="mb-4 section-title">From your coffees</h2>
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
          <div className="surface-panel p-5 text-sm text-foreground-muted">No saved coffees match these filters for {formatLong(targetDate)}. Try another process or turn off Peak only.</div>
        ) : (
          <ul className="overflow-hidden rounded-xl border border-border bg-surface">
            {rankedCoffees.map((result) => (
              <li key={result.item.id}>
                <Link href={`/coffee/${result.item.id}`} className="block border-b border-border p-4 transition-colors hover:bg-surface-muted/70 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
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
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
          <div><p className="eyebrow mb-1">Buying something new?</p><h2 className="section-title">Roast date guidance</h2></div>
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
        <div className="grid gap-2 md:hidden">
          {guidance.filter((g) => processFilter === "all" || g.input.process === processFilter).map((g) => (
            <div key={g.input.process} className="surface-panel p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{PROCESS_OFFSETS[g.input.process].label}</h3><ConfidenceBadge confidence={g.window.confidence} /></div>
              <p className="mt-2 text-sm">Look for a roast around <strong>{formatLong(g.recommendedRoastDate)}</strong></p>
              <p className="mt-1 text-xs text-foreground-muted">Estimated peak {formatLong(g.window.peakFrom)} – {formatLong(g.window.peakUntil)}</p>
            </div>
          ))}
        </div>
        <div tabIndex={0} aria-label="Roast date guidance table" className="hidden overflow-x-auto rounded-xl border border-border bg-surface md:block">
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
