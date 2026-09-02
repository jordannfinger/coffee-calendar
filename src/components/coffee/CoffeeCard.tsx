import Link from "next/link";
import type { CoffeeRow } from "@/lib/coffee/coffeeTypes";
import { calculateCoffeeWindow, getCoffeeStatus, peakProgress } from "@/lib/coffee/engine";
import { differenceInCalendarDays, formatShort, parseDateOnly, today } from "@/lib/coffee/dateUtils";
import { StatusBadge } from "@/lib/coffee/statusIcons";
import { PROCESS_OFFSETS } from "@/lib/coffee/model";
import type { ProfileOverrideIndex } from "@/lib/coffee/profileOverrides";
import { resolveOverride } from "@/lib/coffee/profileOverrides";
import { Card } from "@/components/ui/Card";

export function statusLine(coffee: ReturnType<typeof calculateCoffeeWindow>, onDate: Date): string {
  const status = getCoffeeStatus(coffee, onDate);
  if (status === "not_ready") {
    const days = differenceInCalendarDays(onDate, coffee.drinkableFrom);
    return `Ready in ${days} day${days === 1 ? "" : "s"}`;
  }
  if (status === "drinkable") {
    const days = differenceInCalendarDays(onDate, coffee.peakFrom);
    return `${days} day${days === 1 ? "" : "s"} until peak`;
  }
  if (status === "peak") {
    const progress = peakProgress(coffee, onDate);
    if (progress) {
      const remaining = progress.peakLengthDays - progress.dayOfPeak;
      return `Day ${progress.dayOfPeak} of ${progress.peakLengthDays} in peak — ${remaining} day${remaining === 1 ? "" : "s"} left`;
    }
    return "In peak";
  }
  if (status === "out_of_peak") {
    return `Out of peak since ${formatShort(coffee.peakUntil)}`;
  }
  return "Well past its best";
}

export function CoffeeCard({ coffee, overrides }: { coffee: CoffeeRow; overrides?: ProfileOverrideIndex }) {
  const roastDate = parseDateOnly(coffee.roast_date);
  const overrideProfile = resolveOverride(overrides, coffee.process, coffee.process_subtype, coffee.roast_level);
  const window = calculateCoffeeWindow({
    roastDate,
    process: coffee.process,
    processSubtype: coffee.process_subtype,
    roastLevel: coffee.roast_level,
    overrideProfile,
  });
  const status = getCoffeeStatus(window, today());
  const daysSinceRoast = differenceInCalendarDays(roastDate, today());

  return (
    <Link href={`/coffee/${coffee.id}`} className="block">
      <Card className="flex flex-col gap-3 transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold leading-tight">{coffee.name}</h3>
            <p className="text-sm text-foreground-muted">{coffee.roaster}</p>
          </div>
          <StatusBadge status={status} size="sm" />
        </div>

        <p className="text-xs text-foreground-muted">
          {PROCESS_OFFSETS[coffee.process].label} · Roasted {daysSinceRoast} day{daysSinceRoast === 1 ? "" : "s"} ago
        </p>

        <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
          <span className="text-foreground-muted">
            Peak {formatShort(window.peakFrom)} – {formatShort(window.peakUntil)}
          </span>
          <span className="font-medium text-foreground">{statusLine(window, today())}</span>
        </div>
      </Card>
    </Link>
  );
}
