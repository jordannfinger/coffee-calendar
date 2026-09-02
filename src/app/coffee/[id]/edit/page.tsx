"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthGate } from "@/components/auth/AuthGate";
import { CoffeeForm } from "@/components/coffee/CoffeeForm";
import { rowToFormValues, formValuesToInsert, type CoffeeFormValues, type CoffeeRow } from "@/lib/coffee/coffeeTypes";
import { createClient } from "@/lib/supabase/client";

function EditCoffeeContent({ id }: { id: string }) {
  const router = useRouter();
  const [coffee, setCoffee] = useState<CoffeeRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

  async function handleSubmit(values: CoffeeFormValues) {
    if (!values.roastDate) return { error: "Roast date is required." };
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "You've been signed out — please log in again." };

    const { error } = await supabase.from("coffees").update(formValuesToInsert(values, user.id)).eq("id", id);
    if (error) return { error: error.message };
    router.push(`/coffee/${id}`);
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 font-display text-3xl font-semibold">Edit {coffee.name}</h1>
      <CoffeeForm initialValues={rowToFormValues(coffee)} onSubmit={handleSubmit} submitLabel="Save changes" />
    </div>
  );
}

export default function EditCoffeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AuthGate title="Edit coffee">
      <EditCoffeeContent id={id} />
    </AuthGate>
  );
}
