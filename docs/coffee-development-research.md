# Filter Coffee Development Model — Research & Rationale

This document is the sourcing and reasoning behind the default "days since roast" milestones used by Coffee Calendar (`src/lib/coffee/model.ts`). It is **not a scientific paper** — it's a synthesis of specialty-coffee roaster guidance, a handful of trade/industry studies, and general CO2-degassing chemistry, assembled into a defensible starting point for a consumer app. Treat every number here as an estimate to be refined with real user feedback, not as ground truth.

**Scope note:** this research is specific to **filter/drip/pour-over coffee**, not espresso. Espresso is far more sensitive to residual CO2 (it disrupts crema, extraction, and puck integrity under pressure) and is conventionally rested longer. Filter brewing is more forgiving because gas released during blooming simply escapes into open air rather than fighting back-pressure — several sources below make this distinction explicitly.

---

## 1. How roast level affects resting time and staling speed

**Consensus direction:** lighter roasts are denser and less porous, so CO2 escapes more slowly — they take longer to reach a good drinking window, but that same dense structure also means they hold their flavor and CO2 cushion longer before going stale. Darker roasts have a more fractured, porous cell structure (more roasting heat/time = more internal cracking), so they degas — and stale — faster.

- James Hoffmann's guidance (as summarized by multiple secondary sources citing his book/videos): filter coffee can be "good" around **4–5 days** post-roast for a medium roast, while a very light roast may want up to **10 days**. ([kafeido.com summary of Hoffmann](https://www.kafeido.com/en-us/blogs/coffee/resting-roasted-coffee-beans))
- "Dark roasts should rest 3–5 days while light roasts need 7–10 days to degas." ([RAVE Coffee et al., aggregated in Prufrock-adjacent search results](https://ravecoffee.co.uk/blogs/news/resting-coffee))
- "Darker roasts off-gas faster because the bean is more porous... a dark roast [can be] ready in 3–4 days; a very light roast might need 7–10 [days]." Barista Hustle research is cited as showing **light roasts often don't reach their flavour potential until days 14–21** ("Stage 3" of degassing, where CO2 is low enough that extraction efficiency peaks). ([Coffee On Cue, summarizing Barista Hustle](https://www.coffeeoncue.com.au/blogs/how-to-make-coffee/coffee-degassing-four-stage-flavour-evolution-guide); [Barista Hustle glossary: Degas](https://www.baristahustle.com/glossary/degas/))
- Academic/porosity mechanism: "light roast has a dense structure with fewer pores, while dark roast has a looser structure with more pores... the porous structure developed... determines the residual CO2 content after roasting, as well as subsequent CO2 mass transport during storage." This tracks with a University of Guelph thesis on CO2 formation/degassing behavior and a *Food Research International* paper on roasting conditions and CO2 degassing. ([Effect of roasting conditions on CO2 degassing — ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0963996914000337); [Understanding CO2 Formation & Degassing — U. Guelph thesis](https://atrium.lib.uoguelph.ca/server/api/core/bitstreams/ee9d7e24-7df2-42b0-a66a-e88dc6f2c70e/content))
- Staling side: "Light roasts, in particular, tend to preserve their complex aromas better over a longer period, while darker roasts degrade more rapidly," attributed partly to surface oils exposed by the more porous, broken-down structure of dark roasts oxidizing faster.

**A useful dissenting/nuancing data point — Scott Rao.** Rao (*The Coffee Roaster's Companion*) pushes back on a universal "rest longer = better" rule and ties optimal rest more to roaster type/airflow than roast color alone. Notably, in his own testing he found **dark roasts can go rancid within days and shouldn't be rested more than ~1 day**, while **air-roasted (e.g., Loring) beans may want 1–4 weeks**. This is a genuinely different framing from most consumer-facing roaster blogs (which treat "dark = rest less" and "light = rest more" as the operative rule but don't recommend near-zero rest for dark roasts) — we've kept the mainstream "dark roasts rest for a shorter but still non-trivial number of days" framing as the app default because it's what the overwhelming majority of roaster-facing sources recommend for **filter** brewing, but it's worth knowing this dissent exists. ([Scott Rao — Resting Roasts: Is Fresher Better?](https://www.scottrao.com/blog/restingbeans))

**Net effect on the model:** roast level should scale both ends of the timeline — a slower "developmentFactor" for how long it takes to become ready/peak, and a separate (steeper) "longevityFactor" for how long it stays good, since darker roasts lose ground faster than their faster ramp-up alone would suggest.

---

## 2. How process/fermentation intensity affects development

**Consensus direction, roughly in order of published agreement:**

1. **Washed is the cleanest, most-consensus case.** Mucilage is removed before drying, so the bean enters the roaster more structurally uniform, and roaster guidance for washed coffee is the most consistent (typically clustering around **5–14 days** rest for filter). This is treated as the model's high-confidence baseline.
2. **Naturals and honey/pulped naturals generally need *more* time, not less**, contrary to a common assumption that "the fruit's already forward so you can drink it sooner." Multiple sources agree natural-process coffee retains more CO2 and volatile compounds from drying with the whole cherry intact, and needs longer to settle:
   - "Natural coffees retain more CO₂ and require a longer degassing period, around **10 to 14 days**." ([GEVI, aggregating roaster guidance](https://gevi.com/blogs/coffee-knowledge/how-to-degass-coffee-beans-resting-guide))
   - "[Wait] around seven or eight days [for washed]... [naturals need] approximately two weeks... because the seed has stayed in the cherry for a longer time." — Daniel Horbat, founder of Sumo Coffee Roasters, quoted via MTPak. ([mtpak.coffee](https://mtpak.coffee/2020/12/degassing-coffee-how-long-does-it-take/))
   - "Washed coffees usually peak in flavor after six to 15 days, while naturally prepared coffees reach their sweet spot between ten and 20 days." (secondary aggregation, directionally consistent with the above two primary-ish sources)
   - A small independent cupping study (see below) found naturally- and honey-processed coffees showed **"the largest and most consistent [positive] changes"** in cupping score across 4–22 days of rest, while washed coffees showed **minimal change** beyond the first few days — i.e., washed peaks and plateaus fast; natural/honey keeps improving for longer.
3. **Heavily fermented / anaerobic / "exotic" processes are anecdotally described as needing *even more* rest** to let intense, sometimes "funky"/boozy fermentation aromatics integrate — and are also described as holding a wider, later, longer peak window because they carry more soluble fermentation byproducts:
   - "It's important to rest fermented coffees for around **a month** after roasting, as opposed to 10 to 14 days for non-fermented lighter roast profiles. Two to three weeks for espresso isn't unusual for a heavily processed anaerobic." ([Headcount Coffee](https://www.headcountcoffee.com/blogs/coffee-news/how-fermentation-changes-coffee-flavor-notes-anaerobic-extended-yeast-based))
   - "You experience this aromatic tendency [funk] immediately when you open a bag of anaerobically fermented coffee, yet once you brew it, it is much less dominating" — i.e., the funk that seems overwhelming out-of-bag is partly an aroma/CO2 artifact that resting (and brewing itself) tames. ([Barista Magazine](https://www.baristamagazine.com/getting-funky-with-anaerobic-fermentation/))
   - "Carbonic maceration coffees need up to **23 days** of degassing and resting before reaching peak flavor" — one of the more specific numeric claims found, though from an aggregator rather than a named roaster/scientist, so treated as a directional signal rather than a hard number. ([secondary aggregation])
   - Experimental/exotic lots (co-ferments, thermal shock, etc.) are described as "totally unpredictable" and get noticeably **more oily in appearance the longer they're left off-roast** compared to traditionally processed lots of similar age — a qualitative hint that CO2/oil migration behaves differently, but no source gives a clean day-range for these newer techniques (koji, thermal shock). We treat that absence of data as a genuine evidence gap, not a reason to guess wildly — these are modeled as similar in intensity to anaerobic/lactic fermentation, flagged **Low confidence**.
4. **Wet-hulled (Indonesian giling basah) is the clear outlier in the other direction.** Hulling at 35–50% moisture produces a low-density, low-acid, heavy-bodied bean, and specialty sources consistently describe it as best enjoyed fresh rather than needing a long rest:
   - "Wet-hulled coffee skips prolonged drying, hulling beans at 35–50% moisture, which mutes acidity and emphasizes a heavy, syrupy body with earthy, herbal notes." Because the cup is already "naturally deep and low-acid," staling is harder to detect by taste alone, but the underlying degassing/staling chemistry still applies — the recommendation to buy/use wet-hulled coffee **within 2–4 weeks of roast** is if anything tighter than for delicate washed lots, not looser. ([weaverscoffee.com](https://weaverscoffee.com/blogs/blog/what-is-sumatran-coffee), general Sumatra-coffee sourcing pages)
   - We did not find a source giving wet-hulled a *long* minimum rest; the pattern across sourcing/roaster pages is "low acid, low density, drink it fresh, don't overthink long resting periods" — consistent with the community understanding the user described. Evidence here is thinner than for washed/natural (most pages talk about origin/flavor, not resting mechanics specifically), so this is flagged **Medium confidence** at best, **Low** for uncommon roast-level pairings (e.g. a light-roast wet-hulled coffee is unusual in practice).

**A genuinely useful primary-ish data point — the Cafe Kreyol post-roast rest study.** This is a small, non-peer-reviewed but methodologically explicit cupping study (Girard & Stazzone) that directly tested the "how long should coffee rest" question across process types:

- 21 coffees, 4 regions, 5 countries, **8 distinct processing methods**, all roasted identically on an Ikawa Pro sample roaster.
- Cupped at rest intervals of **4, 8, 11, 17, and 22 days** post-roast, double-blind, ≥3 experienced cuppers per session including at least one licensed Q-grader.
- **94.73% of coffees reached peak cupping score after 72 hours** — i.e., well past the 8–24 hour evaluation window used by CQI/SCA green-grading protocols (note: that finding is about *cupping/QC timing*, not necessarily "best drinking day for a home consumer," but it's a strong data point that early-rest tasting undersells a coffee).
- Only 1 of 21 coffees peaked at the standard 24-hour mark; **over 73% didn't peak until 8+ days** of rest.
- **Naturally processed and honey-processed coffees showed the largest and most consistent [upward] changes** in score through the full 22-day window; **washed coffees showed minimal positive change** beyond the first several days — directly supporting "washed settles/peaks fast, natural/honey keeps developing longer."
- ([cafekreyol.com — How Long Should Coffee Rest?](https://cafekreyol.com/research/post-roast-rest-study/))

**Net effect on the model:** process is modeled as a single "fermentation intensity" scalar (washed = 1.0 baseline) that shifts every milestone outward, with wet-hulled as the one process with intensity *below* 1.0. Rest/peak-start shift the most (settling time for fermentation aromatics dominates there); the "too old" ceiling shifts the least, since staling chemistry (oxidation, generic CO2 loss) matters more than fermentation character by the time a coffee is genuinely old.

---

## 3. Concrete day-ranges found, quoted with source

| Claim | Source |
|---|---|
| "Leaving coffee to rest for anything between **5 – 14 days** post-roast allows for the flavours to open up, offering much clarity to your cup." (filter) | [Square Mile Coffee Roasters — Rest is Best](https://squaremileblog.com/2020/06/25/rest-is-best/) |
| "To get the best out of your espresso let it rest for **7 – 14 days** after it has been roasted." (contrast case, not filter) | [Square Mile Coffee Roasters — Rest is Best](https://squaremileblog.com/2020/06/25/rest-is-best/) |
| Filter coffee "good" **4–5 days** post-roast for medium roast; light roast may want up to **10 days** | James Hoffmann, via [kafeido.com summary](https://www.kafeido.com/en-us/blogs/coffee/resting-roasted-coffee-beans) |
| "Pulling shots of coffee roasted recently and ground on demand results in massive amounts of crema and lower extractions than shots pulled from beans several weeks off roast." (espresso-specific CO2 mechanism) | [Scott Rao — Resting Roasts: Is Fresher Better?](https://www.scottrao.com/blog/restingbeans) |
| Dark roast (drum) rest "no more than one day" before rancidity risk; air-roasted (Loring) beans may want **1–4 weeks** | [Scott Rao — Resting Roasts: Is Fresher Better?](https://www.scottrao.com/blog/restingbeans) |
| "In the first 24 hours after roasting, coffee releases approximately **40%** of absorbed CO2," then slows sharply | Multiple aggregator sources, consistent with SCA literature review below |
| Washed: wait "around **seven or eight days**" (quoting Daniel Horbat, Sumo Coffee Roasters); natural: "approximately **two weeks**" | [mtpak.coffee — How Long Does It Take Coffee to Degas?](https://mtpak.coffee/2020/12/degassing-coffee-how-long-does-it-take/) |
| Light roasts "often don't reach their flavour potential until days **14–21**" | [Coffee On Cue, summarizing Barista Hustle degassing-stage research](https://www.coffeeoncue.com.au/blogs/how-to-make-coffee/coffee-degassing-four-stage-flavour-evolution-guide) |
| "Rest fermented coffees for around **a month** after roasting, as opposed to **10 to 14 days** for non-fermented lighter roast profiles" | [Headcount Coffee — How Fermentation Changes Coffee Flavor Notes](https://www.headcountcoffee.com/blogs/coffee-news/how-fermentation-changes-coffee-flavor-notes-anaerobic-extended-yeast-based) |
| Carbonic maceration "up to **23 days**" to reach peak flavor | Secondary aggregation (directional, not a named primary source — treat cautiously) |
| Onyx Coffee Lab: specialty coffee "at its best **2–6 weeks** off roast" | Search-aggregated summary of Onyx's own consumer guidance |
| Sey Coffee: **2 weeks minimum** rest, **4 weeks ideal** | Search-aggregated summary (home-barista.com discussion referencing Sey's stated guidance) |
| Degassing "peaks **7–14 days** post-roast" | [SCA — What is the Shelf Life of Roasted Coffee? A Literature Review on Coffee Staling](https://sca.coffee/sca-news/2012/02/15/what-is-the-shelf-life-of-roasted-coffee-a-literature-review-on-coffee-staling) (Emma Sage, SCA Coffee Science Manager) |
| **94.73%** of 21 coffees across 8 process types reached peak cupping score only after **72 hours**; **73%+ didn't peak until 8+ days** | [Cafe Kreyol post-roast rest study](https://cafekreyol.com/research/post-roast-rest-study/) |
| For each 1% increase in packaging oxygen, staling rate increases **~10%**; dropping O2 to 0.5% can extend shelf life **up to 20x** | [SCA literature review on coffee staling](https://sca.coffee/sca-news/2012/02/15/what-is-the-shelf-life-of-roasted-coffee-a-literature-review-on-coffee-staling) |
| Trained assessors detected rancidity in air-packed coffee after **~4 months** | [SCA literature review on coffee staling](https://sca.coffee/sca-news/2012/02/15/what-is-the-shelf-life-of-roasted-coffee-a-literature-review-on-coffee-staling) |

---

## 4. General consensus on the total "usable window"

There's no single authoritative number, but a fairly tight band shows up repeatedly:

- **Peak/best-flavor window:** roughly **1–3 weeks** post-roast for most filter coffee, shifting later (up to ~3 weeks) for lighter roasts and heavier fermentation, earlier (as soon as 4–7 days) for darker roasts and washed process.
- **Outer "still good" bound:** most consumer- and roaster-facing sources converge on **3–6 weeks** from roast date as the point where filter coffee is considered to have lost its edge, with some (Onyx: 2–6 weeks; Counter Culture: 2–4 weeks "for peak flavor"; various aggregators: "3 to 4 weeks" before noticeable decline) skewing toward the tighter end and specialty roasters selling long-rest naturals/anaerobics sometimes extending guidance toward 4–6+ weeks.
- **Hard staling/rancidity, not just "flat":** the SCA literature review found trained assessors could detect rancidity in air-exposed coffee only after about **4 months** — a reminder that "stale" (flat, losing complexity) and "spoiled/rancid" (lipid oxidation, genuinely off) are different thresholds, and the app's "too old" cutoff should represent the former (a much shorter, quality-of-experience threshold), not the latter (a food-safety-adjacent threshold that's far more permissive).
- Packaging/storage strongly modulates all of this — sealed one-way-valve bags with excess air pushed out last meaningfully longer than the same coffee in a loosely closed bag exposed to more oxygen — but that's a separate variable from the roast-date model itself (the app doesn't currently model storage/packaging, and this doc doesn't attempt to quantify it).

**Bottom line used for the model's outer bound:** a light, washed coffee's `tooOldDays` sits around **7 weeks** (49 days), scaling down to roughly **4–4.5 weeks** (30 days) for a medium-dark washed coffee, with heavily fermented processes pushed further out and wet-hulled pulled further in. This is deliberately toward the generous end of the "3–6 weeks" consensus band, since `tooOldDays` is meant to represent "no longer worth recommending," not "already bad" — the `drinkableEndDays` milestone (the "out of peak but still fine" boundary) sits inside the tighter 3–5 week consensus range for most cells.

---

## 5. Proposed default table

Values are **days since roast date**. `min_rest_days` = earliest recommended drinkable point; `peak_start_days`/`peak_end_days` = estimated peak window; `drinkable_end_days` = after this, call it "out of peak" but still drinkable; `too_old_days` = beyond this, not recommended.

This is a **modifier-based model**, not 60 independently-researched rows: each roast level has a baseline (washed process) schedule, and each process applies a day-offset on top of that baseline representing its relative "fermentation intensity" (washed = 0 offset/baseline; wet-hulled is the one negative offset; everything fermentation-heavy is a positive offset, roughly scaled to how much anecdotal/scientific evidence describes it needing extra settling time). This mirrors the design already in `src/lib/coffee/model.ts` (`ROAST_LEVEL_FACTORS` × `fermentationIntensity`), just expressed as concrete resolved numbers rather than multiplicative factors, for cross-checking/seeding purposes.

Machine-readable version: [`docs/coffee-development-defaults.json`](./coffee-development-defaults.json) — 60 rows (4 roast levels × 15 processes), matching the `process`/`roastLevel` enum values already used in `src/lib/coffee/types.ts`, ready to use as seed data for a `process_profiles` override table or as a reference set to sanity-check `computeProfile()`'s formula output.

| Process | Roast | Min Rest | Peak Start | Peak End | Drinkable End | Too Old | Confidence |
|---|---|---:|---:|---:|---:|---:|---|
| Washed | Light | 7 | 10 | 21 | 35 | 49 | High |
| Honey / Pulped Natural | Light | 8 | 11 | 23 | 38 | 52 | Medium |
| Natural / Dry Process | Light | 9 | 13 | 25 | 41 | 56 | Medium |
| Wet-Hulled | Light | 4 | 6 | 15 | 25 | 35 | Low |
| Anaerobic Washed | Light | 9 | 13 | 25 | 40 | 55 | Medium |
| Anaerobic | Light | 10 | 14 | 27 | 42 | 58 | Medium |
| Anaerobic Natural | Light | 11 | 15 | 29 | 44 | 61 | Low |
| Carbonic Maceration | Light | 11 | 15 | 29 | 44 | 61 | Low |
| Carbonic Maceration Natural | Light | 12 | 16 | 30 | 46 | 63 | Low |
| Thermal Shock | Light | 11 | 15 | 28 | 43 | 60 | Low |
| Koji | Light | 11 | 15 | 29 | 44 | 61 | Low |
| Lactic / Lactic Fermentation | Light | 11 | 15 | 29 | 44 | 61 | Low |
| Yeast Inoculated | Light | 10 | 14 | 27 | 42 | 58 | Medium |
| Extended Fermentation | Light | 12 | 16 | 30 | 46 | 63 | Low |
| Experimental / Other | Light | 11 | 15 | 29 | 44 | 61 | Low |
| Washed | Light-Medium | 6 | 8 | 18 | 30 | 44 | High |
| Honey / Pulped Natural | Light-Medium | 7 | 9 | 20 | 33 | 47 | Medium |
| Natural / Dry Process | Light-Medium | 8 | 11 | 22 | 36 | 51 | Medium |
| Wet-Hulled | Light-Medium | 3 | 4 | 12 | 20 | 30 | Low |
| Anaerobic Washed | Light-Medium | 8 | 11 | 22 | 35 | 50 | Medium |
| Anaerobic | Light-Medium | 9 | 12 | 24 | 37 | 53 | Medium |
| Anaerobic Natural | Light-Medium | 10 | 13 | 26 | 39 | 56 | Low |
| Carbonic Maceration | Light-Medium | 10 | 13 | 26 | 39 | 56 | Low |
| Carbonic Maceration Natural | Light-Medium | 11 | 14 | 27 | 41 | 58 | Low |
| Thermal Shock | Light-Medium | 10 | 13 | 25 | 38 | 55 | Low |
| Koji | Light-Medium | 10 | 13 | 26 | 39 | 56 | Low |
| Lactic / Lactic Fermentation | Light-Medium | 10 | 13 | 26 | 39 | 56 | Low |
| Yeast Inoculated | Light-Medium | 9 | 12 | 24 | 37 | 53 | Medium |
| Extended Fermentation | Light-Medium | 11 | 14 | 27 | 41 | 58 | Low |
| Experimental / Other | Light-Medium | 10 | 13 | 26 | 39 | 56 | Low |
| Washed | Medium | 5 | 6 | 15 | 26 | 38 | High |
| Honey / Pulped Natural | Medium | 6 | 7 | 17 | 29 | 41 | Medium |
| Natural / Dry Process | Medium | 7 | 9 | 19 | 32 | 45 | Medium |
| Wet-Hulled | Medium | 2 | 3 | 9 | 16 | 24 | Medium |
| Anaerobic Washed | Medium | 7 | 9 | 19 | 31 | 44 | Medium |
| Anaerobic | Medium | 8 | 10 | 21 | 33 | 47 | Medium |
| Anaerobic Natural | Medium | 9 | 11 | 23 | 35 | 50 | Low |
| Carbonic Maceration | Medium | 9 | 11 | 23 | 35 | 50 | Low |
| Carbonic Maceration Natural | Medium | 10 | 12 | 24 | 37 | 52 | Low |
| Thermal Shock | Medium | 9 | 11 | 22 | 34 | 49 | Low |
| Koji | Medium | 9 | 11 | 23 | 35 | 50 | Low |
| Lactic / Lactic Fermentation | Medium | 9 | 11 | 23 | 35 | 50 | Low |
| Yeast Inoculated | Medium | 8 | 10 | 21 | 33 | 47 | Medium |
| Extended Fermentation | Medium | 10 | 12 | 24 | 37 | 52 | Low |
| Experimental / Other | Medium | 9 | 11 | 23 | 35 | 50 | Low |
| Washed | Medium-Dark | 4 | 5 | 12 | 21 | 30 | Medium |
| Honey / Pulped Natural | Medium-Dark | 5 | 6 | 14 | 24 | 33 | Medium |
| Natural / Dry Process | Medium-Dark | 6 | 8 | 16 | 27 | 37 | Medium |
| Wet-Hulled | Medium-Dark | 1 | 2 | 6 | 11 | 18 | Medium |
| Anaerobic Washed | Medium-Dark | 6 | 8 | 16 | 26 | 36 | Medium |
| Anaerobic | Medium-Dark | 7 | 9 | 18 | 28 | 39 | Medium |
| Anaerobic Natural | Medium-Dark | 8 | 10 | 20 | 30 | 42 | Low |
| Carbonic Maceration | Medium-Dark | 8 | 10 | 20 | 30 | 42 | Low |
| Carbonic Maceration Natural | Medium-Dark | 9 | 11 | 21 | 32 | 44 | Low |
| Thermal Shock | Medium-Dark | 8 | 10 | 19 | 29 | 41 | Low |
| Koji | Medium-Dark | 8 | 10 | 20 | 30 | 42 | Low |
| Lactic / Lactic Fermentation | Medium-Dark | 8 | 10 | 20 | 30 | 42 | Low |
| Yeast Inoculated | Medium-Dark | 7 | 9 | 18 | 28 | 39 | Medium |
| Extended Fermentation | Medium-Dark | 9 | 11 | 21 | 32 | 44 | Low |
| Experimental / Other | Medium-Dark | 8 | 10 | 20 | 30 | 42 | Low |

### How the offsets were derived

Per-process offset applied to every milestone of the roast-level baseline (in days: `min_rest / peak_start / peak_end / drinkable_end / too_old`), before floor/ordering guards:

| Process | Offset | Rationale |
|---|---|---|
| Washed | +0 / +0 / +0 / +0 / +0 | Baseline. Best evidence, most consistent across roasters. |
| Honey / Pulped Natural | +1 / +1 / +2 / +3 / +3 | Some mucilage sugar left on during drying — a modest step up from washed. |
| Natural / Dry Process | +2 / +3 / +4 / +6 / +7 | Whole-cherry drying, more CO2 and soluble compounds retained; supported by Cafe Kreyol's finding that naturals kept improving through 22 days while washed plateaued. |
| Wet-Hulled | −3 / −4 / −6 / −10 / −14 | Low density, low acidity, consistently described as best fresh; the one process with a *negative* offset. |
| Anaerobic Washed | +2 / +3 / +4 / +5 / +6 | Sealed anaerobic soak layered onto an otherwise clean washed process — moderate step up. |
| Anaerobic | +3 / +4 / +6 / +7 / +9 | Sealed, oxygen-free fermentation; "funky" aromatics anecdotally need real settling time. |
| Yeast Inoculated | +3 / +4 / +6 / +7 / +9 | Deliberate yeast strain; treated same intensity as generic anaerobic — has more peer-reviewed fermentation-chemistry backing than most exotic processes, but almost no post-roast *resting* data specifically. |
| Anaerobic Natural, Carbonic Maceration, Koji, Lactic Fermentation | +4 / +5 / +8 / +9 / +12 | Grouped together as "intense, thinly-documented ferments" — each has plausible mechanistic reasons (whole-cherry + anaerobic; CO2-flush maceration; novel enzymatic fungal fermentation; targeted lactic-acid-bacteria fermentation) to need more settling time than plain anaerobic, but none has enough published day-range data to justify a materially different number from the others. Treating them identically is an honest reflection of the evidence gap, not a claim they're chemically the same. |
| Carbonic Maceration Natural, Extended Fermentation | +5 / +6 / +9 / +11 / +14 | The two most fermentation-intense categories modeled — carbonic maceration stacked on a full natural, and deliberately prolonged fermentation. Largest offsets, lowest confidence. |
| Thermal Shock | +4 / +5 / +7 / +8 / +11 | Newer technique, essentially no published resting guidance; positioned between the "moderate" and "intense" tiers by analogy. |
| Experimental / Other | +4 / +5 / +8 / +9 / +12 | Catch-all default — same as the "intense, thinly-documented ferments" tier, flagged Low confidence explicitly because it covers whatever a producer invents next. |

Roast-level baselines (washed-process anchor, before process offsets):

| Roast Level | Min Rest | Peak Start | Peak End | Drinkable End | Too Old |
|---|---:|---:|---:|---:|---:|
| Light | 7 | 10 | 21 | 35 | 49 |
| Light-Medium | 6 | 8 | 18 | 30 | 44 |
| Medium | 5 | 6 | 15 | 26 | 38 |
| Medium-Dark | 4 | 5 | 12 | 21 | 30 |

Guards applied after adding offsets (so no row can produce nonsensical ordering, particularly for wet-hulled at medium/medium-dark roast where negative offsets are largest relative to the base): `min_rest ≥ 1`; `peak_start > min_rest`; `peak_end ≥ peak_start + 3`; `drinkable_end ≥ peak_end + 5`; `too_old ≥ drinkable_end + 7`.

### Confidence assignment logic

- **High** — Washed at Light, Light-Medium, and Medium roast levels: the best-documented, most-consistent-guidance combination across nearly every source consulted.
- **Medium** — Washed at Medium-Dark (less filter-specific guidance exists for darker roasts specifically, most roaster advice targets light/medium filter roasts); Honey, Natural, Anaerobic Washed, Anaerobic, and Yeast Inoculated at all roast levels (real, converging guidance exists, but with more variation between sources and less specificity than washed); Wet-Hulled at Medium and Medium-Dark roast levels (the traditional, commonly-seen combination).
- **Low** — Anaerobic Natural, Carbonic Maceration, Carbonic Maceration Natural, Thermal Shock, Koji, Lactic Fermentation, Extended Fermentation, and Experimental/Other at every roast level (thin, mostly anecdotal, producer-specific, or entirely absent published resting guidance); Wet-Hulled at Light and Light-Medium roast levels specifically (a light-roast wet-hulled coffee is an unusual real-world pairing with essentially no dedicated sourcing on how it behaves).

---

## 6. Explicit caveats — please read before trusting these numbers

1. **This is not scientific consensus.** No controlled, peer-reviewed study was found that directly measures "days until peak flavor" per process × roast-level combination for filter coffee, aimed at consumers. Most of what exists is roaster marketing copy, aggregator blog posts (often themselves synthesizing other blog posts), and a handful of small or narrowly-scoped studies (the SCA staling literature review is the most rigorous, but is about staling/oxidation chemistry broadly, not a day-by-day peak curve; the Cafe Kreyol study is a real dataset but is small, non-peer-reviewed, and measures *cupping* peak, which may not equal *home-brewing enjoyment* peak).
2. **Sources disagree meaningfully**, not just by a day or two. Square Mile says filter rest 5–14 days broadly; Onyx frames the whole usable window as 2–6 weeks; Sey recommends a 2-week minimum with 4 weeks "ideal" — these are compatible in spirit but not reconcilable into one precise number. The table above picks a defensible point estimate per cell; real coffees from real roasters will land all over this range.
3. **Process taxonomy is fuzzier in practice than in this schema.** "Anaerobic natural," "carbonic maceration," "thermal shock," "koji," and "extended fermentation" are often combined by producers (e.g., "koji + thermal shock," "double anaerobic natural"), and roasters don't consistently define these terms the same way. The model's flat per-process offset can't capture producer-specific variation, intentionally — it's a default, meant to be overridden by an actual roaster's stated guidance when available (`source: "override"` in the schema already supports this).
4. **Storage and packaging are not modeled here at all**, but matter a lot — a one-way-valve bag with air pushed out behaves very differently from a loosely resealed bag left in a warm kitchen. The `too_old_days` numbers assume reasonably good storage (sealed bag, room temperature, out of direct light); poor storage will shorten every window meaningfully.
5. **Grind size and brew method interact with all of this.** Everything above concerns whole bean coffee; once ground, surface area increases dramatically and degassing/staling accelerates within hours, independent of the roast-date model.
6. **The "confidence" field is a statement about evidence quality, not about how good the coffee will taste.** A Low-confidence row (e.g., Koji) isn't a worse coffee — it just means fewer people have published a specific "here's how many days to rest it" number, so the app should communicate the estimate with appropriate humility (e.g., wider displayed ranges, explicit "estimate" language in the UI) rather than presenting it with the same certainty as the Washed/Light row.
7. **Numbers here should be revisited** if/when the app collects real user feedback (e.g., "still tasted fresh at day X" or "tasted flat by day Y" signals) — that data would be far stronger evidence than anything synthesized from public blog posts, and is exactly the kind of input the `process_profiles` override table is designed to eventually be informed by.

---

## Full source list

Specialty roaster / industry blogs:
- [Square Mile Coffee Roasters — Rest is Best](https://squaremileblog.com/2020/06/25/rest-is-best/)
- [Square Mile Coffee Roasters — FAQ](https://shop.squaremilecoffee.com/pages/faq)
- [Counter Culture Coffee — Coffee Basics: Freshness](https://counterculturecoffee.com/blogs/counter-culture-coffee/coffee-basics-freshness)
- [Barista Magazine — Getting Funky with Anaerobic Fermentation](https://www.baristamagazine.com/getting-funky-with-anaerobic-fermentation/)
- [Barista Magazine — Understanding the Process: Koji Fermentation](https://www.baristamagazine.com/understanding-the-process-koji-fermentation/)
- [Barista Magazine — Understanding the Process, Part Three: Honey Process](https://www.baristamagazine.com/understanding-the-process-part-three-honey-process/)
- [Perfect Daily Grind — How to Roast Anaerobically Fermented Coffee](https://perfectdailygrind.com/2024/01/how-to-roast-anaerobic-fermented-coffee/)
- [Perfect Daily Grind — What Is Koji Fermented Coffee?](https://perfectdailygrind.com/2022/03/what-is-koji-fermented-coffee/)
- [Perfect Daily Grind — Coffee Roasting & Experimental Processing Methods](https://perfectdailygrind.com/2021/06/coffee-roasting-experimental-processing-methods/)
- [Headcount Coffee — How Fermentation Changes Coffee Flavor Notes](https://www.headcountcoffee.com/blogs/coffee-news/how-fermentation-changes-coffee-flavor-notes-anaerobic-extended-yeast-based)
- [Headcount Coffee — Why Coffee Degassing Matters for Flavor](https://www.headcountcoffee.com/blogs/coffee-news/why-coffee-degassing-matters-co-release-explained-for-better-flavor)
- [Ozone Coffee UK — Anaerobic Fermentation in Coffee](https://ozonecoffee.co.uk/blogs/coffee-processing-explained/anaerobic-fermentation-coffee)
- [Ozone Coffee UK — Honey & Pulped Natural Coffee Explained](https://ozonecoffee.co.uk/blogs/coffee-processing-explained/pulped-natural-honey-processed-coffee)
- [Nordic Brew Lab — Anaerobic Fermentation (and Carbonic Maceration)](https://nordicbrewlab.com/blogs/coffee-school/anaerobic-coffee-processing-carbonic-maceration)
- [MTPak Coffee — How Long Does It Take Coffee to Degas?](https://mtpak.coffee/2020/12/degassing-coffee-how-long-does-it-take/)
- [MTPak Coffee — Exotic Coffees: What Are They & How Should They Be Roasted?](https://mtpak.coffee/2022/06/exotic-coffees-what-are-the-how-to-roast-them/)
- [Coffee On Cue — Coffee Degassing: Four-Stage Flavour Evolution Guide (summarizing Barista Hustle)](https://www.coffeeoncue.com.au/blogs/how-to-make-coffee/coffee-degassing-four-stage-flavour-evolution-guide)
- [Barista Hustle — Degas (glossary)](https://www.baristahustle.com/glossary/degas/)
- [Barista Hustle — ACM 6.04, CO2 and H2O Content](https://www.baristahustle.com/lesson/acm-6-04-co2-and-h20-content/)
- [Coffee Review — Anaerobic-Processed Coffees](https://www.coffeereview.com/anaerobic-processed-coffees/)
- [weaverscoffee.com — Sumatran Coffee: Flavor Profile, Low Acidity & Bold Taste Explained](https://weaverscoffee.com/blogs/blog/what-is-sumatran-coffee)
- [Buddha Beans Coffee Co. — Exotic Coffee Trends: Anaerobic Fermentation, Thermal Shock, Co-Ferments](https://buddhabeanscoffee.com/blogs/news/exotic-coffee-trends-in-2026-anaerobic-fermentation-thermal-shock-and-co-ferments-explained)

Named coffee professionals / practitioner writing:
- [Scott Rao — Resting Roasts: Is Fresher Better?](https://www.scottrao.com/blog/restingbeans)
- [James Hoffmann's guidance, as summarized via kafeido.com](https://www.kafeido.com/en-us/blogs/coffee/resting-roasted-coffee-beans)

Research / trade-association sources:
- [Specialty Coffee Association — What Is the Shelf Life of Roasted Coffee? A Literature Review on Coffee Staling (Emma Sage, SCA Coffee Science Manager)](https://sca.coffee/sca-news/2012/02/15/what-is-the-shelf-life-of-roasted-coffee-a-literature-review-on-coffee-staling)
- [Cafe Kreyol — How Long Should Coffee Rest (Post Roast) Before Industry Professionals Assess Quality? (Girard & Stazzone)](https://cafekreyol.com/research/post-roast-rest-study/)
- [Effect of Roasting Conditions on Carbon Dioxide Degassing Behavior in Coffee — Food Research International / ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0963996914000337)
- [Understanding the Formation of CO2 and Its Degassing Behaviours in Coffee — University of Guelph thesis](https://atrium.lib.uoguelph.ca/server/api/core/bitstreams/ee9d7e24-7df2-42b0-a66a-e88dc6f2c70e/content)

Notes on sources not directly reachable: several roaster-specific claims (Prufrock, Onyx Coffee Lab's specific "2–6 weeks" framing, Sey Coffee's "2 weeks minimum / 4 weeks ideal," Coffee Collective, George Howell, Manhattan Coffee Roasters, Rusty's Hawaiian) came back from web search as aggregator summaries rather than a directly-fetchable primary page with that exact guidance, or the search did not surface a specific published rest-time statement from that roaster at all (Rusty's Hawaiian, Coffee Collective, George Howell, and Manhattan Coffee Roasters specifically — nothing process/resting-specific was found from these four despite targeted searching). Those are flagged here rather than cited as if directly verified; treat the Onyx and Sey figures in particular as "reported guidance," not confirmed quotes from primary roaster pages.
