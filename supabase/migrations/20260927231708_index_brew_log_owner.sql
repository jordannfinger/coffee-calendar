begin;

-- The composite ownership FK needs a matching child-side index for parent
-- deletes/updates. Its leftmost coffee_id column also covers the old index.
create index brew_logs_coffee_owner_idx
  on public.brew_logs (coffee_id, user_id);
drop index public.brew_logs_coffee_id_idx;

commit;
