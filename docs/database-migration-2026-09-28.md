# Coffee Calendar hosted migration — 2026-09-28

Project: `gvmhjkswotrfggrfmbov` (`coffee-calendar`, `us-east-1`). The local
application URL was checked against this project before any database action.
At the user's request, the inactive project was restored and reported
`ACTIVE_HEALTHY` before the migrations ran.

## Preflight and application

The hosted database had 7 coffees, 0 brew logs, and 0 brew logs attached to a
different owner's coffee. Its migration history contained the original four
schema changes, but neither Phase 1 migration. The original broad public-read
policy and single-column brew-log parent foreign key were present.

The reviewed privacy migration was applied first, followed by the reviewed
composite ownership migration. Supabase recorded them as:

| Version | Name |
| --- | --- |
| `20260927221449` | `20260927105109_protect_coffee_privacy` |
| `20260927221526` | `20260927105356_enforce_brew_log_owner` |

The repository migration files were renamed, without SQL changes, to match all
six recorded hosted versions. References in tests and documentation were
updated. This keeps future CLI migration comparisons aligned with the hosted
history; the local filenames originally used `0001`–`0004` for the already
applied baseline.

## Verification

- The broad public-read policy is absent; the remaining coffee policies are
  owner-scoped.
- `public.get_shared_coffee(uuid)` has the reviewed 18-column return type and
  can be called by `anon` and `authenticated`. An invalid token returns no row.
- The composite `brew_logs(coffee_id, user_id)` foreign key references
  `coffees(id, user_id)` with cascade delete. The old single-column foreign
  key is absent. The hosted mismatch count remains zero.
- Through the hosted REST API using the project's anonymous key, an anonymous
  coffee inventory read returned zero rows without error; an invalid token
  lookup returned zero rows without error.
- Hosted generated TypeScript types now include the RPC and composite
  relationship. The temporary client type overlay was removed locally; type
  checking, all 85 tests, lint, and the production build passed afterward.
- The existing PGlite security regressions pass after the filename alignment.

No existing coffee or brew-log row was deleted or reassigned. There were no
shared coffees on the hosted project, so a positive live share-token lookup
could not be verified against existing data. Authenticated two-owner flows,
account claiming, email callbacks, and deployed application behavior still
need end-to-end checks; local PGlite tests exercise owner RLS and constraints.

Supabase's security advisor still reports the intentionally public capability
RPC ([anonymous](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable),
[authenticated](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable))
and [anonymous sign-in policies](https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0012_auth_allow_anonymous_sign_ins).
These match this application's guest-session and exact-token sharing design;
the RPC uses a fixed projection and an empty search path. The separate
[leaked-password-protection warning](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
predates this migration and remains an operational follow-up.

The performance advisor also identifies the new composite brew-log foreign key
as [missing a covering index](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys).
The table held zero brew logs at migration time; index design can be measured
and handled in a later migration before that table grows. Existing RLS policies
also trigger the [per-row `auth.uid()` evaluation warning](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan).
Those performance notices were not changed during this security migration.

## Phase 5 index follow-through

On 2026-09-28, the hosted performance advisor still reported the composite
`brew_logs(coffee_id, user_id)` foreign key without a covering index. The
`index_brew_log_owner` migration was applied as hosted version `20260927231708`.
It replaces the old `coffee_id` index with a composite index whose leading
column still supports coffee-only lookups. The hosted index definition was
verified and the unindexed-foreign-key notice disappeared. No brew-log rows
existed at migration time.

A hosted transaction created a temporary shared coffee, read its approved
fields through `get_shared_coffee` under the `anon` role, then rolled back.
The coffee count remained 7, and the temporary token returned no result after
rollback. This verifies positive RPC behavior without leaving test data.
In a separate rollback transaction, a temporary second owner saw only their
own coffee under the `authenticated` role and JWT subject; none of the seven
existing owner's coffees were visible. The temporary Auth user and coffee were
absent afterward.
