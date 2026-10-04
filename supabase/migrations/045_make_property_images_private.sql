-- AUD-002: prepara RLS para el corte privado. NO cambia metadatos de Storage.
-- Requiere helpers de operaciones de Storage; si faltan, aborta sin abrir acceso.
-- Después de 044/045 y el deploy coordinado, usar Storage API updateBucket
-- (public: false), conservando allowedMimeTypes/fileSizeLimit inventariados.

begin;

do $$ begin
  if to_regprocedure('storage.allow_any_operation(text[])') is null then
    raise exception 'Actualizar/verificar Storage: falta allow_any_operation(text[]).';
  end if;
end $$;

-- Booleanos estrechos: no abrir profiles al público ni depender de su RLS.
create or replace function public.qrih_property_is_public(p_property_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.properties p
    join public.profiles pr on pr.id = p.owner_id
    where p.id = p_property_id and p.status = 'published'
      and pr.account_status = 'active' and pr.publications_enabled = true);
$$;
revoke all on function public.qrih_property_is_public(uuid) from public;
grant execute on function public.qrih_property_is_public(uuid) to anon, authenticated;

create or replace function public.qrih_can_read_property_image(p_path text, p_object_owner text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select p_object_owner = split_part(p_path, '/', 1) and (
    -- Lectura propia de historial (incluye suspendidos, como 032). Necesaria
    -- también para remove/rollback después de borrar referencias de BD.
    p_object_owner = auth.uid()::text
    or exists (select 1 from public.properties p
      where p.owner_id::text = p_object_owner
        and (exists (select 1 from public.property_images pi
               where pi.property_id = p.id and pi.storage_path = p_path)
             or (p.main_image_path = p_path and not exists (
               select 1 from public.property_images pi where pi.property_id = p.id)))
        and (public.qrih_property_is_public(p.id)
          or exists (select 1 from public.profiles a
            where a.id = auth.uid() and a.role = 'admin' and a.account_status='active')))
  );
$$;
revoke all on function public.qrih_can_read_property_image(text, text) from public;
grant execute on function public.qrih_can_read_property_image(text, text) to anon, authenticated;

-- Sólo decide acceso. No devuelve firmas ni acepta un owner_id enviado por cliente.
create or replace function public.qrih_authorized_image_paths(p_paths text[])
returns text[] language sql stable security definer set search_path = ''
as $$
  select coalesce(array_agg(o.name), array[]::text[]) from storage.objects o
  where o.bucket_id = 'property-images' and o.name = any(p_paths)
    and cardinality(p_paths) <= 1000
    and public.qrih_can_read_property_image(o.name, o.owner_id);
$$;
revoke all on function public.qrih_authorized_image_paths(text[]) from public;
grant execute on function public.qrih_authorized_image_paths(text[]) to anon, authenticated;

drop policy if exists "public sees published properties" on public.properties;
create policy "public sees published properties" on public.properties for select to public
  using (public.qrih_property_is_public(id));
drop policy if exists "public reads images of published properties" on public.property_images;
create policy "public reads images of published properties" on public.property_images for select to public
  using (public.qrih_property_is_public(property_id));

drop policy if exists "public can read published property images" on storage.objects;
create policy "public can read published property images"
  on storage.objects
  for select
  to public
  using (bucket_id = 'property-images'
    and public.qrih_can_read_property_image(name, owner_id));

-- Restrictivas: una policy permisiva adicional no puede abrir este bucket.
create policy "qrih property images read boundary" on storage.objects as restrictive
  for select to public using (bucket_id <> 'property-images'
    or (public.qrih_can_read_property_image(name, owner_id)
      and storage.allow_any_operation(array[
        'object.get_authenticated', 'object.get_authenticated_info', 'object.head_authenticated_info',
        'object.delete', 'object.delete_many'
      ])));
create policy "qrih property images delete boundary" on storage.objects as restrictive
  for delete to public using (bucket_id <> 'property-images' or (
    owner_id = auth.uid()::text and split_part(name, '/', 1) = auth.uid()::text
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.account_status = 'active')));
-- No se usa upsert/update/move: subir nuevos objetos y limpiar mediante API.
create policy "qrih property images no overwrite" on storage.objects as restrictive
  for update to public using (bucket_id <> 'property-images')
  with check (bucket_id <> 'property-images');

-- El catálogo público debe transmitir la ruta estable, nunca una URL firmada.
create or replace function public.get_advisor_catalog(advisor_public_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'public_id', p.public_id,
    'name', p.full_name,
    'company', p.company_name,
    'website', p.website,
    'phone', p.phone,
    'whatsapp', p.whatsapp,
    'avatar_url', p.avatar_url,
    'instagram_url', p.instagram_url,
    'facebook_url', p.facebook_url,
    'linkedin_url', p.linkedin_url,
    'is_verified', p.is_verified,
    'properties', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', pr.id,
            'slug', pr.slug,
            'title', pr.title,
            'operation', pr.operation,
            'zone', pr.zone,
            'price_display', pr.price_display,
            'total_area', pr.total_area,
            'covered_area', pr.covered_area,
            'max_height', pr.max_height,
            'share_commission', pr.share_commission,
            'main_image_path', pr.main_image_path
          )
          order by pr.created_at desc
        )
        from public.properties pr
        where pr.owner_id = p.id
          and pr.status = 'published'
      ),
      '[]'::jsonb
    )
  )
  into result
  from public.profiles p
  where p.public_id = advisor_public_id
    and p.role = 'publisher'
    and p.account_status = 'active'
    and p.publications_enabled = true;

  return result;
end;
$function$;

-- Preserva la auditoría de reenvío 039 e incluye la portada transitoria.
create or replace function public.audit_property_resubmission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  changed_fields jsonb := '[]'::jsonb;
begin
  if old.status::text in ('draft', 'rejected')
    and new.status::text = 'pending' then

    if old.title is distinct from new.title then
      changed_fields := changed_fields || '["title"]'::jsonb;
    end if;

    if old.operation is distinct from new.operation then
      changed_fields := changed_fields || '["operation"]'::jsonb;
    end if;

    if old.price_display is distinct from new.price_display then
      changed_fields := changed_fields || '["price_display"]'::jsonb;
    end if;

    if old.price_plus_vat is distinct from new.price_plus_vat then
      changed_fields := changed_fields || '["price_plus_vat"]'::jsonb;
    end if;

    if old.price_plus_maintenance is distinct from new.price_plus_maintenance then
      changed_fields := changed_fields || '["price_plus_maintenance"]'::jsonb;
    end if;

    if old.negotiable is distinct from new.negotiable then
      changed_fields := changed_fields || '["negotiable"]'::jsonb;
    end if;

    if old.zone_general is distinct from new.zone_general then
      changed_fields := changed_fields || '["zone_general"]'::jsonb;
    end if;

    if old.zone is distinct from new.zone then
      changed_fields := changed_fields || '["zone"]'::jsonb;
    end if;

    if old.location_visibility is distinct from new.location_visibility then
      changed_fields := changed_fields || '["location_visibility"]'::jsonb;
    end if;

    if old.address is distinct from new.address then
      changed_fields := changed_fields || '["address"]'::jsonb;
    end if;

    if old.total_area is distinct from new.total_area then
      changed_fields := changed_fields || '["total_area"]'::jsonb;
    end if;

    if old.covered_area is distinct from new.covered_area then
      changed_fields := changed_fields || '["covered_area"]'::jsonb;
    end if;

    if old.exterior_area is distinct from new.exterior_area then
      changed_fields := changed_fields || '["exterior_area"]'::jsonb;
    end if;

    if old.max_height is distinct from new.max_height then
      changed_fields := changed_fields || '["max_height"]'::jsonb;
    end if;

    if old.offices_area is distinct from new.offices_area then
      changed_fields := changed_fields || '["offices_area"]'::jsonb;
    end if;

    if old.parking is distinct from new.parking then
      changed_fields := changed_fields || '["parking"]'::jsonb;
    end if;

    if old.docks is distinct from new.docks then
      changed_fields := changed_fields || '["docks"]'::jsonb;
    end if;

    if old.description is distinct from new.description then
      changed_fields := changed_fields || '["description"]'::jsonb;
    end if;

    if old.share_commission is distinct from new.share_commission then
      changed_fields := changed_fields || '["share_commission"]'::jsonb;
    end if;

    if old.main_image is distinct from new.main_image then
      changed_fields := changed_fields || '["main_image"]'::jsonb;
    end if;

    if old.main_image_path is distinct from new.main_image_path then
      changed_fields := changed_fields || '["main_image_path"]'::jsonb;
    end if;

    insert into public.audit_logs (
      actor_id,
      entity_type,
      entity_id,
      action,
      metadata
    )
    values (
      new.owner_id,
      'property',
      new.id,
      'property_updated',
      jsonb_build_object(
        'previous_status', old.status::text,
        'status', new.status::text,
        'changed_fields', changed_fields
      )
    );
  end if;

  return new;
end;
$$;

commit;
