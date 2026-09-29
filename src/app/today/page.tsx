"use client";

import Link from "next/link";
import { AuthGate } from "@/components/auth/AuthGate";
import { useCoffees } from "@/lib/coffee/useCoffees";
import { useProfileOverrides } from "@/lib/coffee/useProfileOverrides";
import { resolveOverride } from "@/lib/coffee/profileOverrides";
import { rankForDate } from "@/lib/coffee/engine";
import { getPeakAlerts } from "@/lib/coffee/alerts";
import { statusLine } from "@/components/coffee/CoffeeCard";
import { parseDateOnly, formatWithWeekday } from "@/lib/coffee/dateUtils";
import { useToday } from "@/lib/coffee/useToday";
import { StatusBadge } from "@/lib/coffee/statusIcons";
import { PROCESS_OFFSETS } from "@/lib/coffee/model";
import { Card } from "@/components/ui/Card";
import { ResourceError } from "@/components/ui/ResourceError";
import { buttonClasses } from "@/components/ui/Button";
import { hasCoffeeRemaining, type CoffeeRow } from "@/lib/coffee/coffeeTypes";

const RANK_HEADLINE: Record<number, string> = {
  0: "Best right now",
  1: "Also excellent",
};

function TodayContent() {
  const { coffees, loading, error, refresh } = useCoffees();
  const overrides = useProfileOverrides();
  const targetDate = useToday();

  const ranked = rankForDate(
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

  const peakRanked = ranked.filter((r) => r.status === "peak");
  const alerts = getPeakAlerts(
    ranked.map((r) => ({ item: r.item, window: r.window })),
    targetDate,
  );

  if (error) return <div className="mx-auto max-w-3xl px-4 py-10"><ResourceError message={error} retry={refresh} /></div>;

  return (
    <div className="page-shell">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-7">
        <div>
          <p className="eyebrow mb-2">{formatWithWeekday(targetDate)}</p>
          <h1 className="page-title">What should I drink today?</h1>
          <p className="mt-2 text-sm text-foreground-muted">Your saved coffees, ordered by how well they should brew right now.</p>
        </div>
        <Link href="/coffee/new" className={buttonClasses("primary")}>Add coffee</Link>
      </div>

      {alerts.length > 0 && (
        <div className="mb-7 flex flex-col gap-2 rounded-lg border border-status-peak-border bg-status-peak-bg px-4 py-3">
          {alerts.map((alert) => (
            <p key={`${alert.item.id}-${alert.type}`} className="text-sm text-status-peak-text">
              <Link href={`/coffee/${alert.item.id}`} className="font-semibold underline decoration-current/40 underline-offset-2">
                {alert.item.name}
              </Link>{" "}
              {alert.type === "entering_peak_tomorrow" ? "enters peak tomorrow" : "leaves peak tomorrow"}.
            </p>
          ))}
        </div>
      )}

      {loading && <div role="status" className="surface-panel h-32 animate-pulse p-6 text-sm text-foreground-muted">Loading your coffees…</div>}

      {!loading && coffees.length === 0 && (
        <Card className="flex flex-col items-start gap-3 py-10">
          <p className="section-title">Nothing to choose from yet.</p>
          <p className="max-w-sm text-sm leading-6 text-foreground-muted">Add a coffee from its bag details and we’ll show when it is ready to brew.</p>
          <Link href="/coffee/new" className={buttonClasses("primary")}>
            Add a coffee
          </Link>
        </Card>
      )}

      {!loading && coffees.length > 0 && ranked.length === 0 && (
        <div className="surface-panel p-6 text-sm text-foreground-muted">All your bags are finished. Your history is still in <Link href="/coffee" className="font-semibold text-brand underline underline-offset-4">My coffee</Link>.</div>
      )}

      {ranked.length > 0 && <div className="mb-3 flex items-center justify-between"><h2 className="section-title">Your options</h2><span className="text-sm text-foreground-muted">{ranked.length} {ranked.length === 1 ? "coffee" : "coffees"}</span></div>}
      {ranked.length > 0 && <ul className="overflow-hidden rounded-xl border border-border bg-surface">
        {ranked.map((result) => {
          const peakIndex = peakRanked.indexOf(result);
          const headline = result.status === "peak" ? RANK_HEADLINE[peakIndex] ?? "In peak" : undefined;

          return (
            <li key={result.item.id} className="border-b border-border last:border-0">
              <Link href={`/coffee/${result.item.id}`} className="flex flex-col gap-3 px-5 py-5 transition-colors hover:bg-surface-muted/70 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="min-w-0">
                  {headline && <p className="mb-1 text-xs font-semibold text-brand">{headline}</p>}
                  <h3 className="font-display text-xl font-semibold">{result.item.name}</h3>
                  <p className="mt-1 text-sm text-foreground-muted">{result.item.roaster} · {result.item.origin} · {PROCESS_OFFSETS[result.item.process].label}</p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-3 sm:justify-end">
                  <div className="text-left sm:text-right">
                    <StatusBadge status={result.status} size="sm" />
                    <p className="mt-1 text-xs text-foreground-muted">{statusLine(result.window, targetDate)}</p>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>}
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
