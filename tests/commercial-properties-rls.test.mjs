// Authorized only for disposable PostgreSQL-in-WASM with synthetic rows. No env loader/network/cloud.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { test } from 'node:test'
import { calculateMatch } from '../lib/matching.ts'
const { PGlite } = await import(pathToFileURL(process.env.QRIH_PGLITE_MODULE).href)
const source = file => readFileSync(new URL('../supabase/' + file, import.meta.url), 'utf8')
const A='11111111-1111-4111-8111-111111111111', B='22222222-2222-4222-8222-222222222222'
const P='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', Q='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const R='cccccccc-cccc-4ccc-8ccc-cccccccccccc', REQUEST='dddddddd-dddd-4ddd-8ddd-dddddddddddd'
const path=A+'/original.webp', copy=A+'/copy.webp'
test('052: moneda exacta y compartición sólo publicada en PostgreSQL temporal', async t => {
  const db=new PGlite()
  const rows=async(sql,args=[]) => (await db.query(sql,args)).rows
  async function actor(id,role=id?'authenticated':'postgres') {
    await db.exec('reset role')
    await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
      [id||'',JSON.stringify({sub:id,role:role==='postgres'?'service_role':role})])
    await db.exec('set local role '+role)
  }
  async function denied(sql,args=[]) {
    await db.exec('savepoint expected_denial'); await assert.rejects(db.query(sql,args))
    await db.exec('rollback to savepoint expected_denial')
  }
  async function check(name,run) { await t.test(name,async()=>{
    await db.exec('begin'); try { await run() } finally { await db.exec('rollback; reset role') }
  }) }
  const policies=()=>rows("select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check from pg_policies order by 1,2,3")
  const flags=()=>rows("select n.nspname,c.relname,c.relrowsecurity,c.relforcerowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','storage') and c.relkind='r' order by 1,2")
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create schema storage; create schema extensions;
      grant usage on schema auth,storage,public to anon,authenticated,service_role;
      create table auth.users(id uuid primary key,email text);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
      create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;
      create function storage.extension(text) returns text language sql immutable as $$select reverse(split_part(reverse($1),'.',1))$$;
      create function storage.allow_any_operation(text[]) returns boolean language sql stable as $$select coalesce(current_setting('test.storage_operation',true),'object.get_authenticated')=any($1)$$;
      create table storage.objects(id uuid default gen_random_uuid() primary key,bucket_id text,name text,owner_id text,unique(bucket_id,name));
      create table storage.buckets(id text primary key,name text,public boolean,allowed_mime_types text[],file_size_limit bigint);
      alter table storage.objects enable row level security;
      grant select on storage.objects to anon,authenticated;
      alter default privileges in schema public grant all on tables to anon,authenticated;
      alter default privileges in schema public grant execute on functions to anon,authenticated;`)
    await db.exec(source('staging/baseline-2026-10-03.sql'))
    await db.exec("set app.qrih_storage_origin='https://synthetic.supabase.co'")
    for(const file of ['044_add_property_main_image_path.sql','045_make_property_images_private.sql',
      '046_soft_launch_authorization_boundaries.sql','047_verified_media_ingestion.sql','048_atomic_property_writes.sql',
      '20261004052754_049_lockdown_function_privileges.sql','20261006201021_050_cross_account_opportunities.sql',
      '20261019212016_051_profile_property_management.sql']) await db.exec(source('migrations/'+file))
    await db.exec(`set request.jwt.claims='{"role":"service_role"}';
      insert into auth.users(id) values('${A}'),('${B}');
      insert into public.profiles(id,full_name,role,account_status) values('${A}','Synthetic owner','publisher','active'),('${B}','Synthetic unrelated','publisher','active');
      insert into storage.buckets(id,name,public,allowed_mime_types,file_size_limit) values('property-images','property-images',false,array['image/webp'],20971520);
      insert into storage.objects(bucket_id,name,owner_id) values('property-images','${path}','${A}'),('property-images','${copy}',null);
      insert into public.qrih_verified_uploads(bucket_id,storage_path,owner_id,mime_type,byte_size,sha256) values('property-images','${copy}','${A}','image/webp',100,repeat('a',64));
      insert into public.properties(id,owner_id,slug,title,operation,status,zone,zone_general,price_display,price_value,price_unit,total_area,main_image_path)
      values('${P}','${A}','synthetic-published','Synthetic published','Renta','published','Jurica','Querétaro Norte','$7.50/m²',7.50,'m2',5000,'${path}'),
      ('${Q}','${A}','synthetic-draft','Synthetic draft','Venta','draft','Jurica','Querétaro Norte','Legacy fractional',123.4567,'total',100,null),
      ('${R}','${B}','synthetic-null','Synthetic missing numeric','Renta','draft','Other','Other','Consultar',null,null,100,null);
      insert into public.property_images(property_id,storage_path,position,title) values('${P}','${path}',0,'Portada');`)
    const before=await rows('select to_jsonb(p) as row from public.properties p order by id')
    const beforePolicies=await policies(), beforeFlags=await flags()
    const beforeStorage=await rows('select * from storage.objects order by name')
    await db.exec(source('migrations/20261020212846_052_commercial_currency.sql'))
    await t.test('052 compila: históricos MXN, importes/filas/updated_at/NULL intactos y RLS/Storage iguales',async()=>{
      const after=await rows("select to_jsonb(p)-'price_currency' as row from public.properties p order by id")
      assert.deepEqual(after,before)
      assert.deepEqual(await policies(),beforePolicies); assert.deepEqual(await flags(),beforeFlags)
      assert.deepEqual(await rows('select * from storage.objects order by name'),beforeStorage)
      assert.equal((await rows("select count(*)::int as n from public.properties where price_currency='MXN'"))[0].n,3)
      assert.equal((await rows('select price_value::text as value from public.properties where id=$1',[Q]))[0].value,'123.4567')
      assert.match((await rows("select column_default from information_schema.columns where table_schema='public' and table_name='properties' and column_name='price_currency'"))[0].column_default,/MXN/)
    })
    await check('publicación entrega moneda y sólo campos existentes permitidos, dirección privada redactada',async()=>{
      await rows("update public.properties set address='PRIVATE ADDRESS' where id=$1",[P]); await actor(null,'anon')
      assert.deepEqual(await rows('select id,price_currency,address from public.properties_public'),[{id:P,price_currency:'MXN',address:null}])
      await denied('select previous_data from public.properties_public')
      await denied("update public.properties_public set price_currency='USD' where id=$1",[P])
    })
    for(const status of ['draft','pending','paused','rejected','expired','pending_update']) await check(`estado ${status}: enlace público y nuevas firmas denegados`,async()=>{
      await rows('update public.properties set status=$1 where id=$2',[status,P]); await actor(null,'anon')
      assert.deepEqual(await rows('select id from public.properties_public where id=$1',[P]),[])
      assert.deepEqual((await rows('select public.qrih_authorized_image_paths($1::text[]) as paths',[[path]]))[0].paths,[])
    })
    await check('suspensión o publicaciones deshabilitadas invalidan acceso público y fotos',async()=>{
      for(const field of ['account_status','publications_enabled']) {
        await actor(null)
        await db.exec(field==='account_status'?`update public.profiles set account_status='suspended' where id='${A}'`:`update public.profiles set account_status='active',publications_enabled=false where id='${A}'`)
        await actor(null,'anon')
        assert.deepEqual(await rows('select id from public.properties_public where id=$1',[P]),[])
        assert.deepEqual((await rows('select public.qrih_authorized_image_paths($1::text[]) as paths',[[path]]))[0].paths,[])
      }
    })
    await check('MXN/USD admitidos; moneda ajena/NULL denegadas y cliente anterior conserva MXN',async()=>{
      await actor(A)
      await rows("update public.properties set price_currency='USD' where id=$1",[Q])
      assert.equal((await rows('select price_currency from public.properties where id=$1',[Q]))[0].price_currency,'USD')
      for(const value of ['EUR',null]) await denied('update public.properties set price_currency=$1 where id=$2',[value,Q])
      await rows(`insert into public.properties(owner_id,slug,title,operation,zone,price_display) values('${A}','new','New','Venta','Zone','10')`)
      assert.equal((await rows("select price_currency from public.properties where slug='new'"))[0].price_currency,'MXN')
    })
    await check('edición atómica conserva decimal USD, unidad y galería; rechaza propiedad ajena/anon',async()=>{
      await rows("update public.properties set status='draft' where id=$1",[P])
      const stamp=(await rows('select updated_at::text as stamp from public.properties where id=$1',[P]))[0].stamp
      const sql='select public.qrih_update_property_with_images($1,$2,$3::jsonb,$4::jsonb)'
      const args=[P,stamp,JSON.stringify({price_currency:'USD',price_value:'7.50',price_unit:'m2',price_display:'US$7.50 USD/m²/mes',status:'pending'}),JSON.stringify([{storage_path:path,title:'Portada'}])]
      await actor(B); await denied(sql,args); await actor(null,'anon'); await denied(sql,args)
      await actor(A); await rows(sql,args); await actor(null)
      assert.deepEqual(await rows('select price_value::text as amount,price_currency,price_unit,status::text from public.properties where id=$1',[P]),[{amount:'7.50',price_currency:'USD',price_unit:'m2',status:'pending'}])
      assert.deepEqual(await rows('select storage_path from public.property_images where property_id=$1',[P]),[{storage_path:path}])
    })
    await check('duplicación USD/total exacta e idempotente, portada independiente y fuente intacta',async()=>{
      const old=(await rows('select to_jsonb(p) as row from public.properties p where id=$1',[P]))[0].row
      await actor(A)
      const payload={title:'Synthetic duplicate',operation:'Renta',status:'draft',zone:'Jurica',zone_general:'Querétaro Norte',location_visibility:'zone',
        price_display:'US$37,500 USD/mes',price_value:'37500.00',price_currency:'USD',price_unit:'total',total_area:5000}
      const args=[P,REQUEST,JSON.stringify(payload),JSON.stringify([{storage_path:copy,title:'Copia'}])]
      const sql='select public.qrih_duplicate_property($1,$2,$3::jsonb,$4::jsonb) as id'
      const id=(await rows(sql,args))[0].id; assert.equal((await rows(sql,args))[0].id,id)
      await actor(null)
      assert.deepEqual((await rows('select to_jsonb(p) as row from public.properties p where id=$1',[P]))[0].row,old)
      const duplicate=(await rows('select price_value::text as amount,price_currency,price_unit,status::text,main_image_path from public.properties where id=$1',[id]))[0]
      assert.deepEqual(duplicate,{amount:'37500.00',price_currency:'USD',price_unit:'total',status:'draft',main_image_path:copy})
    })
    await check('duplicación por cliente anterior hereda USD de su origen, no lo sustituye por MXN',async()=>{
      await rows("update public.properties set price_currency='USD' where id=$1",[P]); await actor(A)
      const payload={title:'Legacy synthetic duplicate',operation:'Renta',status:'draft',zone:'Jurica',zone_general:'Querétaro Norte',location_visibility:'zone',
        price_display:'$7.50/m²',price_value:'7.50',price_unit:'m2',total_area:5000}
      const id=(await rows('select public.qrih_duplicate_property($1,$2,$3::jsonb,$4::jsonb) as id',
        [P,REQUEST,JSON.stringify(payload),JSON.stringify([{storage_path:copy,title:'Copia'}])]))[0].id
      assert.equal((await rows('select price_currency from public.properties where id=$1',[id]))[0].price_currency,'USD')
    })
    await check('catálogo asesor conserva moneda y nunca vuelve a publicar teléfono/WhatsApp',async()=>{
      const publicId=(await rows('select public_id from public.profiles where id=$1',[A]))[0].public_id
      await actor(null,'anon')
      const catalog=(await rows('select public.get_advisor_catalog($1) as data',[publicId]))[0].data
      assert.equal(catalog.properties[0].price_currency,'MXN')
      assert.equal('phone' in catalog,false); assert.equal('whatsapp' in catalog,false)
    })
    await check('matching SQL/JS: superficie preservada; presupuesto sin moneda no compara MXN/USD',async()=>{
      const demand={operation:'Renta',zone:'Jurica',zone_general:'Querétaro Norte',area_min:1000,area_max:6000,budget_min:1,budget_max:999999}
      for(const currency of ['MXN','USD']) {
        const p={operation:'Renta',zone:'Jurica',zone_general:'Querétaro Norte',total_area:5000,price_value:7.5,price_unit:'m2',price_currency:currency}
        const score=(await rows('select qrih_private.opportunity_match_total(jsonb_populate_record(null::public.properties,$1::jsonb),jsonb_populate_record(null::public.demand_requests,$2::jsonb)) as score',[JSON.stringify(p),JSON.stringify(demand)]))[0].score
        assert.equal(Number(score),85); assert.equal(Number(score),calculateMatch({...p,surface_m2:p.total_area},demand).total)
      }
    })
  } finally { await db.close() }
})
