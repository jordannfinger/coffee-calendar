"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthGate } from "@/components/auth/AuthGate";
import { CoffeeForm } from "@/components/coffee/CoffeeForm";
import { rowToFormValues, formValuesToInsert, type CoffeeFormValues } from "@/lib/coffee/coffeeTypes";
import { createClient } from "@/lib/supabase/client";
import { useCoffee } from "@/lib/coffee/useCoffee";
import { ResourceError } from "@/components/ui/ResourceError";

function EditCoffeeContent({ id }: { id: string }) {
  const router = useRouter();
  const { coffee, loading, error, refresh } = useCoffee(id);

  async function handleSubmit(values: CoffeeFormValues) {
    if (!values.roastDate) return { error: "Roast date is required." };
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Couldn't verify your session. Please try again." };

    const { data, error } = await supabase.from("coffees").update(formValuesToInsert(values, user.id)).eq("id", id).select("id").single();
    if (error || !data) return { error: "Couldn't confirm the save. Your draft is preserved; please try again." };
    router.push(`/coffee/${id}`);
  }

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6" aria-busy="true" />;
  if (error) return <div className="mx-auto max-w-3xl px-4 py-10"><ResourceError message={error} retry={refresh} /></div>;
  if (!coffee) {
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
      <CoffeeForm key={id} initialValues={rowToFormValues(coffee)} onSubmit={handleSubmit} submitLabel="Save changes" />
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
