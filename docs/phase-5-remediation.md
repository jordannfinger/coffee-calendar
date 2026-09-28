# Phase 5 — operational follow-through

Base: `5c8cbe0b2a27af57de2eea0157bf235ce7a330be` (Phase 4 on `main`).
The hosted index migration and its verification were committed to `main` as
`63da730`. This record accompanies the inventory pagination change.

## Completed checks and changes

- The production Vercel deployment for `5c8cbe0` was `READY`, with its
  production aliases assigned. A request to the production alias returned HTTP
  200. This confirms the deploy and entry route, not every signed-in journey.
- A hosted transaction inserted one temporary coffee and called
  `get_shared_coffee` as `anon` with its exact token. It returned the approved
  public fields. The transaction was rolled back; the hosted coffee count
  remained 7 and the token stopped resolving. No probe data was retained.
- A second hosted transaction created a temporary second owner and coffee.
  Under the `authenticated` role with that owner's JWT subject, RLS returned
  only their one coffee and none of the existing owner's seven. Rollback left
  one Auth user and seven coffees, with no temporary user remaining.
- The hosted `brew_logs` table had no rows. Migration
  `20260927231708_index_brew_log_owner.sql` replaced its `coffee_id` index with
  `(coffee_id, user_id)`. The new index definition was verified on the host,
  and the unindexed-foreign-key advisor notice disappeared.
- The inventory hook now fetches all pages with a stable roast-date/ID order.
  It uses the exact total count and advances by the number of rows actually
  returned, even if the API caps a response below the requested range. A
  failed later page produces an error instead of a partial inventory.

## Verification

- 88 tests across 12 files pass with no skips, including a 1,203-row capped
  response and a later-page failure.
- Type checking, linting, and the production build pass.
- Open Code Review delegation examined all 5 reviewable entries in the
  combined change before the migration commit, then all 4 reviewable entries
  remaining in the working tree. The 2 preexisting `.serena` files were
  included in both previews and left untracked and unchanged. All excluded
  test/doc paths were inspected separately. No confirmed material defect
  remains.

## Live acceptance after deployment

The production Vercel deployment of pagination commit `d6b5702` reported
`READY`. With two isolated anonymous accounts on hosted Supabase, the first
created a coffee and the second could not read its base-table row or attach a
brew log to it. An unauthenticated client could not read the base row but could
read the approved fields with its exact share token. Revoking the token made
that RPC return no row. The probe coffee and both anonymous accounts were
removed; hosted counts returned to one Auth user, seven coffees, and zero
brew logs.

In an installed Chrome browser against the production alias, a temporary
shared coffee rendered on `/c/[shareToken]` without its private notes. After
revocation, the same page rendered the inactive-link message. The browser
reported no page errors. The temporary owner account and coffee were removed.

A separate temporary browser account received 1,001 coffees through hosted
REST. After reloading the deployed `/coffee` page, all 1,001 coffee cards,
including the last row, rendered with no page errors. All test coffees and the
temporary account were removed. Final hosted counts again matched the
pre-test baseline: one Auth user, seven coffees, and zero brew logs.

A temporary guest with one coffee submitted the deployed "Save my data" form
to the provided test inbox. Supabase initially showed a pending email change;
verification promoted that *same user ID* from anonymous to permanent while
its coffee remained attached. The first callback redirected to login because
the test browser holding its PKCE verifier had been closed before the link was
opened. A fresh magic-link login, opened in the same persistent browser that
requested it, successfully exchanged the code at `/auth/callback`, landed on
`/today`, and showed the retained coffee on `/coffee` without page errors.
The confirmed test account, its coffee, and the separate magic-link browser's
guest account were deleted. Hosted counts again returned to baseline.

## Parked operational acceptance

The *email-change callback in the original guest browser* was not directly
verified: the first verifier was lost with the test browser, and Supabase
rate-limited a second email-change attempt before sending. Its account
promotion and data continuity were verified in hosted Auth/Postgres, and the
same deployed callback succeeded for the magic-link flow. The rate-limited
attempt's temporary user and coffee were deleted; final counts were one Auth
user, seven coffees, and zero brew logs. A further deployed-browser retry on
2026-09-28 received Supabase's `429 over_email_send_rate_limit` before a link
was sent. Its temporary accounts and coffees were removed, and counts again
returned to baseline. The exact email-change callback check is deferred until
email sending is available; no additional retry is needed for the other
already-verified account and data-continuity behaviors.

The hosted RLS per-row `auth.uid()` performance warnings were handled in the
[next follow-through](phase-6-remediation.md). The Auth
leaked-password-protection warning remains a project setting follow-up.
