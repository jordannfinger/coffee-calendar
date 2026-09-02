"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./client";

/**
 * Every visitor gets a session automatically — no login screen required.
 * If there's no session yet, we sign in anonymously (Supabase's built-in
 * anonymous auth: a real `auth.uid()`, so RLS-protected data still works
 * exactly as it does for a "real" account). A visitor can later upgrade
 * their anonymous session to a permanent account (see /signup) without
 * losing any data, since it's the same underlying user id.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function ensureSession() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        if (!cancelled) {
          setUser(data.user);
          setLoading(false);
        }
        return;
      }

      const { data: anon, error } = await supabase.auth.signInAnonymously();
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setUser(anon.user);
      setLoading(false);
    }

    ensureSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading, error, isAnonymous: user?.is_anonymous ?? false };
}
