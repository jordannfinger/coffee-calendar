import type { CoffeeStatus } from "./types";
import { STATUS_META } from "./engine";
import clsx from "clsx";

const STATUS_CLASSES: Record<CoffeeStatus, string> = {
  not_ready: "bg-status-not-ready-bg text-status-not-ready-text border-status-not-ready-border",
  drinkable: "bg-status-drinkable-bg text-status-drinkable-text border-status-drinkable-border",
  peak: "bg-status-peak-bg text-status-peak-text border-status-peak-border",
  out_of_peak: "bg-status-out-of-peak-bg text-status-out-of-peak-text border-status-out-of-peak-border",
  too_old: "bg-status-too-old-bg text-status-too-old-text border-status-too-old-border",
};

export function StatusBadge({
  status,
  size = "md",
  className,
}: {
  status: CoffeeStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const meta = STATUS_META[status];
  const sizeClasses =
    size === "sm" ? "text-xs px-2 py-0.5 gap-1" : size === "lg" ? "text-base px-3.5 py-1.5 gap-2" : "text-sm px-2.5 py-1 gap-1.5";

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md border font-medium whitespace-nowrap",
        STATUS_CLASSES[status],
        sizeClasses,
        className,
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      <span>{meta.label}</span>
    </span>
  );
}

export function statusClasses(status: CoffeeStatus): string {
  return STATUS_CLASSES[status];
}
