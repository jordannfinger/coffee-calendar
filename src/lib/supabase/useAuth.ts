"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./client";
import { ensureSession } from "./ensureSession";

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
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setAttempt(value => value + 1);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let authVersion = 0;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // INITIAL_SESSION(null) is not a failed startup: anonymous signup may still be pending.
      if (cancelled || _event === "INITIAL_SESSION") return;
      authVersion++;
      setUser(session?.user ?? null);
      setError(null);
      setLoading(false);
    });

    const initialVersion = authVersion;
    // Defer so an already-unmounted consumer cannot start anonymous signup.
    void Promise.resolve().then(async () => {
      if (cancelled) return;
      try {
        const currentUser = await ensureSession();
        if (cancelled || authVersion !== initialVersion) return;
        setUser(currentUser);
        setError(null);
      } catch (cause) {
        if (cancelled || authVersion !== initialVersion) return;
        setError(cause instanceof Error ? cause.message : "Couldn't start your session. Please try again.");
      } finally {
        if (!cancelled && authVersion === initialVersion) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [attempt]);

  return { user, loading, error, retry, isAnonymous: user?.is_anonymous ?? false };
}
