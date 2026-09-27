-- Coffee Calendar — initial schema
-- Filter coffee only. Two tables: `process_profiles` (the configurable
-- development model, admin-editable, publicly readable) and `coffees`
-- (per-user inventory, protected by RLS).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Shared enums
-- ---------------------------------------------------------------------------

create type coffee_process as enum (
  'washed',
  'natural',
  'honey',
  'anaerobic',
  'anaerobic_natural',
  'anaerobic_washed',
  'carbonic_maceration',
  'carbonic_maceration_natural',
  'thermal_shock',
  'koji',
  'lactic',
  'yeast_inoculated',
  'extended_fermentation',
  'wet_hulled',
  'experimental'
);

create type roast_level as enum (
  'light',
  'light_medium',
  'medium',
  'medium_dark'
);

create type profile_confidence as enum ('high', 'medium', 'low');

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- process_profiles: the configurable development model.
--
-- The app's calculation engine computes a formula-based default for every
-- process/roast-level combination (see src/lib/coffee/model.ts). A row in
-- this table, when present, OVERRIDES that formula for its
-- (process, subtype, roast_level) combination — letting the model evolve
-- from real-world feedback without a code deploy. `subtype = null` matches
-- any subtype of that process.
-- ---------------------------------------------------------------------------

create table process_profiles (
  id uuid primary key default gen_random_uuid(),
  process coffee_process not null,
  subtype text,
  roast_level roast_level not null,
  min_rest_days integer not null check (min_rest_days >= 0),
  peak_start_days integer not null,
  peak_end_days integer not null,
  drinkable_end_days integer not null,
  too_old_days integer not null,
  confidence profile_confidence not null default 'medium',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint process_profiles_order check (
    min_rest_days <= peak_start_days
    and peak_start_days < peak_end_days
    and peak_end_days < drinkable_end_days
    and drinkable_end_days < too_old_days
  )
);

create unique index process_profiles_unique_combo
  on process_profiles (process, coalesce(subtype, ''), roast_level);

create trigger process_profiles_set_updated_at
  before update on process_profiles
  for each row execute function set_updated_at();

alter table process_profiles enable row level security;

-- Publicly readable (including anonymous/logged-out users) so the
-- calculator and date search work without an account.
create policy "process_profiles are publicly readable"
  on process_profiles for select
  using (true);

-- No insert/update/delete policy is defined: only the service role (used by
-- migrations/admin tooling) can write to this table by default.

-- ---------------------------------------------------------------------------
-- coffees: a user's saved coffee inventory.
-- ---------------------------------------------------------------------------

create table coffees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  -- required
  name text not null check (char_length(trim(name)) > 0),
  roaster text not null check (char_length(trim(roaster)) > 0),
  origin text not null check (char_length(trim(origin)) > 0),
  roast_date date not null,
  process coffee_process not null,
  roast_level roast_level not null,
  order_date date,

  -- optional detail
  process_subtype text,
  variety text,
  producer text,
  region text,
  elevation_m integer,
  lot text,
  harvest_year integer,
  tasting_notes text,

  -- brewing
  brew_method text,
  grind_setting text,
  recipe text,
  dose_g numeric(5, 1),
  water_g numeric(6, 1),

  -- personal
  notes text,
  rating smallint check (rating between 1 and 5),
  bag_size_g numeric(6, 1),
  remaining_percent smallint check (remaining_percent between 0 and 100),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index coffees_user_id_idx on coffees (user_id);
create index coffees_roast_date_idx on coffees (roast_date);

create trigger coffees_set_updated_at
  before update on coffees
  for each row execute function set_updated_at();

alter table coffees enable row level security;

create policy "users can view their own coffees"
  on coffees for select
  using (auth.uid() = user_id);

create policy "users can insert their own coffees"
  on coffees for insert
  with check (auth.uid() = user_id);

create policy "users can update their own coffees"
  on coffees for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete their own coffees"
  on coffees for delete
  using (auth.uid() = user_id);
