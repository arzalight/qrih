-- Evitar galería guardada sin edición y contactos eliminados sin propiedad.
-- Sólo modifica datos de aplicación, nunca tablas de metadatos de Storage.
begin;
-- Si existen duplicados, abortar sin deduplicar/borrar datos automáticamente.
create unique index if not exists qrih_interest_demand_property_unique on public.property_interest_requests(demand_request_id,property_id);
create unique index if not exists qrih_opportunity_demand_property_unique on public.opportunity_property_registrations(demand_request_id,property_id);

-- Portada + galería constituyen un único conjunto de hasta siete imágenes.
-- Diferido: reemplazo de galería y cambio de portada se validan al confirmar.
create function public.qrih_validate_complete_image_set()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_main text;
begin
  if tg_table_name='properties' then v_id:=new.id;
  else v_id:=case when tg_op='DELETE' then old.property_id else new.property_id end; end if;
  select main_image_path into v_main from public.properties where id=v_id for update;
  if not found then return null; end if;
  if v_main is not null and exists(select 1 from public.property_images where property_id=v_id)
    and not exists(select 1 from public.property_images where property_id=v_id and storage_path=v_main) then
    raise exception 'La portada debe pertenecer a la galería.';
  end if;
  if (select count(distinct path) from (
    select storage_path as path from public.property_images where property_id=v_id
    union select v_main where v_main is not null
  ) paths)>7 then raise exception 'Máximo 7 fotografías incluyendo la portada.'; end if;
  return null;
end $$;
revoke all on function public.qrih_validate_complete_image_set() from public;
create constraint trigger qrih_complete_image_set_property after insert or update on public.properties
  deferrable initially deferred for each row execute function public.qrih_validate_complete_image_set();
create constraint trigger qrih_complete_image_set_gallery after insert or update or delete on public.property_images
  deferrable initially deferred for each row execute function public.qrih_validate_complete_image_set();

create function public.qrih_update_property_with_images(
  p_property_id uuid, p_expected_updated_at timestamptz, p_changes jsonb, p_images jsonb
) returns void language plpgsql security definer set search_path='' as $$
declare v_old public.properties; v_new public.properties;
begin
  select * into v_old from public.properties where id=p_property_id for update;
  if not found or auth.uid() is null or v_old.owner_id<>auth.uid()
    or not public.qrih_actor_is_active() or v_old.status::text not in ('draft','rejected') then
    raise exception 'No puedes editar esta propiedad.';
  end if;
  if v_old.updated_at is distinct from p_expected_updated_at then
    raise exception 'La propiedad cambió. Recarga antes de editar.';
  end if;
  if p_changes is null or jsonb_typeof(p_changes)<>'object'
    or exists(select 1 from jsonb_object_keys(p_changes) k where k not in (
      'title','operation','price_display','price_plus_vat','price_plus_maintenance','negotiable',
      'zone_general','zone','location_visibility','address','total_area','covered_area','exterior_area',
      'max_height','offices_area','parking','docks','description','share_commission','status')) then
    raise exception 'Campos de edición inválidos.';
  end if;
  v_new := jsonb_populate_record(v_old,p_changes);
  if v_new.status::text not in ('draft','pending') then raise exception 'Estado de edición inválido.'; end if;
  perform public.replace_property_images(p_property_id,p_images);
  update public.properties set title=v_new.title,operation=v_new.operation,price_display=v_new.price_display,
    price_plus_vat=v_new.price_plus_vat,price_plus_maintenance=v_new.price_plus_maintenance,
    negotiable=v_new.negotiable,zone_general=v_new.zone_general,zone=v_new.zone,
    location_visibility=v_new.location_visibility,address=v_new.address,total_area=v_new.total_area,
    covered_area=v_new.covered_area,exterior_area=v_new.exterior_area,max_height=v_new.max_height,
    offices_area=v_new.offices_area,parking=v_new.parking,docks=v_new.docks,description=v_new.description,
    share_commission=v_new.share_commission,main_image_path=p_images->0->>'storage_path',
    status=v_new.status,rejection_reason=case when v_new.status='pending' then null else v_old.rejection_reason end,
    updated_at=clock_timestamp() where id=p_property_id;
end $$;
revoke all on function public.qrih_update_property_with_images(uuid,timestamptz,jsonb,jsonb) from public;
grant execute on function public.qrih_update_property_with_images(uuid,timestamptz,jsonb,jsonb) to authenticated;

create function public.qrih_delete_own_property(p_property_id uuid)
returns text[] language plpgsql security definer set search_path='' as $$
declare v_property public.properties; v_paths text[];
begin
  select * into v_property from public.properties where id=p_property_id for update;
  if not found or auth.uid() is null or v_property.owner_id<>auth.uid()
    or not public.qrih_actor_is_active() then raise exception 'No puedes eliminar esta propiedad.'; end if;
  select coalesce(array_agg(distinct path),array[]::text[]) into v_paths from (
    select storage_path as path from public.property_images where property_id=p_property_id
    union select v_property.main_image_path where v_property.main_image_path is not null
  ) paths where public.qrih_valid_image_reference(v_property.owner_id,path);
  delete from public.property_contact_authorizations where property_id=p_property_id;
  delete from public.property_contacts where property_id=p_property_id;
  delete from public.property_interest_requests where property_id=p_property_id;
  delete from public.opportunity_property_registrations where property_id=p_property_id;
  delete from public.notifications where property_id=p_property_id;
  delete from public.property_views where property_id=p_property_id;
  -- home_pool y property_images tienen cascade. La bitácora permanece.
  delete from public.properties where id=p_property_id;
  return v_paths;
end $$;
revoke all on function public.qrih_delete_own_property(uuid) from public;
grant execute on function public.qrih_delete_own_property(uuid) to authenticated;

create function public.qrih_moderate_property(p_property_id uuid,p_action text,p_reason text default null)
returns void language plpgsql security definer set search_path='' as $$
declare v_property public.properties; v_expected public.property_status; v_status public.property_status; v_action text;
begin
  if not public.current_user_is_admin() then raise exception 'Necesitas un administrador activo.'; end if;
  if p_action is null or p_action not in ('publish','reject','unpublish')
    or (p_action<>'publish' and nullif(trim(p_reason),'') is null) or length(p_reason)>3000 then
    raise exception 'Acción de moderación inválida.';
  end if;
  v_expected:=case when p_action='unpublish' then 'published'::public.property_status else 'pending'::public.property_status end;
  v_status:=case when p_action='publish' then 'published'::public.property_status else 'rejected'::public.property_status end;
  select * into v_property from public.properties where id=p_property_id for update;
  if not found or v_property.status<>v_expected then raise exception 'La propiedad ya no está en el estado esperado.'; end if;
  update public.properties set status=v_status,rejection_reason=case when p_action='publish' then null else trim(p_reason) end,
    previous_data=case when p_action='publish' then previous_data else to_jsonb(v_property) end,
    updated_at=clock_timestamp() where id=p_property_id;
  v_action:=case p_action when 'publish' then 'property_published' when 'reject' then 'property_rejected' else 'property_unpublished' end;
  insert into public.audit_logs(actor_id,entity_type,entity_id,action,metadata)
    values(auth.uid(),'property',p_property_id,v_action,jsonb_build_object('previous_status',v_expected,'status',v_status,'rejection_reason',p_reason));
  if p_action='publish' then perform public.notify_property_published(p_property_id);
  elsif p_action='reject' then perform public.notify_property_rejected(p_property_id,p_reason); end if;
end $$;
revoke all on function public.qrih_moderate_property(uuid,text,text) from public;
grant execute on function public.qrih_moderate_property(uuid,text,text) to authenticated;

-- Los helpers antiguos usan nombres de tablas sin calificar; fijar public antes
-- de pg_temp y retirar CREATE público evita sombreado de tablas/funciones.
revoke create on schema public from public,anon,authenticated;
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.prosecdef and p.proname in (
      'replace_property_images','respond_property_contact_authorization','admin_set_profile_verified',
      'admin_set_profile_account_status','notify_property_published','notify_property_rejected',
      'qrih_advisor_catalog_internal','qrih_publisher_contact_internal','audit_property_resubmission',
      'audit_property_created','get_auto_approve_contact_requests')
  loop execute format('alter function %s set search_path = public, pg_temp',f.signature); end loop;
end $$;
-- Una sesión suspendida tampoco puede invocar los RPC antiguos de notificación.
create function public.qrih_guard_notification_insert()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is not null and not public.qrih_actor_is_active() then raise exception 'Necesitas una cuenta activa.'; end if;
  return new;
end $$;
revoke all on function public.qrih_guard_notification_insert() from public;
create trigger qrih_guard_notification_insert before insert on public.notifications
  for each row execute function public.qrih_guard_notification_insert();
create policy "qrih notifications server insert only" on public.notifications as restrictive for insert to public with check(false);
create policy "qrih audit insert boundary" on public.audit_logs as restrictive for insert to public
  with check(public.current_user_is_admin() and actor_id=auth.uid());
commit;
