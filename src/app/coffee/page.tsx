"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AuthGate } from "@/components/auth/AuthGate";
import { useCoffees } from "@/lib/coffee/useCoffees";
import { useProfileOverrides } from "@/lib/coffee/useProfileOverrides";
import { resolveOverride } from "@/lib/coffee/profileOverrides";
import { calculateCoffeeWindow, getCoffeeStatus, STATUS_META, STATUS_ORDER } from "@/lib/coffee/engine";
import { parseDateOnly } from "@/lib/coffee/dateUtils";
import { useToday } from "@/lib/coffee/useToday";
import { PROCESS_OFFSETS } from "@/lib/coffee/model";
import { CoffeeCard } from "@/components/coffee/CoffeeCard";
import { exportCoffeesAsCsv, exportCoffeesAsJson } from "@/lib/coffee/exportCoffees";
import { buttonClasses, Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ResourceError } from "@/components/ui/ResourceError";
import { baseInputClasses } from "@/components/ui/Field";
import type { CoffeeStatus } from "@/lib/coffee/types";

type SortKey = "status" | "roast_date_desc" | "roast_date_asc" | "name";

function MyCoffeeContent() {
  const { coffees, isAnonymous, loading, error, refresh } = useCoffees();
  const overrides = useProfileOverrides();
  const now = useToday();

  const [statusFilter, setStatusFilter] = useState<CoffeeStatus | "all">("all");
  const [processFilter, setProcessFilter] = useState<string>("all");
  const [roasterFilter, setRoasterFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("status");

  const roasters = useMemo(() => Array.from(new Set(coffees.map((c) => c.roaster))).sort(), [coffees]);

  const rows = useMemo(() => {
    return coffees.map((coffee) => {
      const overrideProfile = resolveOverride(overrides, coffee.process, coffee.process_subtype, coffee.roast_level);
      const window = calculateCoffeeWindow({
        roastDate: parseDateOnly(coffee.roast_date),
        process: coffee.process,
        processSubtype: coffee.process_subtype,
        roastLevel: coffee.roast_level,
        overrideProfile,
      });
      return { coffee, status: getCoffeeStatus(window, now) };
    });
  }, [coffees, overrides, now]);

  const visible = useMemo(() => {
    let filtered = rows;
    if (statusFilter !== "all") filtered = filtered.filter((r) => r.status === statusFilter);
    if (processFilter !== "all") filtered = filtered.filter((r) => r.coffee.process === processFilter);
    if (roasterFilter !== "all") filtered = filtered.filter((r) => r.coffee.roaster === roasterFilter);

    const sorted = [...filtered];
    if (sortKey === "status") {
      sorted.sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));
    } else if (sortKey === "roast_date_desc") {
      sorted.sort((a, b) => b.coffee.roast_date.localeCompare(a.coffee.roast_date));
    } else if (sortKey === "roast_date_asc") {
      sorted.sort((a, b) => a.coffee.roast_date.localeCompare(b.coffee.roast_date));
    } else {
      sorted.sort((a, b) => a.coffee.name.localeCompare(b.coffee.name));
    }
    return sorted.map((r) => r.coffee);
  }, [rows, statusFilter, processFilter, roasterFilter, sortKey]);

  const usedProcesses = useMemo(() => Array.from(new Set(coffees.map((c) => c.process))), [coffees]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold">My Coffee</h1>
        <div className="flex items-center gap-2">
          {coffees.length > 0 && (
            <>
              <Button variant="secondary" size="sm" onClick={() => exportCoffeesAsCsv(coffees)}>
                Export CSV
              </Button>
              <Button variant="secondary" size="sm" onClick={() => exportCoffeesAsJson(coffees)}>
                Export JSON
              </Button>
            </>
          )}
          <Link href="/coffee/new" className={buttonClasses("primary")}>
            + Add coffee
          </Link>
        </div>
      </div>

      {!loading && !error && isAnonymous && coffees.length > 0 && (
        <Card role="region" aria-labelledby="guest-data-heading" className="mb-6 flex flex-col gap-3 bg-brand-tint/50 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="guest-data-heading" className="font-display text-lg font-semibold">Keep your coffees if you change devices</h2>
            <p className="mt-1 text-sm text-foreground-muted">
              This guest session is tied to this browser. If you clear its site data, you cannot reopen these coffees. Save your data
              with an account, or download a JSON copy to keep your own record.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link href="/signup" className={buttonClasses("primary")}>Save my data</Link>
            <Button variant="secondary" onClick={() => exportCoffeesAsJson(coffees)}>Download JSON</Button>
          </div>
        </Card>
      )}

      {loading && <p className="text-sm text-foreground-muted">Loading your coffees…</p>}
      {error && <ResourceError message={error} retry={refresh} />}

      {!loading && !error && coffees.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="font-display text-lg font-semibold">No coffees yet</p>
          <p className="max-w-sm text-sm text-foreground-muted">Add your first bag to see its drinking window, track it on your calendar, and get it ranked on Drink Today.</p>
          <Link href="/coffee/new" className={buttonClasses("primary")}>
            + Add your first coffee
          </Link>
        </Card>
      )}

      {!loading && !error && coffees.length > 0 && (
        <>
          <Card className="mb-6 flex flex-wrap items-center gap-3 py-3">
            <select
              aria-label="Filter by status"
              className={`${baseInputClasses} w-auto`}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CoffeeStatus | "all")}
            >
              <option value="all">All statuses</option>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].emoji} {STATUS_META[s].label}
                </option>
              ))}
            </select>

            <select aria-label="Filter by process" className={`${baseInputClasses} w-auto`} value={processFilter} onChange={(e) => setProcessFilter(e.target.value)}>
              <option value="all">All processes</option>
              {usedProcesses.map((p) => (
                <option key={p} value={p}>
                  {PROCESS_OFFSETS[p].label}
                </option>
              ))}
            </select>

            {roasters.length > 1 && (
              <select aria-label="Filter by roaster" className={`${baseInputClasses} w-auto`} value={roasterFilter} onChange={(e) => setRoasterFilter(e.target.value)}>
                <option value="all">All roasters</option>
                {roasters.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            )}

            <select aria-label="Sort by" className={`${baseInputClasses} ml-auto w-auto`} value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
              <option value="status">Sort: Status</option>
              <option value="roast_date_desc">Sort: Roast date (newest)</option>
              <option value="roast_date_asc">Sort: Roast date (oldest)</option>
              <option value="name">Sort: Name</option>
            </select>
          </Card>

          {visible.length === 0 ? (
            <p className="text-sm text-foreground-muted">No coffees match those filters.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((coffee) => (
                <CoffeeCard key={coffee.id} coffee={coffee} overrides={overrides} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function MyCoffeePage() {
  return (
    <AuthGate title="My Coffee">
      <MyCoffeeContent />
    </AuthGate>
  );
}
