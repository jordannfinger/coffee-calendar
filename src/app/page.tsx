import Link from "next/link";
import { CoffeeCalculator } from "@/components/coffee/CoffeeCalculator";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";

const HOW_IT_WORKS = [
  { step: "1", title: "Enter your roast date", body: "The single most important input — everything else is calculated relative to it." },
  { step: "2", title: "Choose the process", body: "Washed, natural, anaerobic, carbonic maceration, and more — each settles at a different pace." },
  { step: "3", title: "See your drinking window", body: "Not ready, drinkable, peak, and out of peak — mapped onto an actual calendar." },
];

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-10 sm:px-6 sm:py-14">
      <section className="flex flex-col gap-6 text-center sm:gap-8">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Know when your <em className="text-brand not-italic font-medium">coffee</em> is ready.
          </h1>
          <p className="text-balance text-lg text-foreground-muted">
            Roast date in. Peak drinking window out. Coffee Calendar tells you when your filter coffee is ready to drink, when it
            peaks, and when it’s had its best days — for every process and roast level.
          </p>
        </div>
      </section>

      <section aria-labelledby="calculator-heading" className="flex flex-col gap-4">
        <h2 id="calculator-heading" className="sr-only">
          Coffee calculator
        </h2>
        <CoffeeCalculator />
      </section>

      <section aria-labelledby="how-it-works-heading" className="flex flex-col gap-6">
        <h2 id="how-it-works-heading" className="text-center font-display text-2xl font-semibold sm:text-3xl">
          How it works
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {HOW_IT_WORKS.map((item) => (
            <Card key={item.step} className="flex flex-col gap-2">
              <span className="font-display text-2xl font-semibold text-brand">{item.step}</span>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm text-foreground-muted">{item.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="planner-heading">
        <Card className="flex flex-col items-start gap-4 bg-brand-tint/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 id="planner-heading" className="font-display text-xl font-semibold sm:text-2xl">
              Planning ahead? Work backward from a date.
            </h2>
            <p className="text-sm text-foreground-muted sm:max-w-xl">
              Tell us when you want coffee, and we’ll tell you when to order it and what roast date to look for — across every
              process.
            </p>
          </div>
          <Link href="/search" className={buttonClasses("primary", "lg", "shrink-0")}>
            Plan a date →
          </Link>
        </Card>
      </section>

      <section aria-labelledby="account-heading">
        <Card className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 id="account-heading" className="font-display text-xl font-semibold sm:text-2xl">
              Track your own coffee — no account needed
            </h2>
            <p className="text-sm text-foreground-muted sm:max-w-xl">
              Save coffees, see a personal calendar, and get a ranked answer to &ldquo;what should I drink today?&rdquo; right away.
              Add an email later only if you want your data to survive clearing cookies or follow you to a new device.
            </p>
          </div>
          <Link href="/coffee/new" className={buttonClasses("secondary", "lg", "shrink-0")}>
            Start tracking →
          </Link>
        </Card>
      </section>
    </div>
  );
}
