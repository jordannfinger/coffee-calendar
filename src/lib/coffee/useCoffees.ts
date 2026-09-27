"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CoffeeRow } from "./coffeeTypes";
import { useAuth } from "@/lib/supabase/useAuth";

export function useCoffees() {
  const { user, loading: authLoading, error: authError } = useAuth();
  const userId = user?.id;
  const [result, setResult] = useState<{ userId: string; coffees: CoffeeRow[]; error: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const requestVersion = useRef(0);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const version = ++requestVersion.current;
    setLoading(true);
    const supabase = createClient();
    try {
      const { data, error } = await supabase.from("coffees").select("*").eq("user_id", userId).order("roast_date", { ascending: false });
      if (version !== requestVersion.current) return;
      setResult({ userId, coffees: error ? [] : data ?? [], error: error?.message ?? null });
    } catch {
      if (version !== requestVersion.current) return;
      setResult({ userId, coffees: [], error: "Couldn't load your coffees. Please try again." });
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    // refresh() is a stable, mount-time data fetch — not a cascading render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    return () => {
      // This is a request counter, not a DOM ref: invalidate every pending refresh.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      requestVersion.current++;
    };
  }, [refresh]);

  const current = userId && result?.userId === userId ? result : null;
  return {
    coffees: current?.coffees ?? [],
    loading: authLoading || (!!userId && (loading || !current)),
    error: authError ?? current?.error ?? null,
    refresh,
  };
}
