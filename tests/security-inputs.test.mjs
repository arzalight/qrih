import assert from 'node:assert/strict'
import { test } from 'node:test'
import { registerHooks } from 'node:module'
import sharp from 'sharp'
import React from 'react'
import {Document,Page,Image,renderToBuffer} from '@react-pdf/renderer'

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
  assert.throws(()=>assertSameOrigin(new Request('https://qrih.test/api',{headers:{Origin:'https://evil.test'}})))
  assert.doesNotThrow(()=>assertSameOrigin(new Request('https://qrih.test/api',{headers:{Origin:'https://qrih.test'}})))
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
