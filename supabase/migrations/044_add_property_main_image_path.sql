-- AUD-002 / B: transición reversible. Ejecutar primero checks/aud002_preflight.sql.
-- En la MISMA sesión definir app.qrih_storage_origin con el origen exacto de
-- NEXT_PUBLIC_SUPABASE_URL (sin barra final). No contiene una clave secreta.
-- No modifica registros de storage; sólo lee metadatos para validar referencias.
begin;

alter table public.properties add column if not exists main_image_path text;

create or replace function public.qrih_valid_image_reference(p_owner uuid, p_path text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select p_path ~ ('^' || p_owner::text || '/[a-zA-Z0-9._-]+[.]webp$')
    and exists (
      select 1 from storage.objects o
      where o.bucket_id = 'property-images' and o.name = p_path
        and o.owner_id = p_owner::text
    );
$$;
revoke all on function public.qrih_valid_image_reference(uuid, text) from public;

-- Conservar main_image. Ante excepciones, abortar toda la transacción.
do $$
declare
  v_origin text := nullif(current_setting('app.qrih_storage_origin', true), '');
  v_prefix text;
begin
  if v_origin is null or v_origin !~ '^https://[a-zA-Z0-9.-]+(:[0-9]+)?$' then
    raise exception 'Falta el origen HTTPS verificado; ejecutar preflight primero.';
  end if;
  v_prefix := v_origin || '/storage/v1/object/public/property-images/';
  if exists (
    select 1 from public.properties p
    where p.main_image is not null and p.main_image_path is null
      and not (
        left(p.main_image, length(v_prefix)) = v_prefix
        and public.qrih_valid_image_reference(p.owner_id, substring(p.main_image from length(v_prefix) + 1))
        and exists (select 1 from public.property_images pi
          where pi.property_id = p.id
            and pi.storage_path = substring(p.main_image from length(v_prefix) + 1))
      )
  ) then
    raise exception 'main_image contiene excepciones: revisar preflight; no se forzará la conversión.';
  end if;
  if exists (select 1 from public.property_images pi
      join public.properties p on p.id = pi.property_id
      where not public.qrih_valid_image_reference(p.owner_id, pi.storage_path))
    or exists (select 1 from public.property_images group by property_id having count(*) > 7)
    or exists (select 1 from public.property_images group by property_id, storage_path having count(*) > 1)
    or exists (select 1 from public.properties p where p.main_image_path is not null
      and not public.qrih_valid_image_reference(p.owner_id, p.main_image_path)) then
    raise exception 'Galería/rutas existentes inválidas: corregir excepciones antes del corte.';
  end if;
  update public.properties p
  set main_image_path = substring(p.main_image from length(v_prefix) + 1)
  where p.main_image_path is null and p.main_image is not null;
end;
$$;

-- Cubre RPC y escrituras directas. Bloquea la propiedad para serializar escrituras.
create or replace function public.qrih_validate_gallery_reference()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare v_owner uuid;
begin
  select owner_id into v_owner from public.properties
    where id = new.property_id for update;
  if v_owner is null or not public.qrih_valid_image_reference(v_owner, new.storage_path) then
    raise exception 'La imagen no pertenece al propietario de esta propiedad.';
  end if;
  if exists (select 1 from public.property_images pi
      where pi.property_id = new.property_id and pi.storage_path = new.storage_path
        and pi.id <> new.id) then
    raise exception 'Una fotografía no puede repetirse en la galería.';
  end if;
  if (select count(*) from public.property_images pi
      where pi.property_id = new.property_id and pi.id <> new.id) >= 7 then
    raise exception 'Máximo 7 fotografías por propiedad.';
  end if;
  return new;
end;
$$;
revoke all on function public.qrih_validate_gallery_reference() from public;
create trigger qrih_validate_gallery_reference
  before insert or update on public.property_images
  for each row execute function public.qrih_validate_gallery_reference();

create or replace function public.qrih_validate_main_image_path()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.main_image_path is not null
    and not public.qrih_valid_image_reference(new.owner_id, new.main_image_path) then
    raise exception 'La portada no pertenece al propietario de esta propiedad.';
  end if;
  if tg_op = 'UPDATE' and old.owner_id is distinct from new.owner_id and exists (
    select 1 from public.property_images pi where pi.property_id = new.id
      and not public.qrih_valid_image_reference(new.owner_id, pi.storage_path)
  ) then
    raise exception 'El cambio de dueño invalida las referencias de imágenes.';
  end if;
  return new;
end;
$$;
revoke all on function public.qrih_validate_main_image_path() from public;
create trigger qrih_validate_main_image_path
  before insert or update of main_image_path, owner_id on public.properties
  for each row execute function public.qrih_validate_main_image_path();
commit;
