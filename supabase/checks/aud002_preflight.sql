-- SOLO LECTURA. Ejecutar como administrador antes de 044 en el entorno correcto.
-- Definir app.qrih_storage_origin con NEXT_PUBLIC_SUPABASE_URL exacto, sin '/' final.
-- No publica URLs ni nombres de objetos en el reporte; devuelve IDs y motivos.
do $$ begin
  if coalesce(current_setting('app.qrih_storage_origin', true), '') !~ '^https://[a-zA-Z0-9.-]+(:[0-9]+)?$' then
    raise exception 'Definir primero app.qrih_storage_origin con el origen verificado.';
  end if;
end $$;

with settings as (
  select current_setting('app.qrih_storage_origin') || '/storage/v1/object/public/property-images/' as prefix
), candidates as (
  select p.id, p.owner_id, p.main_image,
    left(p.main_image, length(s.prefix)) = s.prefix as expected_origin,
    substring(p.main_image from length(s.prefix) + 1) as path
  from public.properties p cross join settings s
), classified as (
  select c.*,
    coalesce(expected_origin and path ~ ('^' || owner_id::text || '/[a-zA-Z0-9._-]+[.]webp$'), false) as expected_format,
    exists (select 1 from storage.objects o where o.bucket_id = 'property-images'
      and o.name = c.path and o.owner_id = c.owner_id::text) as owned_object,
    exists (select 1 from public.property_images pi where pi.property_id = c.id
      and pi.storage_path = c.path) as gallery_match
  from candidates c
)
select count(*) as total_properties,
  count(*) filter (where main_image is not null) as main_image_total,
  count(*) filter (where main_image is null) as null_values,
  count(*) filter (where main_image is not null and expected_format and owned_object and gallery_match) as convertible,
  count(*) filter (where main_image is not null and not expected_format) as unexpected_format,
  count(*) filter (where main_image is not null and expected_format and not gallery_match) as no_gallery_match,
  count(*) filter (where main_image is not null and expected_format and not owned_object) as no_verified_ownership
from classified;

with settings as (
  select current_setting('app.qrih_storage_origin') || '/storage/v1/object/public/property-images/' as prefix
)
select p.id,
  case
    when left(p.main_image, length(s.prefix)) <> s.prefix then 'origen/formato inesperado'
    when substring(p.main_image from length(s.prefix)+1) !~ ('^'||p.owner_id::text||'/[a-zA-Z0-9._-]+[.]webp$') then 'ruta no canónica/owner distinto'
    when not exists (select 1 from storage.objects o where o.bucket_id='property-images'
      and o.name=substring(p.main_image from length(s.prefix)+1) and o.owner_id=p.owner_id::text) then 'objeto ausente/ownership no verificado'
    when not exists (select 1 from public.property_images pi where pi.property_id=p.id
      and pi.storage_path=substring(p.main_image from length(s.prefix)+1)) then 'sin correspondencia en galería'
  end as exception
from public.properties p cross join settings s
where p.main_image is not null
  and not (left(p.main_image,length(s.prefix))=s.prefix
    and substring(p.main_image from length(s.prefix)+1) ~ ('^'||p.owner_id::text||'/[a-zA-Z0-9._-]+[.]webp$')
    and exists (select 1 from storage.objects o where o.bucket_id='property-images'
      and o.name=substring(p.main_image from length(s.prefix)+1) and o.owner_id=p.owner_id::text)
    and exists (select 1 from public.property_images pi where pi.property_id=p.id
      and pi.storage_path=substring(p.main_image from length(s.prefix)+1)));

select pi.id, pi.property_id, 'galería sin ruta/objeto/owner válidos' as exception
from public.property_images pi join public.properties p on p.id=pi.property_id
where pi.storage_path !~ ('^'||p.owner_id::text||'/[a-zA-Z0-9._-]+[.]webp$')
  or not exists (select 1 from storage.objects o where o.bucket_id='property-images'
    and o.name=pi.storage_path and o.owner_id=p.owner_id::text);
select property_id, count(*) as images from public.property_images
group by property_id having count(*) > 7;
select property_id, count(*) as duplicates from public.property_images
group by property_id, storage_path having count(*) > 1;

-- Capturar configuración antes del corte y comparar luego. No modificarla en SQL.
select id, public, file_size_limit, allowed_mime_types from storage.buckets
where id='property-images';
select schemaname, tablename, policyname, roles, cmd, permissive, qual, with_check
from pg_policies where (schemaname='storage' and tablename='objects')
  or (schemaname='public' and tablename in ('profiles','properties','property_images'));
