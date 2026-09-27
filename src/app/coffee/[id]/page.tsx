"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthGate } from "@/components/auth/AuthGate";
import { createClient } from "@/lib/supabase/client";
import type { CoffeeRow } from "@/lib/coffee/coffeeTypes";
import { calculateCoffeeWindow, getCoffeeStatus } from "@/lib/coffee/engine";
import { parseDateOnly } from "@/lib/coffee/dateUtils";
import { useToday } from "@/lib/coffee/useToday";
import { useProfileOverrides } from "@/lib/coffee/useProfileOverrides";
import { resolveOverride } from "@/lib/coffee/profileOverrides";
import { PROCESS_OFFSETS, ROAST_LEVEL_BASELINE } from "@/lib/coffee/model";
import { Timeline } from "@/components/coffee/Timeline";
import { StatusBadge } from "@/lib/coffee/statusIcons";
import { ConfidenceBadge } from "@/components/coffee/ConfidenceBadge";
import { BrewLogSection } from "@/components/coffee/BrewLogSection";
import { ShareSection } from "@/components/coffee/ShareSection";
import { Card } from "@/components/ui/Card";
import { Button, buttonClasses } from "@/components/ui/Button";

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs uppercase tracking-wide text-foreground-muted">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function CoffeeDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const [coffee, setCoffee] = useState<CoffeeRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const overrides = useProfileOverrides();
  const now = useToday();

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("coffees")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (!data) setNotFound(true);
        else setCoffee(data);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleDelete() {
    if (!coffee) return;
    if (!window.confirm(`Delete "${coffee.name}"? This can't be undone.`)) return;
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("coffees").delete().eq("id", coffee.id);
    setDeleting(false);
    if (!error) router.push("/coffee");
  }

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6" aria-busy="true" />;
  if (notFound || !coffee) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6">
        <p className="text-foreground-muted">Coffee not found.</p>
        <Link href="/coffee" className="mt-4 inline-block underline decoration-border underline-offset-2">
          Back to My Coffee
        </Link>
      </div>
    );
  }

  const roastDate = parseDateOnly(coffee.roast_date);
  const overrideProfile = resolveOverride(overrides, coffee.process, coffee.process_subtype, coffee.roast_level);
  const coffeeWindow = calculateCoffeeWindow({
    roastDate,
    process: coffee.process,
    processSubtype: coffee.process_subtype,
    roastLevel: coffee.roast_level,
    overrideProfile,
  });
  const status = getCoffeeStatus(coffeeWindow, now);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">{coffee.name}</h1>
          <p className="text-foreground-muted">{coffee.roaster}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/coffee/${coffee.id}/edit`} className={buttonClasses("secondary", "sm")}>
            Edit
          </Link>
          <Button variant="secondary" size="sm" onClick={handleDelete} disabled={deleting} className="text-status-not-ready-text">
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>

      <Card className="mb-6 flex flex-col gap-5">
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
          <DetailRow label="Lot" value={coffee.lot} />
          <DetailRow label="Harvest year" value={coffee.harvest_year} />
          <DetailRow label="Order date" value={coffee.order_date} />
          <DetailRow label="Bag size" value={coffee.bag_size_g ? `${coffee.bag_size_g} g` : null} />
          <DetailRow label="Remaining" value={coffee.remaining_percent !== null ? `${coffee.remaining_percent}%` : null} />
          <DetailRow label="Rating" value={coffee.rating ? `${coffee.rating} / 5` : null} />
          <DetailRow label="Storage" value={coffee.storage_method} />
          <DetailRow label="Bag opened" value={coffee.bag_opened_date} />
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

      {coffee.notes && (
        <Card className="mb-6">
          <h2 className="mb-2 font-display text-lg font-semibold">Personal notes</h2>
          <p className="text-sm text-foreground">{coffee.notes}</p>
        </Card>
      )}

      <div className="mb-6">
        <BrewLogSection coffeeId={coffee.id} />
      </div>

      <ShareSection coffee={coffee} onChange={(updated) => setCoffee(updated)} />
    </div>
  );
}

export default function CoffeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AuthGate title="Coffee detail">
      <CoffeeDetailContent id={id} />
    </AuthGate>
  );
}
