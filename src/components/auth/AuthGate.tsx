"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/supabase/useAuth";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";

export function AuthGate({ title, children }: { title: string; children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6" aria-busy="true" aria-live="polite" />;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
        <Card className="flex flex-col items-center gap-4 text-center">
          <h1 className="font-display text-xl font-semibold">{title}</h1>
          <p className="text-sm text-foreground-muted">Log in or create a free account to unlock this feature.</p>
          <div className="flex gap-3">
            <Link href="/login" className={buttonClasses("secondary")}>
              Log in
            </Link>
            <Link href="/signup" className={buttonClasses("primary")}>
              Sign up
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
