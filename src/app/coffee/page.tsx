"use client";

import Link from "next/link";
import { AuthGate } from "@/components/auth/AuthGate";
import { useCoffees } from "@/lib/coffee/useCoffees";
import { useProfileOverrides } from "@/lib/coffee/useProfileOverrides";
import { CoffeeCard } from "@/components/coffee/CoffeeCard";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

function MyCoffeeContent() {
  const { coffees, loading, error } = useCoffees();
  const overrides = useProfileOverrides();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold">My Coffee</h1>
        <Link href="/coffee/new" className={buttonClasses("primary")}>
          + Add coffee
        </Link>
      </div>

      {loading && <p className="text-sm text-foreground-muted">Loading your coffees…</p>}
      {error && <p className="text-sm font-medium text-status-not-ready-text">{error}</p>}

      {!loading && !error && coffees.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="font-display text-lg font-semibold">No coffees yet</p>
          <p className="max-w-sm text-sm text-foreground-muted">Add your first bag to see its drinking window, track it on your calendar, and get it ranked on Drink Today.</p>
          <Link href="/coffee/new" className={buttonClasses("primary")}>
            + Add your first coffee
          </Link>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {coffees.map((coffee) => (
          <CoffeeCard key={coffee.id} coffee={coffee} overrides={overrides} />
        ))}
      </div>
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
