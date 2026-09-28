# Phase 6 — RLS policy performance follow-through

The eight owner policies on `public.coffees` and `public.brew_logs` called
`auth.uid()` directly. Supabase's performance advisor reported
[`auth_rls_initplan`](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan)
for all eight policies. The forward migration changes each owner comparison to
`(select auth.uid()) = user_id`, following Supabase's
[RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select).
No policy command, role, or owner check changed.

The migration was applied to the hosted project as version `20260928022216`.
Hosted `pg_policies` shows the new expression for every select, insert,
update, and delete policy on both tables, including both sides of update.
The performance advisor no longer reports any `auth_rls_initplan` notice.
With the existing owner's JWT subject, a hosted read returned all seven own
coffees; a different authenticated subject and the unauthenticated role each
returned zero. Counts remained one Auth user, seven coffees, and zero brew logs.

The PGlite security regression applies the new migration before exercising
owner isolation, public share projection and revocation, brew-log parent
ownership, and cascade behavior. All 88 tests pass; type checking, linting,
the production build, and `git diff --check` pass.

## Unused roast-date index

The remaining informational
[`coffees_roast_date_idx` unused-index notice](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index)
had zero recorded scans. The inventory query filters by `user_id` before
ordering by `roast_date` and `id`; the separate `user_id` index had recorded
scans. Migration `20260928024554_drop_unused_roast_date_index.sql` removes
only the roast-date index. The hosted performance advisor now has no notices;
the owner index remains, and row counts are still one Auth user, seven coffees,
and zero brew logs. Revisit a composite owner/date/ID index if inventory size
and query plans later show a need for it.

[Leaked password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
is Pro-only, so its advisor warning cannot be resolved on this Free project.
The exact guest email-change callback check remains
[parked](phase-5-remediation.md#parked-operational-acceptance) because Supabase
rate-limited the verification email.
