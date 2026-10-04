begin;

drop policy if exists "public sees published properties" on public.properties;

create policy "public sees published properties"
on public.properties
for select
using (
  status = 'published'
  and exists (
    select 1
    from public.profiles
    where public.profiles.id = public.properties.owner_id
      and public.profiles.account_status = 'active'
      and public.profiles.publications_enabled = true
  )
);

commit;
