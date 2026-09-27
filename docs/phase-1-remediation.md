# Phase 1 — privacy and account continuity

Base: `759b8f8f241cc2116fc72254d8ea09f7cef15dd2`.
Scope: CC-01, CC-02, CC-03, CC-05, CC-13. No production changes authorized.

| Finding | Local change | Regression coverage |
| --- | --- | --- |
| CC-01 | Owner-only coffee reads; exact-token RPC returns 18 approved fields; inventory explicitly filters owner and hides previous-owner results | PostgreSQL tests reproduce the original disclosure, then verify private reads, public projection, invalid/missing tokens and revocation |
| CC-02 | Session lookup/validation failures never trigger replacement signup; account claiming also waits for the shared initializer | Existing guest/permanent identities, failed refresh, recovery |
| CC-03 | Auth callback accepts only same-origin internal destinations | External, user-info, protocol-relative, backslash and malformed URLs; successful internal redirect; failed exchange |
| CC-05 | Concurrent consumers share one pending initialization; null INITIAL_SESSION does not finish startup; newer auth events supersede stale results; explicit login waits for pending startup | Concurrent signup and login sequencing tests; browser startup/recovery and delayed guest-to-password login checks |
| CC-13 | Composite coffee/owner foreign key; inconsistent existing records stop the migration without deletion | Own-parent insert/cascade, foreign-parent insert/retargeting, forged owner, preflight rollback |

The deleted edit page was restored unchanged from HEAD at the user's request.

## Local verification

Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`.

All four passed on 2026-09-27: 59 tests across 6 files, with no skipped tests.
The production build includes the restored edit route.

Browser checks against the local production build used synthetic auth/data
responses, with no hosted writes. Delayed startup issued one guest signup
across mounted consumers and did not show a premature failure. Inventory
requests included the current owner's ID. A simulated 503 retained the
existing session cookies, showed an error, and recovered on reload without
creating another guest. Password login waited for delayed guest signup to
finish, then reached `/today` with the permanent account. Public sharing
rendered through the exact-token RPC. These are mocked browser checks, not
evidence that the inactive hosted backend is operational.

The initial independent OCR delegation review found and reproduced a late
guest-signup response replacing a successful password login in the installed
Supabase SDK. Both explicit login handlers now await pending initialization;
startup failure does not prevent intentional login. Regression coverage
checks both successful and failed startup plus login without pending startup.

Final OCR delegation verification examined all 14 reviewable files (100%,
none skipped), plus the 6 excluded tests/documentation/lockfile entries.
No confirmed material findings remain. The two preexisting `.serena` files
were reviewed but not changed. `git diff --check` passes. Cross-tab auth
concurrency and hosted integration remain unverified. The edit page's Git
blob hash matches HEAD exactly: `07b8fd66cf6eaa624ac61e352ba062b8ace172f8`.

The database tests use PGlite (PostgreSQL compiled to WebAssembly), with synthetic
Supabase auth roles and `auth.uid()`. They apply the committed migrations and
execute actual RLS, grants, foreign keys, and transactions. The only omitted
baseline statement is installation of pgcrypto, which PGlite does not ship;
the schema uses PostgreSQL's built-in `gen_random_uuid()`. These tests do not
validate hosted Auth, PostgREST configuration, deployment grants, or concurrent
database connections. PGlite is a development-only dependency.

## Release prerequisites — not performed

1. Confirm the hosted project's intended inactive/active state. Do not restore,
   deploy, or apply production migrations without approval.
2. Inspect existing cross-owner relationships with a read-only query:

   ```sql
   select b.id, b.user_id as brew_owner, c.user_id as coffee_owner
   from public.brew_logs b
   join public.coffees c on c.id = b.coffee_id
   where b.user_id <> c.user_id;
   ```

   If rows exist, agree on their disposition. Neither migration deletes or
   reassigns records automatically.
3. Apply `20260927105109_protect_coffee_privacy.sql`. This drops the public
   base-table policy and adds the narrowly scoped public RPC. Its definer
   privilege is intentional: possession of the exact token authorizes only
   this fixed projection. It has an empty search path, no dynamic SQL, and
   explicit execution grants. Do not replace it with a broad public view.
4. Apply `20260927105356_enforce_brew_log_owner.sql`. It locks writes during
   preflight/constraint creation and fails atomically if ownership mismatches
   exist. It is separate so a blocked ownership repair does not prevent the
   privacy fix from being applied.
5. Deploy the client update after the privacy migration. During this sequence,
   old clients may temporarily fail to display public links; do not retain the
   unsafe policy for compatibility. Existing tokens are preserved.
6. Regenerate database types from the migrated schema, including the new
   composite relationship, and remove the temporary `sharedCoffee.ts` RPC
   overlay. The generated baseline is deliberately left untouched locally.
7. Verify two-owner isolation, token lookup/revocation, account claiming,
   concurrent guest startup, and real email callbacks in the deployed stack.

If a client rollback is needed, keep the restrictive privacy migration in
place. Do not restore the original public policy.

Phase 2 and later audit findings remain outside this checkpoint.
