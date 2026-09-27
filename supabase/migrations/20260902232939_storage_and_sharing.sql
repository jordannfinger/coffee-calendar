-- Storage/packaging tracking (informational only — deliberately does not
-- perturb the calculation engine; see README "Assumptions and limitations").
alter table coffees add column storage_method text;
alter table coffees add column bag_opened_date date;

-- Shareable public link: when share_token is set, the coffee becomes
-- readable by anyone with the token, regardless of who's asking (including
-- logged-out visitors). This is an ADDITIONAL select policy — Postgres RLS
-- policies for the same command are OR'd together, so the existing
-- owner-only policy still applies for everything else.
alter table coffees add column share_token uuid unique;

create policy "shared coffees are publicly readable"
  on coffees for select
  using (share_token is not null);
