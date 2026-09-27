"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ensureSession } from "@/lib/supabase/ensureSession";
import { AuthCard } from "@/components/auth/AuthCard";
import { Field, baseInputClasses } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    let currentUser;
    try {
      // Wait for the same guest initialization as Nav/AuthGate; never replace
      // a guest with a new account merely because validation is unavailable.
      currentUser = await ensureSession();
    } catch {
      setError("Couldn't verify your session. Please try again; your saved data has not been changed.");
      setLoading(false);
      return;
    }

    // If we already have an anonymous session, LINK it to a real account
    // instead of creating a separate one — this keeps the same user id, so
    // every coffee already saved carries straight over.
    const { error } = currentUser?.is_anonymous
      ? await supabase.auth.updateUser(
          { email, password },
          { emailRedirectTo: `${window.location.origin}/auth/callback` },
        )
      : await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <AuthCard title="Check your email">
        <p className="text-sm text-foreground-muted">
          We sent a confirmation link to <strong className="text-foreground">{email}</strong>. Click it to finish saving your data
          to this account — everything you&rsquo;ve already added will still be there.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Save your data" subtitle="Add an email and password so your coffees survive clearing cookies or a new device — everything you've added stays exactly as it is.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Field label="Email" htmlFor="signup-email">
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            required
            className={baseInputClasses}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password" htmlFor="signup-password" hint="At least 8 characters.">
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className={baseInputClasses}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label="Confirm password" htmlFor="signup-confirm-password">
          <input
            id="signup-confirm-password"
            type="password"
            autoComplete="new-password"
            required
            className={baseInputClasses}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </Field>
        {error && (
          <p role="alert" className="text-sm font-medium text-status-not-ready-text">
            {error}
          </p>
        )}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Saving…" : "Save my data"}
        </Button>
        <p className="text-center text-sm text-foreground-muted">
          Already have an account on another device?{" "}
          <Link href="/login" className="underline decoration-border underline-offset-2 hover:text-foreground">
            Log in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
