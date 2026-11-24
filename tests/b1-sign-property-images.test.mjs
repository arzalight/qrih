import assert from 'node:assert/strict'
import { test } from 'node:test'
import { performance } from 'node:perf_hooks'
import {
  ALLOWED_SIGN_TTLS,
  MAX_SIGN_PATHS,
  createSignPropertyImagesHandler,
} from '../supabase/functions/sign-property-images/core.ts'

const SUPABASE_URL = 'https://mcyxunymhuxyiwklyfpy.supabase.co'
const PUBLIC_KEY = 'sb_publishable_syntheticStagingKey01'
const SERVICE_KEY = ['sb', 'secret', 'syntheticEdgeOnlyKey99'].join('_')
const STAGING_ORIGIN = 'https://qrih-staging.netlify.app'
const USER_A = '11111111-1111-4111-8111-111111111111'
const USER_B = '22222222-2222-4222-8222-222222222222'
const ADMIN = '44444444-4444-4444-8444-444444444444'

const PUBLIC_PATH = `${USER_A}/published-cover.webp`
const PRIVATE_A_PATH = `${USER_A}/draft-photo.webp`
const PRIVATE_B_PATH = `${USER_B}/private-photo.webp`
const MISSING_PATH = `${USER_A}/does-not-exist.webp`

const TOKENS = {
  userA: 'jwt.userA.valid',
  userB: 'jwt.userB.valid',
  admin: 'jwt.admin.valid',
  anonAuth: 'jwt.anonymous.auth',
  expired: 'jwt.expired.invalid',
}

function makeFixture(options = {}) {
  const logs = []
  let signCalls = 0
  let authzCalls = 0
  const fixedNow = new Date('2026-11-23T23:00:00.000Z')

  const handler = createSignPropertyImagesHandler({
    supabaseUrl: SUPABASE_URL,
    expectedPublicKey: PUBLIC_KEY,
    serviceRoleKey: SERVICE_KEY,
    allowedOrigins: [STAGING_ORIGIN],
    now: () => fixedNow,
    logWarn: (code) => logs.push(code),
    createActorClient: (bearerToken) => ({
      auth: {
        async getUser(jwt) {
          const token = jwt ?? bearerToken
          if (token === TOKENS.userA) return { data: { user: { id: USER_A, is_anonymous: false } }, error: null }
          if (token === TOKENS.userB) return { data: { user: { id: USER_B, is_anonymous: false } }, error: null }
          if (token === TOKENS.admin) return { data: { user: { id: ADMIN, is_anonymous: false } }, error: null }
          if (token === TOKENS.anonAuth) return { data: { user: { id: '99999999-9999-4999-8999-999999999999', is_anonymous: true } }, error: null }
          return { data: { user: null }, error: { message: 'invalid jwt' } }
        },
      },
      async rpc(fn, { p_paths }) {
        authzCalls++
        assert.equal(fn, 'qrih_authorized_image_paths')
        if (options.rpcError) return { data: null, error: { message: 'rpc denied' } }
        const allowed = p_paths.filter((p) => {
          if (p === MISSING_PATH) return false
          if (p === PUBLIC_PATH) return true
          if (bearerToken === TOKENS.admin) return true
          if (bearerToken === TOKENS.userA && p === PRIVATE_A_PATH) return true
          if (bearerToken === TOKENS.userB && p === PRIVATE_B_PATH) return true
          return false
        })
        return { data: allowed, error: null }
      },
    }),
    createServiceClient: () => ({
      storage: {
        from(bucket) {
          assert.equal(bucket, 'property-images')
          return {
            async createSignedUrls(paths, expiresIn) {
              signCalls++
              if (options.storageError) return { data: null, error: { message: `leak ${SERVICE_KEY}` } }
              if (options.storageIncomplete) return { data: [], error: null }
              if (options.storageEvilOrigin) {
                return {
                  data: paths.map((path) => ({ path, signedUrl: `https://evil.invalid/storage/v1/object/sign/property-images/${path}` })),
                  error: null,
                }
              }
              return {
                data: paths.map((path) => ({
                  path,
                  signedUrl: `${SUPABASE_URL}/storage/v1/object/sign/property-images/${path}?token=ephemeral-${expiresIn}`,
                })),
                error: null,
              }
            },
          }
        },
      },
    }),
  })

  return {
    handler,
    logs,
    getSignCalls: () => signCalls,
    getAuthzCalls: () => authzCalls,
  }
}

function makeRequest(body, headers = {}, method = 'POST') {
  return new Request(`${SUPABASE_URL}/functions/v1/sign-property-images`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      apikey: PUBLIC_KEY,
      ...headers,
    },
    ...(method === 'POST' ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
  })
}

test('sign-property-images: visitante público, dueño y admin reciben URLs firmadas con deduplicación y TTLs válidos', async () => {
  const fx = makeFixture()

  // Visitante público anónimo (sin Authorization y con Bearer = apikey público)
  for (const ttl of ALLOWED_SIGN_TTLS) {
    const res = await fx.handler(makeRequest({ paths: [PUBLIC_PATH, PUBLIC_PATH], expiresIn: ttl }))
    assert.equal(res.status, 200)
    assert.equal(res.headers.get('cache-control'), 'no-store')
    const json = await res.json()
    assert.equal(json.expiresIn, ttl)
    assert.equal(Object.keys(json.urls).length, 1)
    assert.ok(json.urls[PUBLIC_PATH].startsWith(`${SUPABASE_URL}/storage/v1/object/sign/property-images/${PUBLIC_PATH}`))
  }

  // @supabase/supabase-js sin sesión puede enviar Authorization: Bearer <publicKey>
  const resAnonBearer = await fx.handler(
    makeRequest({ paths: [PUBLIC_PATH], expiresIn: 600 }, { Authorization: `Bearer ${PUBLIC_KEY}` }),
  )
  assert.equal(resAnonBearer.status, 200)

  // Dueño A autoriza su borrador privado
  const resOwner = await fx.handler(
    makeRequest({ paths: [PRIVATE_A_PATH], expiresIn: 900 }, { Authorization: `Bearer ${TOKENS.userA}` }),
  )
  assert.equal(resOwner.status, 200)

  // Admin activo autoriza borradores ajenos
  const resAdmin = await fx.handler(
    makeRequest({ paths: [PRIVATE_A_PATH, PRIVATE_B_PATH], expiresIn: 900 }, { Authorization: `Bearer ${TOKENS.admin}` }),
  )
  assert.equal(resAdmin.status, 200)
  const adminBody = await resAdmin.json()
  assert.equal(Object.keys(adminBody.urls).length, 2)
})

test('sign-property-images: rechaza apikey faltante/inválida, service_role como token, y JWT inválidos o anónimos sin degradar a anon', async () => {
  const fx = makeFixture()

  const authFailRequests = [
    makeRequest({ paths: [PUBLIC_PATH], expiresIn: 600 }, { apikey: '' }),
    makeRequest({ paths: [PUBLIC_PATH], expiresIn: 600 }, { apikey: 'wrong-key' }),
    makeRequest({ paths: [PUBLIC_PATH], expiresIn: 600 }, { apikey: SERVICE_KEY }),
    // JWT expirado/forjado incluso pidiendo una imagen PÚBLICA -> 401 obligatorio, jamás degradar a anon
    makeRequest({ paths: [PUBLIC_PATH], expiresIn: 600 }, { Authorization: `Bearer ${TOKENS.expired}` }),
    makeRequest({ paths: [PUBLIC_PATH], expiresIn: 600 }, { Authorization: 'Basic abc123' }),
    makeRequest({ paths: [PUBLIC_PATH], expiresIn: 600 }, { Authorization: `Bearer ${TOKENS.anonAuth}` }),
    makeRequest({ paths: [PUBLIC_PATH], expiresIn: 600 }, { Authorization: `Bearer ${SERVICE_KEY}` }),
  ]

  for (const req of authFailRequests) {
    const res = await fx.handler(req)
    assert.equal(res.status, 401)
  }
  assert.equal(fx.getSignCalls(), 0)
  assert.equal(fx.getAuthzCalls(), 0)
})

test('sign-property-images: rechaza sin oráculo rutas privadas ajenas, lotes mixtos e imágenes inexistentes', async () => {
  const fx = makeFixture()

  const deniedCases = [
    // Anónimo pidiendo borrador
    makeRequest({ paths: [PRIVATE_A_PATH], expiresIn: 600 }),
    // Dueño B pidiendo borrador de A
    makeRequest({ paths: [PRIVATE_A_PATH], expiresIn: 900 }, { Authorization: `Bearer ${TOKENS.userB}` }),
    // Lote mixto (1 pública + 1 privada ajena): rechaza TODO el lote
    makeRequest({ paths: [PUBLIC_PATH, PRIVATE_A_PATH], expiresIn: 600 }, { Authorization: `Bearer ${TOKENS.userB}` }),
    // Imagen inexistente (misma respuesta 403 genérica que privada ajena -> cero oráculo)
    makeRequest({ paths: [MISSING_PATH], expiresIn: 600 }, { Authorization: `Bearer ${TOKENS.userA}` }),
  ]

  const messages = new Set()
  for (const req of deniedCases) {
    const res = await fx.handler(req)
    assert.equal(res.status, 403)
    const body = await res.json()
    messages.add(body.error)
  }
  assert.equal(messages.size, 1, 'Rutas privadas e inexistentes deben devolver el mismo mensaje genérico')
  assert.equal(fx.getSignCalls(), 0, 'Nunca invocar Storage privilegiado si falla autorización')
})

test('sign-property-images: rechaza path traversal, TTL inválido, campos extra, bucket no permitido, >200 rutas, cuerpo >32KiB y CORS no autorizado', async () => {
  const fx = makeFixture()

  // Path traversal, URLs persistentes, query strings, extensiones distintas de .webp
  for (const badPath of [
    '../etc/passwd',
    `${USER_A}/../${USER_B}/photo.webp`,
    `${PUBLIC_PATH}?token=x`,
    `https://example.invalid/${PUBLIC_PATH}`,
    `${USER_A}/photo.png`,
    `${USER_A}/photo%2ewebp`,
  ]) {
    const res = await fx.handler(makeRequest({ paths: [badPath], expiresIn: 600 }))
    assert.equal(res.status, 400, `Debe rechazar ${badPath}`)
  }

  // TTL inválido, campos extra (user_id/role), bucket ajeno, arreglo vacío
  for (const badBody of [
    { paths: [PUBLIC_PATH], expiresIn: 60 },
    { paths: [PUBLIC_PATH], expiresIn: 86400 },
    { paths: [PUBLIC_PATH], expiresIn: 600, user_id: ADMIN },
    { paths: [PUBLIC_PATH], expiresIn: 600, role: 'admin' },
    { paths: [PUBLIC_PATH], expiresIn: 600, bucket: 'profile-images' },
    { paths: [], expiresIn: 600 },
  ]) {
    const res = await fx.handler(makeRequest(badBody))
    assert.equal(res.status, 400)
  }

  // > MAX_SIGN_PATHS (201 rutas únicas válidas)
  const tooMany = Array.from({ length: MAX_SIGN_PATHS + 1 }, (_, i) => `${USER_A}/photo-${i}.webp`)
  assert.equal((await fx.handler(makeRequest({ paths: tooMany, expiresIn: 600 }))).status, 400)

  // Cuerpo > 32 KiB -> 413
  const huge = JSON.stringify({ paths: [PUBLIC_PATH], expiresIn: 600 }) + ' '.repeat(33 * 1024)
  assert.equal((await fx.handler(makeRequest(huge))).status, 413)

  // Método no permitido -> 405
  assert.equal((await fx.handler(makeRequest(null, {}, 'GET'))).status, 405)

  // CORS: origen no listado -> 403 sin ACAO; origen autorizado -> 204/200 con ACAO exacto (nunca *)
  const badCors = await fx.handler(makeRequest({ paths: [PUBLIC_PATH], expiresIn: 600 }, { Origin: 'https://evil.invalid' }))
  assert.equal(badCors.status, 403)
  assert.equal(badCors.headers.get('access-control-allow-origin'), null)

  const okPreflight = await fx.handler(makeRequest(null, { Origin: STAGING_ORIGIN }, 'OPTIONS'))
  assert.equal(okPreflight.status, 204)
  assert.equal(okPreflight.headers.get('access-control-allow-origin'), STAGING_ORIGIN)

  assert.equal(fx.getSignCalls(), 0)
})

test('sign-property-images: errores de Storage jamás filtran secretos ni devuelven orígenes externos', async () => {
  for (const opts of [{ storageError: true }, { storageIncomplete: true }, { storageEvilOrigin: true }]) {
    const fx = makeFixture(opts)
    const res = await fx.handler(makeRequest({ paths: [PUBLIC_PATH], expiresIn: 600 }))
    assert.equal(res.status, 502)
    const text = await res.text()
    assert.ok(!text.includes(SERVICE_KEY))
    assert.ok(!text.includes('evil.invalid'))
    assert.ok(fx.logs.every((entry) => !entry.includes(SERVICE_KEY)))
  }
})

test('sign-property-images: medición local p50/p95 del handler (sin red)', async () => {
  const fx = makeFixture()
  const samples = []
  for (let i = 0; i < 50; i++) {
    const t0 = performance.now()
    const res = await fx.handler(makeRequest({ paths: [PUBLIC_PATH], expiresIn: 600 }))
    assert.equal(res.status, 200)
    samples.push(performance.now() - t0)
  }
  samples.sort((a, b) => a - b)
  const p50 = samples[Math.floor(samples.length * 0.5)]
  const p95 = samples[Math.floor(samples.length * 0.95)]
  assert.ok(p50 < 20 && p95 < 50, `Overhead local esperado <50ms (p50=${p50.toFixed(2)}ms, p95=${p95.toFixed(2)}ms)`)
})
