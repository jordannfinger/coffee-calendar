"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { calculateCoffeeWindow, getCoffeeStatus } from "@/lib/coffee/engine";
import { parseDateOnly, today } from "@/lib/coffee/dateUtils";
import { PROCESS_OFFSETS, ROAST_LEVEL_BASELINE } from "@/lib/coffee/model";
import { Timeline } from "@/components/coffee/Timeline";
import { StatusBadge } from "@/lib/coffee/statusIcons";
import { ConfidenceBadge } from "@/components/coffee/ConfidenceBadge";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";
import type { SharedCoffee } from "@/lib/supabase/sharedCoffee";

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
  const [coffee, setCoffee] = useState<SharedCoffee | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    // A token change must not leave a previous coffee or failure on screen.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setCoffee(null);
    setNotFound(false);
    setError(null);
    supabase
      .rpc("get_shared_coffee", { token: shareToken })
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error && error.code !== "22P02") setError("Couldn't load this share link. Please try again.");
        else if (!data) setNotFound(true);
        else setCoffee(data);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [shareToken]);

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6" aria-busy="true" />;

  if (error) return <p role="alert" className="mx-auto max-w-3xl px-4 py-14 sm:px-6">{error}</p>;

  if (notFound || !coffee) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6">
        <p className="text-foreground-muted">This share link is no longer active.</p>
        <Link href="/" className="mt-4 inline-block underline decoration-border underline-offset-2">
          Go to Coffee Calendar
        </Link>
      </div>
    );
  }

  const coffeeWindow = calculateCoffeeWindow({
    roastDate: parseDateOnly(coffee.roast_date),
    process: coffee.process,
    processSubtype: coffee.process_subtype,
    roastLevel: coffee.roast_level,
  });
  const status = getCoffeeStatus(coffeeWindow, today());

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-foreground-muted">Shared coffee</p>
      <h1 className="font-display text-3xl font-semibold">{coffee.name}</h1>
      <p className="text-foreground-muted">{coffee.roaster}</p>

      <Card className="my-6 flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Drinking window</h2>
          <div className="flex items-center gap-2">
            <StatusBadge status={status} />
            <ConfidenceBadge confidence={coffeeWindow.confidence} />
          </div>
        </div>
        <Timeline window={coffeeWindow} className="pt-6" />
        <p className="text-sm text-foreground-muted">{coffeeWindow.notes}</p>
      </Card>

      <Card className="mb-6">
        <h2 className="mb-4 font-display text-lg font-semibold">Details</h2>
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
          <h2 className="mb-4 font-display text-lg font-semibold">Brewing</h2>
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

      <Card className="bg-brand-tint/50 text-center text-sm text-foreground-muted">
        Track your own coffee at{" "}
        <Link href="/" className={buttonClasses("secondary", "sm", "ml-2")}>
          Coffee Calendar →
        </Link>
      </Card>
    </div>
  );
}
