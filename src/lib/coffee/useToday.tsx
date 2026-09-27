"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { addCalendarDays, formatDateOnly, parseDateOnly, today } from "./dateUtils";

const TodayContext = createContext<Date | null>(null);

/** One calendar-day clock for the whole app, including suspended tabs and DST. */
export function watchCurrentDay(onDay: (day: string) => void): () => void {
  let timer: ReturnType<typeof setTimeout>;
  function refresh() {
    clearTimeout(timer);
    const now = new Date();
    onDay(formatDateOnly(now));
    timer = setTimeout(refresh, addCalendarDays(now, 1).getTime() - now.getTime());
  }
  function resume() {
    if (document.visibilityState === "visible") refresh();
  }
  refresh();
  document.addEventListener("visibilitychange", resume);
  return () => {
    clearTimeout(timer);
    document.removeEventListener("visibilitychange", resume);
  };
}

export function TodayProvider({ initialDay, children }: { initialDay: string; children: ReactNode }) {
  const [day, setDay] = useState(initialDay);
  useEffect(() => watchCurrentDay(setDay), []);
  const value = useMemo(() => parseDateOnly(day), [day]);
  return <TodayContext.Provider value={value}>{children}</TodayContext.Provider>;
}

export function useToday(): Date {
  // Standalone renders still work; the application always mounts TodayProvider.
  return useContext(TodayContext) ?? today();
}
