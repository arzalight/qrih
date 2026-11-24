import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { registerHooks } from 'node:module'
import { after, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'server-only') return { url: 'data:text/javascript,export{}', shortCircuit: true }
    return nextResolve(specifier, context)
  },
})

const { createSignedPropertyImageUrlMap, PROPERTY_IMAGE_TTL_SECONDS } = await import('../lib/property-image-urls.ts')
const { uploadVerifiedImage, rollbackVerifiedImages, validateAndEncodeImage } = await import('../lib/verified-media-server.ts')

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const SUPABASE_URL = 'https://mcyxunymhuxyiwklyfpy.supabase.co'
const PUBLIC_KEY = 'sb_publishable_syntheticB1Key'
const USER_ID = '11111111-1111-4111-8111-111111111111'
const OP_ID = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa'
const OBJECT_PATH = `${USER_ID}/22222222-2222-4222-8222-222222222222.webp`

const savedEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
}
after(() => {
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
})

function walkFiles(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walkFiles(full))
    else if (/\.(ts|tsx|js|mjs|cjs)$/.test(entry.name)) out.push(full)
  }
  return out
}

test('Etapa 8 invariante: cero referencias a SUPABASE_SERVICE_ROLE_KEY o supabase-privileged-server en código Next.js', () => {
  assert.equal(existsSync(join(ROOT, 'lib/supabase-privileged-server.ts')), false)
  const files = [
    ...walkFiles(join(ROOT, 'app')),
    ...walkFiles(join(ROOT, 'lib')),
    ...walkFiles(join(ROOT, 'components')),
    join(ROOT, 'proxy.ts'),
  ]
  const forbidden = /SUPABASE_SERVICE_ROLE_KEY|supabase-privileged-server|createPrivilegedServerSupabaseClient/
  for (const file of files) {
    const content = readFileSync(file, 'utf8')
    assert.equal(forbidden.test(content), false, `Referencia privilegiada prohibida encontrada en ${file}`)
  }
})

test('Etapa 8 firma de imágenes: usa Edge Function sign-property-images para anon y autenticado, valida origen y bloquea 401/403', async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = PUBLIC_KEY

  const requests = []
  const okFetch = async (url, init) => {
    requests.push({ url, headers: init.headers, body: JSON.parse(init.body) })
    const { paths, expiresIn } = JSON.parse(init.body)
    return new Response(
      JSON.stringify({
        expiresIn,
        expiresAt: '2026-11-24T16:00:00.000Z',
        urls: Object.fromEntries(
          paths.map((p) => [p, `${SUPABASE_URL}/storage/v1/object/sign/property-images/${p}?token=ok`]),
        ),
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    )
  }

  // Público (sin sesión): omite Authorization
  const publicClient = { auth: { async getSession() { return { data: { session: null } } } } }
  const pubUrls = await createSignedPropertyImageUrlMap(
    publicClient,
    [OBJECT_PATH],
    PROPERTY_IMAGE_TTL_SECONDS.public,
    { fetchImpl: okFetch },
  )
  assert.equal(pubUrls.get(OBJECT_PATH), `${SUPABASE_URL}/storage/v1/object/sign/property-images/${OBJECT_PATH}?token=ok`)
  assert.equal(requests[0].url, `${SUPABASE_URL}/functions/v1/sign-property-images`)
  assert.equal(requests[0].headers.apikey, PUBLIC_KEY)
  assert.equal(requests[0].headers.Authorization, undefined)

  // Autenticado (con sesión): reenvía Bearer JWT del actor
  const authClient = { auth: { async getSession() { return { data: { session: { access_token: 'jwt.actor.ok' } } } } } }
  await createSignedPropertyImageUrlMap(
    authClient,
    [OBJECT_PATH],
    PROPERTY_IMAGE_TTL_SECONDS.admin,
    { fetchImpl: okFetch },
  )
  assert.equal(requests[1].headers.Authorization, 'Bearer jwt.actor.ok')

  // Origen malicioso o 403 -> fail closed
  const evilFetch = async () =>
    new Response(
      JSON.stringify({
        urls: { [OBJECT_PATH]: `https://evil.invalid/storage/v1/object/sign/property-images/${OBJECT_PATH}` },
      }),
      { status: 200 },
    )
  await assert.rejects(
    createSignedPropertyImageUrlMap(publicClient, [OBJECT_PATH], PROPERTY_IMAGE_TTL_SECONDS.public, { fetchImpl: evilFetch }),
    /No fue posible obtener/,
  )
  const deniedFetch = async () => new Response(JSON.stringify({ error: 'denied' }), { status: 403 })
  await assert.rejects(
    createSignedPropertyImageUrlMap(publicClient, [OBJECT_PATH], PROPERTY_IMAGE_TTL_SECONDS.public, { fetchImpl: deniedFetch }),
    /No tienes acceso/,
  )
})

test('Etapa 8 ingesta y rollback: normaliza >1920px a WebP, invoca ingest-verified-media con Bearer JWT y soporta rollback por operationId', async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = PUBLIC_KEY

  // Imagen 3000x2000 se acota a 1920x1280 antes de enviarse a Edge Function (SD-04)
  const bigBuf = await sharp({
    create: { width: 3000, height: 2000, channels: 3, background: { r: 10, g: 50, b: 90 } },
  })
    .webp({ quality: 80 })
    .toBuffer()
  const normalized = await validateAndEncodeImage(new File([bigBuf], 'big.webp', { type: 'image/webp' }))
  const meta = await sharp(normalized).metadata()
  assert.equal(meta.format, 'webp')
  assert.equal(meta.width, 1920)
  assert.equal(meta.height, 1280)

  const seen = []
  const edgeFetch = async (url, init) => {
    seen.push({ url, headers: init.headers, body: init.body })
    if (init.body instanceof FormData) {
      assert.equal(init.body.get('bucket'), 'property-images')
      assert.equal(init.body.get('operationId'), OP_ID)
      return new Response(
        JSON.stringify({
          path: OBJECT_PATH,
          publicUrl: null,
          operationId: OP_ID,
          rollbackToken: '1795539999.syntheticHmacSignatureValue0123456789',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      )
    }
    const payload = JSON.parse(init.body)
    assert.equal(payload.action, 'rollback')
    assert.equal(payload.operationId, OP_ID)
    assert.equal(payload.bucket, 'property-images')
    assert.equal(payload.items[0].path, OBJECT_PATH)
    return new Response(JSON.stringify({ operationId: OP_ID, bucket: 'property-images', results: [{ path: OBJECT_PATH, status: 'deleted' }] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }

  const smallBuf = await sharp({
    create: { width: 120, height: 80, channels: 3, background: { r: 20, g: 40, b: 60 } },
  })
    .webp()
    .toBuffer()
  const authClient = { auth: { async getSession() { return { data: { session: { access_token: 'jwt.user.ok' } } } } } }

  // Sin sesión falla cerrado
  await assert.rejects(
    uploadVerifiedImage(new File([smallBuf], 'ok.webp', { type: 'image/webp' }), USER_ID, 'property-images', () => {}, {
      supabase: { auth: { async getSession() { return { data: { session: null } } } } },
      fetchImpl: edgeFetch,
    }),
    /iniciar sesión/,
  )

  const uploaded = await uploadVerifiedImage(
    new File([smallBuf], 'ok.webp', { type: 'image/webp' }),
    USER_ID,
    'property-images',
    () => {},
    { supabase: authClient, operationId: OP_ID, fetchImpl: edgeFetch },
  )
  assert.equal(uploaded.path, OBJECT_PATH)
  assert.equal(uploaded.publicUrl, null)
  assert.equal(uploaded.operationId, OP_ID)
  assert.ok(uploaded.rollbackToken)
  assert.equal(seen[0].headers.apikey, PUBLIC_KEY)
  assert.equal(seen[0].headers.Authorization, 'Bearer jwt.user.ok')

  await rollbackVerifiedImages({
    bucket: 'property-images',
    operationId: OP_ID,
    items: [{ path: uploaded.path, rollbackToken: uploaded.rollbackToken }],
    supabase: authClient,
    fetchImpl: edgeFetch,
  })
  assert.equal(seen.length, 2)
})
