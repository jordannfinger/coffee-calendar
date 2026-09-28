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
- **Supabase** for Postgres + Auth (anonymous sign-in by default, with optional email/password or magic link), with Row Level Security protecting per-user data.
- **No login required to use the app.** Every visitor gets a real (anonymous) Supabase session automatically on first load — `useAuth` in [`useAuth.ts`](src/lib/supabase/useAuth.ts) calls `signInAnonymously()` if there's no session yet. RLS treats an anonymous session exactly like a normal one, so saved coffees, the calendar, and Drink Today all work immediately with zero UI friction. A visitor can optionally add an email/password later (`/signup`, labeled "Save my data") to make their data survive clearing cookies or follow them to a new device — this **links** the existing anonymous user to real credentials via `supabase.auth.updateUser()` rather than creating a separate account, so nothing already saved is lost.
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

| Route | Purpose |
|---|---|
| `/` | Landing page + interactive calculator |
| `/search` | Date search + reverse "ordering guidance" calculator, ranks your saved coffees |
| `/about` | Methodology, confidence levels, uncertainty |
| `/today` | "What should I drink today?" ranked list |
| `/calendar` | Month grid of every saved coffee's status per day |
| `/coffee` | My Coffee — saved coffee list, with sort/filter and CSV/JSON export |
| `/coffee/new`, `/coffee/[id]`, `/coffee/[id]/edit` | Add/view/edit a coffee, including its brew log and share link |
| `/c/[shareToken]` | Public, read-only view of one shared coffee — no login, no personal fields |
| `/login`, `/signup`, `/reset-password`, `/update-password` | Optional: claim an anonymous session into a real account, or log into an existing one |

Every route works immediately for every visitor — nothing is gated behind login. `/login` and `/signup` exist purely so someone can *optionally* attach an email/password to their existing (anonymous) data.

---

## 2. Database schema

Two tables (see [`supabase/migrations/20260902010646_init.sql`](supabase/migrations/20260902010646_init.sql)):

**`coffees`** — a user's saved coffee inventory. `user_id references auth.users`, RLS restricts every operation to `auth.uid() = user_id`. Required: name, roaster, origin, roast_date, process, roast_level. Everything else (variety, producer, region, elevation, lot, harvest year, tasting notes, brew method, grind setting, recipe, dose, water, personal notes, rating, bag size, remaining %, order date) is optional. `order_date` is intentionally nullable even though the brief lists it as required — it has zero effect on any calculation, and requiring it added form friction with no UX benefit.

**`process_profiles`** — the configurable development model as data, not code. Columns: `process`, `subtype` (nullable — null matches any subtype), `roast_level`, `min_rest_days`, `peak_start_days`, `peak_end_days`, `drinkable_end_days`, `too_old_days`, `confidence`, `notes`. Publicly readable (so the calculator works logged out); writable only by the service role. A row here **overrides** the formula in `model.ts` for its combination — the model can evolve from real feedback without a code deploy. It starts empty; the app works fully on formula defaults with no rows present.

**`brew_logs`** (see [`20260902232910_brew_logs.sql`](supabase/migrations/20260902232910_brew_logs.sql)) — multiple logged brew attempts per coffee, distinct from the single "current recipe" fields on `coffees`: `coffee_id`, `brewed_at`, `brew_method`, `grind_setting`, `dose_g`, `water_g`, `drawdown`, `rating`, `tasting_notes`, `notes`, `locked`. Same owner-only RLS pattern as `coffees`.

**`coffees.storage_method` / `coffees.bag_opened_date`** (see [`20260902232939_storage_and_sharing.sql`](supabase/migrations/20260902232939_storage_and_sharing.sql)) — informational storage tracking; deliberately does **not** feed the calculation engine (see Assumptions below).

**`coffees.share_token`** — when set (via "Create share link"), the exact token grants access through `get_shared_coffee(token)` to a fixed public column list. The underlying table stays owner-only: personal notes, rating, quantity, owner IDs, and tokens are not returned by the public function. Clearing the token revokes access. Apply the forward privacy migration before deploying the RPC-based public page; existing share URLs remain valid. See [Phase 1 remediation](docs/phase-1-remediation.md) for validation and release prerequisites.

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

40 unit tests in [`dateUtils.test.ts`](src/lib/coffee/dateUtils.test.ts), [`engine.test.ts`](src/lib/coffee/engine.test.ts), and [`alerts.test.ts`](src/lib/coffee/alerts.test.ts) cover: leap years (including Feb 29 both as a roast date and as a date being added-across), month and year boundaries, status transitions at every milestone boundary (inclusive/exclusive edges), date search ranking, and reverse-calculation across a year boundary. Run them with:

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

Apply the schema through the Supabase CLI:

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

The migration filenames match the linked project's recorded versions. Keep
future deployments in migration history rather than running these files
manually in the hosted SQL editor.

**Enable anonymous sign-ins** — Authentication → Sign In / Providers in the Supabase dashboard → turn on "Allow anonymous sign-ins" → Save. Without this, visitors get a session-setup error instead of being signed in automatically (the app has no login-required fallback).

Then:

```bash
npm run dev
```

Open http://localhost:3000 — the app is immediately usable, no login. If you want to test the "Save my data" flow (linking to a real email/password account), note Supabase's default email provider is rate-limited; configure custom SMTP in your Supabase project's Auth settings for heavier testing.

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

For hosted data recovery on the Free plan, follow the encrypted off-site backup
and restore procedure in [docs/backup-recovery.md](docs/backup-recovery.md).

---

## 8. Feature additions beyond the MVP

- **Peak alerts** ([`alerts.ts`](src/lib/coffee/alerts.ts)) — a banner on `/today` flags any coffee entering or leaving its peak window tomorrow. This is the in-app equivalent of "your coffee enters peak tomorrow"; there's no email/push infrastructure wired up (no SMTP/email-provider credentials configured), so it surfaces the same signal directly in the UI instead of as a notification. Wiring up real email/push would mean adding a mail provider (e.g. Resend) plus a scheduled job (Vercel Cron or Supabase's `pg_cron`) to run the same query daily.
- **Brew log** (`brew_logs` table, [`BrewLogSection.tsx`](src/components/coffee/BrewLogSection.tsx)) — log individual brew attempts (grind, dose, water, drawdown, rating, notes, a "locked" flag for a repeatable result) per coffee, separate from the coffee's own single "current recipe" fields.
- **Data export** ([`exportCoffees.ts`](src/lib/coffee/exportCoffees.ts)) — CSV/JSON export of My Coffee, generated client-side. Particularly relevant now that data lives in anonymous sessions by default — export is a safety net independent of "Save my data."
- **Storage tracking** — `storage_method` (free text, with common suggestions) and `bag_opened_date` on each coffee. Informational only; see Assumptions below for why it doesn't affect the calculation.
- **Shareable public coffee page** (`/c/[shareToken]`, [`ShareSection.tsx`](src/components/coffee/ShareSection.tsx)) — generate a public link to one coffee's status and peak window. No login needed to view; personal fields are never exposed (see the `share_token` schema note above).
- **Sort/filter on My Coffee** — by status, process, roaster, and roast date, purely client-side over the already-fetched list.

---

## 9. Assumptions and limitations

- **Anonymous sessions aren't portable across browsers/devices** unless claimed via "Save my data." Clearing cookies or site data on a device that never claimed its session loses that data permanently — there's no recovery path, since nothing ties an unclaimed anonymous user back to a person.
- **`order_date` is optional**, despite being listed as required in the original brief — it doesn't feed the calculation engine, and making it mandatory would add form friction without a UX benefit.
- **Dark roast is intentionally unsupported** (roast levels stop at Medium-Dark), per the brief — the model's evidence base for dark roast + filter brewing specifically is thin.
- **Process subtype does not currently perturb the calculation** — it's tracked for reference (and shown in the UI) but the model only varies by process family + roast level. A `process_profiles` override row can be scoped to a specific subtype if real-world data justifies a different number.
- **Storage/packaging is tracked but does not affect the calculation.** `storage_method` and `bag_opened_date` are informational fields shown on a coffee's detail page — there's no researched basis yet for exactly how much, say, freezing or an opened bag should shift a window, so the engine deliberately doesn't guess. The `too_old_days` numbers assume reasonably good storage (sealed bag, room temperature, out of light) throughout.
- **A shared coffee's link has no expiry or revocation history** — "Stop sharing" clears `share_token`, but anyone who already has the old link and re-shares it before it's cleared could theoretically race a viewer; low-stakes for this app's data, but worth knowing.
- **Grind size and brew method are not factored into timing** — they're tracked on a saved coffee for reference, but degassing/staling after grinding is a different, much faster timescale than whole-bean storage, which is out of scope here.
- **The model is a synthesis of public guidance, not a peer-reviewed standard.** Sources disagree meaningfully (not just by a day or two); confidence ratings communicate where the evidence is strong versus thin. See the research doc's explicit caveats section.
- **Supabase's default email provider is rate-limited.** For production use beyond light testing, configure custom SMTP in the Supabase dashboard.
