"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

export type BrewLogRow = Tables<"brew_logs">;

export function useBrewLogs(coffeeId: string) {
  const [logs, setLogs] = useState<BrewLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("brew_logs")
      .select("*")
      .eq("coffee_id", coffeeId)
      .order("brewed_at", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setLogs(data ?? []);
      setError(null);
    }
    setLoading(false);
  }, [coffeeId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return { logs, loading, error, refresh };
}
