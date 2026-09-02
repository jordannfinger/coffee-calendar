"use client";

import { useRouter } from "next/navigation";
import { AuthGate } from "@/components/auth/AuthGate";
import { CoffeeForm } from "@/components/coffee/CoffeeForm";
import { EMPTY_COFFEE_FORM, formValuesToInsert, type CoffeeFormValues } from "@/lib/coffee/coffeeTypes";
import { createClient } from "@/lib/supabase/client";
import { formatDateOnly, today } from "@/lib/coffee/dateUtils";

function AddCoffeeContent() {
  const router = useRouter();

  async function handleSubmit(values: CoffeeFormValues) {
    if (!values.roastDate) {
      return { error: "Roast date is required." };
    }
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "You've been signed out — please log in again." };

    const { data, error } = await supabase
      .from("coffees")
      .insert(formValuesToInsert(values, user.id))
      .select("id")
      .single();

    if (error) return { error: error.message };
    router.push(`/coffee/${data.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 font-display text-3xl font-semibold">Add a coffee</h1>
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
