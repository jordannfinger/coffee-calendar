-- Pin search_path on the updated_at trigger function per the Supabase
-- database linter's function_search_path_mutable recommendation.

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql
set search_path = '';
