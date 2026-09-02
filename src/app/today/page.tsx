"use client";

import Link from "next/link";
import { AuthGate } from "@/components/auth/AuthGate";
import { useCoffees } from "@/lib/coffee/useCoffees";
import { useProfileOverrides } from "@/lib/coffee/useProfileOverrides";
import { resolveOverride } from "@/lib/coffee/profileOverrides";
import { rankForDate } from "@/lib/coffee/engine";
import { getPeakAlerts } from "@/lib/coffee/alerts";
import { statusLine } from "@/components/coffee/CoffeeCard";
import { today, parseDateOnly, formatWithWeekday } from "@/lib/coffee/dateUtils";
import { StatusBadge } from "@/lib/coffee/statusIcons";
import { ConfidenceBadge } from "@/components/coffee/ConfidenceBadge";
import { PROCESS_OFFSETS } from "@/lib/coffee/model";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";
import type { CoffeeRow } from "@/lib/coffee/coffeeTypes";

const RANK_HEADLINE: Record<number, string> = {
  0: "Best right now",
  1: "Also excellent",
};

function TodayContent() {
  const { coffees, loading } = useCoffees();
  const overrides = useProfileOverrides();
  const targetDate = today();

  const ranked = rankForDate(
    coffees,
    (c: CoffeeRow) => ({
      roastDate: parseDateOnly(c.roast_date),
      process: c.process,
      processSubtype: c.process_subtype,
      roastLevel: c.roast_level,
      overrideProfile: resolveOverride(overrides, c.process, c.process_subtype, c.roast_level),
    }),
    targetDate,
  );

  const peakRanked = ranked.filter((r) => r.status === "peak");
  const alerts = getPeakAlerts(
    ranked.map((r) => ({ item: r.item, window: r.window })),
    targetDate,
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold">What should I drink today?</h1>
      <p className="mt-1 text-foreground-muted">{formatWithWeekday(targetDate)}</p>

      {alerts.length > 0 && (
        <Card className="mt-6 flex flex-col gap-2 border-status-peak-border bg-status-peak-bg">
          {alerts.map((alert) => (
            <p key={`${alert.item.id}-${alert.type}`} className="text-sm text-status-peak-text">
              <span aria-hidden="true">{alert.type === "entering_peak_tomorrow" ? "⭐" : "🟠"}</span>{" "}
              <Link href={`/coffee/${alert.item.id}`} className="font-semibold underline decoration-current/40 underline-offset-2">
                {alert.item.name}
              </Link>{" "}
              {alert.type === "entering_peak_tomorrow" ? "enters peak tomorrow" : "leaves peak tomorrow"}.
            </p>
          ))}
        </Card>
      )}

      {loading && <p className="mt-8 text-sm text-foreground-muted">Loading your coffees…</p>}

      {!loading && coffees.length === 0 && (
        <Card className="mt-8 flex flex-col items-center gap-3 py-12 text-center">
          <p className="font-display text-lg font-semibold">No coffees saved yet</p>
          <p className="max-w-sm text-sm text-foreground-muted">Add a coffee and we’ll rank it here against everything else you have brewing.</p>
          <Link href="/coffee/new" className={buttonClasses("primary")}>
            + Add a coffee
          </Link>
        </Card>
      )}

      <ul className="mt-8 flex flex-col gap-4">
        {ranked.map((result) => {
          const peakIndex = peakRanked.indexOf(result);
          const headline = result.status === "peak" ? RANK_HEADLINE[peakIndex] ?? "In peak" : undefined;

          return (
            <li key={result.item.id}>
              <Link href={`/coffee/${result.item.id}`}>
                <Card className="flex flex-col gap-2 transition-shadow hover:shadow-md">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={result.status} />
                    {headline && <span className="font-display text-sm font-semibold text-brand">{headline}</span>}
                    <ConfidenceBadge confidence={result.window.confidence} className="ml-auto" />
                  </div>
                  <h2 className="font-display text-xl font-semibold">{result.item.name}</h2>
                  <p className="text-sm text-foreground-muted">
                    {result.item.roaster} · {PROCESS_OFFSETS[result.item.process].label}
                  </p>
                  <p className="text-sm font-medium text-foreground">{statusLine(result.window, targetDate)}</p>
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function TodayPage() {
  return (
    <AuthGate title="Drink Today">
      <TodayContent />
    </AuthGate>
  );
}
