import { PROCESSES } from "@/lib/coffee/types";
import { PROCESS_OFFSETS, ROAST_LEVEL_BASELINE } from "@/lib/coffee/model";
import { ROAST_LEVELS } from "@/lib/coffee/types";
import { ConfidenceBadge } from "@/components/coffee/ConfidenceBadge";
import { Card } from "@/components/ui/Card";

export const metadata = {
  title: "About the model — Coffee Calendar",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold">How Coffee Calendar works</h1>
      <p className="mt-2 text-foreground-muted">Filter coffee only — no espresso. Here’s the model behind every date on this site.</p>

      <section className="mt-8 flex flex-col gap-3">
        <h2 className="font-display text-xl font-semibold">The three questions</h2>
        <p className="text-foreground-muted">Everything in Coffee Calendar exists to answer three things well:</p>
        <ol className="list-decimal space-y-1 pl-5 text-foreground-muted">
          <li>Can I drink this coffee yet?</li>
          <li>Is this coffee at its peak?</li>
          <li>If I want coffee on a particular date, when should I order or roast it?</li>
        </ol>
      </section>

      <section className="mt-8 flex flex-col gap-3">
        <h2 className="font-display text-xl font-semibold">The model</h2>
        <p className="text-foreground-muted">
          We start from a roast-level baseline (in days since roast) for washed process — the best-documented, most consistent case
          across specialty roaster guidance — then apply a per-process day offset representing how much extra settling time a
          process’s fermentation intensity tends to need. Wet-hulled is the one process with a <em>negative</em> offset: it’s
          consistently described as best enjoyed fresh.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-foreground-muted">
                <th scope="col" className="px-4 py-3 font-medium">
                  Roast level
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Ready (washed)
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Peak (washed)
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Drinkable until (washed)
                </th>
              </tr>
            </thead>
            <tbody>
              {ROAST_LEVELS.map((level) => {
                const b = ROAST_LEVEL_BASELINE[level];
                return (
                  <tr key={level} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{b.label}</td>
                    <td className="px-4 py-3">Day {b.minRestDays}</td>
                    <td className="px-4 py-3">
                      Day {b.peakStartDays}–{b.peakEndDays}
                    </td>
                    <td className="px-4 py-3">Day {b.drinkableEndDays}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 flex flex-col gap-3">
        <h2 className="font-display text-xl font-semibold">Processes</h2>
        <div className="flex flex-col gap-3">
          {PROCESSES.map((process) => {
            const p = PROCESS_OFFSETS[process];
            return (
              <Card key={process} className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">{p.label}</h3>
                  <ConfidenceBadge confidence={p.confidence} />
                </div>
                <p className="text-sm text-foreground-muted">{p.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mt-8 flex flex-col gap-3">
        <h2 className="font-display text-xl font-semibold">Uncertainty, on purpose</h2>
        <Card className="flex flex-col gap-3 text-sm text-foreground-muted">
          <p>
            Coffee development varies by roast profile, coffee density, packaging, storage, and brewing method. These dates are
            estimates, not rules — coffee can taste excellent outside its predicted peak window.
          </p>
          <p>
            Every window carries a confidence rating. <strong className="text-foreground">High confidence</strong> means the
            combination is well documented across multiple independent sources (washed process, lighter roasts).{" "}
            <strong className="text-foreground">Medium confidence</strong> means real, converging guidance exists but with more
            variation between sources. <strong className="text-foreground">Low confidence</strong> means the process is newer,
            more producer-specific, or has little published resting guidance — common for exotic and experimental fermentation
            styles.
          </p>
          <p>
            The full research write-up — sources, direct quotes, and where the evidence is thin — lives in{" "}
            <code className="rounded bg-surface-muted px-1 py-0.5 text-xs">docs/coffee-development-research.md</code> in this
            project’s repository.
          </p>
        </Card>
      </section>
    </div>
  );
}
