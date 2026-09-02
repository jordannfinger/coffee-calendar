-- Example seed data for local development.
--
-- `coffees` rows belong to a specific auth.users row (RLS-enforced), so they
-- can't be seeded generically here — create a local account through the app
-- UI (sign up, then Add Coffee) once your dev server is running.
--
-- What CAN be seeded generically is `process_profiles`: the override table
-- that lets the development model evolve without a code deploy. The rows
-- below are illustrative only, showing the override mechanism working end
-- to end — they are NOT applied to the production project by default (the
-- app works fine with an empty process_profiles table, falling back to the
-- formula in src/lib/coffee/model.ts for every combination).
--
-- To try it locally: `supabase db reset` (via the Supabase CLI) re-applies
-- migrations and then this seed file. Then open the calculator for
-- Washed / Light and compare against Honey / Light — one uses this override,
-- the other still falls back to the formula.

insert into process_profiles (process, subtype, roast_level, min_rest_days, peak_start_days, peak_end_days, drinkable_end_days, too_old_days, confidence, notes)
values (
  'washed',
  null,
  'light',
  7,
  10,
  22,
  36,
  50,
  'high',
  'Example override: a roaster-specific adjustment (peak extended by one day) to demonstrate that a row here takes precedence over the formula default.'
)
on conflict (process, coalesce(subtype, ''), roast_level) do nothing;
