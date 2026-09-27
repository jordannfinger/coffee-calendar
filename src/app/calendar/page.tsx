"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AuthGate } from "@/components/auth/AuthGate";
import { useCoffees } from "@/lib/coffee/useCoffees";
import { useProfileOverrides } from "@/lib/coffee/useProfileOverrides";
import { resolveOverride } from "@/lib/coffee/profileOverrides";
import { calculateCoffeeWindow, getCoffeeStatus, STATUS_META } from "@/lib/coffee/engine";
import { isSameDay, parseDateOnly } from "@/lib/coffee/dateUtils";
import { useToday } from "@/lib/coffee/useToday";
import { Card } from "@/components/ui/Card";
import { ResourceError } from "@/components/ui/ResourceError";
import { buttonClasses, Button } from "@/components/ui/Button";
import type { CoffeeStatus } from "@/lib/coffee/types";
import clsx from "clsx";

const STATUS_CELL_CLASSES: Record<CoffeeStatus, string> = {
  not_ready: "bg-status-not-ready-bg text-status-not-ready-text",
  drinkable: "bg-status-drinkable-bg text-status-drinkable-text",
  peak: "bg-status-peak-bg text-status-peak-text",
  out_of_peak: "bg-status-out-of-peak-bg text-status-out-of-peak-text",
  too_old: "bg-status-too-old-bg text-status-too-old-text",
};

function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function daysInMonth(year: number, month: number): Date[] {
  const count = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: count }, (_, i) => new Date(year, month, i + 1));
}

function CalendarContent() {
  const { coffees, loading, error, refresh } = useCoffees();
  const overrides = useProfileOverrides();
  const now = useToday();
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const year = (selectedMonth ?? now).getFullYear();
  const month = (selectedMonth ?? now).getMonth();

  const days = useMemo(() => daysInMonth(year, month), [year, month]);

  const rows = useMemo(
    () =>
      coffees.map((coffee) => {
        const roastDate = parseDateOnly(coffee.roast_date);
        const overrideProfile = resolveOverride(overrides, coffee.process, coffee.process_subtype, coffee.roast_level);
        const window = calculateCoffeeWindow({
          roastDate,
          process: coffee.process,
          processSubtype: coffee.process_subtype,
          roastLevel: coffee.roast_level,
          overrideProfile,
        });
        return { coffee, window };
      }),
    [coffees, overrides],
  );

  function goToMonth(delta: number) {
    setSelectedMonth(new Date(year, month + delta, 1));
  }

  if (error) return <div className="mx-auto max-w-6xl px-4 py-10"><ResourceError message={error} retry={refresh} /></div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold">Calendar</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => goToMonth(-1)} aria-label="Previous month">
            ←
          </Button>
          <span className="min-w-[10rem] text-center font-medium">{monthLabel(year, month)}</span>
          <Button variant="secondary" size="sm" onClick={() => goToMonth(1)} aria-label="Next month">
            →
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3 text-xs text-foreground-muted">
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <span key={key} className="inline-flex items-center gap-1">
            <span aria-hidden="true">{meta.emoji}</span>
            {meta.label}
          </span>
        ))}
      </div>

      {loading && <p className="text-sm text-foreground-muted">Loading your coffees…</p>}

      {!loading && coffees.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="font-display text-lg font-semibold">Nothing on the calendar yet</p>
          <p className="max-w-sm text-sm text-foreground-muted">Save a coffee to see its whole lifecycle mapped across the month.</p>
          <Link href="/coffee/new" className={buttonClasses("primary")}>
            + Add a coffee
          </Link>
        </Card>
      )}

      {!loading && coffees.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th scope="col" className="sticky left-0 z-10 min-w-[10rem] border-b border-border bg-surface px-3 py-2 text-left font-medium text-foreground-muted">
                  Coffee
                </th>
                {days.map((day) => (
                  <th
                    key={day.toISOString()}
                    scope="col"
                    aria-label={day.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    className={clsx(
                      "w-7 border-b border-border px-0 py-2 text-center text-[10px] font-normal text-foreground-muted",
                      isSameDay(day, now) && "bg-brand-tint text-brand-strong",
                    )}
                  >
                    {day.getDate()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ coffee, window }) => (
                <tr key={coffee.id}>
                  <th scope="row" className="sticky left-0 z-10 border-b border-border bg-surface px-3 py-2 text-left font-medium">
                    <Link href={`/coffee/${coffee.id}`} className="hover:text-brand hover:underline">
                      {coffee.name}
                    </Link>
                  </th>
                  {days.map((day) => {
                    const beforeRoast = day.getTime() < window.roastDate.getTime();
                    const status = beforeRoast ? null : getCoffeeStatus(window, day);
                    return (
                      <td key={day.toISOString()} className="border-b border-border p-0.5 text-center">
                        {status && (
                          <span
                            className={clsx("flex h-6 w-6 items-center justify-center rounded text-xs", STATUS_CELL_CLASSES[status])}
                            title={`${STATUS_META[status].label} on ${day.toLocaleDateString()}`}
                            role="img"
                            aria-label={`${coffee.name}: ${STATUS_META[status].label} on ${day.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
                          >
                            <span aria-hidden="true">{STATUS_META[status].emoji}</span>
                          </span>
                        )}
                        {!status && <span className="sr-only">Before roast on {day.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <AuthGate title="Calendar">
      <CalendarContent />
    </AuthGate>
  );
}
