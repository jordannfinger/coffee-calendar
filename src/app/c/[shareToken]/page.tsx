"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { calculateCoffeeWindow, getCoffeeStatus } from "@/lib/coffee/engine";
import { parseDateOnly } from "@/lib/coffee/dateUtils";
import { useToday } from "@/lib/coffee/useToday";
import { useProfileOverrides } from "@/lib/coffee/useProfileOverrides";
import { resolveOverride } from "@/lib/coffee/profileOverrides";
import { PROCESS_OFFSETS, ROAST_LEVEL_BASELINE } from "@/lib/coffee/model";
import { Timeline } from "@/components/coffee/Timeline";
import { StatusBadge } from "@/lib/coffee/statusIcons";
import { ConfidenceBadge } from "@/components/coffee/ConfidenceBadge";
import { Card } from "@/components/ui/Card";
import { ResourceError } from "@/components/ui/ResourceError";
import type { Database } from "@/lib/supabase/database.types";

type SharedCoffee = Database["public"]["Functions"]["get_shared_coffee"]["Returns"][number];

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs uppercase tracking-wide text-foreground-muted">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

export default function SharedCoffeePage({ params }: { params: Promise<{ shareToken: string }> }) {
  const { shareToken } = use(params);
  const now = useToday();
  const overrides = useProfileOverrides();
  const [coffee, setCoffee] = useState<SharedCoffee | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    // A token change must not leave a previous coffee or failure on screen.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setCoffee(null);
    setNotFound(false);
    setError(null);
    void (async () => {
      try {
        const { data, error } = await supabase.rpc("get_shared_coffee", { token: shareToken }).maybeSingle();
        if (cancelled) return;
        if (error && error.code !== "22P02") setError("Couldn't load this share link. Please try again.");
        else if (!data) setNotFound(true);
        else setCoffee(data);
      } catch {
        if (!cancelled) setError("Couldn't load this share link. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shareToken, attempt]);

  if (loading) return <div className="page-shell max-w-3xl" aria-busy="true"><div className="h-8 w-48 animate-pulse rounded bg-surface-muted" /><div className="mt-8 h-48 animate-pulse rounded bg-surface-muted" /></div>;

  if (error) return <div className="page-shell max-w-3xl"><ResourceError message={error} retry={() => setAttempt(value => value + 1)} /></div>;

  if (notFound || !coffee) {
    return (
      <div className="page-shell max-w-3xl">
        <p className="eyebrow">Shared coffee</p>
        <h1 className="page-title mt-3">This link is no longer active</h1>
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-brand-strong underline underline-offset-4">Go to Coffee Calendar</Link>
      </div>
    );
  }

  const coffeeWindow = calculateCoffeeWindow({
    roastDate: parseDateOnly(coffee.roast_date),
    process: coffee.process,
    processSubtype: coffee.process_subtype,
    roastLevel: coffee.roast_level,
    overrideProfile: resolveOverride(overrides, coffee.process, coffee.process_subtype, coffee.roast_level),
  });
  const status = getCoffeeStatus(coffeeWindow, now);

  return (
    <div className="page-shell max-w-3xl">
      <p className="eyebrow">Shared coffee</p>
      <h1 className="page-title mt-3">{coffee.name}</h1>
      <p className="mt-2 text-foreground-muted">{coffee.roaster}</p>

      <Card className="my-6 flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title">Drinking window</h2>
          <div className="flex items-center gap-2">
            <StatusBadge status={status} />
            <ConfidenceBadge confidence={coffeeWindow.confidence} />
          </div>
        </div>
        <Timeline window={coffeeWindow} className="pt-6" />
        <p className="text-sm text-foreground-muted">{coffeeWindow.notes}</p>
      </Card>

      <Card className="mb-6">
        <h2 className="section-title mb-4">Details</h2>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <DetailRow label="Origin" value={coffee.origin} />
          <DetailRow label="Process" value={`${PROCESS_OFFSETS[coffee.process].label}${coffee.process_subtype ? ` — ${coffee.process_subtype}` : ""}`} />
          <DetailRow label="Roast level" value={ROAST_LEVEL_BASELINE[coffee.roast_level].label} />
          <DetailRow label="Variety" value={coffee.variety} />
          <DetailRow label="Producer" value={coffee.producer} />
          <DetailRow label="Region" value={coffee.region} />
          <DetailRow label="Elevation" value={coffee.elevation_m ? `${coffee.elevation_m} m` : null} />
          <DetailRow label="Storage" value={coffee.storage_method} />
        </dl>
        {coffee.tasting_notes && (
          <div className="mt-4 border-t border-border pt-4">
            <DetailRow label="Tasting notes" value={coffee.tasting_notes} />
          </div>
        )}
      </Card>

      {(coffee.brew_method || coffee.grind_setting || coffee.recipe || coffee.dose_g || coffee.water_g) && (
        <Card className="mb-6">
          <h2 className="section-title mb-4">Brewing</h2>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <DetailRow label="Brew method" value={coffee.brew_method} />
            <DetailRow label="Grind setting" value={coffee.grind_setting} />
            <DetailRow label="Dose" value={coffee.dose_g ? `${coffee.dose_g} g` : null} />
            <DetailRow label="Water" value={coffee.water_g ? `${coffee.water_g} g` : null} />
          </dl>
          {coffee.recipe && (
            <div className="mt-4 border-t border-border pt-4">
              <DetailRow label="Recipe" value={coffee.recipe} />
            </div>
          )}
        </Card>
      )}

      <p className="border-t border-border pt-6 text-sm text-foreground-muted">
        Plan your own coffee dates with <Link href="/" className="font-semibold text-brand-strong underline underline-offset-4">Coffee Calendar</Link>.
      </p>
    </div>
  );
}
