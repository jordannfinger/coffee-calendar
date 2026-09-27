"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { useAuth } from "@/lib/supabase/useAuth";
import { createClient } from "@/lib/supabase/client";

const NAV_LINKS = [
  { href: "/today", label: "Today" },
  { href: "/calendar", label: "Calendar" },
  { href: "/search", label: "Date Search" },
  { href: "/coffee", label: "My Coffee" },
  { href: "/coffee/new", label: "Add Coffee" },
  { href: "/about", label: "About" },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isAnonymous } = useAuth();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
          <span aria-hidden="true">☕</span>
          Coffee Calendar
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                  active ? "bg-brand-tint text-brand-strong" : "text-foreground-muted hover:bg-surface-muted hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {loading || !user ? null : isAnonymous ? (
            <>
              <Link href="/login" className="rounded-full px-4 py-2 text-sm font-medium text-foreground-muted hover:bg-surface-muted">
                Log in
              </Link>
              <Link href="/signup" className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-strong">
                Save my data
              </Link>
            </>
          ) : (
            <button
              onClick={handleSignOut}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-muted"
            >
              Log out
            </button>
          )}
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-full text-foreground md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden="true" className="text-xl">
            {open ? "✕" : "☰"}
          </span>
        </button>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Main" className="border-t border-border bg-surface px-4 py-3 md:hidden">
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={pathname === link.href ? "page" : undefined}
                  className={clsx(
                    "block rounded-lg px-3 py-2.5 text-sm font-medium",
                    pathname === link.href ? "bg-brand-tint text-brand-strong" : "text-foreground-muted hover:bg-surface-muted",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
            {loading || !user ? null : isAnonymous ? (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground-muted hover:bg-surface-muted">
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-brand px-3 py-2.5 text-center text-sm font-medium text-primary-foreground hover:bg-brand-strong"
                >
                  Save my data
                </Link>
              </>
            ) : (
              <button onClick={handleSignOut} className="rounded-lg border border-border px-3 py-2.5 text-left text-sm font-medium text-foreground-muted">
                Log out
              </button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
