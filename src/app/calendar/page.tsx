"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { AuthGate } from "@/components/auth/AuthGate";
import { useCoffees } from "@/lib/coffee/useCoffees";
import { useProfileOverrides } from "@/lib/coffee/useProfileOverrides";
import { resolveOverride } from "@/lib/coffee/profileOverrides";
import { calculateCoffeeWindow, getCoffeeStatus, STATUS_ORDER } from "@/lib/coffee/engine";
import { addCalendarDays, formatDateOnly, isSameDay, parseDateOnly } from "@/lib/coffee/dateUtils";
import { useToday } from "@/lib/coffee/useToday";
import { StatusBadge } from "@/lib/coffee/statusIcons";
import { statusLine } from "@/components/coffee/CoffeeCard";
import { ResourceError } from "@/components/ui/ResourceError";
import { Button, buttonClasses } from "@/components/ui/Button";
import { baseInputClasses } from "@/components/ui/Field";
import { PROCESS_OFFSETS } from "@/lib/coffee/model";
import type { CoffeeStatus } from "@/lib/coffee/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function monthDays(year: number, month: number) {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  const slots = Math.ceil((firstWeekday + count) / 7) * 7;
  return Array.from({ length: slots }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day >= 1 && day <= count ? new Date(year, month, day) : null;
  });
}

function CalendarContent() {
  const { coffees, loading, error, refresh } = useCoffees();
  const overrides = useProfileOverrides();
  const now = useToday();
  const [selected, setSelected] = useState<Date | null>(null);
  const [coffeeFilter, setCoffeeFilter] = useState("all");
  const selectedDay = selected ?? now;
  const year = selectedDay.getFullYear();
  const month = selectedDay.getMonth();
  const days = useMemo(() => monthDays(year, month), [year, month]);
  const monthName = useMemo(() => new Intl.DateTimeFormat("en-AU", { month: "long", year: "numeric" }).format(selectedDay), [selectedDay]);
  const rows = useMemo(() => coffees.map((coffee) => ({
    coffee,
    window: calculateCoffeeWindow({
      roastDate: parseDateOnly(coffee.roast_date),
      process: coffee.process,
      processSubtype: coffee.process_subtype,
      roastLevel: coffee.roast_level,
      overrideProfile: resolveOverride(overrides, coffee.process, coffee.process_subtype, coffee.roast_level),
    }),
  })), [coffees, overrides]);
  const visibleRows = useMemo(() => coffeeFilter === "all" ? rows : rows.filter(({ coffee }) => coffee.id === coffeeFilter), [rows, coffeeFilter]);
  const summaries = useMemo(() => days.map((day) => {
    if (!day) return null;
    const available = visibleRows.filter(({ window }) => day >= window.roastDate);
    const peak = available.filter(({ window }) => getCoffeeStatus(window, day) === "peak");
    const drinkable = available.filter(({ window }) => getCoffeeStatus(window, day) === "drinkable");
    return { peak, drinkable };
  }), [days, visibleRows]);
  const selectedRows = useMemo(() => visibleRows
    .filter(({ window }) => selectedDay >= window.roastDate)
    .map((row) => ({ ...row, status: getCoffeeStatus(row.window, selectedDay) }))
    .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)),
  [visibleRows, selectedDay]);

  function changeMonth(delta: number) {
    setSelected(new Date(year, month + delta, 1));
  }
  function onDateKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, day: Date) {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const next = addCalendarDays(day, step);
    setSelected(next);
    requestAnimationFrame(() => document.getElementById(`day-${formatDateOnly(next)}`)?.focus());
  }

  if (error) return <div className="page-shell"><ResourceError message={error} retry={refresh} /></div>;

  return (
    <div className="page-shell">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Your drinking windows</p>
          <h1 className="page-title">Calendar</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-muted">See when each saved coffee is likely to be ready and at its peak. Select a day for details.</p>
        </div>
        <Link href="/coffee/new" className={buttonClasses("primary")}>Add coffee</Link>
      </div>

      {loading ? (
        <div className="surface-panel p-6" role="status" aria-live="polite">
          <div className="h-6 w-40 animate-pulse rounded bg-surface-muted" />
          <div className="mt-6 grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }, (_, i) => <div key={i} className="h-16 animate-pulse rounded bg-surface-muted" />)}
          </div>
          <span className="sr-only">Loading calendar</span>
        </div>
      ) : coffees.length === 0 ? (
        <div className="surface-panel max-w-2xl px-6 py-10 sm:px-10">
          <p className="eyebrow mb-3">Start here</p>
          <h2 className="section-title">Your calendar starts with a coffee.</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-foreground-muted">Add the roast date and process from a bag. Its estimated drinking window will appear here.</p>
          <Link href="/coffee/new" className={buttonClasses("primary", "md", "mt-6")}>Add a coffee</Link>
        </div>
      ) : (
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
          <section aria-label={monthName} className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="min-w-[12rem] font-display text-xl font-semibold tracking-tight sm:text-2xl">{monthName}</h2>
                <Button variant="secondary" size="sm" onClick={() => changeMonth(-1)} aria-label="Previous month">←</Button>
                <Button variant="secondary" size="sm" onClick={() => changeMonth(1)} aria-label="Next month">→</Button>
                {!isSameDay(selectedDay, now) && <Button variant="ghost" size="sm" onClick={() => setSelected(now)}>Today</Button>}
              </div>
              <select aria-label="Show coffee" className={clsx(baseInputClasses, "max-w-48")} value={coffeeFilter} onChange={(event) => setCoffeeFilter(event.target.value)}>
                <option value="all">All coffees</option>
                {coffees.map((coffee) => <option key={coffee.id} value={coffee.id}>{coffee.name}</option>)}
              </select>
            </div>
            <div className="overflow-hidden rounded-xl border border-border bg-surface">
              <div className="grid grid-cols-7 border-b border-border bg-surface-muted/60">
                {WEEKDAYS.map((weekday) => <div key={weekday} className="px-1 py-2 text-center text-[11px] font-semibold text-foreground-muted">{weekday}</div>)}
              </div>
              <div className="grid grid-cols-7">
                {days.map((day, index) => day ? (() => {
                  const summary = summaries[index]!;
                  const isToday = isSameDay(day, now);
                  const isSelected = isSameDay(day, selectedDay);
                  const label = new Intl.DateTimeFormat("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(day);
                  return (
                    <button key={formatDateOnly(day)} id={`day-${formatDateOnly(day)}`} type="button"
                      onClick={() => setSelected(day)} onKeyDown={(event) => onDateKeyDown(event, day)}
                      aria-label={`${label}: ${summary.peak.length} in peak, ${summary.drinkable.length} drinkable`}
                      aria-pressed={isSelected}
                      className={clsx("relative flex min-h-[4.25rem] min-w-0 flex-col items-start border-b border-r border-border p-1.5 text-left transition-colors hover:bg-brand-tint/60 sm:min-h-[6rem] sm:p-2",
                        isSelected ? "bg-brand-tint" : "bg-surface")}>
                      <span className={clsx("inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold sm:size-7 sm:text-sm",
                        isToday ? "bg-brand text-primary-foreground" : "text-foreground")}>{day.getDate()}</span>
                      {(summary.peak.length > 0 || summary.drinkable.length > 0) && (
                        <span className="mt-auto flex items-center gap-1.5 text-[10px] font-medium leading-4 sm:text-xs">
                          {summary.peak.length > 0 && <span className="inline-flex items-center gap-1 text-status-peak-text"><span aria-hidden="true" className="size-1.5 rounded-full bg-current" />{summary.peak.length}</span>}
                          {summary.drinkable.length > 0 && <span className="inline-flex items-center gap-1 text-status-drinkable-text"><span aria-hidden="true" className="size-1.5 rounded-full bg-current" />{summary.drinkable.length}</span>}
                        </span>
                      )}
                      {summary.peak.length > 0 && <span className="hidden w-full truncate text-[11px] font-medium text-foreground-muted md:block">{summary.peak[0].coffee.name}</span>}
                    </button>
                  );
                })() : <div key={`empty-${index}`} aria-hidden="true" className="min-h-[4.25rem] border-b border-r border-border bg-surface-muted/30 sm:min-h-[6rem]" />)}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-5 text-xs text-foreground-muted">
              <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-status-peak-text" />In peak</span>
              <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-status-drinkable-text" />Drinkable</span>
              <span>Numbers count coffees.</span>
            </div>
          </section>
          <aside aria-label="Selected day" className="surface-panel h-fit p-5 xl:sticky xl:top-20">
            <p className="eyebrow mb-2">Selected day</p>
            <h2 className="font-display text-2xl font-semibold tracking-tight">{new Intl.DateTimeFormat("en-AU", { weekday: "long", day: "numeric", month: "long" }).format(selectedDay)}</h2>
            <p className="mt-1 text-sm text-foreground-muted">{selectedRows.length} {selectedRows.length === 1 ? "coffee" : "coffees"} in your collection</p>
            <div className="mt-5 border-t border-border">
              {selectedRows.length === 0 ? (
                <p className="py-5 text-sm leading-6 text-foreground-muted">No saved coffees have been roasted by this date.</p>
              ) : selectedRows.map(({ coffee, window, status }) => (
                <Link key={coffee.id} href={`/coffee/${coffee.id}`} className="block border-b border-border py-4 last:border-0 hover:text-brand">
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0 font-semibold leading-5">{coffee.name}</span>
                    <StatusBadge status={status as CoffeeStatus} size="sm" />
                  </div>
                  <p className="mt-1 text-xs text-foreground-muted">{coffee.roaster} · {coffee.origin} · {PROCESS_OFFSETS[coffee.process].label}</p>
                  <p className="mt-2 text-xs text-foreground-muted">{statusLine(window, selectedDay)}</p>
                </Link>
              ))}
            </div>
            <Link href="/search" className="mt-4 inline-block text-sm font-semibold text-brand underline decoration-brand/40 underline-offset-4 hover:text-brand-strong">Plan for another date</Link>
          </aside>
        </div>
      )}
    </div>
  );
}

export default function CalendarPage() {
  return <AuthGate title="Calendar"><CalendarContent /></AuthGate>;
}
