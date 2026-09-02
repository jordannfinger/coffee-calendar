import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface-muted">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-foreground-muted sm:px-6">
        <p className="max-w-2xl">
          Coffee development varies by roast profile, coffee density, packaging, storage, and brewing method. Treat every date on
          Coffee Calendar as an estimate, not a rule — coffee can taste excellent outside its predicted peak window.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span>Coffee Calendar · filter coffee only</span>
          <Link href="/about" className="underline decoration-border underline-offset-2 hover:text-foreground">
            How the model works
          </Link>
        </div>
      </div>
    </footer>
  );
}
