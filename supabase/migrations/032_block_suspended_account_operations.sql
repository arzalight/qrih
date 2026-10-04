begin;

-- ============================================================
-- 1. PROPERTIES
-- ============================================================
-- Una cuenta suspendida conserva lectura de su historial,
-- pero no puede crear, eliminar ni modificar propiedades.

drop policy if exists "owners create own properties" on public.properties;
create policy "owners create own properties"
  on public.properties
  for insert
  to authenticated
  with check (
    auth.uid() = owner_id
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.account_status = 'active'
    )
  );

drop policy if exists "owners delete own properties" on public.properties;
create policy "owners delete own properties"
  on public.properties
  for delete
  to authenticated
  using (
    auth.uid() = owner_id
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.account_status = 'active'
    )
  );

drop policy if exists "owners can resubmit rejected properties" on public.properties;
create policy "owners can resubmit rejected properties"
  on public.properties
  for update
  to authenticated
  using (
    auth.uid() = owner_id
    and status = 'rejected'
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

-- ============================================================
-- 2. PROPERTY IMAGES
-- ============================================================
-- El propietario suspendido conserva lectura de su historial,
-- pero pierde cualquier capacidad de modificar imágenes.

drop policy if exists "owners manage images of own properties"
  on public.property_images;

create policy "owners manage images of own properties"
  on public.property_images
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.properties
      join public.profiles
        on public.profiles.id = public.properties.owner_id
      where public.properties.id = public.property_images.property_id
        and public.properties.owner_id = auth.uid()
        and public.profiles.account_status = 'active'
    )
  )
  with check (
    exists (
      select 1
      from public.properties
      join public.profiles
        on public.profiles.id = public.properties.owner_id
      where public.properties.id = public.property_images.property_id
        and public.properties.owner_id = auth.uid()
        and public.profiles.account_status = 'active'
    )
  );

drop policy if exists "owners read images of own properties"
  on public.property_images;

create policy "owners read images of own properties"
  on public.property_images
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.properties
      join public.profiles
        on public.profiles.id = public.properties.owner_id
      where public.properties.id = public.property_images.property_id
        and public.properties.owner_id = auth.uid()
    )
  );

-- ============================================================
-- 3. STORAGE: PROPERTY IMAGES
-- ============================================================
-- Una cuenta suspendida no puede subir nuevas fotografías.

drop policy if exists "owners upload optimized property images"
  on storage.objects;

create policy "owners upload optimized property images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = auth.uid()::text
    and storage.extension(name) = 'webp'
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.account_status = 'active'
    )
  );

-- ============================================================
-- 4. REPLACE PROPERTY IMAGES
-- ============================================================
-- SECURITY DEFINER: debe validar explícitamente la cuenta activa.

create or replace function public.replace_property_images(
  p_property_id uuid,
  p_images jsonb
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_image jsonb;
  v_position integer := 0;
  v_path text;
  v_title text;
begin
  if auth.uid() is null then
    raise exception 'Necesitas iniciar sesión.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and account_status = 'active'
  ) then
    raise exception 'Tu cuenta está suspendida y no puede modificar fotografías.';
  end if;

  if jsonb_typeof(p_images) <> 'array'
    or jsonb_array_length(p_images) < 1
    or jsonb_array_length(p_images) > 7 then
    raise exception 'Debes registrar entre 1 y 7 fotografías.';
  end if;

  if not exists (
    select 1
    from public.properties
    where id = p_property_id
      and owner_id = auth.uid()
  ) then
    raise exception 'No tienes permiso para actualizar estas fotografías.';
  end if;

  delete from public.property_images
  where property_id = p_property_id;

  for v_image in select value from jsonb_array_elements(p_images)
  loop
    v_path := v_image->>'storage_path';
    v_title := left(trim(coalesce(v_image->>'title', '')), 120);

    if v_path is null
      or v_path !~ ('^' || auth.uid()::text || '/.+\.webp$') then
      raise exception 'La ruta de la fotografía no es válida.';
    end if;

    insert into public.property_images (
      property_id,
      storage_path,
      category,
      position,
      title
    ) values (
      p_property_id,
      v_path,
      case when v_position = 0 then 'main' else 'gallery' end,
      v_position,
      nullif(v_title, '')
    );

    v_position := v_position + 1;
  end loop;
end;
$function$;

-- ============================================================
-- 5. CONTACT AUTHORIZATION RESPONSE
-- ============================================================
-- SECURITY DEFINER: una cuenta suspendida no puede responder
-- solicitudes pendientes.

create or replace function public.respond_property_contact_authorization(
  p_authorization_id uuid,
  p_status text
)
returns table(status text)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_authorization record;
begin
  if auth.uid() is null then
    raise exception 'Necesitas iniciar sesión.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and account_status = 'active'
  ) then
    raise exception 'Tu cuenta está suspendida y no puede responder solicitudes.';
  end if;

  if p_status not in ('authorized', 'declined') then
    raise exception 'Solicitud inválida.';
  end if;

  select
    contact_authorization.id,
    contact_authorization.property_id,
    contact_authorization.advisor_id,
    contact_authorization.status,
    property_record.title
  into v_authorization
  from public.property_contact_authorizations contact_authorization
  join public.properties property_record
    on property_record.id = contact_authorization.property_id
  where contact_authorization.id = p_authorization_id
    and property_record.owner_id = auth.uid()
  for update of contact_authorization;

  if not found then
    raise exception 'No tienes permiso para responder esta solicitud.';
  end if;

  if v_authorization.status <> 'pending' then
    raise exception 'Esta solicitud ya fue respondida.';
  end if;

  update public.property_contact_authorizations
  set
    status = p_status,
    responded_at = now()
  where id = p_authorization_id;

  if p_status = 'authorized' and v_authorization.advisor_id is not null then
    insert into public.notifications (
      user_id,
      type,
      title,
      message,
      property_id
    )
    values (
      v_authorization.advisor_id,
      'property_contact_authorized',
      'Contacto autorizado',
      'El propietario autorizó tu solicitud de contacto para: ' ||
        v_authorization.title,
      v_authorization.property_id
    );
  end if;

  return query select p_status;
end;
$function$;

-- ============================================================
-- 6. OPPORTUNITY REGISTRATION
-- ============================================================
-- Una cuenta suspendida no puede registrar una de sus propiedades
-- en oportunidades.

drop policy if exists "users can create opportunity registrations"
  on public.opportunity_property_registrations;

create policy "users can create opportunity registrations"
  on public.opportunity_property_registrations
  for insert
  to authenticated
  with check (
    registered_by = auth.uid()
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.account_status = 'active'
    )
    and exists (
      select 1
      from public.properties p
      where p.id = opportunity_property_registrations.property_id
        and p.owner_id = auth.uid()
        and p.status = 'published'
    )
  );

-- ============================================================
-- 7. OPPORTUNITY NOTIFICATION FUNCTION
-- ============================================================
-- SECURITY DEFINER: debe respetar la suspensión.

create or replace function public.notify_opportunity_property_registered(
  p_demand_request_id uuid,
  p_property_id uuid,
  p_registered_by uuid
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid;
  v_property_title text;
begin
  if p_registered_by <> auth.uid() then
    raise exception 'Usuario no autorizado.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and account_status = 'active'
  ) then
    raise exception 'Tu cuenta está suspendida y no puede registrar oportunidades.';
  end if;

  select user_id
  into v_user_id
  from public.demand_requests
  where id = p_demand_request_id;

  select title
  into v_property_title
  from public.properties
  where id = p_property_id
    and owner_id = auth.uid()
    and status = 'published';

  if v_user_id is null or v_property_title is null then
    raise exception 'Datos de oportunidad no válidos.';
  end if;

  insert into public.notifications (
    user_id,
    type,
    title,
    message,
    demand_request_id,
    property_id
  )
  values (
    v_user_id,
    'opportunity_property_registered',
    'Nueva propiedad para tu requerimiento',
    'Una propiedad fue registrada como compatible con tu requerimiento: ' ||
      v_property_title,
    p_demand_request_id,
    p_property_id
  );
end;
$function$;

-- ============================================================
-- 8. PROPERTY CONTACT ACCESS
-- ============================================================
-- No se debe entregar contacto de una propiedad cuyo propietario
-- está suspendido, aunque exista una autorización histórica.

create or replace function public.get_property_publisher_contact(
  p_property_id uuid
)
returns table(
  name text,
  phone text,
  company text,
  email text
)
language sql
security definer
set search_path to 'public'
as $function$
  select
    p.full_name as name,
    p.phone,
    p.company_name as company,
    u.email
  from public.properties pr
  join public.profiles p
    on p.id = pr.owner_id
  join auth.users u
    on u.id = pr.owner_id
  where pr.id = p_property_id
    and pr.status = 'published'
    and p.account_status = 'active'
    and p.publications_enabled = true
    and pr.owner_id <> auth.uid()
    and exists (
      select 1
      from public.property_contact_authorizations contact_authorization
      where contact_authorization.property_id = pr.id
        and contact_authorization.advisor_id = auth.uid()
        and contact_authorization.status = 'authorized'
    );
$function$;

commit;
