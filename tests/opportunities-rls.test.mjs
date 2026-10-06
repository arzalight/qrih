import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { pathToFileURL } from 'node:url'
import { calculateMatch } from '../lib/matching.ts'

const { PGlite } = await import(pathToFileURL(process.env.QRIH_PGLITE_MODULE).href)
const sql = file => readFileSync(new URL('../supabase/' + file, import.meta.url), 'utf8')
const A='11111111-1111-4111-8111-111111111111', B='22222222-2222-4222-8222-222222222222', C='33333333-3333-4333-8333-333333333333'
const P='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', D='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

test('AUD-032: baseline + 044–050, colaboración sin abrir filas privadas', async t => {
  const db = new PGlite()
  const rows = async (query, args=[]) => (await db.query(query,args)).rows
  async function actor(id,extra={}) {
    await db.exec('reset role')
    await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
      [id||'',JSON.stringify({sub:id,role:id?'authenticated':'service_role',...extra})])
    if(id) await db.exec('set local role authenticated')
  }
  async function denied(query,args=[],pattern=/permission|unavailable|row-level/i) {
    await db.exec('savepoint expected_denial')
    await assert.rejects(db.query(query,args),pattern)
    await db.exec('rollback to savepoint expected_denial')
  }
  async function check(name,fn) {
    await t.test(name,async()=>{
      await db.exec('begin')
      try { await fn() } finally {await db.exec('reset role; rollback')}
    })
  }
  const feed=async()=> (await rows('select public.qrih_opportunity_feed() as data'))[0].data
  const listings=async()=> (await rows('select public.qrih_opportunity_registrations() as data'))[0].data
  const register=()=>rows('select public.qrih_register_opportunity($1,$2) as id',[D,P])
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
      create function storage.allow_any_operation(text[]) returns boolean language sql stable as $$select false$$;
      create table storage.objects(id uuid default gen_random_uuid() primary key,bucket_id text,name text,owner_id text);
      create table storage.buckets(id text primary key,name text,public boolean,allowed_mime_types text[],file_size_limit bigint);
      alter default privileges in schema public grant all on tables to anon,authenticated;
      alter default privileges in schema public grant execute on functions to anon,authenticated;`)
    await db.exec(sql('staging/baseline-2026-10-03.sql'))
    await db.exec("set app.qrih_storage_origin='https://mcyxunymhuxyiwklyfpy.supabase.co'")
    for(const file of ['044_add_property_main_image_path.sql','045_make_property_images_private.sql',
      '046_soft_launch_authorization_boundaries.sql','047_verified_media_ingestion.sql','048_atomic_property_writes.sql',
      '20261004052754_049_lockdown_function_privileges.sql','20261006201021_050_cross_account_opportunities.sql']) {
      await db.exec(sql('migrations/'+file))
    }
    await db.exec(`set request.jwt.claims='{"role":"service_role"}';
      insert into auth.users(id) values('${A}'),('${B}'),('${C}');
      insert into public.profiles(id,full_name) values('${A}','Synthetic owner'),('${B}','Synthetic requester'),('${C}','Synthetic unrelated');
      insert into public.properties(id,owner_id,slug,title,operation,status,zone,zone_general,price_display,total_area,price_value,price_unit)
        values('${P}','${A}','synthetic-property','Synthetic property','Renta','published','Jurica','Querétaro Norte','Synthetic',500,50000,'total');
      insert into public.demand_requests(id,user_id,name,email,phone,company,notes,operation,zone_general,zone,area_min,area_max,budget_min,budget_max)
        values('${D}','${B}','PRIVATE NAME','private@example.invalid','0000000000','PRIVATE COMPANY','PRIVATE NOTES','Renta','Querétaro Norte','Jurica',400,600,40000,60000);`)

    await check('feed técnico ajeno sin nombre/contacto/identidad; tabla privada sigue cerrada',async()=>{
      await actor(A)
      const data=await feed()
      assert.equal(data.length,1);assert.equal(data[0].id,D)
      assert.deepEqual(Object.keys(data[0]).sort(),['id','operation','zone_general','zone','area_min','area_max','budget_min','budget_max','status','created_at'].sort())
      assert.ok(!JSON.stringify(data).includes('PRIVATE'));assert.ok(!JSON.stringify(data).includes(B))
      assert.equal((await rows('select count(*)::int as n from public.demand_requests'))[0].n,0)
    })
    await check('postulación cruzada, destinatario B, propietario A y un aviso atómicos',async()=>{
      await actor(A);const result=await register();assert.ok(result[0].id)
      assert.equal((await listings()).length,1)
      await actor(B);const data=await listings();assert.equal(data.length,1)
      assert.equal(data[0].property.title,'Synthetic property')
      assert.ok(!('owner_id' in data[0].property));assert.ok(!('address' in data[0].property))
      assert.equal((await rows('select count(*)::int as n from public.properties'))[0].n,0)
      const notices=await rows('select type,property_id,demand_request_id from public.notifications')
      assert.deepEqual(notices,[{type:'opportunity_property_registered',property_id:P,demand_request_id:D}])
      await actor(null)
      assert.equal((await rows('select registered_by from public.opportunity_property_registrations'))[0].registered_by,A)
    })
    await check('duplicado no repite registro ni aviso',async()=>{
      await actor(A);await register();await denied('select public.qrih_register_opportunity($1,$2)',[D,P],/duplicate|unique/i)
      await actor(null)
      assert.equal((await rows('select count(*)::int as n from public.opportunity_property_registrations'))[0].n,1)
      assert.equal((await rows('select count(*)::int as n from public.notifications'))[0].n,1)
    })
    await check('actor ajeno/no propietario no descubre feed ni registra IDs',async()=>{
      await actor(C);assert.deepEqual(await feed(),[]);assert.deepEqual(await listings(),[])
      await denied('select public.qrih_register_opportunity($1,$2)',[D,P])
    })
    await check('anon no ejecuta wrappers ni funciones privadas',async()=>{
      await actor(null);await db.exec('set local role anon')
      for(const query of ['select public.qrih_opportunity_feed()','select public.qrih_opportunity_registrations()',
        'select qrih_private.opportunity_feed()']) await denied(query)
      await denied('select public.qrih_register_opportunity($1,$2)',[D,P])
    })
    await check('INSERT directo y helper interno no permiten saltar autorización',async()=>{
      await actor(A)
      await denied('insert into public.opportunity_property_registrations(demand_request_id,property_id,registered_by) values($1,$2,$3)',[D,P,A])
      await denied('select qrih_private.opportunity_actor_active()',[],/permission/i)
    })
    await check('cuenta suspendida, publicación deshabilitada y sesión anónima bloqueadas',async()=>{
      for(const scenario of ['suspended','disabled','anonymous']) {
        await actor(null)
        await db.query("update public.profiles set account_status=$1,publications_enabled=$2 where id=$3",[scenario==='suspended'?'suspended':'active',scenario!=='disabled',A])
        await actor(A,{is_anonymous:scenario==='anonymous'})
        assert.deepEqual(await feed(),[])
        await denied('select public.qrih_register_opportunity($1,$2)',[D,P])
      }
    })
    await check('propiedad no publicada no se postula en ninguno de sus estados privados',async()=>{
      for(const status of ['draft','pending','paused','rejected','expired','pending_update']) {
        await actor(null);await db.query('update public.properties set status=$1::public.property_status where id=$2',[status,P])
        await actor(A);assert.deepEqual(await feed(),[])
        await denied('select public.qrih_register_opportunity($1,$2)',[D,P])
      }
    })
    await check('requerimiento cerrado, viejo, sin destinatario o de suspendido no se oferta',async()=>{
      for(const scenario of ['closed','old','anonymous','suspended']) {
        await actor(null)
        await db.query("update public.demand_requests set status=$1,created_at=$2,user_id=$3 where id=$4",
          [scenario==='closed'?'closed':'new',scenario==='old'?'2020-01-01T00:00:00Z':new Date().toISOString(),scenario==='anonymous'?null:B,D])
        await db.query('update public.profiles set account_status=$1 where id=$2',[scenario==='suspended'?'suspended':'active',B])
        await actor(A);assert.deepEqual(await feed(),[])
        await denied('select public.qrih_register_opportunity($1,$2)',[D,P])
      }
    })
    await check('cero compatibilidad no aparece ni se postula manipulando IDs',async()=>{
      await actor(null)
      await db.query("update public.properties set operation='Venta',zone='Other',zone_general='Other',total_area=null,price_value=null where id=$1",[P])
      await actor(A);assert.deepEqual(await feed(),[])
      await denied('select public.qrih_register_opportunity($1,$2)',[D,P])
    })
    await check('ranking SQL conserva algoritmo TypeScript, incluidos m²/NULL/ceros/rangos',async()=>{
      const property={operation:' RENTA ',zone_general:' Querétaro Norte ',zone:' Jurica ',total_area:500,price_value:100,price_unit:'m²'}
      const demand={operation:'Renta',zone_general:'Querétaro Norte',zone:'Jurica',area_min:400,area_max:600,budget_min:40000,budget_max:60000}
      for(const change of [{},{total_area:200},{total_area:900},{total_area:null},{price_value:null},{price_unit:'total'},
        {price_unit:' m2 '},{operation:'Venta',zone_general:'Other',zone:'Other'}]) {
        const p={...property,...change}
        for(const ranges of [{},{area_min:0,area_max:0,budget_min:0,budget_max:0},{area_min:null,area_max:null,budget_min:null,budget_max:null}]) {
          const d={...demand,...ranges}
          const result=(await rows('select qrih_private.opportunity_match_total(jsonb_populate_record(null::public.properties,$1::jsonb),jsonb_populate_record(null::public.demand_requests,$2::jsonb)) as score',[JSON.stringify(p),JSON.stringify(d)]))[0].score
          assert.ok(Math.abs(Number(result)-calculateMatch({...p,surface_m2:p.total_area},d).total)<1e-8)
        }
      }
    })
    await check('postulación propia previa preservada y aviso de propiedad despublicada sin datos',async()=>{
      await actor(null);await db.query('update public.demand_requests set user_id=$1 where id=$2',[A,D])
      await actor(A);await register();assert.equal((await listings()).length,1)
      await actor(null);await db.query('update public.demand_requests set user_id=$1 where id=$2',[B,D])
      await db.query("update public.properties set status='paused' where id=$1",[P])
      await actor(B);assert.equal((await listings())[0].property,null)
      await actor(C);assert.deepEqual(await listings(),[])
    })
  } finally {await db.close()}
})
