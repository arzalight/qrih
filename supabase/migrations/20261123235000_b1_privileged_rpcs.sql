-- B1 Etapa 3: Sustituye los accesos privilegiados de Postgres en Next.js mediante tres RPCs
-- SECURITY DEFINER con search_path fijo, permisos mínimos y límites internos:
--   1. public.qrih_admin_metrics_snapshot(boolean)
--   2. public.qrih_submit_demand_request(...)
--   3. public.qrih_record_public_property_view(uuid)
-- Conserva public.qrih_take_server_limit sin alteraciones y cerrada a anon/authenticated,
-- y mantiene intactas todas las políticas RLS RESTRICTIVE vigentes (046, 047, 049).

begin;

revoke all on function public.qrih_take_server_limit(text, text) from public, anon, authenticated;
grant execute on function public.qrih_take_server_limit(text, text) to service_role;

-- 1. Métricas administrativas agregadas (15 conteos sobre 4 tablas; sin PII ni demand_requests).
--    p_only_pending = true permite refrescar "pending" en vivo cada 30 s respetando
--    la caché privada de 5 minutos del resto de métricas en lib/admin-metrics.ts.
create or replace function public.qrih_admin_metrics_snapshot(
  p_only_pending boolean default false
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := pg_catalog.now();
  v_start timestamptz := v_now - interval '30 days';
  v_previous timestamptz := v_now - interval '60 days';
  v_soon timestamptz := v_now + interval '7 days';

  v_published bigint := 0;
  v_expired bigint := 0;
  v_pending bigint := 0;
  v_soon_count bigint := 0;
  v_draft bigint := 0;
  v_paused bigint := 0;
  v_rejected bigint := 0;
  v_updates bigint := 0;

  v_users bigint := 0;
  v_new_users bigint := 0;
  v_previous_users bigint := 0;

  v_links bigint := 0;
  v_previous_links bigint := 0;

  v_contacts bigint := 0;
  v_previous_contacts bigint := 0;
begin
  if auth.uid() is null
     or coalesce((auth.jwt()->>'is_anonymous')::boolean, false)
     or not public.current_user_is_admin() then
    raise exception 'Restricted statistics' using errcode = '42501';
  end if;

  if coalesce(p_only_pending, false) then
    select count(*)
      into v_pending
      from public.properties
     where status = 'pending'::public.property_status;

    return pg_catalog.jsonb_build_object(
      'as_of', v_now,
      'pending', v_pending
    );
  end if;

  select
    count(*) filter (where status = 'published'::public.property_status),
    count(*) filter (where status = 'expired'::public.property_status),
    count(*) filter (where status = 'pending'::public.property_status),
    count(*) filter (
      where status = 'published'::public.property_status
        and verification_due_at >= v_now
        and verification_due_at < v_soon
    ),
    count(*) filter (where status = 'draft'::public.property_status),
    count(*) filter (where status = 'paused'::public.property_status),
    count(*) filter (where status = 'rejected'::public.property_status),
    count(*) filter (where status = 'pending_update'::public.property_status)
    into
      v_published,
      v_expired,
      v_pending,
      v_soon_count,
      v_draft,
      v_paused,
      v_rejected,
      v_updates
    from public.properties;

  select
    count(*),
    count(*) filter (where created_at >= v_start and created_at < v_now),
    count(*) filter (where created_at >= v_previous and created_at < v_start)
    into v_users, v_new_users, v_previous_users
    from public.profiles;

  select
    count(*) filter (where created_at >= v_start and created_at < v_now),
    count(*) filter (where created_at >= v_previous and created_at < v_start)
    into v_links, v_previous_links
    from public.opportunity_property_registrations;

  select
    count(*) filter (where created_at >= v_start and created_at < v_now),
    count(*) filter (where created_at >= v_previous and created_at < v_start)
    into v_contacts, v_previous_contacts
    from public.property_contacts;

  return pg_catalog.jsonb_build_object(
    'as_of', v_now,
    'published', v_published,
    'expired', v_expired,
    'users', v_users,
    'pending', v_pending,
    'links', v_links,
    'previous_links', v_previous_links,
    'contacts', v_contacts,
    'previous_contacts', v_previous_contacts,
    'soon', v_soon_count,
    'draft', v_draft,
    'paused', v_paused,
    'rejected', v_rejected,
    'updates', v_updates,
    'new_users', v_new_users,
    'previous_users', v_previous_users
  );
end;
$$;

revoke all on function public.qrih_admin_metrics_snapshot(boolean) from public, anon, authenticated;
grant execute on function public.qrih_admin_metrics_snapshot(boolean) to authenticated;

-- 2. Alta transaccional e idempotente de requerimientos (identidad derivada exclusivamente de auth.uid()).
create or replace function public.qrih_submit_demand_request(
  p_request_id uuid,
  p_name text,
  p_email text,
  p_phone text,
  p_operation text,
  p_area_min numeric,
  p_area_max numeric,
  p_budget_min numeric,
  p_budget_max numeric,
  p_company text default null,
  p_giro text default null,
  p_zone_general text default null,
  p_zone text default null,
  p_notes text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_existing_owner uuid;
  v_name text;
  v_email text;
  v_phone text;
  v_company text;
  v_giro text;
  v_zone_general text;
  v_zone text;
  v_notes text;
begin
  if v_actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if not public.qrih_actor_is_active() then
    raise exception 'ACCOUNT_INACTIVE' using errcode = '42501';
  end if;

  v_name := pg_catalog.btrim(coalesce(p_name, ''));
  v_email := pg_catalog.btrim(coalesce(p_email, ''));
  v_phone := pg_catalog.btrim(coalesce(p_phone, ''));

  if p_request_id is null
     or pg_catalog.length(v_name) not between 1 and 120
     or pg_catalog.length(v_email) not between 3 and 254
     or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
     or v_phone !~ '^[0-9]{10}$'
     or p_operation is null
     or p_operation not in ('Renta', 'Venta')
     or p_area_min is null or p_area_max is null
     or p_budget_min is null or p_budget_max is null
     or p_area_min = 'NaN'::numeric or p_area_max = 'NaN'::numeric
     or p_budget_min = 'NaN'::numeric or p_budget_max = 'NaN'::numeric
     or p_area_min = 'Infinity'::numeric or p_area_min = '-Infinity'::numeric
     or p_area_max = 'Infinity'::numeric or p_area_max = '-Infinity'::numeric
     or p_budget_min = 'Infinity'::numeric or p_budget_min = '-Infinity'::numeric
     or p_budget_max = 'Infinity'::numeric or p_budget_max = '-Infinity'::numeric
     or p_area_min < 0 or p_area_min > 1e12
     or p_area_max < 0 or p_area_max > 1e12
     or p_budget_min < 0 or p_budget_min > 1e12
     or p_budget_max < 0 or p_budget_max > 1e12
     or p_area_min > p_area_max
     or p_budget_min > p_budget_max
     or pg_catalog.length(coalesce(p_company, '')) > 160
     or pg_catalog.length(coalesce(p_giro, '')) > 160
     or pg_catalog.length(coalesce(p_zone_general, '')) > 160
     or pg_catalog.length(coalesce(p_zone, '')) > 160
     or pg_catalog.length(coalesce(p_notes, '')) > 3000 then
    raise exception 'INVALID_DEMAND_INPUT' using errcode = '22023';
  end if;

  v_company := nullif(pg_catalog.btrim(coalesce(p_company, '')), '');
  v_giro := nullif(pg_catalog.btrim(coalesce(p_giro, '')), '');
  v_zone_general := nullif(pg_catalog.btrim(coalesce(p_zone_general, '')), '');
  v_zone := nullif(pg_catalog.btrim(coalesce(p_zone, '')), '');
  v_notes := nullif(pg_catalog.btrim(coalesce(p_notes, '')), '');

  -- Serializa reintentos concurrentes sobre el mismo request_id y protege la cuota por actor.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('qrih-demand:' || p_request_id::text, 0)
  );

  select d.user_id
    into v_existing_owner
    from public.demand_requests d
   where d.id = p_request_id;

  if found then
    if v_existing_owner = v_actor then
      return p_request_id;
    end if;
    raise exception 'REQUEST_ID_CONFLICT' using errcode = '42501';
  end if;

  if not public.qrih_take_server_limit(v_actor::text, 'demand') then
    raise exception 'RATE_LIMIT_EXCEEDED' using errcode = 'P0001';
  end if;

  insert into public.demand_requests (
    id,
    name,
    email,
    phone,
    company,
    giro,
    operation,
    zone_general,
    zone,
    area_min,
    area_max,
    budget_min,
    budget_max,
    area_requirement,
    budget,
    notes,
    user_id,
    status
  ) values (
    p_request_id,
    v_name,
    v_email,
    v_phone,
    v_company,
    v_giro,
    p_operation,
    v_zone_general,
    v_zone,
    p_area_min,
    p_area_max,
    p_budget_min,
    p_budget_max,
    p_area_min::text || ' - ' || p_area_max::text || ' m²',
    '$' || p_budget_min::text || ' - $' || p_budget_max::text,
    v_notes,
    v_actor,
    'new'
  );

  return p_request_id;
end;
$$;

revoke all on function public.qrih_submit_demand_request(
  uuid, text, text, text, text, numeric, numeric, numeric, numeric, text, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.qrih_submit_demand_request(
  uuid, text, text, text, text, numeric, numeric, numeric, numeric, text, text, text, text, text
) to authenticated;

-- 3. Registro best-effort de vistas públicas con doble límite (propiedad primero, global después).
create or replace function public.qrih_record_public_property_view(
  p_property_id uuid
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_window timestamptz;
  v_global_hits int;
begin
  if p_property_id is null or not public.qrih_property_is_public(p_property_id) then
    return false;
  end if;

  -- Evaluar primero el límite por propiedad (60 / 15 min) para que abusar de una sola
  -- ficha nunca consuma más de 60 unidades del cupo global defensivo (600 / 15 min).
  -- qrih_take_server_limit ejecuta además la purga de ventanas expiradas (> 1 día).
  if not public.qrih_take_server_limit('public:' || p_property_id::text, 'view') then
    return false;
  end if;

  v_window := pg_catalog.to_timestamp(
    pg_catalog.floor(extract(epoch from pg_catalog.now()) / 900) * 900
  );

  insert into public.qrih_rate_windows(subject, action, window_start, hits)
  values ('global:views', 'view_global', v_window, 1)
  on conflict (subject, action, window_start)
  do update set hits = public.qrih_rate_windows.hits + 1
  returning hits into v_global_hits;

  if v_global_hits > 600 then
    return false;
  end if;

  insert into public.property_views (property_id)
  values (p_property_id);

  return true;
end;
$$;

revoke all on function public.qrih_record_public_property_view(uuid) from public, anon, authenticated;
grant execute on function public.qrih_record_public_property_view(uuid) to anon, authenticated;

notify pgrst, 'reload schema';

commit;
