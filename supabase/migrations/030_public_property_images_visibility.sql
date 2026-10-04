begin;

drop policy if exists "public reads images of published properties" on public.property_images;

create policy "public reads images of published properties"
on public.property_images
for select
to public
using (
  exists (
    select 1
    from public.properties
    join public.profiles
      on public.profiles.id = public.properties.owner_id
    where public.properties.id = public.property_images.property_id
      and public.properties.status = 'published'
      and public.profiles.account_status = 'active'
      and public.profiles.publications_enabled = true
  )
);

commit;
