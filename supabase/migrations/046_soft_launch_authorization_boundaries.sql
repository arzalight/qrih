-- Correcciones bloqueantes de aislamiento y escrituras directas. No ejecutada en real.
begin;

create or replace function public.current_user_is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id=auth.uid()
    and role='admin' and account_status='active');
$$;
revoke all on function public.current_user_is_admin() from public;
grant execute on function public.current_user_is_admin() to anon, authenticated;

create or replace function public.qrih_actor_is_active()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id=auth.uid() and account_status='active');
$$;
revoke all on function public.qrih_actor_is_active() from public;
grant execute on function public.qrih_actor_is_active() to anon, authenticated;

create or replace function public.qrih_can_read_property(p_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.qrih_property_is_public(p_id) or public.current_user_is_admin()
    or exists(select 1 from public.properties where id=p_id and owner_id=auth.uid());
$$;
revoke all on function public.qrih_can_read_property(uuid) from public;
grant execute on function public.qrih_can_read_property(uuid) to anon, authenticated;

-- Protección también en INSERT, no sólo UPDATE; RLS no valida columnas.
create or replace function public.qrih_protect_managed_profile_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_field text;
begin
  if auth.uid() is not null and not public.current_user_is_admin() then
    if tg_op='INSERT' then
      if new.id <> auth.uid() or new.role <> 'publisher' or new.plan::text <> 'trial'
        or new.is_verified or new.account_status <> 'active' or not new.publications_enabled
        or new.trial_ends_at is not null or new.suspension_reason is not null
        or new.suspended_at is not null or new.suspended_by is not null
        or new.identity_last_changed_at is not null or new.identity_change_locked_until is not null then
        raise exception 'No puedes asignar campos administrados al crear el perfil.';
      end if;
      -- El ID público sólo puede ser asignado por el servidor, nunca elegido.
      new.public_id := nextval('public.profiles_public_id_seq');
      new.created_at := clock_timestamp();
    else
      foreach v_field in array array['id','role','plan','trial_ends_at','is_verified',
        'account_status','suspension_reason','suspended_at','suspended_by',
        'publications_enabled','public_id','created_at',
        'identity_last_changed_at','identity_change_locked_until'] loop
        if to_jsonb(new)->v_field is distinct from to_jsonb(old)->v_field then
          raise exception 'No puedes modificar campos administrados del perfil.';
        end if;
      end loop;
    end if;
  end if;
  if length(trim(new.full_name)) not between 1 and 120 then
    raise exception 'Nombre inválido.';
  end if;
  return new;
end $$;
revoke all on function public.qrih_protect_managed_profile_fields() from public;
-- Ejecutar antes de protect_profile_identity_changes, que asigna el bloqueo legítimo.
create trigger aa_qrih_protect_managed_profile_fields before insert or update on public.profiles
  for each row execute function public.qrih_protect_managed_profile_fields();

create or replace function public.qrih_protect_property_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_field text; v_number numeric;
begin
  if auth.uid() is not null and not public.current_user_is_admin() then
    if not public.qrih_actor_is_active() or new.owner_id <> auth.uid()
      or new.status::text not in ('draft','pending') then
      raise exception 'No puedes guardar la propiedad en ese estado.';
    end if;
    if tg_op='INSERT' then
      if coalesce(new.featured,false) or new.featured_priority is not null
        or new.last_verified_at is not null or new.verification_due_at is not null
        or new.rejection_reason is not null or new.main_image is not null then
        raise exception 'No puedes asignar campos de moderación.';
      end if;
    else
      if old.status::text not in ('draft','rejected') then
        raise exception 'Sólo puedes editar borradores o propiedades rechazadas.';
      end if;
      foreach v_field in array array['id','owner_id','created_at','featured','featured_priority',
        'last_verified_at','verification_due_at','main_image','previous_data'] loop
        if to_jsonb(new)->v_field is distinct from to_jsonb(old)->v_field then
          raise exception 'No puedes modificar campos de moderación.';
        end if;
      end loop;
    end if;
  end if;
  if length(trim(new.title)) not between 1 and 200 or length(new.description) > 10000
    or new.total_area < 0 or new.covered_area < 0 or new.exterior_area < 0
    or new.offices_area < 0 or new.parking < 0 or new.docks < 0 then
    raise exception 'Datos de propiedad inválidos.';
  end if;
  foreach v_field in array array['price_value','total_area','covered_area','exterior_area','offices_area','parking','docks'] loop
    v_number := (to_jsonb(new)->>v_field)::numeric;
    if v_number < 0 or v_number > 1e12 then raise exception 'Cantidad fuera de rango.'; end if;
  end loop;
  if length(new.zone)>160 or length(new.zone_general)>160 or length(new.address)>1000
    or length(new.price_display)>80 or length(new.max_height)>80 then raise exception 'Datos de propiedad demasiado largos.'; end if;
  new.updated_at := clock_timestamp();
  return new;
end $$;
revoke all on function public.qrih_protect_property_fields() from public;
create trigger aa_qrih_protect_property_fields before insert or update on public.properties
  for each row execute function public.qrih_protect_property_fields();

-- RPC definer y escrituras directas comparten la barrera de moderación.
create or replace function public.qrih_guard_gallery_mutation()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_property public.properties; v_id uuid;
begin
  v_id := case when tg_op='DELETE' then old.property_id else new.property_id end;
  select * into v_property from public.properties where id=v_id for update;
  -- Cascade al borrar la propiedad no es una edición de galería.
  if tg_op='DELETE' and not found then return old; end if;
  if auth.uid() is not null and not public.current_user_is_admin() then
    if v_property.owner_id <> auth.uid() or not public.qrih_actor_is_active()
      or v_property.status::text not in ('draft','rejected') then
      raise exception 'No puedes modificar fotografías fuera de edición autorizada.';
    end if;
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
revoke all on function public.qrih_guard_gallery_mutation() from public;
create trigger aa_qrih_guard_gallery_mutation before insert or update or delete on public.property_images
  for each row execute function public.qrih_guard_gallery_mutation();

-- Barreras restrictivas: no depender de esconder botones ni de OR permisivos.
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.property_contact_authorizations enable row level security;
alter table public.opportunity_property_registrations enable row level security;
alter table public.property_interest_requests enable row level security;
alter table public.property_views enable row level security;

create policy "qrih profiles read boundary" on public.profiles as restrictive for select to public
  using(id=auth.uid() or public.current_user_is_admin());
create policy "qrih properties read boundary" on public.properties as restrictive for select to public
  using(owner_id=auth.uid() or public.current_user_is_admin());
create policy "qrih gallery read boundary" on public.property_images as restrictive for select to public
  using(public.qrih_can_read_property(property_id));
create policy "qrih demands read boundary" on public.demand_requests as restrictive for select to public
  using(user_id=auth.uid() or public.current_user_is_admin());
create policy "qrih notifications read boundary" on public.notifications as restrictive for select to public
  using(user_id=auth.uid());
create policy "qrih logs read boundary" on public.audit_logs as restrictive for select to public
  using(public.current_user_is_admin());

-- Notificaciones son registros del servidor: usuarios sólo pueden marcar read_at.
create or replace function public.qrih_protect_notification_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null and (to_jsonb(new)-'read_at') is distinct from (to_jsonb(old)-'read_at') then
    raise exception 'Sólo puedes marcar tu notificación como leída.';
  end if;
  return new;
end $$;
revoke all on function public.qrih_protect_notification_update() from public;
create trigger qrih_protect_notification_update before update on public.notifications
  for each row execute function public.qrih_protect_notification_update();

-- Aprobar una solicitud siempre requiere el RPC del dueño, nunca INSERT directo.
create policy "qrih contact authorization insert boundary" on public.property_contact_authorizations
  as restrictive for insert to public with check(false);
create policy "qrih contacts insert boundary" on public.property_contacts
  as restrictive for insert to public with check(false);

-- Superficie pública separada; evita exponer address/previous_data por SELECT *.
-- La vista es sólo lectura, con filtro de estado/cuenta explícito y sin datos
-- internos de moderación. No concede acceso a la tabla privada subyacente.
do $$
declare v_columns text;
begin
  select string_agg(case when attname='address'
    then 'case when p.location_visibility=''address'' then p.address else null end as address'
    else format('p.%I',attname) end,', ' order by attnum) into v_columns
  from pg_attribute where attrelid='public.properties'::regclass and attnum>0 and not attisdropped
    and attname not in ('previous_data','rejection_reason','main_image','publication_authorized_at',
      'terms_accepted_at','last_verified_at','verification_due_at');
  execute 'create view public.properties_public with (security_barrier=true) as select '||v_columns||
    ' from public.properties p where public.qrih_property_is_public(p.id)';
end $$;
-- También retirar privilegios heredados de DEFAULT PRIVILEGES de Supabase.
revoke all on public.properties_public from public,anon,authenticated;
grant select on public.properties_public to anon,authenticated;

create policy "qrih interests insert boundary" on public.property_interest_requests as restrictive
  for insert to public with check(user_id=auth.uid() and public.qrih_actor_is_active()
    and public.qrih_property_is_public(property_id)
    and exists(select 1 from public.demand_requests d where d.id=demand_request_id and d.user_id=auth.uid()));
drop policy "users can create property interests" on public.property_interest_requests;
create policy "users can create property interests" on public.property_interest_requests for insert to authenticated
  with check(user_id=auth.uid() and public.qrih_property_is_public(property_id)
    and exists(select 1 from public.demand_requests d where d.id=demand_request_id and d.user_id=auth.uid()));
create policy "qrih opportunity insert boundary" on public.opportunity_property_registrations as restrictive
  for insert to public with check(registered_by=auth.uid() and public.qrih_actor_is_active()
    and public.qrih_property_is_public(property_id)
    and exists(select 1 from public.properties p where p.id=property_id and p.owner_id=auth.uid())
    and exists(select 1 from public.demand_requests d where d.id=demand_request_id and d.user_id=auth.uid()));
create policy "qrih authorization update boundary" on public.property_contact_authorizations as restrictive
  for update to public using(false) with check(false);

create or replace function public.qrih_notify_registered_opportunity()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_user uuid; v_title text;
begin
  select user_id into v_user from public.demand_requests where id=new.demand_request_id;
  select title into v_title from public.properties where id=new.property_id;
  if v_user is not null then
    insert into public.notifications(user_id,type,title,message,demand_request_id,property_id)
      values(v_user,'opportunity_property_registered','Nueva propiedad para tu requerimiento',
        'Una propiedad fue registrada como compatible: '||v_title,new.demand_request_id,new.property_id);
  end if;
  return new;
end $$;
revoke all on function public.qrih_notify_registered_opportunity() from public;
create trigger qrih_notify_registered_opportunity after insert on public.opportunity_property_registrations
  for each row execute function public.qrih_notify_registered_opportunity();
revoke all on function public.notify_opportunity_property_registered(uuid,uuid,uuid) from public,anon,authenticated;

-- Contacto, autorización y notificación en UNA transacción, con identidad JWT.
create or replace function public.qrih_request_property_contact(
  p_property_id uuid, p_name text, p_phone text, p_email text,
  p_company text default null, p_message text default null
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid; v_title text; v_auto boolean; v_contact uuid := gen_random_uuid();
  v_authorization uuid := gen_random_uuid(); v_status text; v_existing record;
begin
  if auth.uid() is null or not public.qrih_actor_is_active() then
    raise exception 'Necesitas una cuenta activa.';
  end if;
  if p_property_id is null or p_name is null or length(trim(p_name)) not between 1 and 120
    or p_phone is null or p_phone !~ '^[0-9]{10}$'
    or p_email is null or length(p_email)>254 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
    or length(p_company)>160 or length(p_message)>3000 then
    raise exception 'Datos de contacto inválidos.';
  end if;
  select p.owner_id,p.title,pr.auto_approve_contact_requests
    into v_owner,v_title,v_auto from public.properties p join public.profiles pr on pr.id=p.owner_id
    where p.id=p_property_id and public.qrih_property_is_public(p.id);
  if v_owner is null or v_owner=auth.uid() then raise exception 'Propiedad no disponible para solicitar contacto.'; end if;
  -- Serializar también el límite por actor, no sólo los duplicados por propiedad.
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
  select id,status into v_existing from public.property_contact_authorizations
    where advisor_id=auth.uid() and property_id=p_property_id and status in ('pending','authorized')
    order by created_at desc limit 1;
  if found then return jsonb_build_object('authorization_id',v_existing.id,'authorization_status',v_existing.status); end if;
  if (select count(*) from public.property_contact_authorizations where advisor_id=auth.uid()
    and created_at>now()-interval '15 minutes') >= 10 then raise exception 'Demasiadas solicitudes. Intenta más tarde.'; end if;
  v_status := case when coalesce(v_auto,false) then 'authorized' else 'pending' end;
  insert into public.property_contacts(id,property_id,name,phone,email,company,message,source)
    values(v_contact,p_property_id,trim(p_name),p_phone,lower(trim(p_email)),nullif(trim(p_company),''),nullif(trim(p_message),''),'property');
  insert into public.property_contact_authorizations(id,property_id,contact_id,advisor_id,status,responded_at)
    values(v_authorization,p_property_id,v_contact,auth.uid(),v_status,case when v_auto then now() end);
  insert into public.notifications(user_id,type,title,message,property_id)
    values(v_owner,'property_contact_request','Nueva solicitud de contacto',trim(p_name)||' solicitó información sobre tu propiedad: '||v_title,p_property_id);
  return jsonb_build_object('authorization_id',v_authorization,'authorization_status',v_status);
end $$;
revoke all on function public.qrih_request_property_contact(uuid,text,text,text,text,text) from public;
grant execute on function public.qrih_request_property_contact(uuid,text,text,text,text,text) to authenticated;

-- RPC de notificación antiguas no pueden servir como oráculo/spam directo.
revoke all on function public.notify_property_contact_request(uuid,uuid) from public, anon, authenticated;

-- Catálogo de asesor nunca revela teléfono/WhatsApp antes de autorización.
-- Conserva el contrato y sólo suprime datos de contacto privados del JSON.
alter function public.get_advisor_catalog(bigint) rename to qrih_advisor_catalog_internal;
revoke all on function public.qrih_advisor_catalog_internal(bigint) from public,anon,authenticated;
create function public.get_advisor_catalog(advisor_public_id bigint)
returns jsonb language sql stable security definer set search_path = '' as $$
  select public.qrih_advisor_catalog_internal(advisor_public_id)-'phone'-'whatsapp';
$$;
revoke all on function public.get_advisor_catalog(bigint) from public;
grant execute on function public.get_advisor_catalog(bigint) to anon,authenticated;

alter function public.get_property_publisher_contact(uuid) rename to qrih_publisher_contact_internal;
revoke all on function public.qrih_publisher_contact_internal(uuid) from public,anon,authenticated;
create function public.get_property_publisher_contact(p_property_id uuid)
returns table(name text,phone text,company text,email text)
language sql stable security definer set search_path='' as $$
  select * from public.qrih_publisher_contact_internal(p_property_id)
    where public.qrih_actor_is_active();
$$;
revoke all on function public.get_property_publisher_contact(uuid) from public;
grant execute on function public.get_property_publisher_contact(uuid) to authenticated;

grant usage on sequence public.profiles_public_id_seq to authenticated;

commit;
