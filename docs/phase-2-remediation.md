# Phase 2 — consistent calculations and recommendations

Base: `c2a5e0d8d19a0f68fc8b19b7af1b2f2fbd2503af` (Phase 1, committed and pushed to `main`).
Scope: CC-06 through CC-11. Working checkout: `C:\Users\Jordan\Desktop\Coffee Calendar`.

| Finding | Reproduction and change | Verification |
| --- | --- | --- |
| CC-06 | Shared pages omitted existing profile overrides. They now load the same public profiles and use the owner view's resolver. | Resolver exact/wildcard/fallback regression; browser owner/public drinking-window text agrees with and without a nondefault override, including dates, status, confidence and notes. |
| CC-07 | A new comparison against the checked-in defaults failed before the fix. Peak start must follow minimum rest; light/light-medium wet-hulled confidence is low per the research document. | All 60 documented milestone/confidence combinations match. No research values or override rows changed. |
| CC-08 | The revised alert regression reproduced the one-day-early warning. Leaving tomorrow now means today is the final inclusive peak day. | Assertions cover Sep 2/3/4 status and alert boundaries; browser alert disappears after midnight as status changes. |
| CC-09 | Today and Search ranked finished bags. Both now filter explicitly zero remaining through one predicate. | Unknown and positive quantities remain eligible; browser verifies finished bags stay in My Coffee and disappear from both recommendation screens. |
| CC-10 | Timeline omitted the last peak day and clamped a late Today marker to an earlier endpoint; status text named the last peak day as the first day outside peak. | Rendered timeline reports 12 inclusive peak days, shows markers only inside the plotted dates, and names the following day as the start of out-of-peak. |
| CC-11 | Date-sensitive views had no midnight/resume update. A root provider now supplies one local calendar day, rescheduled at the next local midnight and on visibility return. | Fake-clock tests cover midnight, year/leap-day boundaries, resume and cleanup. Browser verifies Today, inventory filters/cards, default Search date, selected-date preservation and calendar month navigation. |

## Validation

- `npm test`: 65 passed across 8 files; no skipped tests.
- `npm run typecheck`, `npm run lint`, `npm run build`: passed.
- `git diff --check`: passed.
- Independent OCR delegation review: all 18 selected files and all 5 excluded
  test/report files examined; zero skipped, no confirmed material findings.
  The reviewer independently reran all 65 tests. Preexisting `.serena` files
  were inspected and left unchanged.
- Browser checks used the local production build, installed Chrome/Playwright,
  an Australia/Brisbane clock, and synthetic Supabase responses. No hosted
  writes were made. Initial browser attempts exposed harness timing and
  synthetic-cookie navigation problems; corrected checks completed with no
  page errors. These are not production end-to-end results.
- Existing conditional ranking assertions were replaced with explicit expected
  ordering and corrected fixture dates.

The existing engine remains authoritative. The checked-in research and its
60-row defaults are the reference for CC-07; this phase does not introduce new
coffee-science claims. Explicitly selected search/calculator dates and manually
navigated calendar months remain fixed when the current day changes. Form drafts
are preserved, while date limits update. Finished coffee history and exports
remain intact.

## Release and next checkpoint

Phase 1 was pushed directly to `main` at the user's request. Its two database
migrations are still unapplied; pushing application code does not apply them.
The public RPC requires the privacy migration before hosted sharing can work.
Supabase restoration, deployed grants/policies, and hosted behavior remain
unverified and unchanged by this phase.

Phase 3 (validation, saving, error feedback and recovery) remains the next
implementation checkpoint. In particular, this phase does not resolve existing
resource-error handling or form-validation findings.
