# Coffee Calendar

Know when your filter coffee is ready to drink, when it peaks, and when it's had its best days — based on roast date, process, and roast level.

**Filter coffee only.** No espresso.

Coffee Calendar answers three questions well:

1. Can I drink this coffee yet?
2. Is this coffee at its peak?
3. If I want coffee on a particular date, when should I order or roast it?

---

## 1. Architecture

- **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4**, deployed to Vercel.
- **Supabase** for Postgres + Auth (email/password and magic link), with Row Level Security protecting per-user data.
- One calculation engine, one source of truth. Every feature — the calculator, calendar, date search, reverse calculator, My Coffee, and Drink Today — computes coffee windows through a single function:

  ```ts
  calculateCoffeeWindow({ roastDate, process, processSubtype, roastLevel, overrideProfile })
  // → { drinkableFrom, peakFrom, peakUntil, drinkableUntil, tooOldFrom, confidence, notes, source }
  ```

  This lives in [`src/lib/coffee/engine.ts`](src/lib/coffee/engine.ts). No component computes rest/peak days on its own.

### Directory layout

```
src/
  lib/coffee/           # Framework-independent domain logic (fully unit-tested)
    types.ts            # Process, RoastLevel, CoffeeStatus, DevelopmentProfile, CoffeeWindow
    dateUtils.ts         # Calendar-date-safe helpers (no UTC/timezone drift)
    model.ts             # The configurable development model (roast-level baseline + process offsets)
    engine.ts             # calculateCoffeeWindow, getCoffeeStatus, rankForDate, reverseCalculate
    options.ts, profileOverrides.ts, coffeeTypes.ts, statusIcons.tsx, useCoffees.ts, useProfileOverrides.ts
  lib/supabase/          # Browser/server/middleware Supabase clients + generated DB types
  components/            # Reusable UI: coffee/ (Timeline, Calculator, forms, cards) and ui/ (Button, Card, Field)
  app/                    # Routes — see below
supabase/
  migrations/             # Schema + RLS, applied in order
  seed.sql                # Example process_profiles override for local dev
docs/
  coffee-development-research.md   # Full sourcing/rationale behind the model's defaults
  coffee-development-defaults.json # Machine-readable version of the same table
```

### Routes

| Route | Purpose | Auth |
|---|---|---|
| `/` | Landing page + interactive calculator | Public |
| `/search` | Date search + reverse "ordering guidance" calculator | Public (saved-coffee ranking needs login) |
| `/about` | Methodology, confidence levels, uncertainty | Public |
| `/login`, `/signup`, `/reset-password`, `/update-password` | Auth flows | Public |
| `/today` | "What should I drink today?" ranked list | Requires login |
| `/calendar` | Month grid of every saved coffee's status per day | Requires login |
| `/coffee` | My Coffee — saved coffee list | Requires login |
| `/coffee/new`, `/coffee/[id]`, `/coffee/[id]/edit` | Add/view/edit a coffee | Requires login |

Logged-out users get the full calculator and date search; logging in unlocks saved coffees, the personal calendar, and Drink Today.

---

## 2. Database schema

Two tables (see [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)):

**`coffees`** — a user's saved coffee inventory. `user_id references auth.users`, RLS restricts every operation to `auth.uid() = user_id`. Required: name, roaster, origin, roast_date, process, roast_level. Everything else (variety, producer, region, elevation, lot, harvest year, tasting notes, brew method, grind setting, recipe, dose, water, personal notes, rating, bag size, remaining %, order date) is optional. `order_date` is intentionally nullable even though the brief lists it as required — it has zero effect on any calculation, and requiring it added form friction with no UX benefit.

**`process_profiles`** — the configurable development model as data, not code. Columns: `process`, `subtype` (nullable — null matches any subtype), `roast_level`, `min_rest_days`, `peak_start_days`, `peak_end_days`, `drinkable_end_days`, `too_old_days`, `confidence`, `notes`. Publicly readable (so the calculator works logged out); writable only by the service role. A row here **overrides** the formula in `model.ts` for its combination — the model can evolve from real feedback without a code deploy. It starts empty; the app works fully on formula defaults with no rows present.

---

## 3. The coffee-development model

This is a **configurable model**, not 60 hand-picked numbers. It has two layers:

1. A **roast-level baseline** (days since roast, for the washed process): `ROAST_LEVEL_BASELINE` in [`model.ts`](src/lib/coffee/model.ts).
2. A **per-process day offset** applied on top: `PROCESS_OFFSETS`. Washed = 0 offset (the anchor); wet-hulled is the one *negative* offset (low density/acidity, consistently described as best fresh); every fermentation-heavy process gets a positive offset sized to how much settling time it's documented to need.

```ts
minRestDays      = baseline.minRestDays      + offset.minRestDays
peakStartDays    = baseline.peakStartDays    + offset.peakStartDays
peakEndDays      = baseline.peakEndDays      + offset.peakEndDays
drinkableEndDays = baseline.drinkableEndDays + offset.drinkableEndDays
tooOldDays       = baseline.tooOldDays       + offset.tooOldDays
```

(with guards so no combination can produce out-of-order milestones). A `process_profiles` row, when present, replaces this computed result entirely for its combination.

### Statuses

| Status | Meaning |
|---|---|
| 🔴 Not Yet Drinkable | Before `drinkableFrom` — still resting |
| 🟢 Drinkable | Capable of a good cup, not necessarily at its best |
| ⭐ Peak | The estimated optimal window |
| 🟠 Out of Peak | Past peak, but can still be enjoyable — **not** a synonym for "bad" |
| ⚫ Too Old | Well past the window — not recommended to order for a future date |

Every status is shown with an icon **and** text, not color alone (see [`statusIcons.tsx`](src/lib/coffee/statusIcons.tsx)).

---

## 4. Date calculation logic

All date math lives in [`dateUtils.ts`](src/lib/coffee/dateUtils.ts) and operates on **calendar dates**, deliberately avoiding `toISOString()`/UTC conversion, which can shift a date by one day depending on the user's timezone offset. Dates are parsed and formatted using local calendar components only (`getFullYear()`/`getMonth()`/`getDate()`), so "12 September" means the same day everywhere regardless of the viewer's timezone.

36 unit tests in [`dateUtils.test.ts`](src/lib/coffee/dateUtils.test.ts) and [`engine.test.ts`](src/lib/coffee/engine.test.ts) cover: leap years (including Feb 29 both as a roast date and as a date being added-across), month and year boundaries, status transitions at every milestone boundary (inclusive/exclusive edges), date search ranking, and reverse-calculation across a year boundary. Run them with:

```bash
npm test
```

---

## 5. How the peak windows were determined

Documented in full, with direct quotes and source links, in [`docs/coffee-development-research.md`](docs/coffee-development-research.md) — researched from specialty roaster guidance (Square Mile, Onyx, Sey, Counter Culture, and others), practitioner writing (James Hoffmann, Scott Rao), SCA's staling literature review, and a small independent post-roast cupping study across 8 process types. Highlights:

- **Washed** is the best-documented, most-consensus case (High confidence) — the model's baseline.
- **Naturals and honey need *more* rest, not less**, contrary to the "fruit's already forward" intuition — a cupping study found naturals/honey kept improving through 22 days while washed plateaued early.
- **Heavily fermented/exotic processes** (anaerobic, carbonic maceration, koji, lactic, extended fermentation) are anecdotally described as needing the most settling time and holding the widest, latest peak — but with the thinnest published evidence (Low confidence).
- **Wet-hulled** is the one process consistently described as best enjoyed fresh — the model's only negative offset.

Every number is explicitly an estimate. The app never claims scientific precision — every window carries a confidence rating, and the About page and footer both state plainly that coffee can taste excellent outside its predicted window.

---

## 6. Running locally

### Prerequisites

- Node.js 20+
- A Supabase project (free tier is enough)

### Setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local` with your Supabase project's URL and anon/publishable key (Project Settings → API in the Supabase dashboard).

Apply the schema — either via the Supabase CLI:

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

or by running the SQL in `supabase/migrations/0001_init.sql` and `0002_fix_function_search_path.sql` directly in the Supabase SQL editor, in order.

Then:

```bash
npm run dev
```

Open http://localhost:3000. Sign up for an account (Supabase's default email provider is rate-limited — for heavier local testing, configure custom SMTP in your Supabase project's Auth settings), then use Add Coffee to start populating My Coffee, the Calendar, and Drink Today.

### Other scripts

```bash
npm test        # run the date/engine unit tests
npm run lint     # ESLint
npm run typecheck  # tsc --noEmit
npm run build    # production build
```

---

## 7. Deploying to Vercel

1. Push this repository to GitHub (or GitLab/Bitbucket).
2. Import it in Vercel — it auto-detects Next.js.
3. Add the two environment variables from `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the Vercel project's Environment Variables settings.
4. In your Supabase project's Auth → URL Configuration, add your Vercel deployment URL to the Site URL / Redirect URLs so magic links, signup confirmation, and password reset links redirect correctly in production.
5. Deploy.

No other infrastructure is required — Supabase is the only external dependency.

---

## 8. Assumptions and limitations

- **`order_date` is optional**, despite being listed as required in the original brief — it doesn't feed the calculation engine, and making it mandatory would add form friction without a UX benefit.
- **Dark roast is intentionally unsupported** (roast levels stop at Medium-Dark), per the brief — the model's evidence base for dark roast + filter brewing specifically is thin.
- **Process subtype does not currently perturb the calculation** — it's tracked for reference (and shown in the UI) but the model only varies by process family + roast level. A `process_profiles` override row can be scoped to a specific subtype if real-world data justifies a different number.
- **Storage/packaging is not modeled** (bag opened date, vacuum/freezing, etc.) — the schema and this README call this out as a natural extension, but it was deliberately left out of the MVP per the brief's scope guidance. The `too_old_days` numbers assume reasonably good storage (sealed bag, room temperature, out of light).
- **Grind size and brew method are not factored into timing** — they're tracked on a saved coffee for reference, but degassing/staling after grinding is a different, much faster timescale than whole-bean storage, which is out of scope here.
- **The model is a synthesis of public guidance, not a peer-reviewed standard.** Sources disagree meaningfully (not just by a day or two); confidence ratings communicate where the evidence is strong versus thin. See the research doc's explicit caveats section.
- **Supabase's default email provider is rate-limited.** For production use beyond light testing, configure custom SMTP in the Supabase dashboard.
