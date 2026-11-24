import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

// Motor PostgreSQL temporal externo: no se añade a package.json productivo.
// QRIH_PGLITE_MODULE apunta al dist/index.js de @electric-sql/pglite.
// PGlite valida SQL, RLS, roles, grants y lógica transaccional localmente;
// NO sustituye validación final contra Postgres/PostgREST/Auth en Supabase STAGING.
const pglitePath = process.env.QRIH_PGLITE_MODULE
if (!pglitePath) {
  test('B1 RPCs (PGlite): omitida porque QRIH_PGLITE_MODULE no está definida', { skip: true }, () => {})
  process.exit(0)
}

const { PGlite } = await import(pathToFileURL(pglitePath).href)
const migration = (name) => readFileSync(new URL('../supabase/migrations/' + name, import.meta.url), 'utf8')

const USER_A = '11111111-1111-4111-8111-111111111111'
const USER_B = '22222222-2222-4222-8222-222222222222'
const EDITOR = '33333333-3333-4333-8333-333333333333'
const ADMIN = '44444444-4444-4444-8444-444444444444'
const SUSPENDED_ADMIN = '55555555-5555-4555-8555-555555555555'
const SUSPENDED_USER = '66666666-6666-4666-8666-666666666666'

async function setupDb() {
  const db = new PGlite()
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create schema storage;

    create table auth.users (id uuid primary key, email text);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('test.uid', true), '')::uuid
    $$;
    create function auth.jwt() returns jsonb language sql stable as $$
      select jsonb_build_object(
        'sub', current_setting('test.uid', true),
        'role', current_setting('test.role', true),
        'is_anonymous', coalesce(nullif(current_setting('test.is_anonymous', true), '')::boolean, false)
      )
    $$;

    create function storage.foldername(text) returns text[] language sql immutable as $$
      select string_to_array($1, '/')
    $$;
    create function storage.extension(text) returns text language sql immutable as $$
      select reverse(split_part(reverse($1), '.', 1))
    $$;
    create function storage.allow_any_operation(text[]) returns boolean language sql stable as $$
      select true
    $$;
    create table storage.buckets (id text primary key, name text, public boolean);
    create table storage.objects (
      id uuid default gen_random_uuid() primary key,
      bucket_id text, name text, owner_id text, unique(bucket_id, name)
    );
    alter table storage.objects enable row level security;
  `)

  await db.exec(migration('001_qrih_schema.sql'))
  await db.exec(`
    alter table public.profiles
      add account_status text default 'active',
      add publications_enabled boolean default true,
      add public_id bigint,
      add whatsapp text,
      add avatar_url text,
      add instagram_url text,
      add facebook_url text,
      add linkedin_url text,
      add is_verified boolean default false,
      add auto_approve_contact_requests boolean default false,
      add user_type text,
      add suspension_reason text,
      add suspended_at timestamptz,
      add suspended_by uuid,
      add identity_last_changed_at timestamptz,
      add identity_change_locked_until timestamptz;
    alter table public.properties
      add zone_general text,
      add previous_data jsonb,
      add price_value numeric,
      add price_unit text,
      add main_image_path text;
    alter table public.property_images add title text;
    alter table public.demand_requests
      add user_id uuid references public.profiles(id),
      add area_min numeric,
      add area_max numeric,
      add budget_min numeric,
      add budget_max numeric,
      add giro text,
      add zone_general text;
    create table public.notifications (
      id uuid default gen_random_uuid() primary key,
      user_id uuid references public.profiles(id),
      type text, title text, message text,
      demand_request_id uuid references public.demand_requests(id),
      property_id uuid references public.properties(id),
      read_at timestamptz,
      created_at timestamptz default now()
    );
    create table public.property_contact_authorizations (
      id uuid default gen_random_uuid() primary key,
      advisor_id uuid references public.profiles(id),
      property_id uuid references public.properties(id),
      contact_id uuid references public.property_contacts(id),
      status text default 'pending',
      responded_at timestamptz,
      created_at timestamptz default now()
    );
    create table public.opportunity_property_registrations (
      id uuid default gen_random_uuid() primary key,
      registered_by uuid references public.profiles(id),
      property_id uuid references public.properties(id),
      demand_request_id uuid references public.demand_requests(id),
      created_at timestamptz default now()
    );
    create table public.property_interest_requests (
      id uuid default gen_random_uuid() primary key,
      user_id uuid references public.profiles(id),
      property_id uuid references public.properties(id),
      demand_request_id uuid references public.demand_requests(id),
      status text default 'pending'
    );
    create table public.property_views (
      id uuid default gen_random_uuid() primary key,
      property_id uuid references public.properties(id),
      created_at timestamptz default now()
    );

    -- Helpers y políticas mínimas equivalentes a 045/046/047/049
    create or replace function public.qrih_property_is_public(p_property_id uuid)
    returns boolean language sql stable security definer set search_path = '' as $$
      select exists (
        select 1 from public.properties p
        join public.profiles pr on pr.id = p.owner_id
        where p.id = p_property_id
          and p.status = 'published'
          and pr.account_status = 'active'
          and pr.publications_enabled = true
      );
    $$;
    create or replace function public.current_user_is_admin()
    returns boolean language sql stable security definer set search_path = '' as $$
      select exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin' and account_status = 'active'
      );
    $$;
    create or replace function public.qrih_actor_is_active()
    returns boolean language sql stable security definer set search_path = '' as $$
      select exists (
        select 1 from public.profiles
        where id = auth.uid() and account_status = 'active'
      );
    $$;

    create table public.qrih_rate_windows (
      subject text not null,
      action text not null,
      window_start timestamptz not null,
      hits integer not null,
      primary key (subject, action, window_start)
    );
    alter table public.qrih_rate_windows enable row level security;
    revoke all on public.qrih_rate_windows from public, anon, authenticated;
    grant select, insert, update, delete on public.qrih_rate_windows to service_role;

    -- Función preexistente de migración 047 (conservada intacta por Etapa 3).
    create or replace function public.qrih_take_server_limit(p_subject text, p_action text)
    returns boolean language plpgsql security definer set search_path = '' as $$
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

    alter table public.opportunity_property_registrations enable row level security;
    alter table public.property_views enable row level security;
    create policy "qrih demands server insert only" on public.demand_requests
      as restrictive for insert to public with check (false);
    create policy "qrih views server insert only" on public.property_views
      as restrictive for insert to public with check (false);
    create policy "users read own demand" on public.demand_requests
      for select to authenticated using (user_id = auth.uid() or public.current_user_is_admin());

    grant usage on schema public, auth, storage to anon, authenticated, service_role;
    grant select, insert, update, delete on public.demand_requests, public.property_views,
      public.properties, public.profiles, public.property_contacts,
      public.opportunity_property_registrations to anon, authenticated;
    revoke all on function public.qrih_property_is_public(uuid) from public;
    grant execute on function public.qrih_property_is_public(uuid) to anon, authenticated;
    revoke all on function public.current_user_is_admin() from public;
    grant execute on function public.current_user_is_admin() to anon, authenticated;
    revoke all on function public.qrih_actor_is_active() from public;
    grant execute on function public.qrih_actor_is_active() to anon, authenticated;

    -- Simular DEFAULT PRIVILEGES permisivo de Supabase para verificar que la migración revoca correctamente.
    alter default privileges in schema public grant execute on functions to anon, authenticated;
  `)

  // Aplicar la migración real B1 Etapa 3 bajo prueba.
  await db.exec(migration('20261123235000_b1_privileged_rpcs.sql'))

  // Sembrar usuarios sintéticos de todos los roles/estados.
  await db.exec(`
    insert into auth.users(id, email) values
      ('${USER_A}', 'a@example.invalid'),
      ('${USER_B}', 'b@example.invalid'),
      ('${EDITOR}', 'editor@example.invalid'),
      ('${ADMIN}', 'admin@example.invalid'),
      ('${SUSPENDED_ADMIN}', 'sadmin@example.invalid'),
      ('${SUSPENDED_USER}', 'suser@example.invalid');
    insert into public.profiles(id, full_name, role, account_status, publications_enabled, created_at) values
      ('${USER_A}', 'Advisor A', 'publisher', 'active', true, now() - interval '5 days'),
      ('${USER_B}', 'Advisor B', 'publisher', 'active', true, now() - interval '40 days'),
      ('${EDITOR}', 'Editor', 'editor', 'active', true, now() - interval '90 days'),
      ('${ADMIN}', 'Admin Active', 'admin', 'active', true, now() - interval '90 days'),
      ('${SUSPENDED_ADMIN}', 'Admin Suspended', 'admin', 'suspended', true, now() - interval '90 days'),
      ('${SUSPENDED_USER}', 'User Suspended', 'publisher', 'suspended', true, now() - interval '90 days');
  `)

  async function setActor(uid, { role = uid ? 'authenticated' : 'anon', anonymous = false } = {}) {
    await db.exec('reset role')
    await db.query("select set_config('test.uid', $1, false)", [uid || ''])
    await db.query("select set_config('test.role', $1, false)", [role])
    await db.query("select set_config('test.is_anonymous', $1, false)", [anonymous ? 'true' : 'false'])
    await db.exec('set role ' + role)
  }

  async function asRoot(sql, params = []) {
    await db.exec('reset role')
    return params.length ? db.query(sql, params) : db.query(sql)
  }

  async function asRootExec(sql) {
    await db.exec('reset role')
    return db.exec(sql)
  }

  return { db, setActor, asRoot, asRootExec }
}

test('B1 RPCs: matriz de privilegios EXECUTE, SECURITY DEFINER, search_path y RLS RESTRICTIVE intactos', async () => {
  const { db, setActor } = await setupDb()
  try {
    // Verificar propiedades de catálogo pg_proc para las 4 funciones
    const procs = (await db.query(`
      select p.proname, p.prosecdef, p.proconfig
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname in (
          'qrih_take_server_limit',
          'qrih_admin_metrics_snapshot',
          'qrih_submit_demand_request',
          'qrih_record_public_property_view'
        )
      order by p.proname
    `)).rows
    assert.equal(procs.length, 4)
    for (const proc of procs) {
      assert.equal(proc.prosecdef, true, `${proc.proname} debe ser SECURITY DEFINER`)
      assert.ok(
        proc.proconfig?.some((cfg) => cfg === 'search_path=""' || cfg === 'search_path='),
        `${proc.proname} debe fijar search_path=''`,
      )
    }

    // anon: solo qrih_record_public_property_view permitida
    await setActor(null, { role: 'anon' })
    const anonChecks = [
      ['public.qrih_take_server_limit(text,text)', false],
      ['public.qrih_admin_metrics_snapshot(boolean)', false],
      ['public.qrih_submit_demand_request(uuid,text,text,text,text,numeric,numeric,numeric,numeric,text,text,text,text,text)', false],
      ['public.qrih_record_public_property_view(uuid)', true],
    ]
    for (const [sig, expected] of anonChecks) {
      const actual = (await db.query("select has_function_privilege(current_user, $1, 'EXECUTE') as ok", [sig])).rows[0].ok
      assert.equal(actual, expected, `anon EXECUTE en ${sig}`)
    }

    // authenticated: qrih_take_server_limit DENEGADA; las 3 RPCs B1 PERMITIDAS
    await setActor(USER_A)
    const authChecks = [
      ['public.qrih_take_server_limit(text,text)', false],
      ['public.qrih_admin_metrics_snapshot(boolean)', true],
      ['public.qrih_submit_demand_request(uuid,text,text,text,text,numeric,numeric,numeric,numeric,text,text,text,text,text)', true],
      ['public.qrih_record_public_property_view(uuid)', true],
    ]
    for (const [sig, expected] of authChecks) {
      const actual = (await db.query("select has_function_privilege(current_user, $1, 'EXECUTE') as ok", [sig])).rows[0].ok
      assert.equal(actual, expected, `authenticated EXECUTE en ${sig}`)
    }

    // Inserciones directas siguen bloqueadas por RLS RESTRICTIVE
    await assert.rejects(
      db.exec("insert into public.demand_requests(name,phone,email) values('X','5555555555','x@example.invalid')"),
      /row-level security/,
    )
    await assert.rejects(
      db.exec("insert into public.property_views(property_id) values('11111111-1111-4111-8111-111111111111')"),
      /row-level security/,
    )
  } finally {
    await db.close()
  }
})

test('B1 RPC 1 (qrih_admin_metrics_snapshot): autorización estricta, 15 conteos exactos, pending en vivo y cero PII', async () => {
  const { db, setActor, asRoot, asRootExec } = await setupDb()
  try {
    const pPubSoon = 'aaaaaaaa-0001-4aaa-8aaa-aaaaaaaaaaaa'
    const pPubLater = 'aaaaaaaa-0002-4aaa-8aaa-aaaaaaaaaaaa'
    const pPending1 = 'aaaaaaaa-0003-4aaa-8aaa-aaaaaaaaaaaa'
    const pDraft = 'aaaaaaaa-0004-4aaa-8aaa-aaaaaaaaaaaa'
    const pExpired = 'aaaaaaaa-0005-4aaa-8aaa-aaaaaaaaaaaa'
    const pPaused = 'aaaaaaaa-0006-4aaa-8aaa-aaaaaaaaaaaa'
    const pRejected = 'aaaaaaaa-0007-4aaa-8aaa-aaaaaaaaaaaa'
    const pUpdate = 'aaaaaaaa-0008-4aaa-8aaa-aaaaaaaaaaaa'
    const d1 = 'dddddddd-0001-4ddd-8ddd-dddddddddddd'

    await asRootExec(`
      insert into public.properties(id, owner_id, slug, title, operation, status, zone, price_display, verification_due_at) values
        ('${pPubSoon}', '${USER_A}', 'pub-soon', 'Pub Soon', 'Renta', 'published', 'Z', '100', now() + interval '3 days'),
        ('${pPubLater}', '${USER_A}', 'pub-later', 'Pub Later', 'Renta', 'published', 'Z', '100', now() + interval '20 days'),
        ('${pPending1}', '${USER_A}', 'pending-1', 'Pending 1', 'Renta', 'pending', 'Z', '100', null),
        ('${pDraft}', '${USER_A}', 'draft-1', 'Draft 1', 'Renta', 'draft', 'Z', '100', null),
        ('${pExpired}', '${USER_A}', 'exp-1', 'Expired 1', 'Renta', 'expired', 'Z', '100', null),
        ('${pPaused}', '${USER_A}', 'paused-1', 'Paused 1', 'Renta', 'paused', 'Z', '100', null),
        ('${pRejected}', '${USER_A}', 'rej-1', 'Rej 1', 'Renta', 'rejected', 'Z', '100', null),
        ('${pUpdate}', '${USER_A}', 'upd-1', 'Upd 1', 'Renta', 'pending_update', 'Z', '100', null);

      insert into public.demand_requests(id, user_id, name, phone, email) values
        ('${d1}', '${USER_B}', 'PII_SECRET_NAME', '5511223344', 'pii-secret@example.invalid');

      insert into public.opportunity_property_registrations(registered_by, property_id, demand_request_id, created_at) values
        ('${USER_A}', '${pPubSoon}', '${d1}', now() - interval '10 days'),
        ('${USER_A}', '${pPubLater}', '${d1}', now() - interval '45 days'),
        ('${USER_A}', '${pPubLater}', '${d1}', now() - interval '75 days');

      insert into public.property_contacts(property_id, name, phone, email, created_at) values
        ('${pPubSoon}', 'PII_CONTACT', '5599887766', 'contact-pii@example.invalid', now() - interval '2 days'),
        ('${pPubSoon}', 'PII_CONTACT2', '5599887766', 'contact-pii2@example.invalid', now() - interval '5 days'),
        ('${pPubSoon}', 'PII_CONTACT3', '5599887766', 'contact-pii3@example.invalid', now() - interval '40 days');
    `)

    // Rechazos: anon, publisher, editor, admin suspendido, JWT anónimo
    await setActor(null, { role: 'anon' })
    await assert.rejects(db.query('select public.qrih_admin_metrics_snapshot(false)'), /permission denied/)

    for (const [uid, opts] of [
      [USER_A, {}],
      [EDITOR, {}],
      [SUSPENDED_ADMIN, {}],
      [ADMIN, { anonymous: true }],
    ]) {
      await setActor(uid, opts)
      await assert.rejects(db.query('select public.qrih_admin_metrics_snapshot(false)'), /Restricted statistics/)
    }

    // Admin activo: 15 conteos exactos + as_of, cero PII, tablas sensibles siguen cerradas a SELECT
    await setActor(ADMIN)
    assert.equal((await db.query('select * from public.property_contacts')).rows.length, 0)
    assert.equal((await db.query('select * from public.opportunity_property_registrations')).rows.length, 0)

    const snap = (await db.query('select public.qrih_admin_metrics_snapshot(false) as data')).rows[0].data
    const serialized = JSON.stringify(snap)
    assert.doesNotMatch(serialized, /PII_|example\.invalid|5511223344|5599887766|demand/)
    assert.equal(snap.published, 2)
    assert.equal(snap.expired, 1)
    assert.equal(snap.users, 6)
    assert.equal(snap.pending, 1)
    assert.equal(snap.links, 1)
    assert.equal(snap.previous_links, 1)
    assert.equal(snap.contacts, 2)
    assert.equal(snap.previous_contacts, 1)
    assert.equal(snap.soon, 1)
    assert.equal(snap.draft, 1)
    assert.equal(snap.paused, 1)
    assert.equal(snap.rejected, 1)
    assert.equal(snap.updates, 1)
    assert.equal(snap.new_users, 1)
    assert.equal(snap.previous_users, 1)
    assert.equal(Object.keys(snap).length, 16) // 15 conteos + as_of

    // pending en vivo (p_only_pending = true) refleja mutación inmediata
    await asRoot(`update public.properties set status = 'pending' where id = '${pDraft}'`)
    await setActor(ADMIN)
    const live = (await db.query('select public.qrih_admin_metrics_snapshot(true) as data')).rows[0].data
    assert.deepEqual(Object.keys(live).sort(), ['as_of', 'pending'])
    assert.equal(live.pending, 2)
  } finally {
    await db.close()
  }
})

test('B1 RPC 2 (qrih_submit_demand_request): validación, identidad real, idempotencia, anti-suplantación y cuota 5/15m', async () => {
  const { db, setActor, asRoot } = await setupDb()
  const callSql = `select public.qrih_submit_demand_request(
    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14
  ) as id`
  const makeArgs = (reqId, overrides = {}) => [
    reqId,
    overrides.name ?? 'Cliente Industrial',
    overrides.email ?? 'cliente@example.invalid',
    overrides.phone ?? '4421234567',
    overrides.operation ?? 'Renta',
    overrides.areaMin ?? 500,
    overrides.areaMax ?? 1500,
    overrides.budgetMin ?? 50000,
    overrides.budgetMax ?? 150000,
    overrides.company ?? 'Logística QRO',
    overrides.giro ?? 'Almacenaje',
    overrides.zoneGeneral ?? 'El Marqués',
    overrides.zone ?? 'Parque Industrial',
    overrides.notes ?? 'Requerimiento sintético',
  ]

  try {
    const req1 = 'bbbbbbbb-0001-4bbb-8bbb-bbbbbbbbbbbb'

    // Rechazos de actor: anon, is_anonymous, suspendido
    await setActor(null, { role: 'anon' })
    await assert.rejects(db.query(callSql, makeArgs(req1)), /permission denied/)

    await setActor(USER_A, { anonymous: true })
    await assert.rejects(db.query(callSql, makeArgs(req1)), /AUTH_REQUIRED/)

    await setActor(SUSPENDED_USER)
    await assert.rejects(db.query(callSql, makeArgs(req1)), /ACCOUNT_INACTIVE/)

    // Validaciones estrictas de entrada
    await setActor(USER_A)
    const invalidCases = [
      { name: '   ' },
      { email: 'not-an-email' },
      { phone: '442123456' }, // 9 dígitos
      { operation: 'Traspaso' },
      { areaMin: 2000, areaMax: 1000 },
      { budgetMin: 500, budgetMax: 100 },
      { areaMin: -1 },
      { areaMin: 'NaN' },
      { budgetMax: 'Infinity' },
      { notes: 'x'.repeat(3001) },
    ]
    for (const bad of invalidCases) {
      await assert.rejects(db.query(callSql, makeArgs(req1, bad)), /INVALID_DEMAND_INPUT/)
    }

    // Alta válida e identidad derivada de auth.uid()
    const created = (await db.query(callSql, makeArgs(req1))).rows[0].id
    assert.equal(created, req1)

    const row = (await asRoot('select user_id, status, area_requirement, budget from public.demand_requests where id = $1', [req1])).rows[0]
    assert.equal(row.user_id, USER_A)
    assert.equal(row.status, 'new')
    assert.equal(row.area_requirement, '500 - 1500 m²')
    assert.equal(row.budget, '$50000 - $150000')

    // Idempotencia: reintento mismo request_id no duplica ni consume cuota
    await setActor(USER_A)
    assert.equal((await db.query(callSql, makeArgs(req1))).rows[0].id, req1)

    // Anti-suplantación: USER_B no puede reclamar ni leer el request_id de USER_A
    await setActor(USER_B)
    await assert.rejects(db.query(callSql, makeArgs(req1)), /REQUEST_ID_CONFLICT/)

    // Cuota 5 / 15 min para USER_A (req1 ya consumió 1; 4 más deben pasar y la 6ª fallar)
    await setActor(USER_A)
    for (let i = 2; i <= 5; i++) {
      const id = `bbbbbbbb-000${i}-4bbb-8bbb-bbbbbbbbbbbb`
      assert.equal((await db.query(callSql, makeArgs(id))).rows[0].id, id)
    }
    await assert.rejects(
      db.query(callSql, makeArgs('bbbbbbbb-0006-4bbb-8bbb-bbbbbbbbbbbb')),
      /RATE_LIMIT_EXCEEDED/,
    )
    // Incluso con cuota agotada, un reintento idempotente de req1 sigue devolviendo req1
    assert.equal((await db.query(callSql, makeArgs(req1))).rows[0].id, req1)
  } finally {
    await db.close()
  }
})

test('B1 RPC 3 (qrih_record_public_property_view): sólo publicadas, límite 60/propiedad primero y 600/global después', async () => {
  const { db, setActor, asRoot, asRootExec } = await setupDb()
  try {
    // Crear 11 propiedades publicadas + 1 borrador + 1 de usuario suspendido
    const pubIds = []
    for (let i = 1; i <= 11; i++) {
      const id = `cccccccc-00${String(i).padStart(2, '0')}-4ccc-8ccc-cccccccccccc`
      pubIds.push(id)
      await asRootExec(`
        insert into public.properties(id, owner_id, slug, title, operation, status, zone, price_display)
        values ('${id}', '${USER_A}', 'pub-view-${i}', 'Pub ${i}', 'Renta', 'published', 'Z', '100')
      `)
    }
    const draftId = 'cccccccc-0098-4ccc-8ccc-cccccccccccc'
    const suspPropId = 'cccccccc-0099-4ccc-8ccc-cccccccccccc'
    await asRootExec(`
      insert into public.properties(id, owner_id, slug, title, operation, status, zone, price_display) values
        ('${draftId}', '${USER_A}', 'draft-view', 'Draft', 'Renta', 'draft', 'Z', '100'),
        ('${suspPropId}', '${SUSPENDED_USER}', 'susp-view', 'Susp', 'Renta', 'published', 'Z', '100')
    `)

    // Propiedades no públicas / inexistentes / null devuelven false sin consumir cuota
    await setActor(null, { role: 'anon' })
    for (const invalidId of [null, draftId, suspPropId, '99999999-9999-4999-8999-999999999999']) {
      const ok = (await db.query('select public.qrih_record_public_property_view($1) as ok', [invalidId])).rows[0].ok
      assert.equal(ok, false)
    }
    assert.equal((await asRoot('select count(*)::int as c from public.property_views')).rows[0].c, 0)
    assert.equal((await asRoot('select count(*)::int as c from public.qrih_rate_windows')).rows[0].c, 0)

    // Límite por propiedad primero: 60 vistas en pubIds[0] pasan; 61..80 fallan sin consumir cupo global
    await setActor(null, { role: 'anon' })
    let acceptedProp1 = 0
    for (let n = 0; n < 80; n++) {
      const ok = (await db.query('select public.qrih_record_public_property_view($1) as ok', [pubIds[0]])).rows[0].ok
      if (ok) acceptedProp1++
    }
    assert.equal(acceptedProp1, 60)
    const globalAfterProp1 = (await asRoot("select hits from public.qrih_rate_windows where subject='global:views' and action='view_global'")).rows[0].hits
    assert.equal(globalAfterProp1, 60, 'El exceso sobre una sola propiedad no debe consumir cupo global')

    // Límite global defensivo (600 / 15 min) entre múltiples propiedades:
    // pubIds[1..9] (9 propiedades × 60 = 540 vistas) llevan el global de 60 a 600.
    // pubIds[10] (propiedad 11, aún con 0 vistas propias) debe rechazarse al instante por tope global.
    await setActor(USER_B)
    let acceptedOthers = 0
    for (let idx = 1; idx <= 10; idx++) {
      for (let n = 0; n < 60; n++) {
        const ok = (await db.query('select public.qrih_record_public_property_view($1) as ok', [pubIds[idx]])).rows[0].ok
        if (ok) acceptedOthers++
      }
    }
    assert.equal(acceptedOthers, 540)
    const totalViews = (await asRoot('select count(*)::int as c from public.property_views')).rows[0].c
    assert.equal(totalViews, 600)
    const prop11Views = (await asRoot('select count(*)::int as c from public.property_views where property_id = $1', [pubIds[10]])).rows[0].c
    assert.equal(prop11Views, 0, 'La propiedad 11 debe quedar frenada por el límite global defensivo de 600/15m')
  } finally {
    await db.close()
  }
})
