"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

export type BrewLogRow = Tables<"brew_logs">;

export function useBrewLogs(coffeeId: string) {
  const [logs, setLogs] = useState<BrewLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const version = useRef(0);

  const refresh = useCallback(async () => {
    const request = ++version.current;
    setLoading(true);
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("brew_logs")
        .select("*")
        .eq("coffee_id", coffeeId)
        .order("brewed_at", { ascending: false })
        .order("created_at", { ascending: false });
      if (request !== version.current) return;
      if (error) {
        setLogs([]);
        setError("Couldn't load the brew log. Please try again.");
      } else {
        setLogs(data ?? []);
        setError(null);
      }
    } catch {
      if (request === version.current) {
        setLogs([]);
        setError("Couldn't load the brew log. Please try again.");
      }
    } finally {
      if (request === version.current) setLoading(false);
    }
  }, [coffeeId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    return () => {
      // Invalidate requests, rather than capturing a DOM ref at effect setup.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      version.current++;
    };
  }, [refresh]);

  return { logs, loading, error, refresh };
}
