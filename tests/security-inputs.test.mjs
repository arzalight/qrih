import assert from 'node:assert/strict'
import { test } from 'node:test'
import { registerHooks } from 'node:module'
import sharp from 'sharp'
import React from 'react'
import {Document,Page,Image,renderToBuffer} from '@react-pdf/renderer'
import {captureAuthBaseline,verifyAuthBaseline} from './staging-fixture-guard.mjs'

registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier==='server-only') return {url:'data:text/javascript,export{}',shortCircuit:true}
  if (specifier==='./supabase-privileged-server') return nextResolve(new URL('./supabase-privileged-server.ts',context.parentURL).href,context)
  if (specifier==='./request-security') return nextResolve(new URL('./request-security.ts',context.parentURL).href,context)
  return nextResolve(specifier,context)
}})
const {safeInternalPath}=await import('../lib/safe-navigation.ts')
const {readJson,readForm,assertSameOrigin,validUuid}=await import('../lib/request-security.ts')
const {validateAndEncodeImage}=await import('../lib/verified-media-server.ts')
const {encodePdfImage,preparePdfImages}=await import('../lib/pdf-images-server.ts')

test('guard staging exige vacío por defecto y preserva cuenta/perfil con opt-in explícito',async()=>{
  let users=[{id:'synthetic-prior',updated_at:'initial',user_metadata:{name:'synthetic'}}]
  let profiles=[{id:'synthetic-prior',role:'publisher'}]
  const svc={auth:{admin:{listUsers:async()=>({data:{users},error:null})}},from:()=>({select:()=>({in:async()=>({data:profiles,error:null})})})}
  await assert.rejects(captureAuthBaseline(svc,false))
  const baseline=await captureAuthBaseline(svc,true)
  await verifyAuthBaseline(svc,baseline)
  users=[{...users[0],updated_at:'changed'}]
  await assert.rejects(verifyAuthBaseline(svc,baseline))
  users=[{id:'synthetic-prior',updated_at:'initial',user_metadata:{name:'synthetic'}}]
  profiles=[{id:'synthetic-prior',role:'admin'}]
  await assert.rejects(verifyAuthBaseline(svc,baseline))
  profiles=[];users=[{id:'one'},{id:'two'}]
  await assert.rejects(captureAuthBaseline(svc,true))
  users=[]
  await assert.doesNotReject(captureAuthBaseline(svc,false))
})

test('next externo/codificado/protocol-relative rechazado; ruta local preservada',()=>{
  for(const input of ['https://evil.test','//evil.test','/%2Fevil.test','/\\evil.test','javascript:alert(1)','/%5cevil.test','/\nevil.test'])
    assert.equal(safeInternalPath(input),'/publicar')
  assert.equal(safeInternalPath('/inventario?q=a'),'/inventario?q=a')
})
test('JSON/form corruptos, arrays, cuerpos enormes y UUID adulterado',async()=>{
  for(const text of ['null','[]','bad','"string"']) await assert.rejects(readJson(new Request('https://qrih.test',{method:'POST',body:text})))
  await assert.rejects(readJson(new Request('https://qrih.test',{method:'POST',body:' '.repeat(65537)})),/grande/)
  await assert.rejects(readForm(new Request('https://qrih.test',{method:'POST',body:'x',headers:{'Content-Type':'multipart/form-data'}})))
  assert.equal(validUuid('11111111-1111-4111-8111-111111111111'),true)
  assert.equal(validUuid('11111111-1111-4111-8111-111111111111 OR 1=1'),false)
})
test('origen cruzado bloqueado y mismo origen permitido',()=>{
  const previousId=process.env.SITE_ID
  delete process.env.SITE_ID
  try {
    assert.throws(()=>assertSameOrigin(new Request('https://qrih.test/api',{headers:{Origin:'https://evil.test'}})))
    assert.doesNotThrow(()=>assertSameOrigin(new Request('https://qrih.test/api',{headers:{Origin:'https://qrih.test'}})))
  } finally {
    if(previousId!==undefined)process.env.SITE_ID=previousId
  }
})
test('Netlify valida origen canónico del servidor, no URL interna ni headers manipulables',()=>{
  const previousId=process.env.SITE_ID,previousUrl=process.env.URL
  process.env.SITE_ID='synthetic-site-id'
  process.env.URL='https://qrih-staging.netlify.app'
  const request=origin=>new Request('https://develop--qrih-staging.netlify.app/api/imagenes',{headers:{Origin:origin,Host:'evil.test','X-Forwarded-Host':'evil.test','X-Forwarded-Proto':'https'}})
  try {
    assert.doesNotThrow(()=>assertSameOrigin(request('https://qrih-staging.netlify.app')))
    for(const origin of ['https://evil.test','null','https://develop--qrih-staging.netlify.app','http://qrih-staging.netlify.app','https://qrih-staging.netlify.app.evil.test'])
      assert.throws(()=>assertSameOrigin(request(origin)))
    const credentialUrl=new URL('https://qrih-staging.netlify.app')
    credentialUrl.username='synthetic';credentialUrl.password='synthetic'
    for(const invalid of ['', 'http://qrih-staging.netlify.app',credentialUrl.href,'https://qrih-staging.netlify.app/path','https://qrih-staging.netlify.app?x=1']) {
      process.env.URL=invalid
      assert.throws(()=>assertSameOrigin(request('https://qrih-staging.netlify.app')))
    }
  } finally {
    if(previousId===undefined)delete process.env.SITE_ID;else process.env.SITE_ID=previousId
    if(previousUrl===undefined)delete process.env.URL;else process.env.URL=previousUrl
  }
})
test('WebP real decodificado; MIME falso/corrupción/SVG/tamaño no pasan',async()=>{
  const valid=await sharp({create:{width:16,height:16,channels:3,background:'#fff'}}).webp().toBuffer()
  const encoded=await validateAndEncodeImage(new File([valid],'a.webp',{type:'image/webp'}))
  assert.equal((await sharp(encoded).metadata()).format,'webp')
  for(const contents of ['<svg xmlns="http://www.w3.org/2000/svg"></svg>','broken RIFF'])
    await assert.rejects(validateAndEncodeImage(new File([contents],'a.webp',{type:'image/webp'})))
  const png=await sharp(valid).png().toBuffer()
  await assert.rejects(validateAndEncodeImage(new File([png],'a.webp',{type:'image/webp'})),/Formato/)
  await assert.rejects(validateAndEncodeImage(new File([valid],'a.webp',{type:'image/png'})),/Formato/)
  await assert.rejects(validateAndEncodeImage(new File([new Uint8Array(20*1024*1024+1)],'large.webp',{type:'image/webp'})),/Tamaño/)
})
test('avatar PNG legítimo se convierte a WebP y SVG se rechaza',async()=>{
  const png=await sharp({create:{width:16,height:16,channels:3,background:'#fff'}}).png().toBuffer()
  const encoded=await validateAndEncodeImage(new File([png],'avatar.png',{type:'image/png'}),true)
  assert.equal((await sharp(encoded).metadata()).format,'webp')
  await assert.rejects(validateAndEncodeImage(new File(['<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>'],'avatar.svg',{type:'image/svg+xml'}),true))
})
test('diagnóstico de imágenes sólo reporta etapas constantes sin detalles de archivo',async()=>{
  const bytes=await sharp({create:{width:80,height:60,channels:3,background:'#336699'}}).webp().toBuffer()
  const stages=[]
  await validateAndEncodeImage(new File([bytes],'private-name.webp',{type:'image/webp'}),false,stage=>stages.push(stage))
  assert.deepEqual(stages,['size','metadata','format','encode'])
  const badStages=[]
  await assert.rejects(validateAndEncodeImage(new File([bytes],'private-name.webp',{type:'image/png'}),false,stage=>badStages.push(stage)))
  assert.deepEqual(badStages,['size','metadata','format'])
})
test('PDF: siete WebP sintéticos convertidos y fotos JPEG realmente incrustadas',async()=>{
  const webp=await sharp({create:{width:16,height:16,channels:3,background:'#fff'}}).webp().toBuffer()
  const jpeg=await encodePdfImage(webp)
  assert.equal((await sharp(jpeg).metadata()).format,'jpeg')
  const content=Array.from({length:7},(_,i)=>React.createElement(Image,{key:i,src:{data:jpeg,format:'jpg'},style:{width:16,height:16}}))
  const result=await renderToBuffer(React.createElement(Document,null,React.createElement(Page,null,...content)))
  assert.equal(result.subarray(0,4).toString(),'%PDF')
  assert.ok(result.toString('latin1').includes('/Subtype /Image'))
})
test('PDF no descarga rutas públicas, externas ni redirecciones arbitrarias',async()=>{
  const previous=process.env.NEXT_PUBLIC_SUPABASE_URL
  process.env.NEXT_PUBLIC_SUPABASE_URL='https://fixtures.supabase.co'
  try{
    await assert.rejects(preparePdfImages(['https://untrusted.test/photo.webp']),/Origen/)
    await assert.rejects(preparePdfImages(['https://fixtures.supabase.co/storage/v1/object/public/property-images/a.webp']),/Origen/)
  }finally{
    if(previous===undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
    else process.env.NEXT_PUBLIC_SUPABASE_URL=previous
  }
})
