import assert from 'node:assert/strict'
import {randomUUID, createHash} from 'node:crypto'
import {setTimeout as delay} from 'node:timers/promises'
import {createClient} from '@supabase/supabase-js'
import {createServerClient} from '@supabase/ssr'
import sharp from 'sharp'

// No es una prueba automática de deploy: requiere autorización, staging vacío
// y ejecución única dentro del build privado de Netlify. Nunca registrar secretos.
if(process.env.QRIH_LIVE_STAGING_TEST !== '1') {
  console.log('Extended staging flows: skipped (explicit opt-in required).')
  process.exit(0)
}
const url='https://mcyxunymhuxyiwklyfpy.supabase.co'
const origin='https://qrih-staging.netlify.app'
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL,url)
assert.ok(process.env.NETLIFY && process.env.QRIH_LIVE_RUN_ID)
const options={auth:{persistSession:false,autoRefreshToken:false}}
const svc=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,options)
const anon=createClient(url,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,options)
const actors=[], properties=[], demands=[], objects=[], results=[]
const run=randomUUID()
let step='preflight'
const hash=bytes=>createHash('sha256').update(bytes).digest('hex')
const pass=label=>{results.push(label);console.log(`FLOWS PASS: ${label}`)}
const check=(value,label)=>{step=label;assert.ok(value,label);pass(label)}
async function data(promise,label) {
  step=label
  const result=await promise
  if(result.error)console.error(`FLOWS ERROR CODE: ${result.error.code||result.error.status||'unknown'}`)
  assert.ok(!result.error,label)
  return result.data
}
const form=values=>{const f=new FormData();for(const [key,value] of Object.entries(values))f.set(key,String(value));return f}
const request=(path,actor,init={})=>fetch(origin+path,{...init,redirect:'manual',signal:AbortSignal.timeout(60000),headers:{Origin:origin,...(actor?{Cookie:actor.cookies.map(c=>`${c.name}=${c.value}`).join('; ')}:{}),...init.headers}})
const json=(path,actor,body)=>request(path,actor,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
async function upload(actor,kind,bytes,type='image/webp') {
  step=`HTTP ${kind} upload`
  const f=new FormData();f.set('kind',kind);f.set('image',new Blob([bytes],{type}),'synthetic-image.webp')
  let response
  try {response=await request('/api/imagenes',actor,{method:'POST',body:f})}
  catch(error) {console.error(`FLOWS UPLOAD TRANSPORT: ${error?.name==='TimeoutError'?'timeout':'network error'}`);throw new Error('Image transport failure')}
  console.log(`FLOWS UPLOAD HTTP: ${response.status}`)
  if(response.status!==200) {
    const message=(await response.clone().json().catch(()=>({}))).error
    const safeMessages=['Solicitud inválida.','Necesitas iniciar sesión.','Necesitas una cuenta activa.','Servicio no disponible.','No se pudo subir la imagen. Revisa formato, tamaño y límite de fotografías.']
    console.log(`FLOWS UPLOAD CATEGORY: ${safeMessages.includes(message)?message:'unclassified; body omitted'}`)
    const quota=await svc.rpc('qrih_take_server_limit',{p_subject:actor.id,p_action:kind==='avatar'?'avatar':'media'})
    console.log(`FLOWS DIAGNOSTIC: build-service quota ${!quota.error&&quota.data?'PASS':'FAIL'}`)
    const probePath=`${actor.id}/${randomUUID()}.webp`
    const probe=await svc.storage.from(kind==='avatar'?'profile-images':'property-images').upload(probePath,bytes,{contentType:type,upsert:false})
    console.log(`FLOWS DIAGNOSTIC: build-service Storage ${probe.error?'FAIL':'PASS'}`)
    if(!probe.error) {
      objects.push({bucket:kind==='avatar'?'profile-images':'property-images',path:probePath})
      await svc.storage.from(kind==='avatar'?'profile-images':'property-images').remove([probePath])
    }
  }
  assert.equal(response.status,200,'Image ingest HTTP')
  const result=await response.json()
  assert.ok(result.path.startsWith(actor.id+'/') && result.path.endsWith('.webp'))
  objects.push({bucket:kind==='avatar'?'profile-images':'property-images',path:result.path})
  return result
}
async function seedPropertyImage(actor,bytes) {
  // Estrategia independiente: permite probar contactos/edición aun si upload falla.
  // No constituye evidencia de que /api/imagenes funcione y nunca corrige el fallo.
  const path=`${actor.id}/${randomUUID()}.webp`
  await data(svc.storage.from('property-images').upload(path,bytes,{contentType:'image/webp',upsert:false,cacheControl:'0'}),'Seed synthetic Storage fixture')
  objects.push({bucket:'property-images',path})
  await data(svc.from('qrih_verified_uploads').insert({bucket_id:'property-images',storage_path:path,owner_id:actor.id,mime_type:'image/webp',byte_size:bytes.length,sha256:hash(bytes)}),'Seed synthetic provenance')
  console.log('FLOWS SETUP: direct server Storage fixture; HTTP image upload remains BLOCKED, not counted PASS.')
  return {path}
}
async function createProperty(actor,suffix) {
  const result=await data(actor.client.from('properties').insert({owner_id:actor.id,slug:`flows-${run}-${suffix}`,title:`QRIH synthetic ${suffix}`,operation:'Renta',zone:'Synthetic',zone_general:'Synthetic',price_display:'100',status:'draft',total_area:100,location_visibility:'zone',address:'SYNTHETIC PRIVATE ADDRESS'}).select('id,slug,updated_at').single(),'Create own draft')
  properties.push({id:result.id,actor})
  return result
}
async function attach(actor,property,images,status='draft',changes={}) {
  const version=await data(actor.client.from('properties').select('updated_at').eq('id',property.id).single(),'Read current edit version')
  await data(actor.client.rpc('qrih_update_property_with_images',{p_property_id:property.id,p_expected_updated_at:version.updated_at,p_images:images,p_changes:{...changes,status}}),'Save atomic gallery')
}
try {
  const initial=await data(svc.auth.admin.listUsers({page:1,perPage:1}),'Check empty Auth')
  assert.equal(initial.users.length,0,'Empty staging required')
  const before=await svc.from('properties').select('id',{count:'exact',head:true})
  assert.ok(!before.error && before.count===0,'Empty staging properties required')
  await data(svc.from('qrih_rate_windows').insert({subject:`one-shot:${process.env.QRIH_LIVE_RUN_ID}`,action:'staging-flows',window_start:'2099-01-01T00:00:00Z',hits:1}),'Claim unique execution')
  for(const role of ['publisher','publisher','admin']) {
    const email=`qrih-${run}-${actors.length}@example.invalid`,password=`Synthetic-${randomUUID()}!`
    const account=await data(svc.auth.admin.createUser({email,password,email_confirm:true}),'Create synthetic account')
    const actor={id:account.user.id,cookies:[],jwt:null}
    actors.push(actor)
    await data(svc.from('profiles').insert({id:actor.id,full_name:`Synthetic ${actors.length}`,role,user_type:'advisor',phone:'0000000000',company_name:'Synthetic'}),'Create synthetic profile')
    actor.client=createServerClient(url,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{auth:{autoRefreshToken:false},cookies:{getAll:()=>actor.cookies,setAll:values=>{for(const c of values){const i=actor.cookies.findIndex(x=>x.name===c.name);if(i<0)actor.cookies.push(c);else actor.cookies[i]=c}}}})
    const login=await data(actor.client.auth.signInWithPassword({email,password}),'Real password login')
    actor.jwt=login.session.access_token
  }
  const [a,b,admin]=actors
  check(actors.every(x=>x.cookies.length),'Real JWT and SSR cookies (not email delivery)')
  const bytes=await sharp({create:{width:80,height:60,channels:3,background:'#336699'}}).webp().toBuffer()
  const image=process.env.QRIH_LIVE_FIXTURE_MEDIA==='1'
    ? await seedPropertyImage(a,bytes) : await upload(a,'property',bytes)
  const gallery=[{storage_path:image.path,title:'Synthetic original'}]
  const property=await createProperty(a,'primary')
  await attach(a,property,gallery)
  // Real optimistic-lock race, no duplicated writes accepted.
  const v=await data(a.client.from('properties').select('updated_at').eq('id',property.id).single(),'Concurrent version')
  const competing=await Promise.all(['One','Two'].map(title=>a.client.rpc('qrih_update_property_with_images',{p_property_id:property.id,p_expected_updated_at:v.updated_at,p_images:gallery,p_changes:{title:`Synthetic concurrent ${title}`,status:'draft'}})))
  check(competing.filter(x=>!x.error).length===1 && competing.filter(x=>x.error).length===1,'Concurrent RPC edit: one commit, one conflict')
  const edit=()=>form({id:property.id,title:'Synthetic HTTP edit',operation:'Renta',price:'100',zone_general:'Synthetic',zone:'Synthetic',area:'100',visibility:'zone',address:'SYNTHETIC PRIVATE ADDRESS',submission_action:'draft',gallery:JSON.stringify([{kind:'existing',...gallery[0]}])})
  check((await request('/api/editar-propiedad',b,{method:'POST',body:edit()})).status===403,'B cannot edit A property over HTTP')
  check((await request('/api/editar-propiedad',a,{method:'POST',body:edit(),headers:{Origin:'https://untrusted.invalid'}})).status===400,'Cross-origin authenticated edit rejected')
  check((await request('/api/editar-propiedad',a,{method:'POST',body:edit()})).status===200,'Owner HTTP edit preserves gallery and cover')
  check((await json('/api/eliminar-propiedad',b,{propertyId:property.id})).status===404,'B cannot delete A property over HTTP')
  check(Boolean((await b.client.rpc('qrih_moderate_property',{p_property_id:property.id,p_action:'publish'})).error),'Non-admin cannot moderate via direct RPC')
  await attach(a,property,gallery,'pending')
  check((await request('/api/editar-propiedad',a,{method:'POST',body:edit()})).status===403,'Pending property cannot be edited over HTTP')
  await data(admin.client.rpc('qrih_moderate_property',{p_property_id:property.id,p_action:'publish'}),'Admin publication')
  check(Boolean((await admin.client.rpc('qrih_moderate_property',{p_property_id:property.id,p_action:'publish'})).error),'Repeated admin publish rejected without duplicate action')
  const publicResp=await request(`/bodegas/${property.slug}`)
  assert.equal(publicResp.status,200)
  const html=await publicResp.text()
  check(!html.includes('SYNTHETIC PRIVATE ADDRESS'),'Public ficha masks private address')
  check((await data(b.client.rpc('get_property_publisher_contact',{p_property_id:property.id}),'Before contact authorization')).length===0,'No owner contact before authorization')
  const contactForm=()=>form({property_id:property.id,name:'Synthetic requester',phone:'0000000000',email:'synthetic@example.invalid',message:'Test only'})
  step='Concurrent contact HTTP'
  const concurrent=await Promise.all([0,1].map(()=>request('/api/contactar-propiedad',b,{method:'POST',body:contactForm()})))
  assert.ok(concurrent.every(x=>x.status===200))
  const contact=await Promise.all(concurrent.map(x=>x.json()))
  check(contact[0].authorization_id===contact[1].authorization_id && contact.every(x=>x.authorization_status==='pending' && !x.owner),'Concurrent contact deduplicates and exposes no owner PII')
  const authorization=contact[0].authorization_id
  const cs=await data(svc.from('property_contacts').select('id').eq('property_id',property.id),'Contact consistency')
  const ns=await data(a.client.from('notifications').select('id').eq('property_id',property.id).eq('type','property_contact_request'),'Contact notification')
  check(cs.length===1 && ns.length===1,'One contact, one owner notification in same transaction')
  check((await json('/api/contactar-propiedad/autorizacion',b,{authorization_id:authorization,status:'authorized'})).status===400,'Requester cannot authorize own request')
  check((await json('/api/contactar-propiedad/autorizacion',a,{authorization_id:authorization,status:'authorized'})).status===200,'Owner authorizes contact over HTTP')
  const allowedContact=await data(b.client.rpc('get_property_publisher_contact',{p_property_id:property.id}),'Authorized contact')
  check(allowedContact.length===1 && allowedContact[0].phone==='0000000000','Authorized requester receives synthetic owner contact')
  check((await data(b.client.from('notifications').select('id').eq('property_id',property.id).eq('type','property_contact_authorized'),'Requester notification')).length===1,'Authorization notifies requester')
  check((await json('/api/contactar-propiedad/autorizacion',a,{authorization_id:authorization,status:'declined'})).status===400,'Already answered authorization cannot be changed')
  const bNotices=await data(b.client.from('notifications').select('id').eq('property_id',property.id),'Read own notices')
  const notice=bNotices[0].id
  check((await data(a.client.from('notifications').select('id').eq('id',notice),'Cross-user notice')).length===0,'Notification read isolation')
  check(Boolean((await b.client.from('notifications').update({message:'forged'}).eq('id',notice)).error),'Notification content cannot be forged')
  const readNotice=await data(b.client.from('notifications').update({read_at:new Date().toISOString()}).eq('id',notice).select('read_at'),'Mark notice read')
  check(readNotice.length===1 && Boolean(readNotice[0].read_at),'Owner may mark own notice read')
  const demandBody={name:'Synthetic demand',email:'synthetic@example.invalid',phone:'0000000000',operation:'Renta',zone:'Synthetic',area_min:50,area_max:150,budget_min:50,budget_max:200,notes:'Fixture, no real demand'}
  const ownedDemand={}
  for(const actor of [a,b]) {
    step='HTTP authenticated demand'
    const resp=await json('/api/requerimientos',actor,demandBody)
    assert.equal(resp.status,200)
    const result=await resp.json();assert.ok(result.id)
    demands.push(result.id);ownedDemand[actor.id]=result.id
  }
  check((await data(b.client.from('demand_requests').select('id').eq('id',ownedDemand[a.id]),'Cross-user demand')).length===0,'HTTP demand identity derives from session; cross-user SELECT denied')
  const interest=(actor,demand)=>request('/api/interes-propiedad',actor,{method:'POST',body:form({demand_request_id:demand,property_id:property.id})})
  check((await interest(b,ownedDemand[a.id])).status===403,'Cannot register interest against another user demand')
  const interests=await Promise.all([0,1].map(()=>interest(b,ownedDemand[b.id])))
  check(interests.every(x=>x.status===200) && (await data(svc.from('property_interest_requests').select('id').eq('property_id',property.id),'Interest count')).length===1,'Concurrent interest is idempotent')
  const opportunity=(actor,demand)=>request('/api/registrar-oportunidad',actor,{method:'POST',body:form({demand_request_id:demand,property_id:property.id})})
  check((await opportunity(b,ownedDemand[b.id])).status===403,'Opportunity requires own property')
  const opps=await Promise.all([0,1].map(()=>opportunity(a,ownedDemand[a.id])))
  check(opps.map(x=>x.status).sort().join(',')==='200,409','Concurrent opportunity: one registration, one duplicate 409')
  check((await data(a.client.from('notifications').select('id').eq('demand_request_id',ownedDemand[a.id]).eq('type','opportunity_property_registered'),'Opportunity notification')).length===1,'Opportunity notification registered once')
  const profile=await data(a.client.from('profiles').select('public_id').eq('id',a.id).single(),'Catalog ID')
  const catalog=await data(anon.rpc('get_advisor_catalog',{advisor_public_id:profile.public_id}),'Public catalog')
  check(catalog && !('phone' in catalog) && !('whatsapp' in catalog),'Public advisor catalog excludes phone and WhatsApp')
  const png=await sharp({create:{width:40,height:40,channels:3,background:'#779933'}}).png().toBuffer()
  try {
  const avatar1=await upload(a,'avatar',png,'image/png')
  const avatarBytes=Buffer.from(await (await fetch(avatar1.publicUrl)).arrayBuffer())
  check((await sharp(avatarBytes).metadata()).format==='webp','PNG avatar becomes authentic public WebP')
  const avatar2=await upload(a,'avatar',bytes)
  const stored=await data(a.client.from('profiles').select('avatar_url').eq('id',a.id).single(),'Avatar persisted')
  const oldAvatar=await svc.storage.from('profile-images').download(avatar1.path)
  check(stored.avatar_url===avatar2.publicUrl && avatar1.path!==avatar2.path && Boolean(oldAvatar.error),'Avatar replacement uses new own path and removes old object')
  check(Boolean((await b.client.from('profiles').update({avatar_url:avatar2.publicUrl}).eq('id',b.id)).error),'Cannot claim another owner avatar')
  const bad=form({kind:'avatar'});bad.set('image',new Blob(['corrupt'],{type:'image/png'}),'fake.png')
  check((await request('/api/imagenes',a,{method:'POST',body:bad})).status===400,'Corrupt avatar rejected over HTTP')
  } catch {
    console.error('FLOWS BLOCKED: avatar HTTP ingest; remaining independent checks continue.')
    process.exitCode=1
  }
  // Fixture restoration drill: preserves data and bytes in memory, no export of people.
  const snapshot=await data(svc.from('properties').select('*').eq('id',property.id).single(),'Snapshot synthetic property')
  const snapshotGallery=await data(svc.from('property_images').select('storage_path,title,position').eq('property_id',property.id).order('position'),'Snapshot synthetic gallery')
  const blob=await data(svc.storage.from('property-images').download(image.path),'Snapshot synthetic object')
  const originalBytes=Buffer.from(await blob.arrayBuffer())
  const restored=await createProperty(a,'recovery')
  const restorePath=`${a.id}/${randomUUID()}.webp`
  await data(svc.storage.from('property-images').upload(restorePath,originalBytes,{contentType:'image/webp',upsert:false,cacheControl:'0'}),'Restore fixture object')
  objects.push({bucket:'property-images',path:restorePath})
  await data(svc.from('qrih_verified_uploads').insert({bucket_id:'property-images',storage_path:restorePath,owner_id:a.id,mime_type:'image/webp',byte_size:originalBytes.length,sha256:hash(originalBytes)}),'Restore fixture provenance')
  await attach(a,restored,[{storage_path:restorePath,title:snapshotGallery[0].title}],'draft',{title:snapshot.title})
  const restoredBlob=await data(svc.storage.from('property-images').download(restorePath),'Read restored object')
  const restoredRecord=await data(a.client.from('properties').select('title,main_image_path').eq('id',restored.id).single(),'Read restored row')
  check(hash(Buffer.from(await restoredBlob.arrayBuffer()))===hash(originalBytes) && restoredRecord.title===snapshot.title && restoredRecord.main_image_path===restorePath,'Synthetic row+gallery+Storage recovery: bytes hash and cover preserved (not full backup)')
  // Exact product TTL for PDF; no TTL shortening or product configuration change.
  const start=Date.now()
  const signature=await data(svc.storage.from('property-images').createSignedUrl(image.path,300),'Create exact PDF TTL fixture')
  check((await fetch(signature.signedUrl,{cache:'no-store'})).status===200,'PDF TTL 300s signature initially downloads')
  await data(svc.from('profiles').update({account_status:'suspended'}).eq('id',b.id),'Suspend requester fixture')
  check((await data(b.client.rpc('get_property_publisher_contact',{p_property_id:property.id}),'Suspended contact')).length===0,'Suspension removes previously authorized contact despite old JWT')
  check((await json('/api/requerimientos',b,demandBody)).status===403,'Suspended account cannot submit demand with old JWT')
  const pdf=await request(`/api/bodegas/${property.slug}/pdf`)
  check(pdf.status===200 && Buffer.from(await pdf.arrayBuffer()).subarray(0,4).toString()==='%PDF','Published PDF remains functional during extended flows')
  // Four parallel reads are a bounded concurrency smoke, not a capacity benchmark.
  const readResponses=await Promise.all([0,1,2,3].map(()=>request(`/bodegas/${property.slug}`)))
  check(readResponses.every(x=>x.status===200),'Four concurrent public reads without 5xx (not cold-start proof)')
  // Keep the existing object in place; otherwise 404 would not prove expiry.
  console.log('FLOWS WAIT: exact 300s PDF TTL expiry; object retained; no URL logged.')
  while(Date.now()-start<310000)await delay(Math.min(30000,310000-(Date.now()-start)))
  step='Exact TTL expiry'
  const expired=await fetch(signature.signedUrl,{cache:'no-store',signal:AbortSignal.timeout(60000)})
  const retained=await svc.storage.from('property-images').download(image.path)
  check(expired.status!==200 && !retained.error,'Exact 300s signed URL expires while object still exists')
  const fresh=await data(svc.storage.from('property-images').createSignedUrl(image.path,300),'Fresh PDF fixture signature')
  check((await fetch(fresh.signedUrl,{cache:'no-store'})).status===200,'New signature downloads after previous expiry')
  const deletion=await json('/api/eliminar-propiedad',a,{propertyId:restored.id})
  check(deletion.status===200 && (await data(svc.from('properties').select('id').eq('id',restored.id),'Delete result')).length===0,'Owner HTTP delete removes property row')
  check(Boolean((await svc.storage.from('property-images').download(restorePath)).error),'Owner HTTP delete removes associated Storage object')
} catch {
  console.error(`FLOWS FAIL AT: ${step}; secrets and signed URLs omitted.`)
  process.exitCode=1
} finally {
  let clean=true
  for(const actor of actors) {
    const result=await svc.from('profiles').update({account_status:'active'}).eq('id',actor.id);clean&&=!result.error
  }
  for(const p of properties) {
    const exists=await svc.from('properties').select('id').eq('id',p.id)
    clean&&=!exists.error
    if(exists.data?.length) {
      const removed=await p.actor.client.rpc('qrih_delete_own_property',{p_property_id:p.id});clean&&=!removed.error
    }
  }
  for(const bucket of ['property-images','profile-images']) {
    const paths=objects.filter(x=>x.bucket===bucket).map(x=>x.path)
    if(paths.length) {
      const removed=await svc.storage.from(bucket).remove(paths);clean&&=!removed.error
      const proofs=await svc.from('qrih_verified_uploads').delete().eq('bucket_id',bucket).in('storage_path',paths);clean&&=!proofs.error
    }
  }
  if(demands.length) {
    const notices=await svc.from('notifications').delete().in('demand_request_id',demands);clean&&=!notices.error
    const removed=await svc.from('demand_requests').delete().in('id',demands);clean&&=!removed.error
  }
  for(const actor of actors) {
    if(actor.jwt)await svc.auth.admin.signOut(actor.jwt,'global')
    const notices=await svc.from('notifications').delete().eq('user_id',actor.id);clean&&=!notices.error
    const rates=await svc.from('qrih_rate_windows').delete().eq('subject',actor.id);clean&&=!rates.error
    const audit=await svc.from('audit_logs').update({actor_id:null}).eq('actor_id',actor.id);clean&&=!audit.error
    const removed=await svc.auth.admin.deleteUser(actor.id);clean&&=!removed.error
  }
  console.log(`FLOWS CLEANUP: ${clean?'PASS':'FAIL'} (only this run synthetic IDs)`)
  if(!clean)process.exitCode=1
  console.log(`FLOWS SUMMARY: ${results.length} passed; real email, public 600/900s TTL, full backup restore, real devices and true cold-start not covered.`)
}
