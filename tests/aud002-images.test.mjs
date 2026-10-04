import assert from 'node:assert/strict'
import { test } from 'node:test'
import { registerHooks } from 'node:module'
import { readFileSync } from 'node:fs'

// Next sustituye server-only al compilar. En este test sin Next sólo se simula
// ese módulo marcador; la utilidad TypeScript se ejecuta sin alterar su código.
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === 'server-only') return { url: 'data:text/javascript,export{}', shortCircuit: true }
  if (specifier === './supabase-privileged-server') return nextResolve(new URL('./supabase-privileged-server.ts', context.parentURL).href, context)
  return nextResolve(specifier, context)
}})
const { createSignedPropertyImageUrlMap: realSign, propertyImagePaths, PROPERTY_IMAGE_TTL_SECONDS: ttl } =
  await import('../lib/property-image-urls.ts')
const sign = (actor, paths, seconds) => realSign(actor, paths, seconds, actor)
const path = '11111111-1111-4111-8111-111111111111/image.webp'
function client(response, spy = () => {}) {
  return { async rpc(_name, {p_paths}) { return { data: p_paths, error: null } }, storage: { from(bucket) { assert.equal(bucket, 'property-images'); return {
    async createSignedUrls(paths, expires) { spy(paths, expires); return response }
  }}}}
}
test('sin rutas no llama Storage', async () => {
  assert.equal((await sign(client(null, () => assert.fail()), [null, undefined], ttl.public)).size, 0)
})
test('rechazo de autorización jamás llama al firmador privilegiado', async () => {
  for (const response of [{data:[],error:null},{data:null,error:{message:'denied'}}]) {
    const actor = client(null, () => assert.fail('firmó sin autorización'))
    actor.rpc = async () => response
    await assert.rejects(sign(actor, [path], ttl.public), /No tienes acceso/)
  }
})
test('firma en lote, deduplica y conserva TTL autorizado', async () => {
  for (const expires of Object.values(ttl)) {
    const urls = await sign(client({ data: [{ path, signedUrl: 'https://storage.test/signed' }], error: null },
      (paths, seconds) => { assert.deepEqual(paths, [path]); assert.equal(seconds, expires) }), [path, path], expires)
    assert.equal(urls.get(path), 'https://storage.test/signed')
  }
})
test('rechaza URLs persistentes, traversals y TTL arbitrarios antes de pedir firmas', async () => {
  for (const invalid of ['https://example.test/image.webp', '../x.webp', path + '?token=x', path.replace('image.webp','../image.webp')]) {
    await assert.rejects(sign(client(null, () => assert.fail()), [invalid], ttl.public), /inválida/)
  }
  await assert.rejects(sign(client(null), [path], 86400), /Duración/)
})
test('error global, por objeto o respuesta incompleta falla sin URL pública fallback', async () => {
  for (const response of [
    { data: null, error: { message: 'private secret path' } },
    { data: [{ path, error: 'not authorized' }], error: null },
    { data: [], error: null },
    { data: [{ path: path+'other', signedUrl: 'https://bad.test' }], error: null },
  ]) {
    await assert.rejects(sign(client(response), [path], ttl.public), (error) => !error.message.includes('secret'))
  }
})
test('portada primero, galería completa sin duplicar fotografía principal', () => {
  assert.deepEqual(propertyImagePaths(path, [{storage_path:path},{storage_path:'other'}]), [path,'other'])
  assert.deepEqual(propertyImagePaths(null, [{storage_path:path}]), [path])
})
test('superficies públicas no usan sesión ni consulta de perfiles privados', () => {
  for (const file of ['app/page.tsx','app/inventario/page.tsx','app/bodegas/[slug]/page.tsx',
    'app/asesor/[public_id]/page.tsx','app/api/bodegas/[slug]/pdf/route.tsx']) {
    const source = readFileSync(new URL('../'+file, import.meta.url), 'utf8')
    assert.ok(source.includes('createPublicServerSupabaseClient'))
    assert.ok(!source.includes('getPublicUrl'))
    assert.ok(!source.includes('profiles!'))
  }
})
