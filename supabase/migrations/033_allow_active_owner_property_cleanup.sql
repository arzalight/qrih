begin;

-- ============================================================
-- 1. PROPERTY CONTACTS
-- ============================================================
-- Un propietario activo puede eliminar los contactos asociados
-- a sus propias propiedades. Esto permite eliminar una propiedad
-- cuyo FK property_contacts usa ON DELETE NO ACTION.

drop policy if exists "owners can delete contacts for own properties"
  on public.property_contacts;

create policy "owners can delete contacts for own properties"
  on public.property_contacts
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.properties
      join public.profiles
        on public.profiles.id = public.properties.owner_id
      where public.properties.id = public.property_contacts.property_id
        and public.properties.owner_id = auth.uid()
        and public.profiles.account_status = 'active'
    )
  );

-- ============================================================
-- 2. STORAGE: PROPERTY IMAGES
-- ============================================================
-- Un propietario activo puede eliminar únicamente imágenes
-- almacenadas dentro de su propia carpeta de usuario.

drop policy if exists "owners delete own property images"
  on storage.objects;

create policy "owners delete own property images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.account_status = 'active'
    )
  );

commit;
