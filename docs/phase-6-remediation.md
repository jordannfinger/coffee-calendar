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

The performance advisor still reports the informational
[`coffees_roast_date_idx` unused-index notice](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).
With seven coffees and no evidence that dropping it helps, the index is left
in place. The Auth leaked-password-protection setting remains a separate
operational follow-up. The exact guest email-change callback check is
[parked](phase-5-remediation.md#parked-operational-acceptance) because Supabase
rate-limited the verification email.
