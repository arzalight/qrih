// PostgreSQL in WASM, synthetic identities only. No network or hosted SQL.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { test } from 'node:test'
const { PGlite } = await import(pathToFileURL(process.env.QRIH_PGLITE_MODULE).href)
const sql = file => readFileSync(new URL('../supabase/' + file, import.meta.url), 'utf8')
const A='11111111-1111-4111-8111-111111111111', B='22222222-2222-4222-8222-222222222222', ADMIN='33333333-3333-4333-8333-333333333333', SUSP='44444444-4444-4444-8444-444444444444'
const id=n=>`aaaaaaaa-aaaa-4aaa-8aaa-${String(n).padStart(12,'0')}`
const P=id(1), PB=id(2), C=id(3), CB=id(4), D=id(5), D2=id(6), DB=id(7)
test('Sprint3: migrations and isolated authorization/atomicity/urgency', async t=>{
  const db=new PGlite()
  const rows=async(q,p=[]) => (await db.query(q,p)).rows
  async function actor(uid,role=uid?'authenticated':'postgres') {
    await db.exec('reset role')
    await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",[uid||'',JSON.stringify({sub:uid,role:role==='postgres'?'service_role':role})])
    await db.exec('set local role '+role)
  }
  async function denied(q,p=[]) { await db.exec('savepoint denial');await assert.rejects(db.query(q,p));await db.exec('rollback to savepoint denial') }
  async function check(name,fn) { await t.test(name,async()=>{await db.exec('begin');try{await fn()}finally{await db.exec('rollback;reset role')}}) }
  const details=(property,patch)=>rows('select public.qrih_set_property_private_details($1,$2::jsonb)',[property,JSON.stringify(patch)])
  const urgency=(demand,action='activate')=>rows('select public.qrih_change_demand_urgency($1,$2) value',[demand,action])
  const deniedUrgency=(demand,action='activate')=>denied('select public.qrih_change_demand_urgency($1,$2)',[demand,action])
  try {
    await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
      create schema auth;create schema storage;create schema extensions;
      grant usage on schema auth,storage,public to anon,authenticated,service_role;
      create table auth.users(id uuid primary key,email text);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
      create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;
      create function storage.extension(text) returns text language sql immutable as $$select reverse(split_part(reverse($1),'.',1))$$;
      create function storage.allow_any_operation(text[]) returns boolean language sql stable as $$select coalesce(current_setting('test.storage_operation',true),'object.get_authenticated')=any($1)$$;
      create table storage.objects(id uuid default gen_random_uuid() primary key,bucket_id text,name text,owner_id text,unique(bucket_id,name));
      create table storage.buckets(id text primary key,name text,public boolean,allowed_mime_types text[],file_size_limit bigint);
      alter table storage.objects enable row level security;grant select on storage.objects to anon,authenticated;
      alter default privileges in schema public grant all on tables to anon,authenticated;
      alter default privileges in schema public grant execute on functions to anon,authenticated;`)
    await db.exec(sql('staging/baseline-2026-10-03.sql'))
    await db.exec("set app.qrih_storage_origin='https://synthetic.supabase.co'")
    for(const file of ['044_add_property_main_image_path.sql','045_make_property_images_private.sql','046_soft_launch_authorization_boundaries.sql','047_verified_media_ingestion.sql','048_atomic_property_writes.sql','20261004052754_049_lockdown_function_privileges.sql','20261006201021_050_cross_account_opportunities.sql','20261019212016_051_profile_property_management.sql','20261020212846_052_commercial_currency.sql','20261027061535_sprint3_private_owners.sql','20261027061537_sprint3_atomic_private_property.sql','20261027061538_sprint3_demand_urgency.sql']) await db.exec(sql('migrations/'+file))
    await db.exec(sql('migrations/20261027142223_sprint3_owner_picker_pending.sql'))
    await db.exec(`set request.jwt.claims='{"role":"service_role"}';insert into auth.users(id) values('${A}'),('${B}'),('${ADMIN}'),('${SUSP}');
      insert into public.profiles(id,full_name,role,account_status) values('${A}','Synthetic A','publisher','active'),('${B}','Synthetic B','publisher','active'),('${ADMIN}','Synthetic Admin','admin','active'),('${SUSP}','Synthetic suspended','publisher','suspended');
      insert into public.properties(id,owner_id,slug,title,operation,status,zone,zone_general,price_display,price_value,price_unit,price_currency,total_area)
        values('${P}','${A}','synthetic-a','Commercial A','Renta','draft','Jurica','Querétaro Norte','$100 MXN m²/mes',100,'m2','MXN',500),('${PB}','${B}','synthetic-b','Commercial B','Renta','draft','Jurica','Querétaro Norte','$100 MXN m²/mes',100,'m2','MXN',500);
      insert into public.advisor_owners(id,advisor_id,name,phone,email,notes) values('${C}','${A}','PRIVATE_CANARY_A','0000000000','a@example.invalid','PRIVATE_NOTE_A'),('${CB}','${B}','PRIVATE_CANARY_B',null,null,null);
      insert into public.demand_requests(id,user_id,name,email,phone,operation,zone,zone_general,status) values('${D}','${A}','Synthetic demand','a@example.invalid','0000000000','Renta','Jurica','Querétaro Norte','new'),('${D2}','${A}','Synthetic second','a@example.invalid','0000000000','Renta','Jurica','Querétaro Norte','new'),('${DB}','${B}','Synthetic B','b@example.invalid','0000000000','Renta','Jurica','Querétaro Norte','new');`)
    await check('A sees/edits own only; foreign IDs neither readable nor writable',async()=>{
      await actor(A);assert.deepEqual((await rows('select id from public.advisor_owners')).map(r=>r.id),[C])
      assert.equal((await rows('update public.advisor_owners set name=$1 where id=$2 returning id',['intrusion',CB])).length,0)
      await denied('insert into public.advisor_owners(advisor_id,name) values($1,$2)',[B,'intrusion'])
      await denied('delete from public.advisor_owners where id=$1',[C])
      await denied('update public.advisor_owners set advisor_id=$1 where id=$2',[B,C])
      await actor(B)
      await rows("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:B,role:'authenticated',user_metadata:{role:'admin'}})])
      assert.deepEqual((await rows('select id from public.advisor_owners')).map(row=>row.id),[CB],'User-editable metadata cannot grant admin access')
    })
    await check('Anonymous and suspended read/write denied; active admin read only foreign',async()=>{
      await actor(null,'anon');await denied('select * from public.advisor_owners');await deniedUrgency(D)
      await actor(SUSP);assert.equal((await rows('select * from public.advisor_owners')).length,0);await deniedUrgency(D)
      await actor(ADMIN);assert.equal((await rows('select * from public.advisor_owners')).length,2)
      assert.equal((await rows("update public.advisor_owners set name='intrusion' where id=$1 returning id",[C])).length,0)
    })
    await check('private names optional/trimmed; own association only; partial update preserves; explicit null unlinks',async()=>{
      await actor(A);await details(P,{internal_name:' INTERNAL_CANARY ',owner_contact_id:C})
      assert.equal((await rows('select internal_name from public.property_private_details'))[0].internal_name,'INTERNAL_CANARY')
      await denied('select public.qrih_set_property_private_details($1,$2::jsonb)',[P,JSON.stringify({owner_contact_id:CB})])
      await denied('select public.qrih_set_property_private_details($1,$2::jsonb)',[PB,JSON.stringify({owner_contact_id:C})])
      await details(P,{internal_name:'changed'});assert.equal((await rows('select owner_contact_id from public.property_private_details'))[0].owner_contact_id,C)
      await details(P,{owner_contact_id:null});assert.equal((await rows('select owner_contact_id from public.property_private_details'))[0].owner_contact_id,null)
      assert.equal((await rows('select count(*)::int n from public.advisor_owners'))[0].n,1)
    })
    await check('archive retains contact/property and allows preserving owned relationships, never deletes history',async()=>{
      const before=await rows('select to_jsonb(p) value from public.properties p where id=$1',[P])
      await actor(A);await details(P,{owner_contact_id:C});await rows('update public.advisor_owners set archived_at=now() where id=$1',[C])
      await details(P,{internal_name:'still editable'})
      assert.equal((await rows('select owner_contact_id from public.property_private_details'))[0].owner_contact_id,C)
      await details(P,{owner_contact_id:null})
      await details(P,{owner_contact_id:C})
      await actor(null);assert.deepEqual(await rows('select to_jsonb(p) value from public.properties p where id=$1',[P]),before)
    })
    await check('private values never enter property record, previous_data, public view or audit',async()=>{
      await actor(A);await details(P,{internal_name:'INTERNAL_CANARY',owner_contact_id:C})
      await actor(B);assert.equal((await rows('select * from public.property_private_details')).length,0)
      await actor(null);await rows("update public.properties set status='pending',publication_authorized_at=now(),terms_accepted_at=now() where id=$1",[P])
      await actor(ADMIN);await rows("select public.qrih_moderate_property($1,'publish',null)",[P])
      await actor(null);const payload=JSON.stringify(await rows('select to_jsonb(p) value from public.properties p'))+JSON.stringify(await rows('select * from public.audit_logs'))
      assert.doesNotMatch(payload,/PRIVATE_CANARY|INTERNAL_CANARY|PRIVATE_NOTE/)
      await actor(null,'anon');const publicRows=await rows('select * from public.properties_public')
      assert.equal(publicRows.length,1,'Privacy check includes a real published row, not an empty result')
      assert.doesNotMatch(JSON.stringify(publicRows),/PRIVATE_CANARY|INTERNAL_CANARY|PRIVATE_NOTE/)
      await actor(ADMIN);assert.equal((await rows('select internal_name from public.property_private_details'))[0].internal_name,'INTERNAL_CANARY')
    })
    await check('deleting a property removes only association, never the owner contact',async()=>{
      await actor(A);await details(P,{owner_contact_id:C})
      await rows('select public.qrih_delete_own_property($1)',[P])
      assert.equal((await rows('select id from public.properties where id=$1',[P])).length,0)
      assert.equal((await rows('select property_id from public.property_private_details where property_id=$1',[P])).length,0)
      assert.equal((await rows('select id from public.advisor_owners where id=$1',[C])).length,1)
    })
    const commercial={title:'Synthetic created',slug:'synthetic-created',operation:'Renta',zone:'Jurica',zone_general:'Querétaro Norte',price_display:'$100 MXN m²/mes',price_value:100,price_currency:'MXN',price_unit:'m2',total_area:500,location_visibility:'zone'}
    const create=(privateData,propertyId=id(10))=>rows("select public.qrih_create_property_with_private($1,$2::jsonb,'[]'::jsonb,$3::jsonb,'draft',true) id",[propertyId,JSON.stringify(commercial),JSON.stringify(privateData)])
    await check('atomic create+private details, idempotent retry and invalid contact rollback',async()=>{
      await actor(A);assert.equal((await create({internal_name:'INTERNAL_CANARY',owner_contact_id:C}))[0].id,id(10))
      assert.equal((await create({internal_name:'retry must not overwrite'}))[0].id,id(10))
      assert.equal((await rows('select internal_name from public.property_private_details where property_id=$1',[id(10)]))[0].internal_name,'INTERNAL_CANARY')
      await denied("select public.qrih_create_property_with_private($1,$2::jsonb,'[]'::jsonb,$3::jsonb,'draft',true)",[id(11),JSON.stringify({...commercial,slug:'invalid-contact'}),JSON.stringify({owner_contact_id:CB})])
      assert.equal((await rows('select id from public.properties where id=$1',[id(11)])).length,0)
    })
    await check('atomic update and duplicate preserve source/privacy; rejected association rolls back entire save',async()=>{
      const path=`${A}/source.webp`,copy=`${A}/copy.webp`
      await rows("insert into storage.buckets(id,name,public) values('property-images','property-images',false)")
      await rows("insert into storage.objects(bucket_id,name,owner_id) values('property-images',$1,$3),('property-images',$2,$3)",[path,copy,A])
      await rows("insert into public.qrih_verified_uploads(bucket_id,storage_path,owner_id,mime_type,byte_size,sha256) values('property-images',$1,$3,'image/webp',100,repeat('a',64)),('property-images',$2,$3,'image/webp',100,repeat('b',64))",[path,copy,A])
      await actor(A);await details(P,{internal_name:'INTERNAL_CANARY',owner_contact_id:C})
      const original=(await rows('select to_jsonb(p) value from public.properties p where id=$1',[P]))[0].value
      const update={...commercial,status:'draft'};delete update.slug
      await denied("select public.qrih_save_property_with_private('update',$1,null,$2,$3::jsonb,$5::jsonb,$4::jsonb)",[P,original.updated_at,JSON.stringify({...update,title:'Must rollback'}),JSON.stringify({owner_contact_id:CB}),JSON.stringify([{storage_path:path}])])
      assert.deepEqual((await rows('select to_jsonb(p) value from public.properties p where id=$1',[P]))[0].value,original)
      await rows("select public.qrih_save_property_with_private('update',$1,null,$2,$3::jsonb,$5::jsonb,$4::jsonb)",[P,original.updated_at,JSON.stringify(update),JSON.stringify({internal_name:'Still private',owner_contact_id:C}),JSON.stringify([{storage_path:path}])])
      const saved=(await rows('select to_jsonb(p) value from public.properties p where id=$1',[P]))[0].value
      // Archived contacts remain valid history and can be preserved on a same-account duplicate.
      await rows('update public.advisor_owners set archived_at=now() where id=$1',[C])
      const duplicated=await rows("select public.qrih_save_property_with_private('duplicate',$1,$2,null,$3::jsonb,$5::jsonb,$4::jsonb) id",[P,id(20),JSON.stringify(update),JSON.stringify({internal_name:'Copy private',owner_contact_id:C}),JSON.stringify([{storage_path:copy}])])
      assert.notEqual(duplicated[0].id,P)
      assert.equal((await rows('select owner_contact_id from public.property_private_details where property_id=$1',[duplicated[0].id]))[0].owner_contact_id,C)
      assert.deepEqual((await rows('select to_jsonb(p) value from public.properties p where id=$1',[P]))[0].value,saved)
      assert.equal((await rows('select count(*)::int n from public.advisor_owners'))[0].n,1)
      const retry=await rows("select public.qrih_save_property_with_private('duplicate',$1,$2,null,null,null,$3::jsonb) id",[P,id(20),JSON.stringify({internal_name:'Must not overwrite'})])
      assert.equal(retry[0].id,duplicated[0].id)
      assert.equal((await rows('select internal_name from public.property_private_details where property_id=$1',[duplicated[0].id]))[0].internal_name,'Copy private')
      await actor(B);await denied("select public.qrih_save_property_with_private('duplicate',$1,$2,null,$3::jsonb,'[]'::jsonb,'{}'::jsonb)",[P,id(21),JSON.stringify(update)])
    })
    const pendingOwner=(n=40)=>({request_id:id(n),name:'José  Muñoz',company:'Empresa ficticia',phone:'0000000000',email:'owner@example.invalid'})
    const createOwnerProperty=(n,privateData,status='draft',images=[])=>rows('select public.qrih_create_property_with_owner($1,$2::jsonb,$3::jsonb,$4::jsonb,$5,true) id',
      [id(n),JSON.stringify({...commercial,slug:'owner-property-'+n}),JSON.stringify(images),JSON.stringify(privateData),status])
    async function ownerImage(){
      await actor(null)
      const path=`${A}/owner-synthetic.webp`
      await rows("insert into storage.buckets(id,name,public) values('property-images','property-images',false)")
      await rows("insert into storage.objects(bucket_id,name,owner_id) values('property-images',$1,$2)",[path,A])
      await rows("insert into public.qrih_verified_uploads(bucket_id,storage_path,owner_id,mime_type,byte_size,sha256) values('property-images',$1,$2,'image/webp',100,repeat('c',64))",[path,A])
      await actor(A);return [{storage_path:path,title:'Synthetic photo'}]
    }
    await check('picker: zero/one/three/more matches, normalized accents/case/spaces and exact-prefix-partial ranking',async()=>{
      await actor(A)
      const search=async q=>rows('select * from public.qrih_search_own_owners($1)',[q])
      assert.deepEqual(await search('zz'),[]);assert.deepEqual(await search('j'),[])
      await rows('insert into public.advisor_owners(id,advisor_id,name,company) values($1,$2,$3,$4)',[id(61),A,'  JOSÉ   Muñoz  ','Ficticia'])
      assert.equal((await search(' jose   MUNOZ ')).length,1)
      for(const[n,name]of [[62,'José Muñoz A'],[63,'X José Muñoz'],[64,'José Muñoz B'],[65,'Y José Muñoz']])
        await rows('insert into public.advisor_owners(id,advisor_id,name) values($1,$2,$3)',[id(n),A,name])
      assert.deepEqual((await search('jose munoz')).map(o=>o.id),[id(61),id(62),id(64)])
      assert.deepEqual(Object.keys((await search('munoz'))[0]),['id','name','company'])
      await rows('update public.advisor_owners set archived_at=now() where id=$1',[id(64)])
      assert.deepEqual((await search('jose munoz')).map(o=>o.id),[id(61),id(62),id(63)])
      await actor(B);assert.deepEqual(await search('jose'),[])
      await actor(ADMIN);assert.deepEqual(await search('jose'),[],'admin picker is own-only, unlike administrative directory reads')
      await actor(SUSP);assert.deepEqual(await search('jose'),[])
      await actor(null,'anon');await denied('select * from public.qrih_search_own_owners($1)',['jose'])
    })
    await check('pending owner saved in private draft only, recovered later; no contact, foreign reads or malformed payload',async()=>{
      await actor(A);await createOwnerProperty(70,{pending_owner:pendingOwner(),owner_contact_id:null})
      assert.deepEqual((await rows('select pending_owner from public.property_private_details where property_id=$1',[id(70)]))[0].pending_owner,pendingOwner())
      assert.equal((await rows('select count(*)::int n from public.advisor_owners'))[0].n,1)
      for(const patch of [{notes:'forbidden'},{name:''},{email:'invalid'},{request_id:B,phone:9},{request_id:'invalid'}])
        await denied('select public.qrih_set_property_private_details($1,$2::jsonb)',[id(70),JSON.stringify({pending_owner:{...pendingOwner(),...patch}})])
      await denied('select public.qrih_set_property_private_details($1,$2::jsonb)',[id(70),JSON.stringify({pending_owner:pendingOwner(),owner_contact_id:CB})])
      await actor(B);assert.deepEqual(await rows('select pending_owner from public.property_private_details where property_id=$1',[id(70)]),[])
      await denied('select public.qrih_set_property_private_details($1,$2::jsonb)',[id(70),JSON.stringify({pending_owner:pendingOwner()})])
      await actor(A);await details(id(70),{owner_contact_id:C})
      const linked=(await rows('select owner_contact_id,pending_owner from public.property_private_details where property_id=$1',[id(70)]))[0]
      assert.deepEqual(linked,{owner_contact_id:C,pending_owner:null})
    })
    await check('review creates/associates pending owner atomically; same ID retry never creates a second contact',async()=>{
      const images=await ownerImage()
      const first=await createOwnerProperty(71,{pending_owner:pendingOwner(),owner_contact_id:null},'pending',images)
      assert.equal(first[0].id,id(71));await rows('set constraints all immediate')
      const detail=(await rows('select owner_contact_id,pending_owner from public.property_private_details where property_id=$1',[id(71)]))[0]
      assert.deepEqual(detail,{owner_contact_id:id(40),pending_owner:null})
      await createOwnerProperty(71,{pending_owner:pendingOwner(),owner_contact_id:null},'pending',images)
      assert.equal((await rows('select count(*)::int n from public.advisor_owners where id=$1',[id(40)]))[0].n,1)
      assert.equal((await rows('select status from public.properties where id=$1',[id(71)]))[0].status,'pending')
      await actor(ADMIN);await rows("select public.qrih_moderate_property($1,'publish',null)",[id(71)])
      await actor(null,'anon');const published=await rows('select * from public.properties_public where id=$1',[id(71)])
      assert.equal(published.length,1);assert.doesNotMatch(JSON.stringify(published),/José|Muñoz|owner@example|pending_owner|owner_contact_id|Empresa ficticia/)
      await actor(null);assert.doesNotMatch(JSON.stringify(await rows('select * from public.audit_logs')),/José|Muñoz|owner@example|pending_owner|owner_contact_id/)
    })
    await check('equivalent owner blocks creation for explicit selection; no orphan/property after final association failure',async()=>{
      const images=await ownerImage()
      await rows('insert into public.advisor_owners(id,advisor_id,name,company) values($1,$2,$3,$4)',[id(80),A,'JOSE MUNOZ','  EMPRESA  ficticia'])
      await denied('select public.qrih_create_property_with_owner($1,$2::jsonb,$3::jsonb,$4::jsonb,\'pending\',true)',
        [id(72),JSON.stringify({...commercial,slug:'equivalent-block'}),JSON.stringify(images),JSON.stringify({pending_owner:pendingOwner()})])
      assert.equal((await rows('select id from public.properties where id=$1',[id(72)])).length,0)
      assert.equal((await rows('select id from public.advisor_owners where id=$1',[id(40)])).length,0)
      await createOwnerProperty(72,{owner_contact_id:id(80),pending_owner:null},'pending',images)
      await actor(null)
      await db.exec(`create function qrih_private.synthetic_owner_failure() returns trigger language plpgsql as $$begin if new.owner_contact_id='${id(41)}' then raise exception 'Synthetic association failure';end if;return new;end$$;
        create trigger synthetic_owner_failure before update on public.property_private_details for each row execute function qrih_private.synthetic_owner_failure();`)
      await actor(A)
      await denied('select public.qrih_create_property_with_owner($1,$2::jsonb,$3::jsonb,$4::jsonb,\'pending\',true)',
        [id(73),JSON.stringify({...commercial,slug:'association-rollback'}),JSON.stringify(images),JSON.stringify({pending_owner:{...pendingOwner(41),name:'Different synthetic'}})])
      assert.equal((await rows('select id from public.properties where id=$1',[id(73)])).length,0)
      assert.equal((await rows('select id from public.advisor_owners where id=$1',[id(41)])).length,0)
      await rows('set constraints all immediate')
    })
    await check('edit draft retains pending; duplicate retains own pending/association and source; review retry and foreign IDs',async()=>{
      const images=await ownerImage();await createOwnerProperty(74,{pending_owner:pendingOwner(),owner_contact_id:null})
      const original=(await rows('select to_jsonb(p) value from public.properties p where id=$1',[id(74)]))[0].value
      const changes={...commercial,status:'draft'};delete changes.slug
      const copy=(await rows("select public.qrih_save_property_with_owner('duplicate',$1,$2,null,$3::jsonb,$4::jsonb,$5::jsonb) id",[id(74),id(85),JSON.stringify(changes),'[]',JSON.stringify({pending_owner:pendingOwner(),owner_contact_id:null})]))[0].id
      assert.notEqual(copy,id(74));assert.deepEqual((await rows('select to_jsonb(p) value from public.properties p where id=$1',[id(74)]))[0].value,original)
      assert.deepEqual((await rows('select pending_owner from public.property_private_details where property_id=$1',[copy]))[0].pending_owner,pendingOwner())
      await rows("select public.qrih_save_property_with_owner('update',$1,null,$2,$3::jsonb,$4::jsonb,$5::jsonb)",[id(74),original.updated_at,JSON.stringify({...changes,status:'pending'}),JSON.stringify(images),JSON.stringify({pending_owner:pendingOwner(),owner_contact_id:null})])
      await denied("select public.qrih_save_property_with_owner('update',$1,null,$2,$3::jsonb,$4::jsonb,$5::jsonb)",[id(74),original.updated_at,JSON.stringify({...changes,status:'pending'}),JSON.stringify(images),JSON.stringify({pending_owner:pendingOwner()})])
      assert.equal((await rows('select count(*)::int n from public.advisor_owners where id=$1',[id(40)]))[0].n,1)
      await actor(B);await denied('select public.qrih_set_property_private_details($1,$2::jsonb)',[PB,JSON.stringify({owner_contact_id:id(40),pending_owner:null})])
      await actor(A);await rows('set constraints all immediate')
    })
    await check('legacy direct review cannot commit an unresolved pending owner',async()=>{
      await actor(A);await createOwnerProperty(75,{pending_owner:pendingOwner()})
      await rows('savepoint legacy_transition')
      await rows("update public.properties set status='pending',publication_authorized_at=now(),terms_accepted_at=now() where id=$1",[id(75)])
      await assert.rejects(rows('set constraints all immediate'))
      await rows('rollback to savepoint legacy_transition')
      assert.equal((await rows('select status from public.properties where id=$1',[id(75)]))[0].status,'draft')
    })
    await check('one urgency; exact 168 hours; repeat activate does not renew; explicit renew/remove',async()=>{
      await actor(A);const first=(await urgency(D))[0].value
      assert.equal(Date.parse(first.expires_at)-Date.parse(first.activated_at),168*3600000)
      assert.equal((await urgency(D))[0].value.expires_at,first.expires_at)
      await deniedUrgency(D2);await deniedUrgency(DB)
      const renewed=(await urgency(D,'renew'))[0].value;assert.ok(Date.parse(renewed.expires_at)>=Date.parse(first.expires_at))
      await urgency(D,'remove');await urgency(D2);assert.equal((await rows('select demand_request_id from public.demand_urgencies'))[0].demand_request_id,D2)
      await denied('insert into public.demand_urgencies(user_id,demand_request_id,activated_at,expires_at) values($1,$2,now(),now()+interval \'168 hours\')',[A,D])
    })
    await check('expired urgency frees slot without closing request; closed/old/foreign/suspended reject',async()=>{
      await actor(A);await urgency(D)
      await actor(null);await rows("update public.demand_urgencies set activated_at=now()-interval '8 days',expires_at=now()-interval '1 day'")
      await actor(A);await urgency(D2)
      await actor(null);await rows("update public.demand_requests set status='closed' where id=$1",[D])
      await actor(A);await deniedUrgency(D,'renew');await urgency(D2,'remove')
      await actor(null);await rows("update public.demand_requests set created_at=now()-interval '46 days' where id=$1",[D2])
      await actor(A);await deniedUrgency(D2)
      await actor(SUSP);await deniedUrgency(D)
      await actor(null);assert.equal((await rows('select status from public.demand_requests where id=$1',[D2]))[0].status,'new')
    })
    await check('serialization uses per-user transaction lock and unique invariant',async()=>{
      const definition=(await rows("select pg_get_functiondef('qrih_private.change_demand_urgency(uuid,text)'::regprocedure) source"))[0].source
      assert.match(definition,/pg_advisory_xact_lock/);assert.ok(definition.indexOf('pg_advisory_xact_lock')<definition.indexOf('v_now:=clock_timestamp'))
      await actor(A);await urgency(D);await deniedUrgency(D2)
      assert.equal((await rows('select count(*)::int n from public.demand_urgencies where user_id=$1',[A]))[0].n,1)
    })
    await check('matching feed prioritizes live urgency, removes expired flag and never adds PII or extra eligibility',async()=>{
      await rows("update public.properties set status='published',publication_authorized_at=now(),terms_accepted_at=now(),last_verified_at=now() where id=$1",[P])
      await rows("update public.demand_requests set created_at=now()-interval '1 day' where id=$1",[D2])
      await actor(A);await urgency(D2)
      const feed=(await rows('select public.qrih_opportunity_feed() value'))[0].value
      assert.equal(feed[0].id,D2);assert.ok(feed[0].urgency_expires_at)
      for(const demand of feed) for(const key of ['name','company','phone','email','user_id','internal_name','owner_contact_id'])assert.ok(!(key in demand))
      await actor(B);assert.deepEqual((await rows('select public.qrih_opportunity_feed() value'))[0].value,[])
      await actor(null);await rows("update public.demand_urgencies set activated_at=now()-interval '8 days',expires_at=now()-interval '1 day'")
      await actor(A);const expired=(await rows('select public.qrih_opportunity_feed() value'))[0].value
      assert.notEqual(expired[0].id,D2);assert.equal(expired.find(demand=>demand.id===D2).urgency_expires_at,null)
    })
  } finally {await db.close()}
})
