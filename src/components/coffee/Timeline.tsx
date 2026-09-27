import type { CoffeeWindow } from "@/lib/coffee/types";
import { differenceInCalendarDays, formatLong } from "@/lib/coffee/dateUtils";
import { useToday } from "@/lib/coffee/useToday";
import clsx from "clsx";

interface Segment {
  key: string;
  label: string;
  days: number;
  className: string;
}

/**
 * The signature "roast date → out of peak" horizontal timeline. Shows four
 * bands (not ready / drinkable / peak / out of peak) sized proportionally to
 * their length in days, plus a "today" marker when the current date falls
 * within the pictured range.
 */
export function Timeline({ window: coffeeWindow, className }: { window: CoffeeWindow; className?: string }) {
  const { roastDate, drinkableFrom, peakFrom, peakUntil, drinkableUntil } = coffeeWindow;

  const segments: Segment[] = [
    {
      key: "not_ready",
      label: "Not ready",
      days: Math.max(differenceInCalendarDays(roastDate, drinkableFrom), 0),
      className: "bg-status-not-ready-bg",
    },
    {
      key: "drinkable",
      label: "Drinkable",
      days: Math.max(differenceInCalendarDays(drinkableFrom, peakFrom), 0),
      className: "bg-status-drinkable-bg",
    },
    {
      key: "peak",
      label: "Peak",
      days: Math.max(differenceInCalendarDays(peakFrom, peakUntil) + 1, 0),
      className: "bg-status-peak-bg",
    },
    {
      key: "out_of_peak",
      label: "Out of peak",
      days: Math.max(differenceInCalendarDays(peakUntil, drinkableUntil), 0),
      className: "bg-status-out-of-peak-bg",
    },
  ];

  const totalDays = segments.reduce((sum, s) => sum + s.days, 0) || 1;
  const now = useToday();
  const todayOffsetDays = differenceInCalendarDays(roastDate, now);
  const showTodayMarker = todayOffsetDays >= 0 && differenceInCalendarDays(now, drinkableUntil) >= 0;
  // Each calendar day occupies one cell; put its marker in that cell's center.
  const todayPercent = ((todayOffsetDays + 0.5) / totalDays) * 100;

  return (
    <div className={clsx("w-full", className)}>
      <div className="relative">
        {showTodayMarker && (
          <div
            className="absolute -top-6 flex -translate-x-1/2 flex-col items-center text-xs font-semibold text-brand"
            style={{ left: `${todayPercent}%` }}
          >
            <span>Today</span>
            <span aria-hidden="true" className="h-2 w-0.5 bg-brand" />
          </div>
        )}
        <div className="flex h-3 w-full overflow-hidden rounded-full border border-border" role="img" aria-label={describeTimeline(segments)}>
          {segments.map((segment) => (
            <div
              key={segment.key}
              className={clsx(segment.className, "h-full first:rounded-l-full last:rounded-r-full")}
              style={{ width: `${(segment.days / totalDays) * 100}%` }}
              title={`${segment.label}: ${segment.days} day${segment.days === 1 ? "" : "s"}`}
            />
          ))}
        </div>
      </div>

      <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[11px] font-medium uppercase tracking-wide text-foreground-muted sm:text-xs">
        {segments.map((segment) => (
          <div key={segment.key}>{segment.label}</div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-foreground-muted sm:grid-cols-4">
        <DateLabel label="Roasted" date={roastDate} />
        <DateLabel label="Ready" date={drinkableFrom} />
        <DateLabel label="Peak" date={peakFrom} dateEnd={peakUntil} />
        <DateLabel label="Drinkable until" date={drinkableUntil} />
      </div>
    </div>
  );
}

function DateLabel({ label, date, dateEnd }: { label: string; date: Date; dateEnd?: Date }) {
  return (
    <div>
      <div className="text-foreground-muted">{label}</div>
      <div className="font-semibold text-foreground">
        {formatLong(date)}
        {dateEnd ? ` – ${formatLong(dateEnd)}` : ""}
      </div>
    </div>
  );
}

function describeTimeline(segments: Segment[]): string {
  return segments.map((s) => `${s.label} ${s.days} days`).join(", ");
}
