import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {createClient} from '@supabase/supabase-js'
import {createServerClient} from '@supabase/ssr'
import sharp from 'sharp'
import {captureAuthBaseline,verifyAuthBaseline} from './staging-fixture-guard.mjs'

// Opt-in de una sola ejecución, exclusivamente en staging aislado y Netlify.
// Auth vacío por defecto; cuenta previa sólo con preservación explícita y baseline.
// Nunca copiar claves, JWT, imágenes reales ni información personal a los logs.
if(process.env.QRIH_LIVE_STAGING_TEST !== '1') {
  console.log('Upload staging: skipped (explicit opt-in required).')
  process.exit(0)
}
const url='https://mcyxunymhuxyiwklyfpy.supabase.co',origin='https://qrih-staging.netlify.app'
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL,url)
assert.ok(process.env.NETLIFY && process.env.QRIH_LIVE_RUN_ID)
const svc=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}})
const actors=[],properties=[],objects=[]
let step='preflight',failed=false,passed=0,baseline
async function checked(promise,label) {
  step=label
  const result=await promise
  assert.ok(!result.error,label)
  return result.data
}
try {
  baseline=await captureAuthBaseline(svc)
  const before=await svc.from('properties').select('id',{count:'exact',head:true})
  assert.ok(!before.error && before.count===0)
  await checked(svc.from('qrih_rate_windows').insert({subject:`one-shot:${process.env.QRIH_LIVE_RUN_ID}`,action:'upload-test',window_start:'2099-01-01T00:00:00Z',hits:1}),'Single use')
  const run=randomUUID(),email=`qrih-upload-${run}@example.invalid`,password=`Synthetic-${randomUUID()}!`
  const account=await checked(svc.auth.admin.createUser({email,password,email_confirm:true}),'Synthetic Auth')
  const actor={id:account.user.id,cookies:[],jwt:null}
  actors.push(actor)
  await checked(svc.from('profiles').insert({id:actor.id,full_name:'Synthetic upload',role:'publisher',user_type:'advisor'}),'Synthetic profile')
  actor.client=createServerClient(url,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{auth:{autoRefreshToken:false},cookies:{getAll:()=>actor.cookies,setAll:values=>{for(const c of values){const i=actor.cookies.findIndex(x=>x.name===c.name);if(i<0)actor.cookies.push(c);else actor.cookies[i]=c}}}})
  const login=await checked(actor.client.auth.signInWithPassword({email,password}),'Real login')
  actor.jwt=login.session.access_token
  const bytes=await sharp({create:{width:80,height:60,channels:3,background:'#336699'}}).webp().toBuffer()
  for(const phase of ['before_draft','after_draft']) {
    if(phase==='after_draft') {
      const property=await checked(actor.client.from('properties').insert({owner_id:actor.id,slug:`upload-${run}`,title:'Synthetic upload',operation:'Renta',zone:'Synthetic',price_display:'100',status:'draft'}).select('id').single(),'Draft')
      properties.push(property.id)
    }
    for(const kind of ['property','avatar']) {
      step=`${phase}_${kind}`
      const form=new FormData();form.set('kind',kind);form.set('image',new Blob([bytes],{type:'image/webp'}),'synthetic.webp')
      const response=await fetch(origin+'/api/imagenes',{method:'POST',redirect:'manual',signal:AbortSignal.timeout(60000),headers:{Origin:origin,Cookie:actor.cookies.map(c=>`${c.name}=${c.value}`).join('; ')},body:form})
      console.log(`UPLOAD HTTP: ${phase} ${kind} ${response.status}`)
      if(response.status!==200){failed=true;continue}
      const result=await response.json()
      assert.ok(result.path.startsWith(actor.id+'/') && result.path.endsWith('.webp'))
      objects.push({bucket:kind==='property'?'property-images':'profile-images',path:result.path})
      assert.equal(kind==='property'?result.publicUrl===null:typeof result.publicUrl==='string',true)
      const proof=await checked(svc.from('qrih_verified_uploads').select('owner_id,mime_type').eq('storage_path',result.path).single(),'Provenance')
      assert.ok(proof.owner_id===actor.id && proof.mime_type==='image/webp')
      passed++
    }
  }
  if(failed)process.exitCode=1
} catch {
  console.error(`UPLOAD FAIL AT: ${step}; details omitted.`)
  process.exitCode=1
} finally {
  let clean=true
  for(const id of properties) {
    const result=await actors[0].client.rpc('qrih_delete_own_property',{p_property_id:id});clean&&=!result.error
  }
  for(const bucket of ['property-images','profile-images']) {
    const paths=objects.filter(x=>x.bucket===bucket).map(x=>x.path)
    if(paths.length) {
      const removed=await svc.storage.from(bucket).remove(paths);clean&&=!removed.error
      const proof=await svc.from('qrih_verified_uploads').delete().eq('bucket_id',bucket).in('storage_path',paths);clean&&=!proof.error
    }
  }
  for(const actor of actors) {
    if(actor.jwt)await svc.auth.admin.signOut(actor.jwt,'global')
    const rates=await svc.from('qrih_rate_windows').delete().eq('subject',actor.id);clean&&=!rates.error
    const audits=await svc.from('audit_logs').update({actor_id:null}).eq('actor_id',actor.id);clean&&=!audits.error
    const removed=await svc.auth.admin.deleteUser(actor.id);clean&&=!removed.error
  }
  if(baseline) {
    try {await verifyAuthBaseline(svc,baseline);console.log('UPLOAD BASELINE: prior Auth/profile unchanged')}
    catch {clean=false;console.error('UPLOAD BASELINE: FAIL; no personal details logged')}
  }
  console.log(`UPLOAD CLEANUP: ${clean?'PASS':'FAIL'} (only this run synthetic IDs)`)
  console.log(`UPLOAD SUMMARY: ${passed}/4 uploads passed; no email delivery tested.`)
  if(!clean)process.exitCode=1
}
