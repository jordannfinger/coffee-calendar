import Link from "next/link";
import { CoffeeCalculator } from "@/components/coffee/CoffeeCalculator";
import { LandingFilm } from "@/components/landing/LandingFilm";
import { buttonClasses } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <div className="page-shell !pt-4 sm:!pt-7">
      <section className="grid overflow-hidden rounded-lg bg-[#172b21] text-[#f7f7f3] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center">
        <div className="px-6 py-10 sm:px-10 sm:py-14 lg:px-12 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#a6d4b5]">For filter coffee, in its time</p>
          <h1 className="mt-5 max-w-[11ch] font-display text-[clamp(2.75rem,5.2vw,5.3rem)] font-medium leading-[1.04] tracking-[-.055em]">
            Your best cup has its day.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-[#d2dfd3]">
            Find when each roast opens up, reaches its peak, and deserves a place in your morning.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#calculator" className={buttonClasses("secondary", "lg", "!border-[#f7f7f3] !bg-[#f7f7f3] !text-[#172b21] hover:!bg-[#e4eee7]")}>Find your window</a>
            <Link href="/calendar" className="inline-flex min-h-12 items-center px-3 text-sm font-semibold text-[#f7f7f3] underline decoration-[#a6d4b5] underline-offset-4 transition-colors hover:text-[#a6d4b5]">Explore the calendar</Link>
          </div>
        </div>
        <div className="min-w-0 border-t border-[#456456] lg:border-l lg:border-t-0">
          <LandingFilm />
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-[11px] font-semibold uppercase tracking-[.12em] text-[#c7d9ca] sm:px-5">
            <span>The film</span><span>20 seconds · Sound available</span>
          </div>
          <details className="border-t border-[#456456] px-4 py-3 text-xs leading-5 text-[#c7d9ca] sm:px-5">
            <summary className="w-fit text-xs font-semibold underline decoration-[#789982] underline-offset-4 hover:text-white">Film credits</summary>
            <p className="mt-2 max-w-xl">
              Footage from <a className="underline underline-offset-2" href="https://www.pexels.com/video/slow-pour-over-coffee-brewing-in-filter-37771208/">Pexels</a>,{" "}
              <a className="underline underline-offset-2" href="https://www.pexels.com/video/pour-over-coffee-in-making-5564283/">Pexels</a>, and{" "}
              <a className="underline underline-offset-2" href="https://www.pexels.com/video/pouring-coffee-on-a-cup-9356233/">Pexels</a>.
              Music: <a className="underline underline-offset-2" href="https://ende.app/en/song/12874-happy-beats-business-moves-vol-9">Happy Beats &amp; Business Moves, Vol. 9 by Ende</a>,{" "}
              <a className="underline underline-offset-2" href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Excerpt trimmed and mixed with sound effects.
            </p>
          </details>
        </div>
      </section>

      <section id="calculator" aria-labelledby="calculator-heading" className="scroll-mt-24 pt-12 sm:pt-16">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow mb-1">Start with your roast date</p>
            <h2 id="calculator-heading" className="section-title">Drinking window calculator</h2>
          </div>
          <span className="text-sm text-foreground-muted">No account needed</span>
        </div>
        <CoffeeCalculator />
      </section>

      <section aria-label="Explore Coffee Calendar" className="mt-12 grid border-t border-border md:grid-cols-2">
        <div className="border-b border-border py-7 md:border-b-0 md:border-r md:pr-10">
          <p className="eyebrow mb-2">Your coffee, in context</p>
          <h2 className="section-title">Keep track of every bag</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-foreground-muted">Save a coffee once. See its best days on the calendar, decide what to drink today, and record the brews you want to remember.</p>
          <Link href="/coffee/new" className={buttonClasses("secondary", "md", "mt-5")}>Add your first coffee</Link>
        </div>
        <div className="py-7 md:pl-10">
          <p className="eyebrow mb-2">Looking ahead</p>
          <h2 className="section-title">Start with a date</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-foreground-muted">Pick the day you want to brew. Find which saved coffees will be at their best, or when to look for a fresh roast.</p>
          <Link href="/search" className={buttonClasses("secondary", "md", "mt-5")}>Find a roast date</Link>
        </div>
      </section>
    </div>
  );
}
