"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { CoffeeForm } from "@/components/coffee/CoffeeForm";
import { EMPTY_COFFEE_FORM, formValuesToInsert, type CoffeeFormValues } from "@/lib/coffee/coffeeTypes";
import { createClient } from "@/lib/supabase/client";
import { formatDateOnly, today } from "@/lib/coffee/dateUtils";

function AddCoffeeContent() {
  const router = useRouter();
  // Reuse the ID after an uncertain response so a retry cannot insert a second bag.
  const draftId = useRef<string | null>(null);

  async function handleSubmit(values: CoffeeFormValues) {
    if (!values.roastDate) {
      return { error: "Roast date is required." };
    }
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Couldn't verify your session. Please try again." };

    const { data, error } = await supabase
      .from("coffees")
      .upsert({ ...formValuesToInsert(values, user.id), id: draftId.current ??= crypto.randomUUID() }, { onConflict: "id" })
      .select("id")
      .single();

    if (error || !data) return { error: "Couldn't confirm the save. Your draft is preserved; check My Coffee before retrying." };
    router.push(`/coffee/${data.id}`);
  }

  return (
    <div className="page-shell max-w-3xl">
      <div className="mb-7"><p className="eyebrow mb-2">Your collection</p><h1 className="page-title">Add a coffee</h1><p className="mt-2 text-sm text-foreground-muted">Start with what is printed on the bag. Add brewing details whenever you like.</p></div>
      <CoffeeForm
        initialValues={{ ...EMPTY_COFFEE_FORM, roastDate: formatDateOnly(today()) }}
        onSubmit={handleSubmit}
        submitLabel="Save coffee"
      />
    </div>
  );
}

export default function AddCoffeePage() {
  return (
    <AuthGate title="Add a coffee">
      <AddCoffeeContent />
    </AuthGate>
  );
}
