begin;

-- Inventory reads filter by user_id and then sort by roast date and ID.
-- The owner index remains; a roast-date-only index does not support that
-- filter and currently has zero recorded scans on the hosted database.
drop index public.coffees_roast_date_idx;

commit;
