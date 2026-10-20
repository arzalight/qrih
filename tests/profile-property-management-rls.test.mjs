// SQL integration, new PostgreSQL-in-WASM instance per run. Synthetic identities,
// storage METADATA only; no Supabase client, .env, network, Docker or real files.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { pathToFileURL } from 'node:url'

const { PGlite } = await import(pathToFileURL(process.env.QRIH_PGLITE_MODULE).href)
const source = file => readFileSync(new URL('../supabase/' + file, import.meta.url), 'utf8')
const migration = '20261019212016_051_profile_property_management.sql'
const A = '11111111-1111-4111-8111-111111111111', B = '22222222-2222-4222-8222-222222222222'
const ADMIN = '33333333-3333-4333-8333-333333333333', SUSPENDED = '44444444-4444-4444-8444-444444444444'
const P = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', PB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const REQUEST = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const DEMAND = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
const sourcePath = `${A}/original.webp`, copyPath = `${A}/copy.webp`, otherPath = `${B}/private.webp`
const changes = { title: 'Synthetic new property', operation: 'Renta', status: 'draft',
  zone: 'Jurica', zone_general: 'Querétaro Norte', location_visibility: 'zone',
  price_display: '$100/m²', price_value: 100, price_unit: 'm2', total_area: 500,
  price_plus_vat: false, price_plus_maintenance: false, negotiable: false, share_commission: false }

test('PROP-003/006/007: baseline + 044–051, PostgreSQL aislado sin datos reales', async t => {
  const db = new PGlite()
  const rows = async (query, params = []) => (await db.query(query, params)).rows
  async function actor(id, role = id ? 'authenticated' : 'postgres') {
    assert.ok(['postgres', 'anon', 'authenticated'].includes(role))
    await db.exec('reset role')
    await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
      [id || '', JSON.stringify({ sub: id, role: role === 'postgres' ? 'service_role' : role })])
    await db.exec('set local role ' + role)
  }
  async function denied(sql, params = []) {
    await db.exec('savepoint expected_denial')
    await assert.rejects(db.query(sql, params))
    await db.exec('rollback to savepoint expected_denial')
  }
  async function check(name, fn) {
    await t.test(name, async () => {
      await db.exec('begin')
      try { await fn() } finally { await db.exec('reset role; rollback') }
    })
  }
  const withdraw = () => rows('select public.qrih_withdraw_own_property($1) as id', [P])
  const duplicate = (payload = changes, gallery = [{ storage_path: copyPath, title: 'New cover' }], request = REQUEST, sourceId = P) =>
    rows('select public.qrih_duplicate_property($1,$2,$3::jsonb,$4::jsonb) as id',
      [sourceId, request, payload === null ? null : JSON.stringify(payload), gallery === null ? null : JSON.stringify(gallery)])
  const policyCatalog = () => rows(`select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
    from pg_policies where schemaname in ('public','storage') order by schemaname,tablename,policyname`)
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create schema storage; create schema extensions;
      grant usage on schema auth,storage,public to anon,authenticated,service_role;
      create table auth.users(id uuid primary key,email text);
      create function auth.uid() returns uuid language sql stable as
        $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      create function auth.jwt() returns jsonb language sql stable as
        $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
      create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;
      create function storage.extension(text) returns text language sql immutable as $$select reverse(split_part(reverse($1),'.',1))$$;
      create function storage.allow_any_operation(text[]) returns boolean language sql stable as
        $$select coalesce(current_setting('test.storage_operation',true),'object.get_authenticated')=any($1)$$;
      create table storage.objects(id uuid default gen_random_uuid() primary key,bucket_id text,name text,owner_id text,unique(bucket_id,name));
      create table storage.buckets(id text primary key,name text,public boolean,allowed_mime_types text[],file_size_limit bigint);
      alter table storage.objects enable row level security;
      grant select on storage.objects to anon,authenticated;
      alter default privileges in schema public grant all on tables to anon,authenticated;
      alter default privileges in schema public grant execute on functions to anon,authenticated;`)
    await db.exec(source('staging/baseline-2026-10-03.sql'))
    await db.exec("set app.qrih_storage_origin='https://synthetic.supabase.co'")
    for (const file of ['044_add_property_main_image_path.sql', '045_make_property_images_private.sql',
      '046_soft_launch_authorization_boundaries.sql', '047_verified_media_ingestion.sql', '048_atomic_property_writes.sql',
      '20261004052754_049_lockdown_function_privileges.sql', '20261006201021_050_cross_account_opportunities.sql']) {
      await db.exec(source('migrations/' + file))
    }
    const policiesBefore = await policyCatalog()
    const rlsBefore = await rows("select n.nspname,c.relname,c.relrowsecurity,c.relforcerowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','storage') and c.relkind='r' order by 1,2")
    await db.exec(source('migrations/' + migration))
    await t.test('051 se aplica y compila; catálogo de policies y flags RLS intactos', async () => {
      assert.deepEqual(await policyCatalog(), policiesBefore)
      assert.deepEqual(await rows("select n.nspname,c.relname,c.relrowsecurity,c.relforcerowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','storage') and c.relkind='r' order by 1,2"), rlsBefore)
    })
    await db.exec(`set request.jwt.claims='{"role":"service_role"}';
      insert into auth.users(id) values('${A}'),('${B}'),('${ADMIN}'),('${SUSPENDED}');
      insert into public.profiles(id,full_name,role,account_status) values
        ('${A}','Synthetic owner','publisher','active'),('${B}','Synthetic unrelated','publisher','active'),
        ('${ADMIN}','Synthetic admin','admin','active'),('${SUSPENDED}','Synthetic suspended','publisher','suspended');
      insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
        values('property-images','property-images',false,20971520,array['image/webp']);
      insert into storage.objects(bucket_id,name,owner_id) values
        ('property-images','${sourcePath}','${A}'),('property-images','${copyPath}',null),('property-images','${otherPath}','${B}');
      insert into public.qrih_verified_uploads(bucket_id,storage_path,owner_id,mime_type,byte_size,sha256)
        values('property-images','${copyPath}','${A}','image/webp',100,repeat('a',64));
      insert into public.properties(id,owner_id,slug,title,operation,status,zone,zone_general,
        price_display,price_value,price_unit,total_area,main_image_path,featured,publication_authorized_at,terms_accepted_at,last_verified_at,previous_data)
        values('${P}','${A}','synthetic-source','Synthetic source','Renta','published','Jurica','Querétaro Norte',
          '$100/m²',100,'m2',500,'${sourcePath}',true,now(),now(),now(),'{"synthetic_history":true}'),
        ('${PB}','${B}','synthetic-foreign','Synthetic foreign','Venta','draft','Other','Other',
          '$1000',1000,'total',100,'${otherPath}',false,null,null,null,null);
      insert into public.property_images(property_id,storage_path,position,title) values('${P}','${sourcePath}',0,'Original cover');
      insert into public.property_contacts(property_id,name,email) values('${P}','Synthetic contact','synthetic@example.invalid');
      insert into public.property_views(property_id) values('${P}');
      insert into public.home_pool(property_id) values('${P}');
      insert into public.property_contact_authorizations(property_id,advisor_id,contact_id,status)
        select '${P}','${B}',id,'authorized' from public.property_contacts where property_id='${P}';
      insert into public.notifications(user_id,type,title,message,property_id)
        values('${A}','property_published','Synthetic notice','Synthetic only','${P}');
      insert into public.demand_requests(id,user_id,name,email,phone,operation,zone,zone_general)
        values('${DEMAND}','${B}','Synthetic requester','synthetic@example.invalid','0000000000','Renta','Jurica','Querétaro Norte');
      insert into public.property_interest_requests(demand_request_id,property_id,user_id)
        values('${DEMAND}','${P}','${B}');
      insert into public.opportunity_property_registrations(demand_request_id,property_id,registered_by)
        values('${DEMAND}','${P}','${A}');`)

    await check('publisher propietario retira published→draft; conserva ID/datos/galería y audita una vez', async () => {
      const before = (await rows('select to_jsonb(p) as data from public.properties p where id=$1', [P]))[0].data
      await actor(A)
      assert.equal((await withdraw())[0].id, P)
      assert.equal((await withdraw())[0].id, P)
      await actor(null)
      const after = (await rows('select to_jsonb(p) as data from public.properties p where id=$1', [P]))[0].data
      assert.equal(after.status, 'draft')
      delete before.status; delete before.updated_at; delete after.status; delete after.updated_at
      assert.deepEqual(after, before)
      assert.equal((await rows("select count(*)::int as n from public.audit_logs where entity_id=$1 and action='property_withdrawn_for_edit'", [P]))[0].n, 1)
      assert.deepEqual(await rows('select storage_path from public.property_images where property_id=$1', [P]), [{ storage_path: sourcePath }])
    })
    await check('retirada revoca nuevas lecturas anónimas de tabla/vista/galería/autorización de rutas', async () => {
      await actor(null, 'anon')
      assert.equal((await rows('select count(*)::int as n from public.properties_public where id=$1', [P]))[0].n, 1)
      await actor(A); await withdraw()
      await actor(null, 'anon')
      for (const query of ['select id from public.properties where id=$1', 'select id from public.properties_public where id=$1',
        'select id from public.property_images where property_id=$1']) assert.deepEqual(await rows(query, [P]), [])
      assert.deepEqual((await rows('select public.qrih_authorized_image_paths($1::text[]) as paths', [[sourcePath]]))[0].paths, [])
      assert.deepEqual(await rows('select name from storage.objects where name=$1', [sourcePath]), [])
    })
    await check('propietario conserva lectura de portada privada en draft, ajeno no obtiene ruta', async () => {
      await actor(A); await withdraw()
      assert.deepEqual((await rows('select public.qrih_authorized_image_paths($1::text[]) as paths', [[sourcePath]]))[0].paths, [sourcePath])
      await actor(B)
      assert.deepEqual((await rows('select public.qrih_authorized_image_paths($1::text[]) as paths', [[sourcePath]]))[0].paths, [])
    })
    for (const status of ['pending', 'rejected', 'paused', 'expired', 'pending_update']) {
      await check(`retiro no permite cambiar ${status} mediante el RPC de publicada`, async () => {
        await rows('update public.properties set status=$1 where id=$2', [status, P])
        await actor(A); await denied('select public.qrih_withdraw_own_property($1)', [P])
      })
    }
    for (const who of [B, ADMIN, SUSPENDED, null]) {
      await check(`retiro rechaza actor ${who === B ? 'ajeno' : who === ADMIN ? 'admin-no-propietario' : who ? 'suspendido' : 'anónimo'}`, async () => {
        await actor(who, who ? 'authenticated' : 'anon')
        await denied('select public.qrih_withdraw_own_property($1)', [P])
      })
    }
    await check('propietario suspendido no retira ni duplica su propia propiedad', async () => {
      await rows("update public.profiles set account_status='suspended' where id=$1", [A])
      await actor(A)
      await denied('select public.qrih_withdraw_own_property($1)', [P])
      await denied('select public.qrih_duplicate_property($1,$2,null,null)', [P, REQUEST])
    })
    await check('sin nuevo UPDATE directo ni escape de moderación published/pending/featured', async () => {
      await actor(A)
      const result = await rows("update public.properties set status='draft' where id=$1 returning id", [P])
      assert.deepEqual(result, [])
      await withdraw()
      await denied("update public.properties set status='published' where id=$1", [P])
      await denied("update public.properties set featured=false where id=$1", [P])
      await rows("update public.properties set status='pending' where id=$1", [P])
      await denied('select public.qrih_withdraw_own_property($1)', [P])
    })
    await check('draft retirado mantiene edición048/reenvío y sólo admin vuelve a publicar', async () => {
      await actor(A); await withdraw()
      const old = (await rows('select updated_at from public.properties where id=$1', [P]))[0].updated_at
      await rows('select public.qrih_update_property_with_images($1,$2,$3::jsonb,$4::jsonb)',
        [P, old, JSON.stringify({ title: 'Synthetic edited', status: 'pending' }), JSON.stringify([{ storage_path: sourcePath, title: 'Kept' }])])
      await denied("select public.qrih_moderate_property($1,'publish',null)", [P])
      await actor(ADMIN)
      await rows("select public.qrih_moderate_property($1,'publish',null)", [P])
      await actor(null)
      assert.equal((await rows('select status from public.properties where id=$1', [P]))[0].status, 'published')
    })
    await check('preflight de duplicación no crea propiedad/galería/audit nuevos', async () => {
      const before = await rows('select (select count(*) from public.properties) as p,(select count(*) from public.audit_logs) as a,(select count(*) from public.property_images) as i')
      await actor(A)
      assert.equal((await duplicate(null, null))[0].id, null)
      await actor(null)
      assert.deepEqual(await rows('select (select count(*) from public.properties) as p,(select count(*) from public.audit_logs) as a,(select count(*) from public.property_images) as i'), before)
    })
    for (const status of ['draft', 'published', 'pending', 'rejected', 'paused', 'expired', 'pending_update']) {
      await check(`duplicar origen ${status}: ID nuevo, draft, portada/procedencia, fuente intacta`, async () => {
        await rows('update public.properties set status=$1 where id=$2', [status, P])
        const original = (await rows('select to_jsonb(p) as data from public.properties p where id=$1', [P]))[0].data
        await actor(A)
        const id = (await duplicate())[0].id
        assert.notEqual(id, P)
        await actor(null)
        const copy = (await rows('select * from public.properties where id=$1', [id]))[0]
        assert.equal(copy.owner_id, A); assert.equal(copy.status, 'draft'); assert.equal(copy.main_image_path, copyPath)
        assert.equal(copy.price_value, '100'); assert.equal(copy.price_unit, 'm2')
        for (const column of ['main_image', 'previous_data', 'publication_authorized_at', 'terms_accepted_at',
          'last_verified_at', 'verification_due_at', 'featured_priority', 'rejection_reason']) assert.equal(copy[column], null, column)
        assert.equal(copy.featured, false)
        assert.notEqual(copy.slug, original.slug)
        assert.deepEqual((await rows('select to_jsonb(p) as data from public.properties p where id=$1', [P]))[0].data, original)
        assert.deepEqual(await rows('select storage_path,position from public.property_images where property_id=$1', [id]), [{ storage_path: copyPath, position: 0 }])
        for (const table of ['property_contacts', 'property_contact_authorizations', 'property_views', 'notifications', 'home_pool',
          'property_interest_requests', 'opportunity_property_registrations']) {
          assert.deepEqual(await rows(`select property_id from public.${table} where property_id=$1`, [id]), [])
        }
        const events = await rows('select action from public.audit_logs where entity_id=$1 order by action', [id])
        assert.deepEqual(events, [{ action: 'property_created' }, { action: 'property_duplicated' }])
        await actor(null, 'anon')
        assert.deepEqual(await rows('select id from public.properties_public where id=$1', [id]), [])
        assert.deepEqual((await rows('select public.qrih_authorized_image_paths($1::text[]) as paths', [[copyPath]]))[0].paths, [])
      })
    }
    await check('idempotencia: dos guardados/preflight repiten ID sin fila ni eventos adicionales', async () => {
      await actor(A)
      const first = (await duplicate())[0].id
      assert.equal((await duplicate())[0].id, first)
      assert.equal((await duplicate(null, null))[0].id, first)
      await actor(null)
      assert.equal((await rows('select count(*)::int as n from public.properties'))[0].n, 3)
      assert.equal((await rows("select count(*)::int as n from public.audit_logs where action='property_duplicated'"))[0].n, 1)
    })
    await check('borrador duplicado sin fotos conserva portada NULL y galería vacía', async () => {
      await actor(A)
      const id = (await duplicate(changes, []))[0].id
      assert.equal((await rows('select main_image_path from public.properties where id=$1', [id]))[0].main_image_path, null)
      assert.deepEqual(await rows('select id from public.property_images where property_id=$1', [id]), [])
    })
    await check('siete fotografías nuevas: posiciones, títulos y portada conservan el orden solicitado', async () => {
      const paths = [copyPath]
      for (let i = 2; i <= 7; i++) {
        const path = `${A}/copy${i}.webp`
        paths.push(path)
        await rows("insert into storage.objects(bucket_id,name,owner_id) values('property-images',$1,$2)", [path, A])
      }
      const gallery = paths.reverse().map((storage_path, position) => ({ storage_path, title: `Synthetic ${position}` }))
      await actor(A)
      const id = (await duplicate(changes, gallery))[0].id
      assert.equal((await rows('select main_image_path from public.properties where id=$1', [id]))[0].main_image_path, paths[0])
      assert.deepEqual(await rows('select storage_path,title,position from public.property_images where property_id=$1 order by position', [id]),
        gallery.map((image, position) => ({ ...image, position })))
      await actor(null)
      assert.deepEqual(await rows('select storage_path,position from public.property_images where property_id=$1', [P]), [{ storage_path: sourcePath, position: 0 }])
    })
    await check('eliminar duplicado no elimina fuente/relaciones ni vuelve eliminable su fotografía', async () => {
      const related = ['property_contacts', 'property_contact_authorizations', 'property_views', 'notifications', 'home_pool',
        'property_interest_requests', 'opportunity_property_registrations']
      const before = new Map()
      for (const table of related) before.set(table, await rows(`select to_jsonb(t) as data from public.${table} t where property_id=$1 order by to_jsonb(t)::text`, [P]))
      await actor(A)
      const id = (await duplicate())[0].id
      const result = (await rows('select public.qrih_delete_own_property($1) as paths', [id]))[0].paths
      assert.deepEqual(result, [copyPath])
      assert.equal((await rows('select public.qrih_can_delete_unreferenced_image($1,$2) as allowed', [sourcePath, A]))[0].allowed, false)
      assert.equal((await rows('select public.qrih_can_delete_unreferenced_image($1,$2) as allowed', [copyPath, A]))[0].allowed, true)
      await actor(null)
      assert.equal((await rows('select count(*)::int as n from public.properties where id=$1', [P]))[0].n, 1)
      for (const table of related) assert.deepEqual(await rows(`select to_jsonb(t) as data from public.${table} t where property_id=$1 order by to_jsonb(t)::text`, [P]), before.get(table))
      assert.equal((await rows('select count(*)::int as n from storage.objects'))[0].n, 3, 'Metadata only; no Storage file deletion in this suite')
    })
    for (const [label, images] of [['ruta original compartida', [{ storage_path: sourcePath }]], ['ruta ajena', [{ storage_path: otherPath }]],
      ['objeto inexistente', [{ storage_path: `${A}/missing.webp` }]], ['URL firmada', [{ storage_path: 'https://synthetic.invalid/sign/file?token=synthetic' }]],
      ['ruta duplicada', [{ storage_path: copyPath }, { storage_path: copyPath }]], ['octava foto', Array.from({ length: 8 }, () => ({ storage_path: copyPath }))]]) {
      await check(`duplicación rechaza ${label}; cero filas nuevas tras error`, async () => {
        await actor(A); await denied('select public.qrih_duplicate_property($1,$2,$3::jsonb,$4::jsonb)', [P, REQUEST, JSON.stringify(changes), JSON.stringify(images)])
        await actor(null)
        assert.equal((await rows('select count(*)::int as n from public.properties'))[0].n, 2)
      })
    }
    for (const who of [B, ADMIN, SUSPENDED, null]) {
      await check(`duplicar deniega ${who === B ? 'ajeno' : who === ADMIN ? 'admin-no-propietario' : who ? 'suspendido' : 'anónimo'}`, async () => {
        await actor(who, who ? 'authenticated' : 'anon')
        await denied('select public.qrih_duplicate_property($1,$2,null,null)', [P, REQUEST])
      })
    }
    for (const extra of [{ owner_id: B }, { id: PB }, { status: 'published' }, { featured: true },
      { previous_data: {} }, { publication_authorized_at: '2026-01-01' }, { price_value: -1 }, { price_unit: 'total' }]) {
      await check(`whitelist/validación rechaza ${Object.keys(extra)[0]}`, async () => {
        await actor(A)
        await denied('select public.qrih_duplicate_property($1,$2,$3::jsonb,$4::jsonb)',
          [P, REQUEST, JSON.stringify({ ...changes, ...extra }), JSON.stringify([{ storage_path: copyPath }])])
      })
    }
    await check('fallo al final de duplicación revierte propiedad/galería/audit; objetos fuente siguen presentes', async () => {
      await db.exec(`create function public.synthetic_fail_audit() returns trigger language plpgsql as $$begin
        if new.action='property_duplicated' then raise exception 'Synthetic final failure'; end if; return new; end$$;
        create trigger zz_synthetic_fail_audit before insert on public.audit_logs for each row execute function public.synthetic_fail_audit();`)
      const before = await rows('select (select count(*) from public.audit_logs) as a,(select count(*) from public.property_images) as i')
      await actor(A)
      await denied('select public.qrih_duplicate_property($1,$2,$3::jsonb,$4::jsonb)',
        [P, REQUEST, JSON.stringify(changes), JSON.stringify([{ storage_path: copyPath }])])
      await actor(null)
      assert.equal((await rows('select count(*)::int as n from public.properties'))[0].n, 2)
      assert.deepEqual(await rows('select (select count(*) from public.audit_logs) as a,(select count(*) from public.property_images) as i'), before)
      assert.equal((await rows('select count(*)::int as n from storage.objects'))[0].n, 3)
    })
    await check('auditoría de retiro fallida impide despublicar parcialmente', async () => {
      await db.exec(`create function public.synthetic_fail_withdraw() returns trigger language plpgsql as $$begin
        if new.action='property_withdrawn_for_edit' then raise exception 'Synthetic final failure'; end if; return new; end$$;
        create trigger zz_synthetic_fail_withdraw before insert on public.audit_logs for each row execute function public.synthetic_fail_withdraw();`)
      await actor(A); await denied('select public.qrih_withdraw_own_property($1)', [P])
      await actor(null)
      assert.equal((await rows('select status from public.properties where id=$1', [P]))[0].status, 'published')
    })
    await check('ACL de nuevos RPC: authenticated sí, anon/PUBLIC no; definer con search_path vacío', async () => {
      for (const signature of ['public.qrih_withdraw_own_property(uuid)', 'public.qrih_duplicate_property(uuid,uuid,jsonb,jsonb)']) {
        const result = (await rows(`select has_function_privilege('anon',$1,'EXECUTE') as anon,
          has_function_privilege('authenticated',$1,'EXECUTE') as authenticated`, [signature]))[0]
        assert.deepEqual(result, { anon: false, authenticated: true })
        const proc = (await rows('select prosecdef,proconfig from pg_proc where oid=$1::regprocedure', [signature]))[0]
        assert.equal(proc.prosecdef, true)
        assert.ok(proc.proconfig.includes('search_path=""'))
      }
    })
    assert.equal((await rows('select count(*)::int as n from public.properties'))[0].n, 2, 'Every synthetic subcase rolled back')
  } finally { await db.close() }
})
