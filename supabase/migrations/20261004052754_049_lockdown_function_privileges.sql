-- AUD-019: Supabase concede EXECUTE también a anon/authenticated explícitamente.
-- Un REVOKE sólo de PUBLIC no elimina esos grants. Aplicar después de 048.
begin;

-- Retirar el grant automático explícito para funciones futuras creadas por
-- postgres en public. Cada nueva función debe además revocar PUBLIC y otorgar
-- sólo los permisos que realmente necesita (default global de PostgreSQL).
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated;

revoke execute on all functions in schema public from public, anon, authenticated;
revoke truncate, references, trigger on all tables in schema public from public, anon, authenticated;

-- El alta de autorizaciones ya es exclusiva del RPC atómico de 046.
-- Retirar la política permisiva antigua evita evaluar el helper interno
-- get_auto_approve_contact_requests con permisos del cliente.
drop policy if exists "authenticated users can request contact"
  on public.property_contact_authorizations;

-- Este helper se usa directamente desde RLS, por lo que requiere EXECUTE.
-- Ya no funciona como un oráculo del propietario de rutas privadas ajenas.
create or replace function public.qrih_verified_object_owner(p_bucket text,p_path text)
returns text language sql stable security definer set search_path='' as $$
  select u.owner_id::text from public.qrih_verified_uploads u
  where u.bucket_id=p_bucket and u.storage_path=p_path
    and (
      (auth.jwt()->>'role')='service_role'
      or u.owner_id=auth.uid()
      or (p_bucket='property-images'
        and public.qrih_can_read_property_image(p_path,u.owner_id::text))
    );
$$;
revoke all on function public.qrih_verified_object_owner(text,text) from public,anon,authenticated;

-- Funciones requeridas por las políticas y por la presentación pública.
grant execute on function public.current_user_is_admin() to anon,authenticated;
grant execute on function public.qrih_actor_is_active() to anon,authenticated;
grant execute on function public.qrih_can_read_property(uuid) to anon,authenticated;
grant execute on function public.qrih_property_is_public(uuid) to anon,authenticated;
grant execute on function public.qrih_can_read_property_image(text,text) to anon,authenticated;
grant execute on function public.qrih_verified_object_owner(text,text) to anon,authenticated;
grant execute on function public.qrih_authorized_image_paths(text[]) to anon,authenticated;
grant execute on function public.get_advisor_catalog(bigint) to anon,authenticated;
grant execute on function public.qrih_can_delete_unreferenced_image(text,text) to authenticated;

-- RPCs de los flujos existentes: además de EXECUTE, conservan autorización
-- por auth.uid()/cuenta activa/rol/propiedad en su cuerpo y triggers.
grant execute on function public.replace_property_images(uuid,jsonb) to authenticated;
grant execute on function public.respond_property_contact_authorization(uuid,text) to authenticated;
grant execute on function public.get_property_publisher_contact(uuid) to authenticated;
grant execute on function public.qrih_request_property_contact(uuid,text,text,text,text,text) to authenticated;
grant execute on function public.qrih_update_property_with_images(uuid,timestamptz,jsonb,jsonb) to authenticated;
grant execute on function public.qrih_delete_own_property(uuid) to authenticated;
grant execute on function public.qrih_moderate_property(uuid,text,text) to authenticated;
grant execute on function public.admin_set_profile_verified(uuid,boolean) to authenticated;
grant execute on function public.admin_set_profile_account_status(uuid,text,text) to authenticated;
grant execute on function public.qrih_take_server_limit(text,text) to service_role;

-- Triggers, validadores, funciones internas y notify_* anteriores permanecen
-- sin EXECUTE cliente; los invoca el flujo transaccional de 046/048.
notify pgrst,'reload schema';
commit;
