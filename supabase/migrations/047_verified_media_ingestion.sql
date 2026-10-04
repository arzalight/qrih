-- Ingesta comprobada en servidor. No modifica metadatos de storage mediante SQL.
begin;
create table public.qrih_verified_uploads (
  bucket_id text not null check(bucket_id in ('property-images','profile-images')),
  storage_path text not null,
  owner_id uuid not null references public.profiles(id),
  mime_type text not null check(mime_type='image/webp'),
  byte_size integer not null check(byte_size>0 and byte_size<=20971520),
  sha256 text not null check(length(sha256)=64),
  public_url text,
  created_at timestamptz not null default now(),
  primary key(bucket_id,storage_path)
);
alter table public.qrih_verified_uploads enable row level security;
revoke all on public.qrih_verified_uploads from public,anon,authenticated;
grant select,insert,update,delete on public.qrih_verified_uploads to service_role;

create table public.qrih_rate_windows (
  subject text not null, action text not null, window_start timestamptz not null,
  hits integer not null, primary key(subject,action,window_start)
);
alter table public.qrih_rate_windows enable row level security;
revoke all on public.qrih_rate_windows from public,anon,authenticated;
grant select,insert,update,delete on public.qrih_rate_windows to service_role;
create or replace function public.qrih_take_server_limit(p_subject text,p_action text)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_limit int; v_window timestamptz; v_hits int;
begin
  v_limit := case p_action when 'media' then 50 when 'avatar' then 10 when 'demand' then 5 when 'view' then 60 else 0 end;
  if v_limit=0 or length(p_subject) not between 1 and 100 then return false; end if;
  v_window := to_timestamp(floor(extract(epoch from now())/900)*900);
  delete from public.qrih_rate_windows where window_start<now()-interval '1 day';
  insert into public.qrih_rate_windows values(p_subject,p_action,v_window,1)
    on conflict(subject,action,window_start) do update set hits=public.qrih_rate_windows.hits+1
    returning hits into v_hits;
  return v_hits<=v_limit;
end $$;
revoke all on function public.qrih_take_server_limit(text,text) from public,anon,authenticated;
grant execute on function public.qrih_take_server_limit(text,text) to service_role;

create or replace function public.qrih_verified_object_owner(p_bucket text,p_path text)
returns text language sql stable security definer set search_path='' as $$
  select owner_id::text from public.qrih_verified_uploads
    where bucket_id=p_bucket and storage_path=p_path;
$$;
revoke all on function public.qrih_verified_object_owner(text,text) from public;
grant execute on function public.qrih_verified_object_owner(text,text) to anon,authenticated;

-- service_role upload no asigna owner_id de Storage. Se comprueba procedencia
-- sólo mediante un registro no escribible por clientes y una ruta generada por servidor.
create or replace function public.qrih_valid_image_reference(p_owner uuid,p_path text)
returns boolean language sql stable security definer set search_path='' as $$
  select p_path ~ ('^'||p_owner::text||'/[a-zA-Z0-9._-]+[.]webp$') and exists (
    select 1 from storage.objects o where o.bucket_id='property-images' and o.name=p_path
      and coalesce(o.owner_id,public.qrih_verified_object_owner(o.bucket_id,o.name))=p_owner::text);
$$;
create or replace function public.qrih_authorized_image_paths(p_paths text[])
returns text[] language sql stable security definer set search_path='' as $$
  select coalesce(array_agg(o.name),array[]::text[]) from storage.objects o
    where o.bucket_id='property-images' and o.name=any(p_paths) and cardinality(p_paths)<=1000
      and public.qrih_can_read_property_image(o.name,coalesce(o.owner_id,public.qrih_verified_object_owner(o.bucket_id,o.name)));
$$;
drop policy "public can read published property images" on storage.objects;
create policy "public can read published property images" on storage.objects for select to public
  using(bucket_id='property-images' and public.qrih_can_read_property_image(name,
    coalesce(owner_id,public.qrih_verified_object_owner(bucket_id,name))));
drop policy "qrih property images read boundary" on storage.objects;
create policy "qrih property images read boundary" on storage.objects as restrictive for select to public
  using(bucket_id<>'property-images' or (
    public.qrih_can_read_property_image(name,coalesce(owner_id,public.qrih_verified_object_owner(bucket_id,name)))
    and storage.allow_any_operation(array['object.get_authenticated','object.get_authenticated_info',
      'object.head_authenticated_info','object.delete','object.delete_many'])));
drop policy "qrih property images delete boundary" on storage.objects;
create function public.qrih_can_delete_unreferenced_image(p_path text,p_owner text)
returns boolean language sql stable security definer set search_path='' as $$
  select p_owner=auth.uid()::text and split_part(p_path,'/',1)=auth.uid()::text
    and public.qrih_actor_is_active()
    and not exists(select 1 from public.property_images where storage_path=p_path)
    and not exists(select 1 from public.properties where main_image_path=p_path);
$$;
revoke all on function public.qrih_can_delete_unreferenced_image(text,text) from public;
grant execute on function public.qrih_can_delete_unreferenced_image(text,text) to authenticated;
create policy "qrih property images delete boundary" on storage.objects as restrictive for delete to public
  using(bucket_id<>'property-images' or (
    public.qrih_can_delete_unreferenced_image(name,coalesce(owner_id,public.qrih_verified_object_owner(bucket_id,name)))));

-- No permitir subir bytes arbitrarios directamente con una clave pública/JWT.
-- Validación real de formato/decodificación/tamaño, ruta y cuotas vive en API servidor.
create policy "qrih verified uploads only" on storage.objects as restrictive for insert to public
  with check(bucket_id not in ('property-images','profile-images'));
create policy "qrih avatars no overwrite" on storage.objects as restrictive for update to public
  using(bucket_id<>'profile-images') with check(bucket_id<>'profile-images');
create policy "qrih owner avatar cleanup read" on storage.objects for select to authenticated
  using(bucket_id='profile-images' and split_part(name,'/',1)=auth.uid()::text
    and coalesce(owner_id,public.qrih_verified_object_owner(bucket_id,name))=auth.uid()::text
    and public.qrih_actor_is_active()
    and storage.allow_any_operation(array['object.delete','object.delete_many']));
create policy "qrih avatar delete boundary" on storage.objects as restrictive for delete to public
  using(bucket_id<>'profile-images' or (split_part(name,'/',1)=auth.uid()::text
    and coalesce(owner_id,public.qrih_verified_object_owner(bucket_id,name))=auth.uid()::text
    and public.qrih_actor_is_active()));

create or replace function public.qrih_protect_avatar_reference()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is not null and not public.current_user_is_admin() and new.avatar_url is not null
    and (tg_op='INSERT' or new.avatar_url is distinct from old.avatar_url)
    and not exists(select 1 from public.qrih_verified_uploads u
      where u.bucket_id='profile-images' and u.owner_id=new.id and u.public_url=new.avatar_url) then
    raise exception 'El avatar debe ser una imagen propia validada por el servidor.';
  end if;
  return new;
end $$;
revoke all on function public.qrih_protect_avatar_reference() from public;
create trigger ab_qrih_protect_avatar_reference before insert or update on public.profiles
  for each row execute function public.qrih_protect_avatar_reference();

-- Altas públicas pasan por API validada, nunca una inserción anónima arbitraria.
create policy "qrih demands server insert only" on public.demand_requests
  as restrictive for insert to public with check(false);
create policy "qrih views server insert only" on public.property_views
  as restrictive for insert to public with check(false);
commit;
