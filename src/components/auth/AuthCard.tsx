import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-7 px-4 py-12 sm:px-6 sm:py-16">
      <div>
        <p className="eyebrow mb-2">Coffee Calendar</p>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="mt-3 text-sm leading-6 text-foreground-muted">{subtitle}</p>}
      </div>
      <Card>{children}</Card>
    </div>
  );
}
