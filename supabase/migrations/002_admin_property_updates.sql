-- Restrict property updates to users whose own profile is an administrator.
--
-- The initial "owners manage own properties" policy used FOR ALL, which also
-- granted owners UPDATE permission.  Replace it with the same owner access for
-- SELECT, INSERT and DELETE, deliberately omitting UPDATE.
--
-- This migration does not grant administrators SELECT access.  Keep the public
-- published-property SELECT policy unchanged; add a separate admin read policy
-- only when that access is intentionally in scope.

begin;

drop policy "owners manage own properties" on public.properties;

create policy "owners read own properties"
  on public.properties
  for select
  to authenticated
  using (auth.uid() = owner_id);

create policy "owners create own properties"
  on public.properties
  for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy "owners delete own properties"
  on public.properties
  for delete
  to authenticated
  using (auth.uid() = owner_id);

create policy "admins update properties"
  on public.properties
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

commit;
