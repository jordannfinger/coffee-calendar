begin;

-- Preflight is non-destructive: existing inconsistent rows need an explicit
-- ownership decision before this migration can proceed. Lock out concurrent
-- writes so the check and new constraint describe the same database state.
lock table public.coffees, public.brew_logs in share row exclusive mode;
do $$
begin
  if exists (
    select 1 from public.brew_logs b
    join public.coffees c on c.id = b.coffee_id
    where b.user_id <> c.user_id
  ) then
    raise exception 'Brew logs reference another owner''s coffee. Resolve ownership before applying this migration; no records have been changed.';
  end if;
end;
$$;

alter table public.coffees add constraint coffees_id_user_id_key unique (id, user_id);
alter table public.brew_logs drop constraint brew_logs_coffee_id_fkey;
alter table public.brew_logs add constraint brew_logs_coffee_owner_fkey
  foreign key (coffee_id, user_id) references public.coffees (id, user_id)
  on delete cascade;

commit;
