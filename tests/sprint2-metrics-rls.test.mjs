import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { test } from 'node:test'

const { PGlite } = await import(pathToFileURL(process.env.QRIH_PGLITE_MODULE).href)
test('Sprint2 propuesta aislada:no backfill,aceptación manual única,no auto/rechazo/ajeno/suspendido;agregado privado', async () => {
  const db=new PGlite()
  const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222',p='33333333-3333-4333-8333-333333333333'
  const id=n=>`aaaaaaaa-aaaa-4aaa-8aaa-${String(n).padStart(12,'0')}`
  try {
    await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
      create schema auth;create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      create table public.profiles(id uuid primary key,account_status text);
      create table public.properties(id uuid primary key,owner_id uuid,status text);
      create table public.property_contact_authorizations(id uuid primary key,property_id uuid,status text,responded_at timestamptz);
      insert into public.profiles values('${a}','active'),('${b}','active');
      insert into public.properties values('${p}','${a}','published');
      insert into public.property_contact_authorizations values('${id(1)}','${p}','authorized',now()-interval '1 day');`)
    await db.exec(readFileSync(new URL('../docs/proposals/sprint-2-confirmed-connections.sql',import.meta.url),'utf8'))
    const count=async()=>Number((await db.query('select public.qrih_confirmed_connections_count() n')).rows[0].n)
    assert.equal(await count(),0)
    await db.exec(`insert into public.property_contact_authorizations values('${id(2)}','${p}','authorized',now());`)
    assert.equal(await count(),0,'Autoapproval INSERT is not acceptance')
    for(let n=3;n<=7;n++) await db.exec(`insert into public.property_contact_authorizations values('${id(n)}','${p}','pending',null)`)
    await db.exec(`select set_config('request.jwt.claim.sub','${a}',false);update public.property_contact_authorizations set status='authorized',responded_at=now() where id='${id(3)}'`)
    assert.equal(await count(),1)
    await db.exec(`update public.property_contact_authorizations set responded_at=now(),status='authorized' where id='${id(3)}';
      update public.property_contact_authorizations set status='pending' where id='${id(3)}';
      update public.property_contact_authorizations set status='authorized' where id='${id(3)}';
      update public.property_contact_authorizations set status='declined',responded_at=now() where id='${id(4)}';`)
    assert.equal(await count(),1,'One request counted once,decline excluded')
    await db.exec(`select set_config('request.jwt.claim.sub','${b}',false);update public.property_contact_authorizations set status='authorized',responded_at=now() where id='${id(5)}';
      select set_config('request.jwt.claim.sub','${a}',false);update public.profiles set account_status='suspended' where id='${a}';
      update public.property_contact_authorizations set status='authorized',responded_at=now() where id='${id(6)}';
      select set_config('request.jwt.claim.sub','',false);update public.property_contact_authorizations set status='authorized',responded_at=now() where id='${id(7)}';`)
    assert.equal(await count(),1,'Foreign,suspended and background have no confirmed commercial event')
    for(const role of ['anon','authenticated']) {
      await db.exec(`set role ${role}`)
      await assert.rejects(db.query('select public.qrih_confirmed_connections_count()'))
      await assert.rejects(db.query('select * from qrih_metrics.confirmed_connections'))
      await db.exec('reset role')
    }
    await db.exec('set role service_role');assert.equal(await count(),1)
    await assert.rejects(db.query('select * from qrih_metrics.confirmed_connections'));await db.exec('reset role')
    assert.equal((await db.query("select relrowsecurity from pg_class where oid='qrih_metrics.confirmed_connections'::regclass")).rows[0].relrowsecurity,true)
  } finally { await db.close() }
})
