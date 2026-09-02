import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-14 sm:px-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-foreground-muted">{subtitle}</p>}
      </div>
      <Card>{children}</Card>
    </div>
  );
}
