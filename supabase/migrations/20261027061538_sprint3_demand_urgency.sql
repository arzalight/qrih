-- LOCAL/ISOLATED ONLY. One pointer per account, derived expiration; no cron/backfill.
begin;
create table public.demand_urgencies (
  user_id uuid primary key references public.profiles(id) on delete restrict,
  demand_request_id uuid not null unique references public.demand_requests(id) on delete cascade,
  activated_at timestamptz not null,
  expires_at timestamptz not null,
  constraint urgency_seven_days check(expires_at=activated_at+interval '168 hours')
);
alter table public.demand_urgencies enable row level security;
revoke all on public.demand_urgencies from public,anon,authenticated;
grant select on public.demand_urgencies to authenticated;
create policy urgency_own_admin_read on public.demand_urgencies for select to authenticated
  using ((user_id=(select auth.uid()) and public.qrih_actor_is_active()) or public.current_user_is_admin());

create function qrih_private.change_demand_urgency(p_id uuid,p_action text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v public.demand_urgencies;v_d public.demand_requests;v_now timestamptz;
begin
  if not coalesce(qrih_private.opportunity_actor_active(),false) then raise exception 'Account unavailable.' using errcode='42501';end if;
  if p_action is null or p_action not in ('activate','renew','remove') then raise exception 'Invalid action.';end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('qrih-urgency:'||auth.uid()::text,0));
  v_now:=clock_timestamp();
  select * into v_d from public.demand_requests where id=p_id and user_id=auth.uid() for share;
  if not found then raise exception 'Requirement unavailable.' using errcode='42501';end if;
  if p_action='remove' then
    delete from public.demand_urgencies where user_id=auth.uid() and demand_request_id=p_id;
    return jsonb_build_object('demand_request_id',p_id,'active',false);
  end if;
  if v_d.status<>'new' or v_d.created_at<v_now-interval '45 days' then
    raise exception 'Inactive requirement.' using errcode='42501';end if;
  select * into v from public.demand_urgencies where user_id=auth.uid() for update;
  if found and v.demand_request_id<>p_id and v.expires_at>v_now
    and exists(select 1 from public.demand_requests d where d.id=v.demand_request_id and d.status='new' and d.created_at>=v_now-interval '45 days') then
    raise exception 'Only one current urgency per account.' using errcode='23505';end if;
  -- Repeated activation is idempotent. Renewal is an explicit action, never queued.
  if p_action='activate' and v.demand_request_id=p_id and v.expires_at>v_now then
    return jsonb_build_object('demand_request_id',p_id,'activated_at',v.activated_at,'expires_at',v.expires_at,'active',true);
  end if;
  insert into public.demand_urgencies(user_id,demand_request_id,activated_at,expires_at)
    values(auth.uid(),p_id,v_now,v_now+interval '168 hours')
    on conflict(user_id) do update set demand_request_id=excluded.demand_request_id,activated_at=excluded.activated_at,expires_at=excluded.expires_at;
  return jsonb_build_object('demand_request_id',p_id,'activated_at',v_now,'expires_at',v_now+interval '168 hours','active',true);
end $$;
revoke all on function qrih_private.change_demand_urgency(uuid,text) from public,anon,authenticated;
grant execute on function qrih_private.change_demand_urgency(uuid,text) to authenticated;
create function public.qrih_change_demand_urgency(p_id uuid,p_action text)
returns jsonb language sql security invoker set search_path='' as $$
  select qrih_private.change_demand_urgency(p_id,p_action);
$$;
revoke all on function public.qrih_change_demand_urgency(uuid,text) from public,anon,authenticated;
grant execute on function public.qrih_change_demand_urgency(uuid,text) to authenticated;

-- Same feed eligibility/whitelist as050. Only timing flags added, no contact/user IDs.
create or replace function qrih_private.opportunity_feed()
returns jsonb language sql stable security definer set search_path='' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',d.id,'operation',d.operation,'zone_general',d.zone_general,'zone',d.zone,
    'area_min',d.area_min,'area_max',d.area_max,'budget_min',d.budget_min,'budget_max',d.budget_max,
    'status',d.status,'created_at',d.created_at,
    'urgency_expires_at',case when u.expires_at>now() then u.expires_at else null end)
    order by coalesce(u.expires_at>now(),false) desc,d.created_at desc),'[]'::jsonb)
  from public.demand_requests d left join public.demand_urgencies u on u.demand_request_id=d.id
  where qrih_private.opportunity_actor_active() and d.status='new' and d.created_at>=now()-interval '45 days'
    and exists(select 1 from public.profiles recipient where recipient.id=d.user_id and recipient.account_status='active')
    and exists(select 1 from public.properties p where p.owner_id=auth.uid()
      and public.qrih_property_is_public(p.id) and qrih_private.opportunity_match_total(p,d)>0);
$$;
commit;
