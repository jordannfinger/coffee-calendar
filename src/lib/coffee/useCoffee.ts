"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/useAuth";
import type { CoffeeRow } from "./coffeeTypes";

/** Detail and edit share the same distinction between absence and a failed read. */
export function useCoffee(id: string) {
  const { user, loading: authLoading, error: authError, retry: retryAuth } = useAuth();
  const userId = user?.id;
  const key = `${userId}:${id}`;
  const [result, setResult] = useState<{ key: string; coffee: CoffeeRow | null; error: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const version = useRef(0);
  const refresh = useCallback(async () => {
    if (!userId) return;
    const request = ++version.current;
    setLoading(true);
    try {
      const { data, error } = await createClient().from("coffees").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
      if (request !== version.current) return;
      setResult({ key, coffee: error ? null : data, error: error ? "Couldn't load this coffee. Please try again." : null });
    } catch {
      if (request === version.current) setResult({ key, coffee: null, error: "Couldn't load this coffee. Please try again." });
    } finally {
      if (request === version.current) setLoading(false);
    }
  }, [id, userId, key]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    return () => {
      // Invalidate requests, rather than capturing a DOM ref at effect setup.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      version.current++;
    };
  }, [refresh]);
  const current = result?.key === key ? result : null;
  return {
    coffee: current?.coffee ?? null,
    loading: authLoading || (!!userId && (loading || !current)),
    error: authError ?? current?.error ?? null,
    refresh: authError ? retryAuth : refresh,
    setCoffee: (coffee: CoffeeRow) => setResult({ key, coffee, error: null }),
  };
}
