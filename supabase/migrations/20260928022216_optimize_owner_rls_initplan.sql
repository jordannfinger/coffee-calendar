begin;

-- auth.uid() is fixed for a request. An uncorrelated select lets PostgreSQL
-- evaluate it once per statement instead of once per candidate row.
-- Preserve every policy's command, role, owner comparison and check semantics.
alter policy "users can view their own coffees" on public.coffees
  using ((select auth.uid()) = user_id);

alter policy "users can insert their own coffees" on public.coffees
  with check ((select auth.uid()) = user_id);

alter policy "users can update their own coffees" on public.coffees
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "users can delete their own coffees" on public.coffees
  using ((select auth.uid()) = user_id);

alter policy "users can view their own brew logs" on public.brew_logs
  using ((select auth.uid()) = user_id);

alter policy "users can insert their own brew logs" on public.brew_logs
  with check ((select auth.uid()) = user_id);

alter policy "users can update their own brew logs" on public.brew_logs
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "users can delete their own brew logs" on public.brew_logs
  using ((select auth.uid()) = user_id);

commit;
