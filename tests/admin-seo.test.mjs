import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { registerHooks } from 'node:module'
import { AsyncLocalStorage } from 'node:async_hooks'
globalThis.AsyncLocalStorage ??= AsyncLocalStorage
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === 'server-only') return { url: 'data:text/javascript,export {}', shortCircuit: true }
  if (specifier === './supabase-privileged-server') return { url: 'data:text/javascript,export function createPrivilegedServerSupabaseClient(){globalThis.__privilegedCalls++;if(globalThis.__missingMetrics)throw Error("unavailable");return globalThis.__metricClient}', shortCircuit: true }
  if (specifier === '@/lib/supabase-public-server') return { url: 'data:text/javascript,export function createPublicServerSupabaseClient(){return globalThis.__catalogClient}', shortCircuit: true }
  if (specifier === '@/lib/seo') return nextResolve(new URL('../lib/seo.ts', import.meta.url).href, context)
  if (specifier === 'next/server') return nextResolve(new URL('../node_modules/next/server.js', import.meta.url).href, context)
  return nextResolve(specifier, context)
} })
const { publicOrigin, indexingEnabled, propertySeo, safeJsonLd, publicMetadata } = await import('../lib/seo.ts')
const { loadAdminMetrics, metricWindows } = await import('../lib/admin-metrics.ts')
const { default: sitemap } = await import('../app/sitemap.ts')
const { default: robots } = await import('../app/robots.ts')
const { proxy } = await import('../proxy.ts')
const { NextRequest } = await import('next/server.js')
const saved = Object.fromEntries(['QRIH_PUBLIC_ORIGIN','QRIH_INDEXING_ENABLED','CONTEXT','URL'].map(k => [k,process.env[k]]))
after(() => { for (const [k,v] of Object.entries(saved)) if (v === undefined) delete process.env[k]; else process.env[k]=v })
function production() { Object.assign(process.env, { QRIH_PUBLIC_ORIGIN:'https://industrial.example.com', QRIH_INDEXING_ENABLED:'true', CONTEXT:'production', URL:'https://industrial.example.com' }) }

test('SEO: opt-in production only, invalid domains/configuration fail closed', () => {
  production(); assert.equal(indexingEnabled(), true)
  for (const env of [{CONTEXT:'deploy-preview'}, {CONTEXT:'branch-deploy'}, {QRIH_INDEXING_ENABLED:'false'}, {URL:'https://other.example.com'}, {QRIH_PUBLIC_ORIGIN:'https://qrih-staging.netlify.app'}, {QRIH_PUBLIC_ORIGIN:'http://industrial.example.com'}, {QRIH_PUBLIC_ORIGIN:'https://user:secret@industrial.example.com'}, {QRIH_PUBLIC_ORIGIN:'https://industrial.example.com/path'}, {QRIH_PUBLIC_ORIGIN:''}]) {
    assert.equal(indexingEnabled({...process.env,...env}),false)
  }
  assert.equal(publicOrigin({QRIH_PUBLIC_ORIGIN:'https://industrial.example.com/?secret=x'}),null)
})
test('SEO: property uses public facts, omits secret/address/signed image and fictional type or municipality', () => {
  const value = propertySeo({slug:'nave',title:'Nave industrial',operation:'Renta',zone:'Zona norte',total_area:500,docks:2,
    address:'PRIVATE_ADDRESS',email:'PRIVATE_EMAIL',main_image:'SIGNED_TOKEN',description:'PRIVATE_DESCRIPTION'})
  assert.match(value.title,/500 m²/); assert.match(value.description,/Andenes: 2/)
  assert.doesNotMatch(JSON.stringify(value),/PRIVATE_|SIGNED_TOKEN|municipio/)
  assert.doesNotMatch(propertySeo({title:'Nave',operation:'Venta',total_area:null,zone:null}).description,/null|undefined|0 m²/)
  production(); const meta=publicMetadata('/bodegas/nave','Nave','Descripción');assert.equal(meta.alternates.canonical,'https://industrial.example.com/bodegas/nave');assert.equal(meta.robots.index,true)
})
test('JSON-LD: untrusted closing script cannot escape and remains valid JSON with original text', () => {
  const value={name:'</script><script>alert(1)</script>'}
  const text=safeJsonLd(value);assert.ok(!text.includes('<'));assert.deepEqual(JSON.parse(text),value)
})
test('SEO proxy: staging globally noindex; production private/forms/filtered inventory noindex without Auth on public paths', async () => {
  production()
  for(const path of ['/','/inventario','/bodegas/nave','/privacidad']) {
    const r=await proxy(new NextRequest('https://industrial.example.com'+path));assert.equal(r.headers.get('x-robots-tag'),null)
  }
  for(const path of ['/registro','/publicar','/busco-bodega','/asesor/123','/inventario?zone=norte','/api/example','/auth/callback']) {
    const r=await proxy(new NextRequest('https://industrial.example.com'+path));assert.equal(r.headers.get('x-robots-tag'),'noindex, nofollow')
  }
  assert.equal((await proxy(new NextRequest('https://immutable-deploy.example.com/'))).headers.get('x-robots-tag'),'noindex, nofollow')
  process.env.CONTEXT='branch-deploy'
  assert.equal((await proxy(new NextRequest('https://staging.example.com/'))).headers.get('x-robots-tag'),'noindex, nofollow')
  assert.deepEqual(await sitemap(),[]);assert.equal(robots().sitemap,undefined)
})
function catalog(pages) {
  const calls=[];let index=0
  globalThis.__catalogClient={from(table){assert.equal(table,'properties_public');const q={
    select(fields){assert.equal(fields,'id,slug');return q},eq(k,v){assert.equal(k,'status');assert.equal(v,'published');return q},
    order(k){assert.equal(k,'id');return q},limit(n){assert.equal(n,500);return q},gt(k,v){calls.push([k,v]);return q},
    then(ok,no){return Promise.resolve(pages[index++]).then(ok,no)},
  };return q}}
  return calls
}
test('sitemap: anonymous public projection, keyset beyond REST cap, no private URLs or expiring image signatures', async () => {
  production()
  const page=n=>Array.from({length:500},(_,i)=>({id:String(n+i).padStart(6,'0'),slug:`nave-${n+i}`}))
  const calls=catalog([{data:page(0)}, {data:page(500)}, {data:[{id:'001000',slug:'nave-1000'}]}])
  const result=await sitemap(); assert.equal(result.length,1005);assert.equal(new Set(result.map(x=>x.url)).size,1005)
  assert.deepEqual(calls,[['id','000499'],['id','000999']]);assert.equal(robots().sitemap,'https://industrial.example.com/sitemap.xml')
  assert.ok(result.every(x=>!x.url.includes('/admin')&&!x.url.includes('token')&&!x.url.includes('requerimiento')))
})
test('sitemap: unavailable source throws instead of silently publishing incomplete inventory',async()=>{
  production();catalog([{error:{message:'sensitive'}}]);await assert.rejects(sitemap(),/catalog unavailable/)
  globalThis.__catalogClient=null;await assert.rejects(sitemap(),/not configured/)
})
function actor(options={}) {
  return {auth:{async getUser(){return {data:{user:options.noUser?null:{id:'actor',is_anonymous:options.anonymous}},error:options.error}}},
    from(table){assert.equal(table,'profiles');return {select(){return this},eq(field,id){assert.equal(id,'actor');return this},async single(){return {data:options.noProfile?null:{role:options.role||'admin',account_status:options.status||'active'},error:options.profileError}}}}}
}
function metricFixture(options={}) {
  globalThis.__missingMetrics=options.missing;globalThis.__privilegedCalls=0;const calls=[]
  globalThis.__metricClient={from(table){const call={table,filters:[]};calls.push(call);const q={
    select(fields,args){assert.equal(fields,'id');assert.deepEqual(args,{count:'exact',head:true});return q},
    eq(k,v){call.filters.push(['eq',k,v]);return q},gte(k,v){call.filters.push(['gte',k,v]);return q},lt(k,v){call.filters.push(['lt',k,v]);return q},
    then(ok,no){return (options.throws?Promise.reject(Error('sensitive')):Promise.resolve(options.error?{error:{message:'sensitive'}}:{count:options.zero?0:2501})).then(ok,no)},
  };return q}}
  return calls
}
test('metrics: only real active admin, never client metadata, role editor unchanged, no privileged query for denied actors',async()=>{
  for(const option of [{noUser:true},{anonymous:true},{error:{}},{noProfile:true},{role:'publisher'},{role:'editor'},{status:'suspended'},{profileError:{}}]) {
    metricFixture();await assert.rejects(loadAdminMetrics(actor(option)),/Restricted/);assert.equal(globalThis.__privilegedCalls,0)
  }
})
test('metrics: exact HEAD count beyond row cap, one UTC boundary per request, previous windows half-open, no site visits fabricated',async()=>{
  const calls=metricFixture(),now=new Date('2026-10-27T21:00:00Z')
  const metrics=await loadAdminMetrics(actor(),now)
  assert.equal(metrics.find(m=>m.key==='users').value,2501);assert.equal(metrics.find(m=>m.key==='visits').value,null)
  assert.equal(calls.length,15);assert.ok(!calls.some(c=>c.table==='property_views'))
  const links=calls.filter(c=>c.table==='opportunity_property_registrations')
  assert.deepEqual(links[0].filters,[['gte','created_at','2026-09-27T21:00:00.000Z'],['lt','created_at','2026-10-27T21:00:00.000Z']])
  assert.deepEqual(links[1].filters,[['gte','created_at','2026-08-28T21:00:00.000Z'],['lt','created_at','2026-09-27T21:00:00.000Z']])
  assert.equal(metricWindows(now).soon,'2026-11-03T21:00:00.000Z')
})
test('metrics: errors/missing config never become zero; real empty count stays zero',async()=>{
  for(const option of [{error:true},{missing:true},{throws:true}]) {
    metricFixture(option);const metrics=await loadAdminMetrics(actor());assert.ok(metrics.every(x=>x.value===null))
  }
  metricFixture({zero:true});const metrics=await loadAdminMetrics(actor());assert.equal(metrics[0].value,0);assert.equal(metrics.find(m=>m.key==='links').previous,0)
})
