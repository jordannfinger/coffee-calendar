begin;

-- Keep the private table owner-only. Existing tokens remain valid through the RPC.
drop policy "shared coffees are publicly readable" on public.coffees;

-- Deliberately public capability: knowing one unguessable token permits only
-- this fixed projection, never enumeration or access to the underlying row.
create function public.get_shared_coffee(token uuid)
returns table (
  name text, roaster text, origin text, region text, producer text,
  variety text, elevation_m integer, process public.coffee_process,
  process_subtype text, roast_level public.roast_level, roast_date date,
  tasting_notes text, brew_method text, grind_setting text, recipe text,
  dose_g numeric, water_g numeric, storage_method text
)
language sql stable strict security definer
set search_path = ''
as $$
  select c.name, c.roaster, c.origin, c.region, c.producer, c.variety,
    c.elevation_m, c.process, c.process_subtype, c.roast_level, c.roast_date,
    c.tasting_notes, c.brew_method, c.grind_setting, c.recipe, c.dose_g,
    c.water_g, c.storage_method
  from public.coffees as c
  where c.share_token = token;
$$;

revoke all on function public.get_shared_coffee(uuid) from public;
grant execute on function public.get_shared_coffee(uuid) to anon, authenticated;

commit;
