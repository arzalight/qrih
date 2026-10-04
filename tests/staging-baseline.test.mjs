import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'
import {pathToFileURL} from 'node:url'

const {PGlite}=await import(pathToFileURL(process.env.QRIH_PGLITE_MODULE).href)
const sql=(path)=>readFileSync(new URL('../supabase/'+path,import.meta.url),'utf8')

test('baseline real sin datos + 044–049: flujos SQL y rollback de staging',async()=>{
  const db=new PGlite()
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create schema storage; create schema extensions;
      grant usage on schema auth,storage,public to anon,authenticated,service_role;
      create table auth.users(id uuid primary key,email text);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      create function auth.jwt() returns jsonb language sql stable as
        $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
      create function storage.foldername(text) returns text[] language sql immutable as
        $$ select string_to_array($1,'/') $$;
      create function storage.extension(text) returns text language sql immutable as
        $$ select reverse(split_part(reverse($1),'.',1)) $$;
      create function storage.allow_any_operation(text[]) returns boolean language sql stable as
        $$ select false $$;
      create table storage.objects(id uuid default gen_random_uuid() primary key,bucket_id text,name text,owner_id text);
      create table storage.buckets(id text primary key,name text,public boolean,allowed_mime_types text[],file_size_limit bigint);
      alter default privileges in schema public grant all on tables to anon,authenticated;
      alter default privileges in schema public grant execute on functions to anon,authenticated;
    `)
    await db.exec(sql('staging/baseline-2026-10-03.sql'))
    await db.exec("set app.qrih_storage_origin='https://mcyxunymhuxyiwklyfpy.supabase.co'")
    for(const file of ['044_add_property_main_image_path.sql','045_make_property_images_private.sql',
      '046_soft_launch_authorization_boundaries.sql','047_verified_media_ingestion.sql',
      '048_atomic_property_writes.sql','20261004052754_049_lockdown_function_privileges.sql']) {
      await db.exec(sql('migrations/'+file))
    }
    const reports=await db.exec(sql('checks/staging_security_smoke.sql'))
    const results=reports.find(report=>report.rows[0]?.results)?.rows[0].results
    assert.ok(Array.isArray(results) && results.length>=14)
    assert.ok(results.every(result=>result.passed===true))
    assert.equal((await db.query('select count(*)::int as n from auth.users')).rows[0].n,0)
    assert.equal((await db.query('select count(*)::int as n from public.properties')).rows[0].n,0)
  } finally {await db.close()}
})
