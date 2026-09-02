"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/lib/supabase/useAuth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

/**
 * Every visitor gets a working (anonymous) session automatically — see
 * useAuth. This no longer gates on "logged in or not"; it just waits for
 * that session to finish initializing, and shows a retry state in the rare
 * case session setup itself fails (e.g. a network hiccup).
 */
export function AuthGate({ title, children }: { title: string; children: ReactNode }) {
  const { user, loading, error } = useAuth();

  if (loading) {
    return <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6" aria-busy="true" aria-live="polite" />;
  }

  if (!user || error) {
    return (
      <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
        <Card className="flex flex-col items-center gap-4 text-center">
          <h1 className="font-display text-xl font-semibold">{title}</h1>
          <p className="text-sm text-foreground-muted">
            {error ? "Couldn't start your session — check your connection and try again." : "Something went wrong starting your session."}
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
