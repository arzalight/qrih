import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { registerHooks, createRequire } from 'node:module'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
const require=createRequire(import.meta.url)
const swc=require('next/dist/build/swc');await swc.loadBindings()
const root=fileURLToPath(new URL('../',import.meta.url))
const stub=code=>({url:'data:text/javascript,'+encodeURIComponent(code),shortCircuit:true})
registerHooks({resolve(specifier,context,nextResolve){
  if(specifier==='server-only')return stub('export {}')
  if(specifier==='@/lib/supabase-public-server')return stub('export function createPublicServerSupabaseClient(){return globalThis.__renderCatalog}')
  if(specifier==='@/lib/supabase-privileged-server')return stub('export function createPrivilegedServerSupabaseClient(){return {rpc:async()=>({data:false})}}')
  if(specifier==='next/navigation')return stub('export function notFound(){throw Error("NOT_FOUND")}')
  if(specifier==='@/lib/property-image-urls')return stub('export async function createSignedPropertyImageUrlMap(){return new Map()};export function propertyImagePaths(){return []};export const PROPERTY_IMAGE_TTL_SECONDS={gallery:600,public:600}')
  if(specifier.startsWith('@/components/'))return stub(`export function ${specifier.split('/').at(-1)}(){return null}`)
  if(specifier==='next/link')return stub('export default function Link(){return null}')
  if(specifier.startsWith('@/')){
    const base=root+specifier.slice(2);const path=existsSync(base+'.tsx')?base+'.tsx':base+'.ts'
    return nextResolve(new URL('file://'+path).href,context)
  }
  return nextResolve(specifier,context)
},load(url,context,nextLoad){
  if(url.endsWith('.tsx')){
    const path=fileURLToPath(url)
    return {format:'module',source:swc.transformSync(readFileSync(path,'utf8'),{filename:path,jsc:{parser:{syntax:'typescript',tsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'es6'}}).code,shortCircuit:true}
  }
  return nextLoad(url,context)
}})
const {default:PropertyPage,generateMetadata}=await import('../app/bodegas/[slug]/page.tsx')
const {generateMetadata:inventoryMetadata}=await import('../app/inventario/page.tsx')
const {AdminStatistics}=await import('../components/AdminStatistics.tsx')
const saved={...process.env}
after(()=>{for(const key of ['QRIH_PUBLIC_ORIGIN','QRIH_INDEXING_ENABLED','CONTEXT','URL'])if(saved[key]===undefined)delete process.env[key];else process.env[key]=saved[key]})
function fixture({error=null,property={}}={}) {
  const calls=[]
  const record={id:'p',slug:'nave-publica',title:'Nave industrial',operation:'Renta',zone:'Zona norte',total_area:500,status:'published',
    address:'SECRET_ADDRESS',location_visibility:'zone',price_currency:'MXN',price_value:100,price_unit:'m2',...property}
  globalThis.__renderCatalog={from(table){const call={table,filters:[]};calls.push(call);const q={
    select(fields){call.fields=fields;return q},eq(k,v){call.filters.push([k,v]);return q},order(){return q},
    async single(){return {data:error?null:record,error}},then(ok,no){return Promise.resolve({data:[]}).then(ok,no)},
  };return q}}
  Object.assign(process.env,{QRIH_PUBLIC_ORIGIN:'https://industrial.example.com',QRIH_INDEXING_ENABLED:'true',CONTEXT:'production',URL:'https://industrial.example.com'})
  return calls
}
test('real property SSR + metadata: public projection, useful H1, redacted address and valid JSON-LD',async()=>{
  const calls=fixture();const props={params:Promise.resolve({slug:'nave-publica'})}
  const metadata=await generateMetadata(props)
  assert.match(metadata.title,/500 m²/);assert.equal(metadata.alternates.canonical,'https://industrial.example.com/bodegas/nave-publica')
  const html=renderToStaticMarkup(await PropertyPage(props))
  assert.match(html,/<h1>Nave industrial<\/h1>/);assert.doesNotMatch(html,/SECRET_ADDRESS/)
  const json=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);assert.equal(json['@type'],'WebPage');assert.equal(json.url,metadata.alternates.canonical)
  for(const call of calls.filter(x=>x.table==='properties_public'))assert.deepEqual(call.filters,[['slug','nave-publica'],['status','published']])
})
test('real property metadata: unavailable/private/expired row -> notFound, service errors never become 404',async()=>{
  const props={params:Promise.resolve({slug:'not-public'})}
  fixture({error:{code:'PGRST116'}});await assert.rejects(generateMetadata(props),/NOT_FOUND/);await assert.rejects(PropertyPage(props),/NOT_FOUND/)
  fixture({error:{code:'503'}});await assert.rejects(generateMetadata(props),/Public property unavailable/)
})
test('real inventory metadata: filters canonicalized without indexing parameter combinations',async()=>{
  fixture();const clean=await inventoryMetadata({searchParams:Promise.resolve({})})
  assert.equal(clean.robots.index,true)
  for(const q of [{operation:'Renta'},{zone:'norte'},{utm_source:'google'}]){
    const meta=await inventoryMetadata({searchParams:Promise.resolve(q)});assert.equal(meta.robots.index,false);assert.equal(meta.alternates.canonical,clean.alternates.canonical)
  }
})
test('real statistics SSR: zero, unavailable integration, unavailable query and previous-period difference are distinct',()=>{
  const html=renderToStaticMarkup(React.createElement(AdminStatistics,{metrics:[
    {key:'published',label:'Publicadas',value:0,note:'Estado publicado'},
    {key:'users',label:'Usuarios',value:null,note:'Fuente no disponible'},
    {key:'visits',label:'Visitas',value:null,note:'Integración no disponible'},
    {key:'links',label:'Vinculaciones',value:12,previous:10,note:'Pares únicos'},
  ]}))
  assert.match(html,/>0<\/div>/);assert.match(html,/Sin datos/);assert.match(html,/No configurado/);assert.match(html,/Diferencia: \+2/)
})
