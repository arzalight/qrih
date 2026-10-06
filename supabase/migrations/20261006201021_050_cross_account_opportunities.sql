-- AUD-032: comparación técnica y postulación entre cuentas, sin abrir filas privadas.
-- El esquema interno no se agrega a los schemas expuestos de PostgREST.
begin;
create schema if not exists qrih_private;
revoke all on schema qrih_private from public, anon, authenticated;
grant usage on schema qrih_private to authenticated;

create function qrih_private.opportunity_actor_active()
returns boolean language sql stable security invoker set search_path='' as $$
  select public.qrih_actor_is_active()
    and not coalesce((auth.jwt()->>'is_anonymous')::boolean,false);
$$;

-- Mismos pesos/rangos que lib/matching.ts; no introducir un umbral nuevo.
create function qrih_private.opportunity_range_score(v numeric, lo numeric, hi numeric)
returns numeric language sql immutable security invoker set search_path='' as $$
  select case when v is null then 0
    when lo is not null and v<lo then case when lo=0 then 0 else greatest(0,1-(lo-v)/lo) end
    when hi is not null and v>hi then case when hi=0 then 0 else greatest(0,1-(v-hi)/hi) end
    else 1 end;
$$;
create function qrih_private.opportunity_match_total(p public.properties,d public.demand_requests)
returns numeric language sql immutable security invoker set search_path='' as $$
  select
    case when nullif(lower(btrim(p.operation)),'')=lower(btrim(d.operation)) then 30 else 0 end
    + case when nullif(lower(btrim(p.zone_general)),'')=lower(btrim(d.zone_general)) then 20 else 0 end
    + case when nullif(lower(btrim(p.zone)),'')=lower(btrim(d.zone)) then 20 else 0 end
    + 15*qrih_private.opportunity_range_score(p.total_area,d.area_min,d.area_max)
    + 15*qrih_private.opportunity_range_score(
      case when lower(btrim(p.price_unit)) in ('m2','m²') then p.price_value*p.total_area else p.price_value end,
      d.budget_min,d.budget_max);
$$;

create function qrih_private.opportunity_feed()
returns jsonb language sql stable security definer set search_path='' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',d.id,'operation',d.operation,'zone_general',d.zone_general,'zone',d.zone,
    'area_min',d.area_min,'area_max',d.area_max,'budget_min',d.budget_min,
    'budget_max',d.budget_max,'status',d.status,'created_at',d.created_at)
    order by d.created_at desc),'[]'::jsonb)
  from public.demand_requests d
  where qrih_private.opportunity_actor_active()
    and d.status='new' and d.created_at>=now()-interval '45 days'
    -- Sin cuenta destinataria no se inventa un mecanismo de contacto/notificación.
    and exists(select 1 from public.profiles recipient where recipient.id=d.user_id and recipient.account_status='active')
    and exists(select 1 from public.properties p where p.owner_id=auth.uid()
      and public.qrih_property_is_public(p.id) and qrih_private.opportunity_match_total(p,d)>0);
$$;

create function qrih_private.register_opportunity(p_demand_request_id uuid,p_property_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid(); v_property public.properties;
  v_demand public.demand_requests; v_id uuid;
begin
  if not coalesce(qrih_private.opportunity_actor_active(),false) then
    raise exception 'Opportunity unavailable' using errcode='42501';
  end if;
  -- Locks preservan estado/disponibilidad hasta el commit y el trigger del aviso.
  select * into v_property from public.properties p
    where p.id=p_property_id and p.owner_id=v_actor for share;
  if not found or not public.qrih_property_is_public(p_property_id) then
    raise exception 'Opportunity unavailable' using errcode='42501';
  end if;
  select * into v_demand from public.demand_requests d
    where d.id=p_demand_request_id and d.status='new'
      and d.created_at>=now()-interval '45 days' for share;
  if not found then raise exception 'Opportunity unavailable' using errcode='42501'; end if;
  perform 1 from public.profiles recipient where recipient.id=v_demand.user_id
    and recipient.account_status='active' for share;
  if not found or qrih_private.opportunity_match_total(v_property,v_demand)<=0 then
    raise exception 'Opportunity unavailable' using errcode='42501';
  end if;
  -- Verificar también el perfil del actor bajo lock; no confiar en rol/metadata cliente.
  perform 1 from public.profiles actor where actor.id=v_actor
    and actor.account_status='active' and actor.publications_enabled for share;
  if not found then raise exception 'Opportunity unavailable' using errcode='42501'; end if;
  insert into public.opportunity_property_registrations(demand_request_id,property_id,registered_by)
    values(p_demand_request_id,p_property_id,v_actor) returning id into v_id;
  -- Índice único y trigger qrih_notify_registered_opportunity ya existentes.
  return v_id;
end;
$$;

create function qrih_private.opportunity_registrations()
returns jsonb language sql stable security definer set search_path='' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'demand_request_id',r.demand_request_id,'property_id',r.property_id,'status',r.status,
    'property',case when p.owner_id=auth.uid() or public.qrih_property_is_public(p.id)
      then jsonb_build_object('id',p.id,'slug',p.slug,'title',p.title,'operation',p.operation,
        'zone_general',p.zone_general,'zone',p.zone,'total_area',p.total_area,
        'price_value',p.price_value,'price_unit',p.price_unit,'price_display',p.price_display)
      else null end) order by r.created_at desc),'[]'::jsonb)
  from public.opportunity_property_registrations r
    join public.demand_requests d on d.id=r.demand_request_id
    join public.properties p on p.id=r.property_id
  where qrih_private.opportunity_actor_active()
    and (r.registered_by=auth.uid() or d.user_id=auth.uid());
$$;

-- Todos los grants son explícitos, incluidos defaults PUBLIC del proveedor.
revoke all on all functions in schema qrih_private from public,anon,authenticated;
grant execute on function qrih_private.opportunity_feed() to authenticated;
grant execute on function qrih_private.register_opportunity(uuid,uuid) to authenticated;
grant execute on function qrih_private.opportunity_registrations() to authenticated;

create function public.qrih_opportunity_feed()
returns jsonb language sql stable security invoker set search_path='' as $$
  select qrih_private.opportunity_feed();
$$;
create function public.qrih_register_opportunity(p_demand_request_id uuid,p_property_id uuid)
returns uuid language sql volatile security invoker set search_path='' as $$
  select qrih_private.register_opportunity(p_demand_request_id,p_property_id);
$$;
create function public.qrih_opportunity_registrations()
returns jsonb language sql stable security invoker set search_path='' as $$
  select qrih_private.opportunity_registrations();
$$;
revoke all on function public.qrih_opportunity_feed() from public,anon,authenticated;
revoke all on function public.qrih_register_opportunity(uuid,uuid) from public,anon,authenticated;
revoke all on function public.qrih_opportunity_registrations() from public,anon,authenticated;
grant execute on function public.qrih_opportunity_feed() to authenticated;
grant execute on function public.qrih_register_opportunity(uuid,uuid) to authenticated;
grant execute on function public.qrih_opportunity_registrations() to authenticated;

-- Incluso el flujo propio debe pasar por validación atómica, nunca INSERT de IDs.
create policy "qrih opportunity rpc insert only" on public.opportunity_property_registrations
  as restrictive for insert to public with check(false);
notify pgrst,'reload schema';
commit;
