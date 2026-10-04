-- Permite que la galería conserve las mismas reglas de acceso que la propiedad.
-- También evita que los originales sin optimizar lleguen al bucket.
drop policy if exists "owners upload images" on storage.objects;
create policy "owners upload optimized property images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = auth.uid()::text
    and storage.extension(name) = 'webp'
  );

create policy "public reads images of published properties"
  on public.property_images for select to public
  using (
    exists (
      select 1 from public.properties
      where properties.id = property_images.property_id
        and properties.status = 'published'
    )
  );

create policy "owners manage images of own properties"
  on public.property_images for all to authenticated
  using (
    exists (
      select 1 from public.properties
      where properties.id = property_images.property_id
        and properties.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.properties
      where properties.id = property_images.property_id
        and properties.owner_id = auth.uid()
    )
  );

create policy "admins manage all property images"
  on public.property_images for all to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
