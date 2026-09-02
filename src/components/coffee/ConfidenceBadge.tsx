import type { Confidence } from "@/lib/coffee/types";
import clsx from "clsx";

const LABEL: Record<Confidence, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

const CLASSES: Record<Confidence, string> = {
  high: "border-status-drinkable-border text-status-drinkable-text",
  medium: "border-status-peak-border text-status-peak-text",
  low: "border-status-out-of-peak-border text-status-out-of-peak-text",
};

export function ConfidenceBadge({ confidence, className }: { confidence: Confidence; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full border bg-surface px-2.5 py-1 text-xs font-medium", CLASSES[confidence], className)}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {LABEL[confidence]}
    </span>
  );
}
