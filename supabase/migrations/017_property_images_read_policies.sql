-- Reafirma las lecturas de la galería: público solo para fichas publicadas;
-- propietario y administrador incluso antes de publicar.
drop policy if exists "public reads images of published properties" on public.property_images;
drop policy if exists "owners read images of own properties" on public.property_images;
drop policy if exists "admins read all property images" on public.property_images;

create policy "public reads images of published properties"
  on public.property_images for select to public
  using (
    exists (
      select 1 from public.properties
      where properties.id = property_images.property_id
        and properties.status = 'published'
    )
  );

create policy "owners read images of own properties"
  on public.property_images for select to authenticated
  using (
    exists (
      select 1 from public.properties
      where properties.id = property_images.property_id
        and properties.owner_id = auth.uid()
    )
  );

create policy "admins read all property images"
  on public.property_images for select to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
