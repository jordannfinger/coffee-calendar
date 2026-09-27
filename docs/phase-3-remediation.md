# Phase 3 — validation, saving and recovery

Base: `8d01e03c541caca06ef2c99df060f7239890ec83` (Phase 2, committed and pushed to `main`).
Scope: CC-12 and CC-14. Working checkout: `C:\Users\Jordan\Desktop\Coffee Calendar`.

| Finding | Reproduction and change | Verification |
| --- | --- | --- |
| CC-12 | Forms bypassed native validation and numeric conversion silently accepted partial or fractional integer values. Native constraints now run; shared validation rejects missing text, invalid dates, future roast/brew dates, malformed numbers and out-of-range values. Optional blanks remain null. | Sixteen invalid-input regressions failed before the fix; all now pass. Browser checks verify required fields, whitespace names and fractional ratings cause no writes. |
| CC-14 | Resource failures appeared as missing records or empty lists, and mutation failures could strand pending state or imply success. Screens now distinguish loading, failure, absence and content, expose Retry, retain drafts, and require an acknowledged mutation before navigation or clearing the form. | Browser checks cover inventory, Today, Calendar, Search, detail and edit read retries; create/edit/brew failures and recovery. Share creation/revocation, public-link retry, deletion and session retries also pass; no browser page errors. |

## Save recovery

Coffee and brew creation retain a client-generated UUID until success. Each
attempt upserts that UUID, so an uncertain committed response can be retried
without adding a duplicate. Later draft edits are persisted on retry. Existing
owner-only INSERT/UPDATE policies still apply. Payloads omit sharing and creation
metadata. Buttons and fieldsets disable during saves, and a synchronous pending
guard prevents two submissions before React updates the screen.

The initial independent review reproduced a Medium defect in the first version:
stable-ID inserts prevented duplicates but retries then conflicted forever. The
upsert fix resolves that defect. Browser checks simulate commit followed by a
lost response, revise the draft, retry, and verify one saved record. Brew checks
also cancel/reopen the draft and save a subsequent new brew with a different ID.

A sharing revocation failure explicitly says to treat the link as still active.
Clipboard failures do not claim that copying succeeded. Authentication retries
reuse the session startup path without reloading the page.

## Validation

- `npm test`: 82 passed across 9 files; no skipped tests.
- `npm run typecheck`, `npm run lint`, `npm run build`: passed after the recovery fix.
- `git diff --check`: passed (Windows line-ending notices only).
- Initial OCR delegation review: 25/25 selected files examined, zero skipped;
  the excluded validation test was also reviewed. Preexisting `.serena` files
  were inspected and left unchanged. One confirmed Medium finding was fixed.
- Full browser acceptance: passed, including lost-response retries with edited drafts and a subsequent new brew.
- Independent disposable PGlite probe using the repository schema and Phase 1 migrations: owner upserts save edited values with one row; cross-owner upserts fail RLS (`42501`).
- Final OCR delegation verification: 25/25 selected files examined, zero skipped (100%); both excluded files (validation test and this report) also inspected, 27/27 overall. No unresolved material findings. The reviewer additionally exercised the actual brew component through response loss, edited retry and the next new brew.
- Targeted clipboard browser probe: successful copy followed by rejected copy clears the success label and exposes the recovery message. Final lint/build passed after that fix.

Browser checks use the local production build, installed Chrome/Playwright, an
Australia/Brisbane context and synthetic Supabase responses. A local proxy strips
synthetic auth cookies from requests to Next middleware; all browser Supabase
requests are intercepted. These checks make no hosted writes and do not prove
hosted RLS, middleware authentication or deployment behavior. Harness iterations
corrected selectors that accidentally matched Next's route-announcement alert.

## Release and next checkpoint

Phase 2 was pushed directly to `main` at the user's request. Phase 3 is ready
for the requested commit and push to `main`. At this checkpoint, the Phase 1
database migrations remain unapplied, and hosted Supabase behavior remains unverified.
Phase 4 covers the remaining export and accessibility work.
