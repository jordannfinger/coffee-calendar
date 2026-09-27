"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CoffeeRow } from "@/lib/coffee/coffeeTypes";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function ShareSection({ coffee, onChange }: { coffee: CoffeeRow; onChange: (coffee: CoffeeRow) => void }) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);

  const shareUrl = coffee.share_token && typeof window !== "undefined" ? `${window.location.origin}/c/${coffee.share_token}` : null;

  async function updateSharing(token: string | null) {
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const { data, error } = await createClient().from("coffees").update({ share_token: token }).eq("id", coffee.id).select("*").single();
      if (error || !data) throw new Error("Sharing update not confirmed");
      onChange(data);
    } catch {
      setError(token === null
        ? "Couldn't stop sharing. Treat this link as still active; retry to confirm revocation."
        : "Couldn't create a share link. Please try again.");
    } finally {
      pending.current = false;
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    setCopied(false);
    setError(null);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      setError("Couldn't copy the link. Select and copy the displayed link instead.");
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-display text-lg font-semibold">Share</h2>
      {error && <p role="alert" className="text-sm text-status-not-ready-text">{error}</p>}
      {shareUrl ? (
        <>
          <p className="text-sm text-foreground-muted">Anyone with this link can see this coffee’s drinking window — no login needed.</p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="flex-1 truncate rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs">{shareUrl}</code>
            <Button variant="secondary" size="sm" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy link"}
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => updateSharing(null)} disabled={loading} className="self-start text-status-not-ready-text">
            {loading ? "Working…" : "Stop sharing"}
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-foreground-muted">Create a public link showing this coffee’s status and peak window — personal notes and quantity stay private.</p>
          <Button variant="secondary" size="sm" onClick={() => updateSharing(crypto.randomUUID())} disabled={loading} className="self-start">
            {loading ? "Creating…" : "Create share link"}
          </Button>
        </>
      )}
    </Card>
  );
}
