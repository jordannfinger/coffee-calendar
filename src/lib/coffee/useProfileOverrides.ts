"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { buildOverrideIndex, type ProfileOverrideIndex } from "./profileOverrides";

/**
 * Loads `process_profiles` override rows (publicly readable) once on mount.
 * Returns an empty index until the fetch resolves, so callers can render
 * formula-based results immediately and swap in overrides when they arrive.
 */
export function useProfileOverrides(): ProfileOverrideIndex {
  const [index, setIndex] = useState<ProfileOverrideIndex>(new Map());

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase
      .from("process_profiles")
      .select("*")
      .then(({ data }) => {
        if (!cancelled && data) setIndex(buildOverrideIndex(data));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return index;
}
