import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

// Motor PostgreSQL temporal externo: no se añade a las dependencias productivas.
// QRIH_PGLITE_MODULE apunta al dist/index.js del paquete @electric-sql/pglite.
// Sólo fixtures sintéticos en memoria; NO usa .env ni conecta Supabase.
const { PGlite } = await import(pathToFileURL(process.env.QRIH_PGLITE_MODULE).href)
const sql = (file) => readFileSync(new URL('../supabase/'+file, import.meta.url), 'utf8')
const migration = (name) => sql('migrations/'+name)
const A = '11111111-1111-4111-8111-111111111111'
const B = '22222222-2222-4222-8222-222222222222'
const ADMIN = '33333333-3333-4333-8333-333333333333'
const PA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const PB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const pathA = A+'/a.webp', pathB = B+'/b.webp'
const origin = 'https://fixtures.supabase.co'
const m44 = migration('044_add_property_main_image_path.sql')
const m45 = migration('045_make_property_images_private.sql')

test('AUD-002: migraciones, backfill y RLS en PostgreSQL aislado', async (t) => {
  const db = new PGlite()
  async function actor(uid, role = uid ? 'authenticated' : 'anon') {
    await db.exec('reset role')
    await db.query("select set_config('test.uid', $1, false)", [uid || ''])
    await db.query("select set_config('test.role', $1, false)", [role])
    await db.exec('set role '+role)
  }
  async function root(query) { await actor(null, 'postgres'); return db.exec(query) }
  const rows = async (query, params = []) => (await db.query(query, params)).rows
  const visible = async (path) => (await rows('select name from storage.objects where name=$1', [path])).length === 1
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    create table auth.users (id uuid primary key, email text);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as
      $$ select jsonb_build_object('sub',current_setting('test.uid',true),'role',current_setting('test.role',true)) $$;
    create function storage.foldername(text) returns text[] language sql immutable as
      $$ select string_to_array($1, '/') $$;
    create function storage.extension(text) returns text language sql immutable as
      $$ select reverse(split_part(reverse($1), '.', 1)) $$;
    create function storage.allow_any_operation(text[]) returns boolean language sql stable as
      $$ select coalesce(current_setting('test.operation',true),'object.get_authenticated') = any($1) $$;
    create table storage.buckets (id text primary key, name text, public boolean,
      allowed_mime_types text[], file_size_limit bigint);
    create table storage.objects (id uuid default gen_random_uuid() primary key,
      bucket_id text, name text, owner_id text, unique(bucket_id,name));
    alter table storage.objects enable row level security;
  `)
  await db.exec(migration('001_qrih_schema.sql'))
  await db.exec(`alter table public.profiles
    add account_status text default 'active', add publications_enabled boolean default true,
    add public_id bigint, add whatsapp text, add avatar_url text, add instagram_url text,
    add facebook_url text, add linkedin_url text, add is_verified boolean default false,
    add auto_approve_contact_requests boolean default false, add user_type text,
    add suspension_reason text, add suspended_at timestamptz, add suspended_by uuid,
    add identity_last_changed_at timestamptz, add identity_change_locked_until timestamptz;
    -- Campos presentes en el frontend alojado pero ausentes del bootstrap 001.
    alter table public.properties add zone_general text, add previous_data jsonb,
      add price_value numeric, add price_unit text;
    alter table public.property_images add title text;
    alter table public.demand_requests add user_id uuid references public.profiles(id),
      add area_min numeric, add area_max numeric, add budget_min numeric, add budget_max numeric,
      add giro text, add zone_general text;
    create table public.notifications(id uuid default gen_random_uuid() primary key,
      user_id uuid references public.profiles(id), type text, title text, message text,
      demand_request_id uuid references public.demand_requests(id), property_id uuid references public.properties(id),
      read_at timestamptz, created_at timestamptz default now());
    create table public.property_contact_authorizations(id uuid default gen_random_uuid() primary key,
      advisor_id uuid references public.profiles(id), property_id uuid references public.properties(id),
      contact_id uuid references public.property_contacts(id), status text default 'pending',
      responded_at timestamptz, created_at timestamptz default now());
    create table public.opportunity_property_registrations(id uuid default gen_random_uuid() primary key,
      registered_by uuid references public.profiles(id), property_id uuid references public.properties(id),
      demand_request_id uuid references public.demand_requests(id), created_at timestamptz default now());
    create table public.property_interest_requests(id uuid default gen_random_uuid() primary key,
      user_id uuid references public.profiles(id), property_id uuid references public.properties(id),
      demand_request_id uuid references public.demand_requests(id), status text default 'pending');
    create table public.property_views(id uuid default gen_random_uuid() primary key,
      property_id uuid references public.properties(id), created_at timestamptz default now());
  `)
  for (const name of ['002_admin_property_updates.sql','014_property_images_policies.sql',
    '023_fix_profiles_admin_read_rls.sql','029_public_property_visibility_by_account_status.sql',
    '030_public_property_images_visibility.sql']) {
    // El nombre real de 023 se busca en el inventario, no se simula su función.
    let source
    if (name.startsWith('023_')) {
      const { readdirSync } = await import('node:fs')
      source = migration(readdirSync(new URL('../supabase/migrations/', import.meta.url)).find((file) => file.startsWith('023_')))
    } else source = migration(name)
    await db.exec(source)
  }
  // Ejecutar secciones reales 1–4 de 032 (resto corresponde a contactos, fuera del fixture).
  await db.exec(migration('032_block_suspended_account_operations.sql').split('-- 5. CONTACT AUTHORIZATION RESPONSE')[0]+'\ncommit;')
  await db.exec(migration('033_allow_active_owner_property_cleanup.sql'))
  await db.exec(migration('039_audit_property_resubmission.sql'))
  await db.exec(migration('040_allow_owner_save_draft.sql'))
  await db.exec(migration('004_protect_profile_roles.sql'))
  await db.exec(migration('018_add_profile_public_id.sql'))
  await db.exec(migration('021_profile_identity_change_lock.sql'))
  await db.exec(migration('031_protect_publications_enabled.sql'))
  await db.exec(migration('012_version_active_notification_functions.sql'))
  await db.exec(migration('013_version_active_rls_policies.sql'))
  await db.exec(migration('032_block_suspended_account_operations.sql'))
  await db.exec(migration('035_allow_owner_create_draft_properties.sql'))
  await db.exec(migration('040_allow_owner_save_draft.sql'))
  await db.exec(`create policy "fixture admin read" on public.properties for select to authenticated
      using (public.current_user_is_admin());
    grant usage on schema public, auth, storage to anon, authenticated;
    grant select, insert, update, delete on all tables in schema public, storage to anon, authenticated;
    insert into auth.users(id,email) values ('${A}','a@fixtures.test'),('${B}','b@fixtures.test'),('${ADMIN}','admin@fixtures.test');
    insert into public.profiles(id,full_name,role,public_id) values
      ('${A}','Owner A','publisher',1),('${B}','Owner B','publisher',2),('${ADMIN}','Admin','admin',3);
    insert into storage.objects(bucket_id,name,owner_id) values
      ('property-images','${pathA}','${A}'),('property-images','${pathB}','${B}');
    insert into public.properties(id,owner_id,slug,title,operation,status,zone,price_display,main_image) values
      ('${PA}','${A}','a','A','Renta','draft','zone','100','${origin}/storage/v1/object/public/property-images/${pathA}'),
      ('${PB}','${B}','b','B','Renta','draft','zone','100',null);
    insert into public.property_images(property_id,storage_path) values ('${PA}','${pathA}'),('${PB}','${pathB}');
    set app.qrih_storage_origin = '${origin}';
  `)
  await t.test('preflight distingue convertible/NULL sin modificar datos', async () => {
    const reports = await db.exec(sql('checks/aud002_preflight.sql'))
    const counts = reports.find((report) => report.rows[0]?.convertible !== undefined).rows[0]
    assert.equal(counts.convertible, 1); assert.equal(counts.null_values, 1)
  })
  await t.test('URL ambigua aborta 044 y conserva columna/valor legado', async () => {
    await db.exec(`update public.properties set main_image='https://untrusted.test/${pathA}' where id='${PA}'`)
    await assert.rejects(db.exec(m44), /excepciones/); await db.exec('rollback')
    assert.equal((await rows("select column_name from information_schema.columns where table_name='properties' and column_name='main_image_path'")).length, 0)
    assert.equal((await rows(`select main_image from public.properties where id='${PA}'`))[0].main_image, 'https://untrusted.test/'+pathA)
    await db.exec(`update public.properties set main_image='${origin}/storage/v1/object/public/property-images/${pathA}' where id='${PA}'`)
  })
  await db.exec(m44); await db.exec(m45)
  await t.test('backfill ruta persistente preserva URL antigua y NULL', async () => {
    const data = await rows(`select main_image, main_image_path from public.properties where id='${PA}'`)
    assert.equal(data[0].main_image_path, pathA)
    assert.equal(data[0].main_image, origin+'/storage/v1/object/public/property-images/'+pathA)
    assert.equal((await rows(`select main_image_path from public.properties where id='${PB}'`))[0].main_image_path, null)
  })
  await t.test('público: sólo published; perfiles permanecen privados', async () => {
    for (const status of ['draft','pending','published','paused','rejected','expired','pending_update']) {
      await root(`update public.properties set status='${status}' where id='${PA}'`)
      await actor(null)
      assert.equal(await visible(pathA), status === 'published', status)
      assert.equal((await rows('select id from public.properties')).length, status === 'published' ? 1 : 0)
      assert.equal((await rows('select id from public.profiles')).length, 0)
    }
  })
  await t.test('suspensión/publications_enabled bloquea público y conserva historial propio', async () => {
    await root(`update public.properties set status='published' where id='${PA}';
      update public.profiles set account_status='suspended' where id='${A}'`)
    await actor(null); assert.equal(await visible(pathA), false)
    await actor(A); assert.equal(await visible(pathA), true)
    await assert.rejects(db.exec(`insert into storage.objects(bucket_id,name,owner_id) values('property-images','${A}/new.webp','${A}')`), /row-level security/)
    assert.equal((await rows(`delete from storage.objects where name='${pathA}' returning name`)).length, 0)
    await root(`update public.profiles set account_status='active', publications_enabled=false where id='${A}'`)
    await actor(null); assert.equal(await visible(pathA), false)
    await root(`update public.profiles set publications_enabled=true where id='${A}'`)
  })
  await t.test('dueño/admin vs asesor ajeno: imágenes privadas no se comparten por contactos', async () => {
    await root(`update public.properties set status='draft'`)
    await actor(A); assert.equal(await visible(pathA), true); assert.equal(await visible(pathB), false)
    await actor(B); assert.equal(await visible(pathA), false); assert.equal(await visible(pathB), true)
    await actor(ADMIN); assert.equal(await visible(pathA), true); assert.equal(await visible(pathB), true)
  })
  await t.test('firma nativa individual/lote y listado bloqueados para todos los clientes', async () => {
    for (const uid of [null,A,B,ADMIN]) {
      await actor(uid)
      for (const operation of ['object.sign','object.sign_many','object.list','unknown']) {
        await db.query("select set_config('test.operation',$1,false)", [operation])
        assert.equal(await visible(pathA), false, operation)
      }
    }
    await db.query("select set_config('test.operation','object.get_authenticated',false)")
    await actor(A)
    const allowed = (await rows('select public.qrih_authorized_image_paths($1) as paths', [[pathA,pathB]]))[0].paths
    assert.deepEqual(allowed,[pathA])
  })
  await t.test('ID/ruta ajena: INSERT/UPDATE directos, portada y RPC rechazados', async () => {
    await actor(A)
    await assert.rejects(db.exec(`insert into public.property_images(property_id,storage_path) values('${PA}','${pathB}')`), /no pertenece/)
    await assert.rejects(db.exec(`update public.property_images set storage_path='${pathB}' where property_id='${PA}'`), /no pertenece/)
    await assert.rejects(db.exec(`update public.properties set main_image_path='${pathB}' where id='${PA}'`), /no pertenece/)
    await assert.rejects(db.query('select public.replace_property_images($1,$2::jsonb)', [PB,JSON.stringify([{storage_path:pathA}])]), /permiso/)
    await assert.rejects(db.query('select public.replace_property_images($1,$2::jsonb)', [PA,JSON.stringify([{storage_path:pathB}])]), /ruta/)
    assert.equal(await visible(pathB), false)
  })
  await t.test('upload WebP activo/propio; falla ruta ajena/extensión/overwrite', async () => {
    await actor(A)
    await db.exec(`insert into storage.objects(bucket_id,name,owner_id) values('property-images','${A}/new.webp','${A}')`)
    await assert.rejects(db.exec(`insert into storage.objects(bucket_id,name,owner_id) values('property-images','${B}/evil.webp','${A}')`), /row-level security/)
    await assert.rejects(db.exec(`insert into storage.objects(bucket_id,name,owner_id) values('property-images','${A}/bad.jpg','${A}')`), /row-level security/)
    assert.equal((await rows(`update storage.objects set name='${A}/renamed.webp' where name='${pathA}' returning name`)).length, 0)
  })
  await t.test('7 permitido, 8/duplicados y referencias inexistentes rechazados', async () => {
    await root(Array.from({length:8}, (_,i) => `insert into storage.objects(bucket_id,name,owner_id) values('property-images','${A}/photo${i}.webp','${A}');`).join('\n'))
    await actor(A)
    const images = Array.from({length:7},(_,i)=>({storage_path:A+'/photo'+i+'.webp'}))
    await db.query('select public.replace_property_images($1,$2::jsonb)', [PA,JSON.stringify(images)])
    await assert.rejects(db.exec(`insert into public.property_images(property_id,storage_path) values('${PA}','${A}/photo7.webp')`), /Máximo 7/)
    await assert.rejects(db.query('select public.replace_property_images($1,$2::jsonb)', [PA,JSON.stringify([...images, {storage_path:A+'/photo7.webp'}])]), /entre 1 y 7/)
    await assert.rejects(db.exec(`insert into public.property_images(property_id,storage_path) values('${PA}','${A}/photo0.webp')`), /repetirse/)
    await assert.rejects(db.exec(`update public.property_images set storage_path='${A}/absent.webp' where storage_path='${A}/photo0.webp'`), /no pertenece/)
  })
  await t.test('edición/reordenamiento registra main_image_path en auditoría; catálogo sólo publicado', async () => {
    await actor(A)
    await db.exec(`update public.properties set main_image_path='${A}/photo1.webp', status='pending' where id='${PA}'`)
    await actor(null, 'postgres')
    const logs = await rows(`select metadata from public.audit_logs where entity_id='${PA}' order by id desc limit 1`)
    assert.ok(logs[0].metadata.changed_fields.includes('main_image_path'))
    await actor(null)
    const pending = await rows('select public.get_advisor_catalog(1) as catalog')
    assert.equal(pending[0].catalog.properties.length, 0)
    await root(`update public.properties set status='published' where id='${PA}'`)
    await actor(null)
    const published = (await rows('select public.get_advisor_catalog(1) as catalog'))[0].catalog
    assert.equal(published.properties.length, 1)
    assert.equal(published.properties[0].main_image_path, A+'/photo1.webp')
    assert.ok(!('main_image' in published.properties[0]))
  })
  await t.test('limpieza después de eliminar BD: dueño aún tiene SELECT/DELETE de huérfanos propios', async () => {
    await actor(A)
    await db.exec(`delete from public.properties where id='${PA}'`)
    assert.equal(await visible(A+'/photo1.webp'), true)
    assert.equal((await rows(`delete from storage.objects where name='${A}/photo1.webp' returning name`)).length, 1)
    await actor(null); assert.equal(await visible(A+'/photo0.webp'), false)
    await actor(B); assert.equal(await visible(A+'/photo0.webp'), false)
  })
  await actor(null, 'postgres')
  await db.exec(migration('036_platform_settings.sql'))
  await db.exec('grant select,insert,update,delete on public.platform_settings to authenticated')
  await db.exec(migration('020_add_profile_avatar.sql'))
  // Simular el grant automático del proveedor: la vista debe retirarlo.
  await db.exec('alter default privileges in schema public grant all on tables to anon,authenticated')
  await db.exec('alter default privileges in schema public grant execute on functions to anon,authenticated')
  await db.exec(migration('046_soft_launch_authorization_boundaries.sql'))
  await db.exec(migration('047_verified_media_ingestion.sql'))
  await db.exec(migration('041_property_moderation_notifications.sql'))
  await db.exec(migration('022_add_profile_verification.sql'))
  await db.exec(migration('043_restore_publications_on_profile_reactivation.sql'))
  await db.exec(migration('026_protect_admin_managed_profile_fields.sql'))
  await db.exec(migration('048_atomic_property_writes.sql'))
  await db.exec(migration('20261004052754_049_lockdown_function_privileges.sql'))
  await t.test('AUD-019: grants del proveedor no dejan RPC interno ni mutaciones disponibles a anon',async()=>{
    await actor(null)
    for (const signature of ['qrih_valid_image_reference(uuid,text)','qrih_moderate_property(uuid,text,text)',
      'qrih_update_property_with_images(uuid,timestamp with time zone,jsonb,jsonb)',
      'qrih_delete_own_property(uuid)','get_property_publisher_contact(uuid)',
      'qrih_advisor_catalog_internal(bigint)','notify_property_published(uuid)']) {
      assert.equal((await rows('select has_function_privilege(current_user,$1,\'EXECUTE\') as allowed',['public.'+signature]))[0].allowed,false,signature)
    }
    assert.equal((await rows("select has_function_privilege(current_user,'public.get_advisor_catalog(bigint)','EXECUTE') as allowed"))[0].allowed,true)
    await actor(A)
    await assert.rejects(db.query('select public.qrih_valid_image_reference($1,$2)',[B,pathB]),/permission denied/)
  })
  await root(`insert into public.properties(id,owner_id,slug,title,operation,status,zone,price_display,address) values
    ('${PA}','${A}','a2','A2','Renta','draft','zone','100','PRIVATE ADDRESS');
    update public.properties set status='published', address='PRIVATE B ADDRESS' where id='${PB}';
    update public.profiles set phone='1234567890' where id='${B}';
    insert into public.demand_requests(id,user_id,name,phone,email) values
      ('${PA}','${A}','Demand A','1234567890','a@fixtures.test'),
      ('${PB}','${B}','Demand B','1234567890','b@fixtures.test');`)
  await t.test('roles/plan/suspensión/identidad no se escalan por UPDATE directo', async () => {
    await actor(A)
    for (const change of ["role='admin'", "plan='advanced'", "is_verified=true", "public_id=888", "identity_change_locked_until=null", "publications_enabled=false"]) {
      if (change.startsWith('identity')) continue // inicialmente NULL: probar un cambio real
      await assert.rejects(db.exec(`update public.profiles set ${change} where id='${A}'`), /administrados|admin/)
    }
    await assert.rejects(db.exec(`update public.profiles set identity_change_locked_until=now() where id='${A}'`), /administrados/)
    assert.equal((await rows(`update public.profiles set full_name='Spoof' where id='${B}' returning id`)).length, 0)
  })
  await t.test('INSERT de perfil no permite elegir admin/plan/ID público', async () => {
    const newUser = '44444444-4444-4444-8444-444444444444'
    await root(`insert into auth.users(id) values('${newUser}')`)
    await actor(newUser)
    // Política de alta del entorno histórico, omitida en 001, explicitada en fixture.
    await root(`create policy "fixture profile signup" on public.profiles for insert to authenticated with check(id=auth.uid())`)
    await actor(newUser)
    await assert.rejects(db.exec(`insert into public.profiles(id,full_name,role) values('${newUser}','New','admin')`), /administrados/)
    await db.exec(`insert into public.profiles(id,full_name,public_id) values('${newUser}','New',999)`)
    assert.notEqual((await rows(`select public_id from public.profiles where id='${newUser}'`))[0].public_id,999)
  })
  await t.test('tabla privada cerrada; vista sólo published sin dirección oculta ni moderación', async () => {
    for (const uid of [null,A]) {
      await actor(uid)
      assert.equal((await rows(`select * from public.properties where id='${PB}'`)).length,0)
      const publicRows = await rows(`select * from public.properties_public where id='${PB}'`)
      assert.equal(publicRows.length,1); assert.equal(publicRows[0].address,null)
      assert.ok(!('main_image' in publicRows[0])); assert.ok(!('previous_data' in publicRows[0]))
      assert.ok(!('rejection_reason' in publicRows[0]))
      await assert.rejects(db.exec(`update public.properties_public set title='Spoof' where id='${PB}'`), /permission denied/)
      assert.equal((await rows(`select * from public.properties_public where id='${PA}'`)).length,0)
    }
    await actor(ADMIN); assert.equal((await rows(`select address from public.properties where id='${PB}'`))[0].address,'PRIVATE B ADDRESS')
  })
  await t.test('moderación no eludible por edición directa/RPC galería', async () => {
    await actor(A)
    await assert.rejects(db.exec(`update public.properties set status='published' where id='${PA}'`), /estado/)
    await assert.rejects(db.exec(`update public.properties set featured=true where id='${PA}'`), /moderación/)
    await assert.rejects(db.exec(`insert into public.properties(owner_id,slug,title,operation,zone,price_display,featured) values('${A}','evil','Evil','Renta','z','100',true)`), /moderación/)
    await actor(B)
    await assert.rejects(db.query('select public.replace_property_images($1,$2::jsonb)', [PB,JSON.stringify([{storage_path:pathB}])]), /edición autorizada/)
  })
  await t.test('requerimientos privados y altas directas anónimas/autenticadas bloqueadas', async () => {
    for (const uid of [null,A,B,ADMIN]) {
      await actor(uid)
      assert.equal((await rows('select id from public.demand_requests')).length,uid===ADMIN?2:uid?1:0)
      await assert.rejects(db.exec("insert into public.demand_requests(name,phone,email) values('spam','1234567890','spam@test.test')"), /row-level security/)
    }
  })
  let contactId
  await t.test('contacto/autorización/notificación atómicos, idempotentes y no falsificables', async () => {
    await actor(A)
    const query = 'select public.qrih_request_property_contact($1,$2,$3,$4) as result'
    const params = [PB,'Advisor A','1234567890','a@fixtures.test']
    const result = (await rows(query,params))[0].result
    contactId=result.authorization_id
    assert.equal(result.authorization_status,'pending')
    assert.deepEqual((await rows(query,params))[0].result,result)
    await assert.rejects(db.exec(`insert into public.property_contact_authorizations(advisor_id,property_id,status) values('${A}','${PB}','authorized')`), /row-level security/)
    await assert.rejects(db.exec(`select public.notify_property_contact_request('${PB}','${A}')`), /permission denied/)
    assert.equal((await rows(`select * from public.property_contacts where property_id='${PB}'`)).length,0)
    assert.equal((await rows(`select * from public.get_property_publisher_contact('${PB}')`)).length,0)
    await actor(B)
    assert.equal((await rows(`select * from public.property_contacts where property_id='${PB}'`)).length,1)
    const notifications=await rows('select * from public.notifications')
    assert.equal(notifications.length,1)
    await assert.rejects(db.exec(`update public.notifications set message='fake' where id='${notifications[0].id}'`), /leída/)
    await db.exec(`update public.notifications set read_at=now() where id='${notifications[0].id}'`)
    await actor(A)
    await assert.rejects(db.query('select public.respond_property_contact_authorization($1,$2)',[contactId,'authorized']), /permiso/)
    await actor(B)
    await db.query('select public.respond_property_contact_authorization($1,$2)',[contactId,'authorized'])
    await actor(A)
    assert.equal((await rows(`select * from public.get_property_publisher_contact('${PB}')`)).length,1)
    await root(`update public.profiles set account_status='suspended' where id='${A}'`)
    await actor(A)
    assert.equal((await rows(`select * from public.get_property_publisher_contact('${PB}')`)).length,0)
    await root(`update public.profiles set account_status='active' where id='${A}'`)
  })
  await t.test('catálogo anónimo sin teléfono/WhatsApp y RPC interno inaccesible', async () => {
    await actor(null)
    const catalog=(await rows('select public.get_advisor_catalog(2) as catalog'))[0].catalog
    assert.ok(!('phone' in catalog)); assert.ok(!('whatsapp' in catalog))
    await assert.rejects(db.exec('select public.qrih_advisor_catalog_internal(2)'),/permission denied/)
  })
  await t.test('oportunidades/intereses: no se utilizan requerimientos ajenos', async () => {
    await actor(A)
    await assert.rejects(db.exec(`insert into public.property_interest_requests(user_id,property_id,demand_request_id) values('${A}','${PB}','${PB}')`), /row-level security/)
    await db.exec(`insert into public.property_interest_requests(user_id,property_id,demand_request_id) values('${A}','${PB}','${PA}')`)
    await assert.rejects(db.exec(`insert into public.opportunity_property_registrations(registered_by,property_id,demand_request_id) values('${A}','${PB}','${PA}')`), /row-level security/)
    await assert.rejects(db.exec(`select public.notify_opportunity_property_registered('${PB}','${PA}','${A}')`),/permission denied/)
  })
  await t.test('ingesta directa bloqueada; procedencia sólo servidor valida objeto sin owner_id', async () => {
    const path=A+'/verified.webp'
    await actor(A)
    await assert.rejects(db.exec(`insert into storage.objects(bucket_id,name,owner_id) values('property-images','${path}','${A}')`),/row-level security/)
    await assert.rejects(db.exec(`insert into public.qrih_verified_uploads(bucket_id,storage_path,owner_id,mime_type,byte_size,sha256) values('property-images','${path}','${A}','image/webp',100,'${'a'.repeat(64)}')`), /permission denied/)
    await root(`insert into storage.objects(bucket_id,name) values('property-images','${path}');
      insert into public.qrih_verified_uploads(bucket_id,storage_path,owner_id,mime_type,byte_size,sha256) values('property-images','${path}','${A}','image/webp',100,'${'a'.repeat(64)}');`)
    await actor(A)
    await db.query('select public.replace_property_images($1,$2::jsonb)',[PA,JSON.stringify([{storage_path:path}])])
    assert.equal(await visible(path),true)
    await actor(B); assert.equal(await visible(path),false)
    assert.equal((await rows('select public.qrih_verified_object_owner($1,$2) as owner',['property-images',path]))[0].owner,null)
    assert.equal((await rows(`delete from storage.objects where name='${pathB}' returning name`)).length,0,
      'No borrar una fotografía todavía referenciada y romper la ficha')
    await actor(null); assert.equal(await visible(path),false)
    assert.equal((await rows('select public.qrih_verified_object_owner($1,$2) as owner',['property-images',path]))[0].owner,null)
    await actor(A)
    await assert.rejects(db.exec(`update public.properties set main_image_path='${pathA}' where id='${PA}'`), /portada.*galería/)
    await assert.rejects(db.exec(`update public.profiles set avatar_url='https://untrusted.test/evil.svg' where id='${A}'`),/avatar/)
  })
  await t.test('cuota atómica sólo servidor; configuración privada no editable por usuario', async () => {
    await actor(A)
    await assert.rejects(db.exec("select public.qrih_take_server_limit('a','media')"),/permission denied/)
    assert.equal((await rows("update public.platform_settings set support_email='spoof@test.test' returning id")).length,0)
    await actor(null,'service_role')
    for (let i=0;i<6;i++) assert.equal((await rows("select public.qrih_take_server_limit('anon','demand') as allowed"))[0].allowed,i<5)
  })
  await t.test('edición+galería transaccionales; datos inválidos/versiones viejas preservan original',async()=>{
    await actor(A)
    const timestamp=(await rows(`select updated_at::text as value from public.properties where id='${PA}'`))[0].value
    const paths=[{storage_path:A+'/verified.webp',title:'Verified'}]
    await assert.rejects(db.query('select public.qrih_update_property_with_images($1,$2,$3,$4)',[PA,timestamp,JSON.stringify({title:'changed',total_area:-1}),JSON.stringify(paths)]),/inválidos/)
    assert.equal((await rows(`select title from public.properties where id='${PA}'`))[0].title,'A2')
    await db.query('select public.qrih_update_property_with_images($1,$2,$3,$4)',[PA,timestamp,JSON.stringify({title:'A edited',status:'pending'}),JSON.stringify(paths)])
    assert.equal((await rows(`select status from public.properties where id='${PA}'`))[0].status,'pending')
    await assert.rejects(db.query('select public.qrih_update_property_with_images($1,$2,$3,$4)',[PA,timestamp,'{}',JSON.stringify(paths)]),/editar/)
    await actor(B)
    await assert.rejects(db.query('select public.qrih_update_property_with_images($1,$2,$3,$4)',[PA,timestamp,'{}',JSON.stringify(paths)]),/editar/)
  })
  await t.test('moderación: admin activo, bitácora+notificación y doble acción rechazados',async()=>{
    await actor(A)
    await assert.rejects(db.query('select public.qrih_moderate_property($1,$2,$3)',[PA,'publish',null]),/administrador/)
    await actor(ADMIN)
    await db.query('select public.qrih_moderate_property($1,$2,$3)',[PA,'publish',null])
    await assert.rejects(db.query('select public.qrih_moderate_property($1,$2,$3)',[PA,'publish',null]),/estado esperado/)
    assert.equal((await rows(`select * from public.audit_logs where entity_id='${PA}' and action='property_published'`)).length,1)
    await actor(A)
    assert.equal((await rows(`select * from public.notifications where property_id='${PA}' and type='property_published'`)).length,1)
    await actor(null)
    assert.equal(await visible(A+'/verified.webp'),true)
  })
  await t.test('borrar propiedad publicada+contactos es atómico; usuario ajeno no puede',async()=>{
    await actor(A)
    await assert.rejects(db.query('select public.qrih_delete_own_property($1)',[PB]),/eliminar/)
    await actor(B)
    const paths=(await rows('select public.qrih_delete_own_property($1) as paths',[PB]))[0].paths
    assert.deepEqual(paths,[pathB])
    assert.equal((await rows(`select * from public.properties where id='${PB}'`)).length,0)
    await actor(null,'postgres')
    assert.equal((await rows(`select * from public.property_contacts where property_id='${PB}'`)).length,0)
    assert.equal((await rows(`select * from public.property_contact_authorizations where property_id='${PB}'`)).length,0)
  })
  await t.test('admin suspendido no puede leer privados/moderar ni emitir notificaciones',async()=>{
    await root(`update public.profiles set account_status='suspended' where id='${ADMIN}'`)
    await actor(ADMIN)
    assert.equal((await rows('select * from public.audit_logs')).length,0)
    await assert.rejects(db.query('select public.qrih_moderate_property($1,$2,$3)',[PA,'unpublish','test']),/administrador/)
    await assert.rejects(db.query('select public.notify_property_published($1)',[PA]),/permission denied/)
    await assert.rejects(db.query('select public.admin_set_profile_verified($1,$2)',[A,true]),/administrados/)
    await root(`update public.profiles set account_status='active' where id='${ADMIN}'`)
  })
  await db.close()
})
