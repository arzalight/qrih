drop policy if exists "anyone can submit contacts" on public.property_contacts;

create policy "authenticated users can submit contacts"
  on public.property_contacts
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.properties
      where properties.id = property_contacts.property_id
        and properties.status = 'published'
    )
  );
