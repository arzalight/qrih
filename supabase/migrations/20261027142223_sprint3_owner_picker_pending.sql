-- PREPARED ONLY. Requires the three Sprint 3 migrations. Never run against hosted DB without a new preflight/authorization.
begin;

create function qrih_private.owner_name_key(p_value text) returns text
language sql immutable security invoker set search_path='' as $$
  select btrim(pg_catalog.regexp_replace(pg_catalog.regexp_replace(
    pg_catalog.normalize(lower(coalesce(p_value,'')),'NFD'),U&'[\0300-\036f]','','g'),'[[:space:]]+',' ','g'));
$$;
revoke all on function qrih_private.owner_name_key(text) from public,anon,authenticated;
grant execute on function qrih_private.owner_name_key(text) to authenticated;

create function qrih_private.valid_pending_owner(p_value jsonb) returns boolean
language plpgsql immutable security invoker set search_path='' as $$
declare k text;v text;maximum integer;
begin
  if p_value is null or p_value='null'::jsonb then return true;end if;
  if jsonb_typeof(p_value)<>'object' or exists(select 1 from jsonb_object_keys(p_value) key
    where key not in ('request_id','name','company','phone','email')) then return false;end if;
  if jsonb_typeof(p_value->'request_id') is distinct from 'string' or (p_value->>'request_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    or jsonb_typeof(p_value->'name') is distinct from 'string' or length(btrim(p_value->>'name')) not between 1 and 160 then return false;end if;
  foreach k in array array['name','company','phone','email'] loop
    if p_value?k and jsonb_typeof(p_value->k) not in ('string','null') then return false;end if;
    v:=p_value->>k;maximum:=case k when 'name' then 160 when 'company' then 200 when 'phone' then 40 else 254 end;
    if length(v)>maximum then return false;end if;
  end loop;
  return nullif(btrim(p_value->>'email'),'') is null or (p_value->>'email') ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$';
end $$;
revoke all on function qrih_private.valid_pending_owner(jsonb) from public,anon,authenticated;
grant execute on function qrih_private.valid_pending_owner(jsonb) to authenticated;

-- Reuses existing private row/RLS. No pending PII in properties, metadata, audit or browser storage.
alter table public.property_private_details add column pending_owner jsonb;
alter table public.property_private_details add constraint property_pending_owner_valid
  check(qrih_private.valid_pending_owner(pending_owner) and (pending_owner is null or owner_contact_id is null));
grant insert(pending_owner),update(pending_owner) on public.property_private_details to authenticated;
create index advisor_owners_name_lookup on public.advisor_owners(advisor_id,qrih_private.owner_name_key(name),id) where archived_at is null;

create function public.qrih_search_own_owners(p_query text)
returns table(id uuid,name text,company text) language sql stable security invoker set search_path='' as $$
  select c.id,c.name,c.company from public.advisor_owners c
  where auth.uid() is not null and public.qrih_actor_is_active() and c.advisor_id=(select auth.uid()) and c.archived_at is null
    and length(qrih_private.owner_name_key(p_query)) between 2 and 160
    and strpos(qrih_private.owner_name_key(c.name),qrih_private.owner_name_key(p_query))>0
  order by case when qrih_private.owner_name_key(c.name)=qrih_private.owner_name_key(p_query) then 0
    when strpos(qrih_private.owner_name_key(c.name),qrih_private.owner_name_key(p_query))=1 then 1 else 2 end,
    qrih_private.owner_name_key(c.name),c.id
  limit 3;
$$;
revoke all on function public.qrih_search_own_owners(text) from public,anon,authenticated;
grant execute on function public.qrih_search_own_owners(text) to authenticated;

create or replace function public.qrih_set_property_private_details(p_property_id uuid,p_details jsonb)
returns void language plpgsql security invoker set search_path='' as $$
declare v_previous public.property_private_details;v_name text;v_contact uuid;v_pending jsonb;
begin
  if auth.uid() is null or not public.qrih_actor_is_active() or p_details is null or jsonb_typeof(p_details)<>'object'
    or exists(select 1 from jsonb_object_keys(p_details) k where k not in ('internal_name','owner_contact_id','pending_owner')) then
    raise exception 'Invalid private fields.' using errcode='42501';end if;
  perform 1 from public.properties where id=p_property_id and owner_id=auth.uid() for update;
  if not found then raise exception 'Property unavailable.' using errcode='42501';end if;
  select * into v_previous from public.property_private_details where property_id=p_property_id for update;
  v_name:=case when p_details?'internal_name' then nullif(btrim(p_details->>'internal_name'),'') else v_previous.internal_name end;
  v_contact:=case when p_details?'owner_contact_id' then (p_details->>'owner_contact_id')::uuid else v_previous.owner_contact_id end;
  v_pending:=case when p_details?'pending_owner' then nullif(p_details->'pending_owner','null'::jsonb) else v_previous.pending_owner end;
  if p_details?'owner_contact_id' and not p_details?'pending_owner' then v_pending:=null;end if;
  if v_pending is not null and v_contact is not null then raise exception 'Choose one owner.';end if;
  if not qrih_private.valid_pending_owner(v_pending) then raise exception 'Invalid pending owner.';end if;
  insert into public.property_private_details(property_id,advisor_id,internal_name,owner_contact_id,pending_owner)
    values(p_property_id,auth.uid(),v_name,v_contact,v_pending)
    on conflict(property_id) do update set internal_name=excluded.internal_name,owner_contact_id=excluded.owner_contact_id,pending_owner=excluded.pending_owner;
end $$;

create function qrih_private.finalize_property_owner(p_property_id uuid)
returns void language plpgsql security invoker set search_path='' as $$
declare v_pending jsonb;v_id uuid;v_contact public.advisor_owners;
begin
  -- The wrapper already owns the property row lock from insertion/update. A new
  -- SELECT FOR UPDATE here would invoke draft-only UPDATE RLS after transition.
  perform 1 from public.properties where id=p_property_id and owner_id=auth.uid() and status='pending';
  if not found or not public.qrih_actor_is_active() then raise exception 'Property unavailable.' using errcode='42501';end if;
  select pending_owner into v_pending from public.property_private_details where property_id=p_property_id and advisor_id=auth.uid() for update;
  if v_pending is null then return;end if;
  -- Same advisor + equivalent normalized name/company serialize, without a global contact search.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('qrih-owner:'||auth.uid()::text||':'||
    qrih_private.owner_name_key(v_pending->>'name')||':'||qrih_private.owner_name_key(v_pending->>'company'),0));
  v_id:=(v_pending->>'request_id')::uuid;
  select * into v_contact from public.advisor_owners where id=v_id and advisor_id=auth.uid();
  if found then
    if v_contact.archived_at is not null or qrih_private.owner_name_key(v_contact.name)<>qrih_private.owner_name_key(v_pending->>'name')
      or qrih_private.owner_name_key(v_contact.company)<>qrih_private.owner_name_key(v_pending->>'company') then raise exception 'Pending owner identity changed.';end if;
  else
    if exists(select 1 from public.advisor_owners where advisor_id=auth.uid() and archived_at is null
      and qrih_private.owner_name_key(name)=qrih_private.owner_name_key(v_pending->>'name')
      and qrih_private.owner_name_key(company)=qrih_private.owner_name_key(v_pending->>'company')) then
      -- Do not guess which person to associate; roll back and ask for an explicit choice.
      raise exception 'OWNER_EQUIVALENT_EXISTS' using errcode='P0001';end if;
    insert into public.advisor_owners(id,advisor_id,name,company,phone,email)
      values(v_id,auth.uid(),v_pending->>'name',nullif(btrim(v_pending->>'company'),''),nullif(btrim(v_pending->>'phone'),''),nullif(btrim(v_pending->>'email'),''));
  end if;
  update public.property_private_details set owner_contact_id=v_id,pending_owner=null where property_id=p_property_id and advisor_id=auth.uid();
end $$;
revoke all on function qrih_private.finalize_property_owner(uuid) from public,anon,authenticated;
grant execute on function qrih_private.finalize_property_owner(uuid) to authenticated;

-- Versioned wrappers leave the original commercial/moderation RPCs in place.
create function public.qrih_create_property_with_owner(p_id uuid,p_changes jsonb,p_images jsonb,p_private jsonb,p_status text,p_consents boolean)
returns uuid language plpgsql security invoker set search_path='' as $$
declare v_id uuid;
begin
  if auth.uid() is null or not public.qrih_actor_is_active() or p_consents is distinct from true then raise exception 'Invalid actor.' using errcode='42501';end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('qrih-create:'||auth.uid()::text||p_id::text,0));
  -- Retry returns the committed result, never turns an earlier draft into a review request.
  select id into v_id from public.properties where id=p_id and owner_id=auth.uid();
  if found then return v_id;end if;
  v_id:=public.qrih_create_property_with_private(p_id,p_changes,p_images,p_private,p_status,p_consents);
  if p_status='pending' then perform qrih_private.finalize_property_owner(v_id);end if;
  return v_id;
end $$;
revoke all on function public.qrih_create_property_with_owner(uuid,jsonb,jsonb,jsonb,text,boolean) from public,anon,authenticated;
grant execute on function public.qrih_create_property_with_owner(uuid,jsonb,jsonb,jsonb,text,boolean) to authenticated;

create function public.qrih_save_property_with_owner(p_mode text,p_property_id uuid,p_request_id uuid,
  p_expected_updated_at timestamptz,p_changes jsonb,p_images jsonb,p_private jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare v_id uuid;
begin
  if p_mode='update' then
    -- Write private fields while the row is still draft/rejected. The commercial
    -- RPC checks actor, version, gallery and state and rolls everything back on failure.
    perform public.qrih_set_property_private_details(p_property_id,p_private);
    perform public.qrih_update_property_with_images(p_property_id,p_expected_updated_at,p_changes,p_images);
    v_id:=p_property_id;
    if p_changes->>'status'='pending' then perform qrih_private.finalize_property_owner(v_id);end if;
  else
    v_id:=public.qrih_save_property_with_private(p_mode,p_property_id,p_request_id,p_expected_updated_at,p_changes,p_images,p_private);
  end if;
  return v_id;
end $$;
revoke all on function public.qrih_save_property_with_owner(text,uuid,uuid,timestamptz,jsonb,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.qrih_save_property_with_owner(text,uuid,uuid,timestamptz,jsonb,jsonb,jsonb) to authenticated;

-- Legacy/direct transitions cannot leave a pending owner half-associated. Deferred checks see final transaction state.
create function qrih_private.ensure_review_owner_finalized() returns trigger
language plpgsql security invoker set search_path='' as $$
declare v_id uuid;
begin
  if tg_table_name='properties' then v_id:=new.id;else v_id:=new.property_id;end if;
  if exists(select 1 from public.properties p join public.property_private_details d on d.property_id=p.id
    where p.id=v_id and p.status='pending' and d.pending_owner is not null) then raise exception 'Pending owner must be finalized atomically.';end if;
  return null;
end $$;
revoke all on function qrih_private.ensure_review_owner_finalized() from public,anon,authenticated;
create constraint trigger qrih_review_owner_finalized after insert or update on public.properties
  deferrable initially deferred for each row execute function qrih_private.ensure_review_owner_finalized();
create constraint trigger qrih_review_details_finalized after insert or update on public.property_private_details
  deferrable initially deferred for each row execute function qrih_private.ensure_review_owner_finalized();

create function public.qrih_owner_picker_ready() returns boolean language sql stable security invoker set search_path='' as $$
  select auth.uid() is not null and public.qrih_actor_is_active();
$$;
revoke all on function public.qrih_owner_picker_ready() from public,anon,authenticated;
grant execute on function public.qrih_owner_picker_ready() to authenticated;
commit;
