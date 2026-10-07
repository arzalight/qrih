import assert from 'node:assert/strict'
import { test } from 'node:test'
import { registerHooks } from 'node:module'
import { readFileSync } from 'node:fs'
import { AsyncLocalStorage } from 'node:async_hooks'

// El test runner Node no inicializa el contexto global del servidor Next.
globalThis.AsyncLocalStorage ??= AsyncLocalStorage
const { NextRequest } = await import('next/server.js')
const { default: nextTesting } = await import('next/experimental/testing/server.js')
const { unstable_doesMiddlewareMatch } = nextTesting

registerHooks({ resolve(specifier, context, nextResolve) {
  const aliases = {
    'next/headers': 'data:text/javascript,export async function cookies(){return globalThis.__ssrCookieStore}',
    'server-only': 'data:text/javascript,export {}',
  }
  if (aliases[specifier]) return { url: aliases[specifier], shortCircuit: true }
  if (specifier === 'next/server') return nextResolve(new URL('../node_modules/next/server.js', import.meta.url).href, context)
  return nextResolve(specifier, context)
} })

const { createServerSupabaseClient } = await import('../lib/supabase-server.ts')
const { proxy, config } = await import('../proxy.ts')
const origin = 'https://synthetic-project.supabase.co'
const cookieName = 'sb-synthetic-project-auth-token'
const user = { id: '11111111-1111-4111-8111-111111111111', email_confirmed_at: 'synthetic', is_anonymous: false }
const jwt = exp => [Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
  Buffer.from(JSON.stringify({ sub: user.id, exp })).toString('base64url'), 'synthetic-signature'].join('.')
const session = exp => ({ access_token: jwt(exp), refresh_token: 'synthetic-refresh', expires_at: exp,
  expires_in: 3600, token_type: 'bearer', user })
const encode = value => 'base64-' + Buffer.from(JSON.stringify(value)).toString('base64url')

async function withFixture(run, { expired = true, chunks = false, revoked = false, rejectUser = false } = {}) {
  const saved = { fetch: globalThis.fetch, url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY }
  const now = Math.floor(Date.now() / 1000)
  const previous = session(now + (expired ? -3600 : 3600))
  if (chunks) previous.user = { ...user, user_metadata: { syntheticPadding: 'x'.repeat(8000) } }
  const initial = encode(previous)
  const jar = new Map(chunks ? initial.match(/.{1,2500}/g).map((s, i) => [cookieName + '.' + i, s]) : [[cookieName, initial]])
  const calls = []
  process.env.NEXT_PUBLIC_SUPABASE_URL = origin
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_synthetic'
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input))
    assert.equal(url.origin, origin, 'Fixture must never call a real Supabase project')
    calls.push([url.pathname, init.method ?? 'GET'])
    if (url.pathname === '/auth/v1/token') {
      assert.equal(url.searchParams.get('grant_type'), 'refresh_token')
      if (revoked) return Response.json({ code: 'refresh_token_not_found', message: 'synthetic revoked' }, { status: 400 })
      return Response.json(session(now + 3600))
    }
    if (url.pathname === '/auth/v1/user') return rejectUser
      ? Response.json({ code: 'bad_jwt', message: 'synthetic invalid' }, { status: 401 }) : Response.json(user)
    throw new Error('Unexpected synthetic request')
  }
  try { await run({ jar, calls, initial }) }
  finally {
    globalThis.fetch = saved.fetch
    if (saved.url === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = saved.url
    if (saved.key === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = saved.key
    delete globalThis.__ssrCookieStore
  }
}

test('AUD-036 reproducción: RSC sólo lectura pierde cookies renovadas y repite refresh', async () => {
  await withFixture(async ({ jar, calls, initial }) => {
    let rejectedWrites = 0
    globalThis.__ssrCookieStore = { getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      set() { rejectedWrites++; throw new Error('Read-only Server Component') } }
    for (let i = 0; i < 2; i++) {
      const client = await createServerSupabaseClient()
      assert.equal((await client.auth.getUser()).data.user.id, user.id)
      client.auth.stopAutoRefresh()
    }
    assert.equal(jar.get(cookieName), initial)
    assert.equal(calls.filter(([path]) => path === '/auth/v1/token').length, 2)
    assert.equal(rejectedWrites, 2)
  })
})

function request(jar) {
  return new NextRequest('http://localhost:3107/mis-propiedades', {
    headers: { Cookie: [...jar].map(([name, value]) => `${name}=${value}`).join('; ') },
  })
}
function applyResponse(jar, response) {
  for (const cookie of response.cookies.getAll()) {
    if (cookie.maxAge === 0 || !cookie.value) jar.delete(cookie.name)
    else jar.set(cookie.name, cookie.value)
  }
}
function assertPrivate(response) {
  assert.match(response.headers.get('cache-control'), /private.*no-store/)
  assert.equal(response.headers.get('pragma'), 'no-cache')
  assert.equal(response.headers.get('expires'), '0')
  assert.equal(response.headers.get('location'), null)
  assert.equal(response.headers.get('x-middleware-next'), '1')
}

test('AUD-036 proxy: cookie renovada llega a RSC/navegador; siguiente petición no renueva', async () => {
  await withFixture(async ({ jar, calls, initial }) => {
    const req = request(jar)
    const response = await proxy(req)
    assertPrivate(response)
    assert.notEqual(req.cookies.get(cookieName).value, initial)
    assert.equal(response.cookies.get(cookieName).value, req.cookies.get(cookieName).value)
    assert.equal(response.headers.get('x-middleware-request-cookie'), req.headers.get('cookie'))
    // RSC usa el request renovado sin escritura ni segunda rotación.
    globalThis.__ssrCookieStore = { getAll: () => req.cookies.getAll(), set() { throw Error('RSC readonly') } }
    const client = await createServerSupabaseClient()
    assert.equal((await client.auth.getUser()).data.user.id, user.id)
    client.auth.stopAutoRefresh()
    applyResponse(jar, response)
    assert.notEqual(jar.get(cookieName), initial)
    await proxy(request(jar))
    assert.equal(calls.filter(([path]) => path === '/auth/v1/token').length, 1)
  })
})

test('AUD-036 proxy: sesión vigente se valida con Auth, sin refresh/cookie fabricada', async () => {
  await withFixture(async ({ jar, calls }) => {
    const response = await proxy(request(jar))
    assertPrivate(response)
    assert.equal(response.cookies.getAll().length, 0)
    assert.deepEqual(calls, [['/auth/v1/user', 'GET']])
  }, { expired: false })
})

test('AUD-036 proxy: sin sesión no hay llamadas Auth ni sesión/redirect inventados', async () => {
  await withFixture(async ({ jar, calls }) => {
    jar.clear()
    const response = await proxy(request(jar))
    assertPrivate(response)
    assert.equal(response.cookies.getAll().length, 0)
    assert.equal(calls.length, 0)
  })
})

test('AUD-036 proxy: refresh revocado limpia cookies; RSC sigue sin actor', async () => {
  await withFixture(async ({ jar, calls }) => {
    const req = request(jar)
    const response = await proxy(req)
    assertPrivate(response)
    assert.ok(response.cookies.getAll().some(c => c.name === cookieName && c.maxAge === 0))
    applyResponse(jar, response)
    assert.equal(jar.size, 0)
    globalThis.__ssrCookieStore = { getAll: () => req.cookies.getAll(), set() { throw Error('RSC readonly') } }
    const client = await createServerSupabaseClient()
    assert.equal((await client.auth.getUser()).data.user, null)
    client.auth.stopAutoRefresh()
    assert.equal(calls.filter(([path]) => path === '/auth/v1/token').length, 1)
  }, { revoked: true })
})

test('AUD-036 proxy: chunks antiguos se retiran en request y response sin perder cookie ajena', async () => {
  await withFixture(async ({ jar }) => {
    jar.set('qrih-recovery', 'synthetic-marker')
    const req = request(jar)
    const response = await proxy(req)
    assertPrivate(response)
    applyResponse(jar, response)
    assert.ok(jar.has(cookieName))
    assert.ok(![...jar.keys()].some(name => name.startsWith(cookieName + '.')))
    assert.ok(!req.cookies.getAll().some(c => c.name.startsWith(cookieName + '.')))
    assert.equal(jar.get('qrih-recovery'), 'synthetic-marker')
    assert.equal(response.cookies.get('qrih-recovery'), undefined)
  }, { chunks: true })
})

test('AUD-036 proxy: cookie con JWT no verificado no concede identidad ni redirect', async () => {
  await withFixture(async ({ jar, calls }) => {
    const req = request(jar)
    assertPrivate(await proxy(req))
    globalThis.__ssrCookieStore = { getAll: () => req.cookies.getAll(), set() { throw Error('RSC readonly') } }
    const client = await createServerSupabaseClient()
    const result = await client.auth.getUser()
    assert.equal(result.data.user, null)
    assert.ok(result.error)
    client.auth.stopAutoRefresh()
    assert.ok(calls.some(([path]) => path === '/auth/v1/user'))
  }, { expired: false, rejectUser: true })
})

test('AUD-036 proxy: configuración ausente/excepción sin secretos en logs ni sesión', async () => {
  await withFixture(async ({ jar }) => {
    const savedWarn = console.warn, warnings = []
    console.warn = (...args) => warnings.push(args)
    try {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      const absent = await proxy(request(jar))
      assertPrivate(absent)
      assert.equal(absent.cookies.getAll().length, 0)
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_synthetic'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'invalid-synthetic-origin'
      const failure = await proxy(request(jar))
      assertPrivate(failure)
      assert.deepEqual(warnings, [['QRIH_SESSION_REFRESH_FAILURE']])
      assert.equal(failure.cookies.getAll().length, 0)
    } finally { console.warn = savedWarn }
  })
})

test('AUD-036 matcher: sólo páginas privadas SSR; APIs/callback/recovery/público/assets excluidos', () => {
  // La API de testing de Next16.3 instalado conserva este nombre legacy.
  const matches = path => unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: 'http://localhost:3107' + path })
  for (const path of ['/perfil', '/notificaciones', '/mis-propiedades', '/mis-propiedades/x/editar',
    '/mis-propiedades/x/solicitudes', '/admin', '/admin/x', '/admin/asesores/x', '/admin/configuracion']) assert.equal(matches(path), true, path)
  for (const path of ['/', '/inventario', '/bodegas/x', '/asesor/x', '/login', '/publicar', '/registro',
    '/auth/callback?code=synthetic', '/restablecer-contrasena', '/recuperar-contrasena', '/api/auth/restablecer',
    '/api/imagenes', '/_next/static/test.js', '/favicon.ico', '/administer', '/mis-propiedades-publicas']) assert.equal(matches(path), false, path)
  const source = readFileSync(new URL('../proxy.ts', import.meta.url), 'utf8')
  assert.ok(!source.includes('SUPABASE_SERVICE_ROLE_KEY'))
  assert.ok(!source.includes('.auth.getSession('))
  assert.ok(!source.includes('user_metadata'))
})

test('AUD-036 control: Route Handler writable sí persiste y siguiente lectura no renueva', async () => {
  await withFixture(async ({ jar, calls, initial }) => {
    globalThis.__ssrCookieStore = { getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      set(name, value) { if (value) jar.set(name, value); else jar.delete(name) } }
    for (let i = 0; i < 2; i++) {
      const client = await createServerSupabaseClient()
      assert.equal((await client.auth.getUser()).data.user.id, user.id)
      client.auth.stopAutoRefresh()
    }
    assert.notEqual(jar.get(cookieName), initial)
    assert.equal(calls.filter(([path]) => path === '/auth/v1/token').length, 1)
  })
})
