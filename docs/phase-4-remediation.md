# Phase 4 — export safety and accessibility

Base: `64bb6ef3c986d9f29b3abd0f911f73fca7ff6efa` (hosted migration
follow-through, pushed to `main`). Scope: CC-04, CC-15, CC-16.

| Finding | Reproduction and change | Verification |
| --- | --- | --- |
| CC-04 | A CSV cell beginning with a spreadsheet formula marker was emitted as executable-looking text, and a bare carriage return was unquoted. Formula-like strings, including full-width markers or leading whitespace, now get a leading tab inside a quoted cell. CR joins quotes, commas, and LF in CSV escaping. Numeric values remain numeric. | An exact CSV regression failed before the fix and now covers `=`, `+`, `-`, `@`, full-width `＝`, leading whitespace, numbers, quotes, commas, CR, and LF. |
| CC-15 | Dark-theme primary actions used white text on light amber backgrounds. A theme-specific foreground now covers shared buttons and desktop/mobile navigation actions; keyboard focus has a visible outline. | Computed browser contrast is 7.31:1 light and 7.33:1 dark at rest, 11.96:1 light and 10.00:1 dark on hover. Keyboard Tab shows a 2px focus outline in both themes. |
| CC-16 | Shared fields rendered hints and errors without control associations; calendar status cells relied on emoji and tooltip titles. `Field` now connects hint/error IDs with `aria-describedby` and marks invalid controls. Coffee and brew validation errors map to their inputs. Calendar column headers name full dates and each status names its coffee, date, and state; pre-roast cells have text. | Field regressions failed before the fix and now pass. Browser checks confirm form associations and accessible calendar names. Checks at 375, 768, and 1280px found no page overflow. |

## Validation

The quoted-tab mitigation follows [OWASP's Excel-resistant CSV guidance](https://community.owasp.org/attacks/CSV_Injection).
The tab becomes part of exported text, so programmatic CSV consumers will see
that prefix on formula-like fields. JSON export preserves the original values.

- `npm test`: 85 passed across 11 files; no skipped tests.
- `npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check`: passed.
- Local production build in installed Chrome/Playwright with synthetic Supabase
  responses: theme contrast, hover, keyboard focus, form associations, calendar
  descriptions, and desktop/tablet/mobile widths passed without page errors.
- axe-core WCAG 2.0/2.1 A/AA scans of the checked home, calendar, and form
  screens returned zero violations. This is not a substitute for a manual
  screen-reader pass across every route.
- Open Code Review delegation covered 19/19 reviewable entries before the
  database follow-through was committed, with zero skipped; 8 excluded
  documentation/test/deleted-type paths were also inspected. A final preview
  against the remaining Phase 4 working tree identified 10/10 reviewable
  entries, all examined, and 3 excluded documentation/test paths, also
  inspected. The independent reviewer confirmed unchanged SQL across all six
  renames, reran 85 tests and type checking, and found no confirmed defect.

## Hosted database follow-through

The Phase 1 migrations were applied to the hosted project on 2026-09-28; see
[the database deployment record](database-migration-2026-09-28.md). Generated
types and the six filename alignments were committed separately as `64bb6ef`.
The database security regression passes against the renamed files.

The hosted project had no shared coffee at migration time. Positive live
sharing, authenticated account transitions, email callbacks, and complete
inventory pagination remain operational acceptance checks for Phase 5.
