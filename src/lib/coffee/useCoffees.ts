"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CoffeeRow } from "./coffeeTypes";
import { useAuth } from "@/lib/supabase/useAuth";
import { fetchAllPages } from "./fetchAllPages";

export function useCoffees() {
  const { user, loading: authLoading, error: authError, retry: retryAuth } = useAuth();
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
      const coffees = await fetchAllPages<CoffeeRow>(async (from, to) => {
        if (version !== requestVersion.current) throw new Error("Stale inventory request");
        const { data, count, error } = await supabase.from("coffees")
          .select("*", { count: "exact" })
          .eq("user_id", userId)
          .order("roast_date", { ascending: false })
          .order("id", { ascending: false })
          .range(from, to);
        return { data, count, error };
      });
      if (version !== requestVersion.current) return;
      setResult({ userId, coffees, error: null });
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
    isAnonymous: user?.is_anonymous ?? false,
    loading: authLoading || (!!userId && (loading || !current)),
    error: authError ?? current?.error ?? null,
    refresh: authError ? retryAuth : refresh,
  };
}
