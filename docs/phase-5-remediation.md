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

## Remaining operational acceptance

The hosted project has one existing Auth user and no shared coffees or brew
logs. Positive token lookup and two-owner isolation were checked inside
rollback transactions, but the deployed public page, Auth account-claiming,
email callbacks, and a real inventory beyond the API row cap have not been
exercised with persistent test accounts. Those checks need isolated test
identities and an email inbox or an existing account owner. The hosted RLS
per-row `auth.uid()` performance warnings and the Auth
leaked-password-protection warning remain;
the former is low impact at the current row count and the latter is a project
setting, not a code change.
