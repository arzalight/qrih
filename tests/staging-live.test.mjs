import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import sharp from 'sharp'
import {captureAuthBaseline,verifyAuthBaseline} from './staging-fixture-guard.mjs'

// Opt-in exclusivo del staging aislado. Auth vacío por defecto; una cuenta previa
// sólo con preservación explícita/baseline. Claves, passwords y JWT sólo en memoria.
if (process.env.QRIH_LIVE_STAGING_TEST !== '1') {
  console.log('Staging HTTP autenticado: omitido (requiere opt-in explícito).')
  process.exit(0)
}
const url='https://mcyxunymhuxyiwklyfpy.supabase.co'
const origin='https://qrih-staging.netlify.app'
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL,url,'Sólo staging aislado')
assert.ok(process.env.NETLIFY,'Sólo dentro de Netlify, nunca copiar la clave localmente')
assert.ok(process.env.QRIH_LIVE_RUN_ID,'Se requiere un ID único para una sola ejecución')
const pub=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const svc=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}})
const anon=createClient(url,pub,{auth:{persistSession:false,autoRefreshToken:false}})
const actors=[], paths=[], results=[]
let propertyId, baseline, step='preflight'
const runId=randomUUID()
const slug=`aud002-${runId}`
const ok=(value,label)=>{assert.ok(value,label);results.push(label);console.log(`STAGING PASS: ${label}`)}
const checked=async(promise,label)=>{step=label;const result=await promise;if(result.error)console.error(`STAGING ERROR CODE: ${result.error.code||result.error.status||'unknown'}`);assert.ok(!result.error,label);return result.data}
const request=(path,actor,init={})=>fetch(origin+path,{...init,redirect:'manual',headers:{Origin:origin,...(actor?{Cookie:actor.cookies.map(c=>`${c.name}=${c.value}`).join('; ')}:{}),...init.headers}})
try {
  baseline=await captureAuthBaseline(svc)
  const existing=await svc.from('properties').select('id',{count:'exact',head:true})
  assert.ok(!existing.error && existing.count===0,'Se requiere staging sin propiedades previas')
  // Marca privada no personal: el mismo paquete nunca ejecuta sus mutaciones dos veces.
  await checked(svc.from('qrih_rate_windows').insert({subject:`one-shot:${process.env.QRIH_LIVE_RUN_ID}`,action:'staging-test',window_start:'2099-01-01T00:00:00Z',hits:1}),'Claim single-use run')
  for(const role of ['publisher','publisher','admin']){
    const email=`qrih-${runId}-${actors.length}@example.invalid`, password=`Qrih-${randomUUID()}!`
    const created=await checked(svc.auth.admin.createUser({email,password,email_confirm:true}),'Create synthetic account')
    const actor={id:created.user.id,cookies:[],jwt:null,client:null}
    actors.push(actor)
    await checked(svc.from('profiles').insert({id:actor.id,full_name:`QRIH synthetic ${actors.length}`,role,user_type:'advisor'}),'Create synthetic profile')
    actor.client=createServerClient(url,pub,{auth:{autoRefreshToken:false},cookies:{getAll:()=>actor.cookies,setAll:values=>{for(const item of values){const index=actor.cookies.findIndex(c=>c.name===item.name);if(index<0)actor.cookies.push(item);else actor.cookies[index]=item}}}})
    const login=await checked(actor.client.auth.signInWithPassword({email,password}),'Real Auth password login')
    actor.jwt=login.session.access_token
  }
  const [a,b,admin]=actors
  ok(actors.every(a=>a.cookies.length>0),'Real Auth JWT and SSR cookies')
  const property=await checked(a.client.from('properties').insert({owner_id:a.id,slug,title:'QRIH synthetic security test',operation:'Renta',zone:'Synthetic zone',price_display:'100',status:'draft',address:'SYNTHETIC PRIVATE ADDRESS'}).select('id,updated_at').single(),'Owner draft insert')
  propertyId=property.id
  for(let index=0;index<7;index++){
    const bytes=await sharp({create:{width:64,height:64,channels:3,background:{r:30+index*20,g:50,b:100}}}).webp().toBuffer()
    const form=new FormData();form.set('kind','property');form.set('image',new Blob([bytes],{type:'image/webp'}),`synthetic-${index}.webp`)
    step='Netlify image upload'
    const response=await request('/api/imagenes',a,{method:'POST',body:form})
    if(response.status!==200){
      console.error(`STAGING UPLOAD HTTP STATUS: ${response.status}`)
      const quota=await svc.rpc('qrih_take_server_limit',{p_subject:a.id,p_action:'media'})
      console.log(`STAGING DIAGNOSTIC: build service quota ${!quota.error&&quota.data?'PASS':'FAIL'}`)
      const probePath=`${a.id}/${randomUUID()}.webp`
      const probe=await svc.storage.from('property-images').upload(probePath,bytes,{contentType:'image/webp',upsert:false})
      console.log(`STAGING DIAGNOSTIC: build service storage ${!probe.error?'PASS':'FAIL'}`)
      if(!probe.error)await svc.storage.from('property-images').remove([probePath])
    }
    assert.equal(response.status,200,'Real upload route')
    const data=await response.json()
    assert.ok(data.path?.startsWith(a.id+'/') && data.path.endsWith('.webp'),'Server owner WebP path')
    paths.push(data.path)
  }
  ok(paths.length===7,'Seven uploads through Netlify: WebP, owner paths, provenance')
  const images=paths.map(storage_path=>({storage_path,title:'Synthetic photo'}))
  await checked(a.client.rpc('qrih_update_property_with_images',{p_property_id:propertyId,p_expected_updated_at:property.updated_at,p_changes:{status:'draft'},p_images:images}),'Atomic draft gallery')
  ok((await anon.rpc('qrih_authorized_image_paths',{p_paths:paths})).data?.length===0,'Anonymous cannot authorize draft paths')
  ok((await b.client.rpc('qrih_authorized_image_paths',{p_paths:paths})).data?.length===0,'Owner B cannot authorize owner A draft paths')
  ok((await a.client.rpc('qrih_authorized_image_paths',{p_paths:paths})).data?.length===7,'Owner A can authorize own draft gallery')
  ok((await admin.client.rpc('qrih_authorized_image_paths',{p_paths:paths})).data?.length===7,'Active administrator can authorize draft gallery')
  ok(Boolean((await a.client.storage.from('property-images').createSignedUrl(paths[0],3600)).error),'Native arbitrary signing denied to authenticated owner')
  ok(Boolean((await a.client.rpc('replace_property_images',{p_property_id:propertyId,p_images:[...images,images[0]]})).error),'Eighth gallery entry rejected atomically')
  const invalid=new FormData();invalid.set('kind','property');invalid.set('image',new Blob(['not-a-webp'],{type:'image/webp'}),'fake.webp')
  ok((await request('/api/imagenes',a,{method:'POST',body:invalid})).status===400,'Corrupt WebP rejected through real HTTP')
  const refreshed=await checked(a.client.from('properties').select('updated_at').eq('id',propertyId).single(),'Read draft version')
  await checked(a.client.rpc('qrih_update_property_with_images',{p_property_id:propertyId,p_expected_updated_at:refreshed.updated_at,p_changes:{status:'pending'},p_images:images}),'Submit pending')
  ok((await request(`/bodegas/${slug}`)).status===404,'Pending ficha hidden from public')
  await checked(admin.client.rpc('qrih_moderate_property',{p_property_id:propertyId,p_action:'publish'}),'Admin publish')
  const response=await request(`/bodegas/${slug}`)
  assert.equal(response.status,200,'Published ficha HTTP')
  const html=await response.text()
  ok(!html.includes('SYNTHETIC PRIVATE ADDRESS'),'Published ficha masks private address')
  const signed=html.match(/https:\/\/mcyxunymhuxyiwklyfpy\.supabase\.co\/storage\/v1\/object\/sign\/property-images\/[^"\s<>\\]+/g)||[]
  ok(signed.length>=7,'Published ficha and gallery contain ephemeral signed URLs')
  const first=signed[0].replaceAll('&amp;','&')
  ok((await fetch(first)).status===200,'Real signed Storage object downloads')
  ok((await fetch(`${url}/storage/v1/object/public/property-images/${paths[0]}`)).status!==200,'Old public Storage endpoint denied for an existing object')
  const pdf=await request(`/api/bodegas/${slug}/pdf`)
  assert.equal(pdf.status,200,'Real Netlify PDF HTTP')
  const pdfBytes=Buffer.from(await pdf.arrayBuffer())
  ok(pdfBytes.subarray(0,4).toString()==='%PDF' && (pdfBytes.toString('latin1').match(/\/Subtype\s*\/Image/g)||[]).length>=7,'Real PDF embeds seven different WebP photographs')
  for(const status of ['draft','pending','rejected','paused','expired','pending_update']){
    await checked(svc.from('properties').update({status}).eq('id',propertyId),'Set synthetic property status')
    ok((await request(`/bodegas/${slug}`)).status===404 && (await anon.rpc('qrih_authorized_image_paths',{p_paths:paths})).data?.length===0,`${status}: public ficha and path authorization denied`)
  }
  await checked(svc.from('properties').update({status:'published'}).eq('id',propertyId),'Restore synthetic published')
  await checked(svc.from('profiles').update({account_status:'suspended'}).eq('id',a.id),'Suspend synthetic owner')
  ok((await request(`/bodegas/${slug}`)).status===404,'Suspended owner: published ficha hidden publicly')
  ok((await request('/api/imagenes',a,{method:'POST',body:invalid})).status===403,'Suspended owner: uploads denied despite existing JWT')
  ok((await fetch(first)).status===200,'Already-issued signed URL remains valid until TTL (documented limitation)')
}catch{
  console.error(`STAGING FAIL AT: ${step}; no secrets logged.`)
  process.exitCode=1
}finally{
  let clean=true
  if(propertyId && actors[0]){
    const restore=await svc.from('profiles').update({account_status:'active'}).eq('id',actors[0].id);clean&&=!restore.error
    const deleted=await actors[0].client.rpc('qrih_delete_own_property',{p_property_id:propertyId});clean&&=!deleted.error
  }
  if(paths.length){
    const removed=await svc.storage.from('property-images').remove(paths);clean&&=!removed.error
    const proofs=await svc.from('qrih_verified_uploads').delete().in('storage_path',paths);clean&&=!proofs.error
  }
  for(const actor of actors){
    if(actor.jwt) await svc.auth.admin.signOut(actor.jwt,'global')
    const rates=await svc.from('qrih_rate_windows').delete().eq('subject',actor.id);clean&&=!rates.error
    // Conservar bitácora sintética sin bloquear la retirada de estas cuentas de prueba.
    const audit=await svc.from('audit_logs').update({actor_id:null}).eq('actor_id',actor.id);clean&&=!audit.error
    const deleted=await svc.auth.admin.deleteUser(actor.id);clean&&=!deleted.error
  }
  if(baseline) {
    try {await verifyAuthBaseline(svc,baseline);console.log('STAGING BASELINE: prior Auth/profile unchanged')}
    catch {clean=false;console.error('STAGING BASELINE: FAIL; no personal details logged')}
  }
  console.log(`STAGING CLEANUP: ${clean?'PASS':'FAIL'} (only this run accounts/property/objects)`)
  if(!clean)process.exitCode=1
  console.log(`STAGING SUMMARY: ${results.length} passed checks; email confirmation, expiry waiting, contacts and mobile not covered.`)
}
