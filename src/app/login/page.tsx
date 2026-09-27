"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { waitForSessionInitialization } from "@/lib/supabase/ensureSession";
import { AuthCard } from "@/components/auth/AuthCard";
import { Field, baseInputClasses } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

type Mode = "password" | "magic_link";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  async function handlePasswordLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    await waitForSessionInitialization();
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/today");
    router.refresh();
  }

  async function handleMagicLink(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    await waitForSessionInitialization();
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMagicLinkSent(true);
  }

  return (
    <AuthCard title="Log in" subtitle="Welcome back — pick up your saved coffees where you left off.">
      <div className="mb-5 flex rounded-full border border-border bg-surface-muted p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => setMode("password")}
          className={`flex-1 rounded-full py-1.5 transition-colors ${mode === "password" ? "bg-surface shadow-sm" : "text-foreground-muted"}`}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => setMode("magic_link")}
          className={`flex-1 rounded-full py-1.5 transition-colors ${mode === "magic_link" ? "bg-surface shadow-sm" : "text-foreground-muted"}`}
        >
          Magic link
        </button>
      </div>

      {mode === "password" ? (
        <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4" noValidate>
          <Field label="Email" htmlFor="login-email">
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              className={baseInputClasses}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Password" htmlFor="login-password">
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              className={baseInputClasses}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          {error && (
            <p role="alert" className="text-sm font-medium text-status-not-ready-text">
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Logging in…" : "Log in"}
          </Button>
          <div className="flex items-center justify-between text-sm text-foreground-muted">
            <Link href="/reset-password" className="underline decoration-border underline-offset-2 hover:text-foreground">
              Forgot password?
            </Link>
            <Link href="/signup" className="underline decoration-border underline-offset-2 hover:text-foreground">
              Save my data instead
            </Link>
          </div>
        </form>
      ) : magicLinkSent ? (
        <p className="text-sm text-foreground-muted">
          Check <strong className="text-foreground">{email}</strong> for a link to log in — you can close this tab.
        </p>
      ) : (
        <form onSubmit={handleMagicLink} className="flex flex-col gap-4" noValidate>
          <Field label="Email" htmlFor="login-magic-email" hint="We'll send a one-time link — no password needed.">
            <input
              id="login-magic-email"
              type="email"
              autoComplete="email"
              required
              className={baseInputClasses}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          {error && (
            <p role="alert" className="text-sm font-medium text-status-not-ready-text">
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Sending…" : "Send magic link"}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
