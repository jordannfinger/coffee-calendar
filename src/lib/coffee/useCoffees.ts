"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CoffeeRow } from "./coffeeTypes";

export function useCoffees() {
  const [coffees, setCoffees] = useState<CoffeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.from("coffees").select("*").order("roast_date", { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setCoffees(data ?? []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // refresh() is a stable, mount-time data fetch — not a cascading render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return { coffees, loading, error, refresh };
}
