begin;

drop policy if exists "owners create own properties"
  on public.properties;

create policy "owners create own properties"
  on public.properties
  for insert
  to authenticated
  with check (
    auth.uid() = owner_id
    and status in ('draft', 'pending')
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.account_status = 'active'
    )
  );

commit;
