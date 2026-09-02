"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CoffeeRow } from "@/lib/coffee/coffeeTypes";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function ShareSection({ coffee, onChange }: { coffee: CoffeeRow; onChange: (coffee: CoffeeRow) => void }) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = coffee.share_token && typeof window !== "undefined" ? `${window.location.origin}/c/${coffee.share_token}` : null;

  async function handleShare() {
    setLoading(true);
    const supabase = createClient();
    const token = crypto.randomUUID();
    const { data, error } = await supabase.from("coffees").update({ share_token: token }).eq("id", coffee.id).select("*").single();
    setLoading(false);
    if (!error && data) onChange(data);
  }

  async function handleStopSharing() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.from("coffees").update({ share_token: null }).eq("id", coffee.id).select("*").single();
    setLoading(false);
    if (!error && data) onChange(data);
  }

  async function handleCopy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-display text-lg font-semibold">Share</h2>
      {shareUrl ? (
        <>
          <p className="text-sm text-foreground-muted">Anyone with this link can see this coffee’s drinking window — no login needed.</p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="flex-1 truncate rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs">{shareUrl}</code>
            <Button variant="secondary" size="sm" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy link"}
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={handleStopSharing} disabled={loading} className="self-start text-status-not-ready-text">
            {loading ? "Working…" : "Stop sharing"}
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-foreground-muted">Create a public link showing this coffee’s status and peak window — personal notes and quantity stay private.</p>
          <Button variant="secondary" size="sm" onClick={handleShare} disabled={loading} className="self-start">
            {loading ? "Creating…" : "Create share link"}
          </Button>
        </>
      )}
    </Card>
  );
}
