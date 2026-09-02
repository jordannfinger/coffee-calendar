-- Per-session brew log: multiple logged brews per coffee, distinct from the
-- single "current recipe" fields already on `coffees`. Mirrors how a serious
-- home brewer actually tracks dialing in a coffee (grind, dose, drawdown,
-- rating per attempt) rather than one static recipe.

create table brew_logs (
  id uuid primary key default gen_random_uuid(),
  coffee_id uuid not null references coffees (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,

  brewed_at date not null default current_date,
  brew_method text,
  grind_setting text,
  dose_g numeric(5, 1),
  water_g numeric(6, 1),
  drawdown text,
  rating smallint check (rating between 1 and 5),
  tasting_notes text,
  notes text,
  locked boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index brew_logs_coffee_id_idx on brew_logs (coffee_id);
create index brew_logs_user_id_idx on brew_logs (user_id);

create trigger brew_logs_set_updated_at
  before update on brew_logs
  for each row execute function set_updated_at();

alter table brew_logs enable row level security;

create policy "users can view their own brew logs"
  on brew_logs for select
  using (auth.uid() = user_id);

create policy "users can insert their own brew logs"
  on brew_logs for insert
  with check (auth.uid() = user_id);

create policy "users can update their own brew logs"
  on brew_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete their own brew logs"
  on brew_logs for delete
  using (auth.uid() = user_id);
