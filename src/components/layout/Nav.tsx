"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import clsx from "clsx";
import { useAuth } from "@/lib/supabase/useAuth";
import { createClient } from "@/lib/supabase/client";
import { buttonClasses } from "@/components/ui/Button";

const NAV_LINKS = [
  { href: "/today", label: "Today" },
  { href: "/calendar", label: "Calendar" },
  { href: "/coffee", label: "My coffee" },
  { href: "/search", label: "Plan a date" },
];

function Mark() {
  return (
    <span className="flex size-8 items-center justify-center rounded-md bg-brand text-primary-foreground" aria-hidden="true">
      <svg viewBox="0 0 24 24" className="size-5" fill="none">
        <path d="M5 8.5h14M8 5v6m8-6v6M5.5 5.5h13v13h-13z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 14.5c.9-.9 1.9-.9 3 0s2.1.9 3 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isAnonymous } = useAuth();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  async function handleSignOut() {
    await createClient().auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  function active(href: string) {
    return pathname === href || (href === "/coffee" && pathname.startsWith("/coffee/") && pathname !== "/coffee/new");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface" onKeyDown={(event) => {
      if (event.key === "Escape" && open) { setOpen(false); menuButton.current?.focus(); }
    }}>
      <div className="mx-auto flex h-16 max-w-[76rem] items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 text-sm font-bold tracking-tight text-foreground sm:text-base" onClick={() => setOpen(false)}>
          <Mark />
          <span>Coffee Calendar</span>
        </Link>
        <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} aria-current={active(link.href) ? "page" : undefined}
              className={clsx("rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-surface-muted hover:text-foreground",
                active(link.href) ? "bg-brand-tint text-brand-strong" : "text-foreground-muted")}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 lg:flex">
          {!loading && user && (isAnonymous
            ? <Link href="/signup" className="px-3 py-2 text-sm font-medium text-foreground-muted hover:text-foreground">Save my data</Link>
            : <button onClick={handleSignOut} className="px-3 py-2 text-sm font-medium text-foreground-muted hover:text-foreground">Log out</button>)}
          <Link href="/coffee/new" className={buttonClasses("primary", "sm")}>Add coffee</Link>
        </div>
        <div className="ml-auto hidden sm:block lg:hidden">
          <Link href="/coffee/new" className={buttonClasses("primary", "sm")}>Add coffee</Link>
        </div>
        <button ref={menuButton} type="button" className="ml-auto flex size-11 items-center justify-center rounded-md text-foreground hover:bg-surface-muted sm:ml-0 lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"} aria-controls="mobile-menu" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open
            ? <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
            : <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>}
        </button>
      </div>
      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="border-t border-border bg-surface px-4 pb-4 pt-2 shadow-sm lg:hidden">
          <div className="mx-auto flex max-w-[76rem] flex-col">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} aria-current={active(link.href) ? "page" : undefined}
                className={clsx("rounded-md px-3 py-3 text-sm font-medium", active(link.href) ? "bg-brand-tint text-brand-strong" : "text-foreground-muted hover:bg-surface-muted")}>
                {link.label}
              </Link>
            ))}
            <Link href="/coffee/new" onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-sm font-medium text-foreground-muted hover:bg-surface-muted sm:hidden">Add coffee</Link>
            <div className="mt-2 border-t border-border pt-2">
              {!loading && user && (isAnonymous
                ? <><Link href="/signup" onClick={() => setOpen(false)} className="block rounded-md px-3 py-3 text-sm font-medium text-foreground-muted hover:bg-surface-muted">Save my data</Link>
                    <Link href="/login" onClick={() => setOpen(false)} className="block rounded-md px-3 py-3 text-sm font-medium text-foreground-muted hover:bg-surface-muted">Log in</Link></>
                : <button onClick={handleSignOut} className="w-full rounded-md px-3 py-3 text-left text-sm font-medium text-foreground-muted hover:bg-surface-muted">Log out</button>)}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
