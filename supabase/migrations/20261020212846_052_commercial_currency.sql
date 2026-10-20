-- PROPOSED ONLY. Do not apply without explicit migration authorization.
-- 052: requires baseline + 044-051. User confirmed all historical prices MXN on 2026-10-20.
-- No amount conversion, no table/bucket/policy deletion, no new public access.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
do $$ begin
  if not exists(select 1 from information_schema.columns where table_schema='public'
    and table_name='properties' and column_name='price_value' and data_type='numeric') then
    raise exception 'Expected exact numeric price_value; inspect schema before migration.';
  end if;
end $$;
-- Constant default backfills existing rows without UPDATE, quantity/updated_at rewrites or float casts.
alter table public.properties add column price_currency text not null default 'MXN'
  constraint properties_price_currency_allowed check(price_currency in ('MXN','USD'));
-- Keep MXN default for the deployed pre-currency client during the additive rollout.
-- New forms/server writes require an explicit selector. Do not publish USD before the new RC.

create or replace function public.qrih_update_property_with_images(
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
      'title','operation','price_display','price_value','price_unit','price_currency','price_plus_vat','price_plus_maintenance','negotiable',
      'zone_general','zone','location_visibility','address','total_area','covered_area','exterior_area',
      'max_height','offices_area','parking','docks','description','share_commission','status')) then
    raise exception 'Campos de edición inválidos.';
  end if;
  v_new := jsonb_populate_record(v_old,p_changes);
  if v_new.status::text not in ('draft','pending') then raise exception 'Estado de edición inválido.'; end if;
  perform public.replace_property_images(p_property_id,p_images);
  update public.properties set title=v_new.title,operation=v_new.operation,price_display=v_new.price_display,
    price_value=v_new.price_value,price_unit=v_new.price_unit,price_currency=v_new.price_currency,
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

create or replace function public.qrih_duplicate_property(p_source_id uuid,p_request_id uuid,p_changes jsonb default null,p_images jsonb default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_source public.properties; v_new public.properties; v_id uuid; v_existing uuid; v_path text;
begin
  if auth.uid() is null or not public.qrih_actor_is_active() or p_request_id is null then raise exception 'Cuenta no autorizada.'; end if;
  select * into v_source from public.properties where id=p_source_id for share;
  if not found or v_source.owner_id<>auth.uid() then raise exception 'Propiedad no disponible.'; end if;
  -- Serialize only the same actor/attempt, never network calls inside transaction.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text||p_request_id::text,0));
  select l.entity_id into v_existing from public.audit_logs l join public.properties p on p.id=l.entity_id
    where l.actor_id=auth.uid() and l.action='property_duplicated'
      and l.metadata->>'request_id'=p_request_id::text and l.metadata->>'source_id'=p_source_id::text
      and p.owner_id=auth.uid();
  if found then return v_existing; end if;
  -- Preflight/idempotency lookup, no row or file is created.
  if p_changes is null and p_images is null then return null; end if;
  if p_changes is null or jsonb_typeof(p_changes)<>'object' or exists(
    select 1 from jsonb_object_keys(p_changes) k where k not in (
      'title','operation','price_display','price_value','price_unit','price_currency','price_plus_vat','price_plus_maintenance','negotiable',
      'zone_general','zone','location_visibility','address','total_area','covered_area','exterior_area',
      'max_height','offices_area','parking','docks','description','share_commission','status'))
    or p_changes->>'status' is distinct from 'draft' then raise exception 'Campos de creación inválidos.'; end if;
  if p_images is null or jsonb_typeof(p_images)<>'array' or jsonb_array_length(p_images) not between 0 and 7 then raise exception 'Galería inválida.'; end if;
  for v_path in select distinct i->>'storage_path' from jsonb_array_elements(p_images) i order by 1 loop
    if v_path is null then raise exception 'Ruta inválida.'; end if;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('qrih-copy:'||v_path,0));
  end loop;
  if exists(select 1 from jsonb_array_elements(p_images) i
    where public.qrih_valid_image_reference(auth.uid(),i->>'storage_path') is not true
      or exists(select 1 from public.property_images where storage_path=i->>'storage_path')
      or exists(select 1 from public.properties where main_image_path=i->>'storage_path')) then
    raise exception 'Las fotografías deben ser propias e independientes.';
  end if;
  v_new:=jsonb_populate_record(null::public.properties,p_changes);
  -- Old deployed duplicate clients omit the new key. Inherit the OWN source currency,
  -- never guess MXN for a USD source and never replace an explicit null/invalid value.
  if not (p_changes ? 'price_currency') then v_new.price_currency:=v_source.price_currency; end if;
  if v_new.price_value is null or v_new.price_value<=0 or v_new.price_value>1e12
    or (v_new.price_unit is not null and v_new.price_unit not in ('m2','total'))
    or v_new.price_currency not in ('MXN','USD') or v_new.price_currency is null then
    raise exception 'Precio inválido.';
  end if;
  v_id:=gen_random_uuid();
  -- Only commercial values. All internal fields use defaults/null, no source clone.
  insert into public.properties(id,owner_id,slug,title,operation,status,zone_general,zone,
    location_visibility,address,price_display,price_value,price_unit,price_currency,price_plus_vat,price_plus_maintenance,negotiable,
    total_area,covered_area,exterior_area,max_height,offices_area,parking,docks,description,share_commission)
    values(v_id,auth.uid(),'bodega-'||v_id::text,v_new.title,v_new.operation,'draft',v_new.zone_general,v_new.zone,
      v_new.location_visibility,v_new.address,v_new.price_display,v_new.price_value,v_new.price_unit,v_new.price_currency,v_new.price_plus_vat,v_new.price_plus_maintenance,v_new.negotiable,
      v_new.total_area,v_new.covered_area,v_new.exterior_area,v_new.max_height,v_new.offices_area,v_new.parking,v_new.docks,v_new.description,v_new.share_commission);
  if jsonb_array_length(p_images)>0 then
    perform public.replace_property_images(v_id,p_images);
    update public.properties set main_image_path=p_images->0->>'storage_path' where id=v_id;
  end if;
  insert into public.audit_logs(actor_id,entity_type,entity_id,action,metadata)
    values(auth.uid(),'property',v_id,'property_duplicated',jsonb_build_object('source_id',p_source_id,'request_id',p_request_id));
  return v_id;
end $$;
revoke all on function public.qrih_duplicate_property(uuid,uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.qrih_duplicate_property(uuid,uuid,jsonb,jsonb) to authenticated;

-- Append ONLY the new permitted column. Preserve existing view column order, location redaction,
-- publication/account filter, security barrier and ACL. Never expose a future column implicitly.
do $$
declare columns_sql text;
begin
  select string_agg(case when attname='address'
    then 'case when p.location_visibility=''address'' then p.address else null end as address'
    else format('p.%I',attname) end,',' order by attnum) into columns_sql
  from pg_attribute where attrelid='public.properties_public'::regclass and attnum>0 and not attisdropped;
  execute 'create or replace view public.properties_public with (security_barrier=true) as select '
    ||columns_sql||',p.price_currency from public.properties p where public.qrih_property_is_public(p.id)';
end $$;
revoke all on public.properties_public from public,anon,authenticated;
grant select on public.properties_public to anon,authenticated;

-- Enrich only already-public catalog items; contact data stays excluded.
create or replace function public.get_advisor_catalog(advisor_public_id bigint)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare catalog jsonb; items jsonb;
begin
  catalog:=public.qrih_advisor_catalog_internal(advisor_public_id)-'phone'-'whatsapp';
  if catalog is null then return null; end if;
  select coalesce(jsonb_agg(item.value||jsonb_build_object('price_currency',p.price_currency,
    'price_value',p.price_value,'price_value_text',p.price_value::text,'price_unit',p.price_unit) order by item.ordinality),'[]'::jsonb)
    into items from jsonb_array_elements(catalog->'properties') with ordinality item
    join public.properties_public p on p.id::text=item.value->>'id';
  return jsonb_set(catalog,'{properties}',items);
end $$;
revoke all on function public.get_advisor_catalog(bigint) from public,anon,authenticated;
grant execute on function public.get_advisor_catalog(bigint) to anon,authenticated;

-- Demand budgets have no currency today. No inferred MXN and no mixed comparison:
-- keep other score components, give the budget component zero until currency is explicit.
create or replace function qrih_private.opportunity_match_total(p public.properties,d public.demand_requests)
returns numeric language sql immutable security invoker set search_path='' as $$
  select
    case when nullif(lower(btrim(p.operation)),'')=lower(btrim(d.operation)) then 30 else 0 end
    + case when nullif(lower(btrim(p.zone_general)),'')=lower(btrim(d.zone_general)) then 20 else 0 end
    + case when nullif(lower(btrim(p.zone)),'')=lower(btrim(d.zone)) then 20 else 0 end
    + 15*qrih_private.opportunity_range_score(p.total_area,d.area_min,d.area_max)
    + case when p.price_currency=(to_jsonb(d)->>'budget_currency') then 15*qrih_private.opportunity_range_score(
      case when lower(btrim(p.price_unit)) in ('m2','m²') then p.price_value*p.total_area else p.price_value end,
      d.budget_min,d.budget_max) else 0 end;
$$;

create or replace function qrih_private.opportunity_registrations()
returns jsonb language sql stable security definer set search_path='' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'demand_request_id',r.demand_request_id,'property_id',r.property_id,'status',r.status,
    'property',case when p.owner_id=auth.uid() or public.qrih_property_is_public(p.id)
      then jsonb_build_object('id',p.id,'slug',p.slug,'title',p.title,'operation',p.operation,
        'zone_general',p.zone_general,'zone',p.zone,'total_area',p.total_area,
        'price_currency',p.price_currency,'price_value',p.price_value,'price_value_text',p.price_value::text,'price_unit',p.price_unit,'price_display',p.price_display)
      else null end) order by r.created_at desc),'[]'::jsonb)
  from public.opportunity_property_registrations r
    join public.demand_requests d on d.id=r.demand_request_id
    join public.properties p on p.id=r.property_id
  where qrih_private.opportunity_actor_active()
    and (r.registered_by=auth.uid() or d.user_id=auth.uid());
$$;

revoke all on function qrih_private.opportunity_match_total(public.properties,public.demand_requests) from public,anon,authenticated;
revoke all on function qrih_private.opportunity_registrations() from public,anon,authenticated;
grant execute on function qrih_private.opportunity_registrations() to authenticated;
notify pgrst,'reload schema';
commit;
