"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
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
    const { error } = await supabase.auth.signUp({
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
          We sent a confirmation link to <strong className="text-foreground">{email}</strong>. Click it to activate your account,
          then come back and log in.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Create your account" subtitle="Save coffees, see your calendar, and get a ranked drink-today list.">
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
          {loading ? "Creating account…" : "Create account"}
        </Button>
        <p className="text-center text-sm text-foreground-muted">
          Already have an account?{" "}
          <Link href="/login" className="underline decoration-border underline-offset-2 hover:text-foreground">
            Log in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
