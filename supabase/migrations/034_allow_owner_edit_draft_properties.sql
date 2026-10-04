begin;

drop policy if exists "owners can resubmit rejected properties"
  on public.properties;

create policy "owners can edit draft or rejected properties"
  on public.properties
  for update
  to authenticated
  using (
    auth.uid() = owner_id
    and status in ('draft', 'rejected')
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.account_status = 'active'
    )
  )
  with check (
    auth.uid() = owner_id
    and status = 'pending'
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.account_status = 'active'
    )
  );

commit;
