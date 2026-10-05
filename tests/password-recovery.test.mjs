import assert from 'node:assert/strict'
import { test } from 'node:test'
import { registerHooks } from 'node:module'
import { createHash } from 'node:crypto'
import { createBrowserClient, createServerClient } from '@supabase/ssr'

registerHooks({ resolve(specifier, context, nextResolve) {
  const aliases = {
    '@/lib/supabase-server': 'data:text/javascript,export async function createServerSupabaseClient(){return globalThis.__recoveryClient}',
    'next/headers': 'data:text/javascript,export async function cookies(){return {get:()=>globalThis.__recoveryMarker ? {value:globalThis.__recoveryMarker}:undefined}}',
    'server-only': 'data:text/javascript,export {}',
  }
  if (aliases[specifier]) return { url: aliases[specifier], shortCircuit: true }
  if (specifier.startsWith('@/lib/')) return nextResolve(new URL(`../lib/${specifier.slice(6)}.ts`, import.meta.url).href, context)
  if (specifier === 'next/server') return nextResolve(new URL('../node_modules/next/server.js', import.meta.url).href, context)
  return nextResolve(specifier, context)
} })
const { RECOVERY_NOTICE, recoveryCallbackUrl, requestPasswordRecovery, passwordRecoveryValidation } = await import('../lib/password-recovery.ts')
const { createRecoveryMarker, getRecoveryUser, RECOVERY_MAX_AGE } = await import('../lib/password-recovery-server.ts')
const { GET } = await import('../app/auth/callback/route.ts')
const { POST } = await import('../app/api/auth/restablecer/route.ts')
const A = '11111111-1111-4111-8111-111111111111'
const B = '22222222-2222-4222-8222-222222222222'
const token = 'synthetic-session-only'
const user = { id: A, email: 'synthetic@example.invalid', email_confirmed_at: 'synthetic', is_anonymous: false }
const session = { access_token: token, user }

function fixture(options = {}) {
  const calls = []
  let listener
  const client = { auth: {
    onAuthStateChange: callback => { listener = callback; return { data: { subscription: { unsubscribe() { listener = undefined } } } } },
    resetPasswordForEmail: async (...args) => { calls.push(['request', ...args]); return { error: options.requestError ?? null } },
    getSession: async () => { calls.push(['session']); return { data: { session: options.session === undefined ? session : options.session }, error: options.sessionError ?? null } },
    getUser: async passedToken => { calls.push(['user', passedToken]); return { data: { user: options.user === undefined ? user : options.user }, error: options.userError ?? null } },
    exchangeCodeForSession: async (...args) => { calls.push(['exchange', ...args]); if (!options.exchangeError) listener?.(options.event ?? 'PASSWORD_RECOVERY'); return { data: { session, user }, error: options.exchangeError ?? null } },
    updateUser: async value => { calls.push(['update', value]); if (options.updateThrow) throw Error('sensitive'); return { data: { user: options.updateUser ?? user }, error: options.updateError ?? null } },
    signOut: async value => { calls.push(['signout', value]); if (options.signOutThrow) throw Error('sensitive'); return { error: options.signOutError ?? null } },
  }, from() { throw Error('Recovery must never access/create a profile') } }
  return { client, calls }
}

test('solicitud recovery: PKCE callback exacto, correo normalizado y sin enumeración', async () => {
  for (const requestError of [null, { status: 400, code: 'user_not_found', message: 'private' }]) {
    const f = fixture({ requestError })
    assert.equal(await requestPasswordRecovery(f.client, ' synthetic@example.invalid ', 'https://qrih-staging.netlify.app'), RECOVERY_NOTICE)
    assert.deepEqual(f.calls, [['request', 'synthetic@example.invalid', { redirectTo: 'https://qrih-staging.netlify.app/auth/callback' }]])
  }
})
test('solicitud: origen inválido no envía, cuota/caída sin filtrar mensajes privados', async () => {
  const credentialOrigin = new URL('https://evil.test')
  credentialOrigin.username = 'synthetic'; credentialOrigin.password = 'invalid'
  for (const origin of ['http://evil.test', credentialOrigin.href, 'https://x.test/path', 'https://x.test/?next=x']) {
    const f = fixture(); await requestPasswordRecovery(f.client, 'synthetic@example.invalid', origin)
    assert.equal(f.calls.length, 0)
  }
  assert.equal(recoveryCallbackUrl('http://127.0.0.1:3107'), 'http://127.0.0.1:3107/auth/callback')
  assert.match(await requestPasswordRecovery(fixture({ requestError: { status: 429, message: 'private' } }).client, 'x', 'https://x.test'), /Espera/)
  assert.match(await requestPasswordRecovery(fixture({ requestError: { status: 503, message: 'private' } }).client, 'x', 'https://x.test'), /no está disponible/)
})
test('contraseña y confirmación: límites y tipo, sin recortar el secreto', () => {
  for (const value of [null, {}, 'short', ' '.repeat(8), 'x'.repeat(129)]) assert.ok(passwordRecoveryValidation(value, value))
  assert.ok(passwordRecoveryValidation('Synthetic!123', 'different'))
  assert.equal(passwordRecoveryValidation(' Synthetic!123 ', ' Synthetic!123 '), null)
  assert.equal(passwordRecoveryValidation('x'.repeat(128), 'x'.repeat(128)), null)
})
test('marca de flujo: 600s, binding token+usuario y Auth verificado, no confiar getSession', async () => {
  const now = 1800000000000
  const marker = createRecoveryMarker(A, token, now)
  const f = fixture()
  assert.equal((await getRecoveryUser(f.client, marker, now)).id, A)
  assert.deepEqual(f.calls, [['session'], ['user', token]])
  for (const options of [{ user: null }, { userError: {} }, { sessionError: {} }, { session: null },
    { user: { ...user, id: B } }, { user: { ...user, is_anonymous: true } },
    { user: { ...user, email_confirmed_at: null } }, { session: { ...session, access_token: 'other-token' } }]) {
    assert.equal(await getRecoveryUser(fixture(options).client, marker, now), null)
  }
  for (const value of [undefined, 'forged', createRecoveryMarker(B, token, now), createRecoveryMarker(A, 'other-token', now)]) {
    assert.equal(await getRecoveryUser(fixture().client, value, now), null)
  }
  assert.equal(await getRecoveryUser(fixture().client, marker, now + RECOVERY_MAX_AGE * 1000), null)
  assert.equal(await getRecoveryUser(fixture().client, marker, now - 1000), null)
})
test('callback recovery real: token/code fuera del destino, marca HttpOnly, sin perfiles', async () => {
  const oldId = process.env.SITE_ID, oldUrl = process.env.URL
  process.env.SITE_ID = 'synthetic-site'; process.env.URL = 'https://qrih-staging.netlify.app'
  try {
    const f = fixture(); globalThis.__recoveryClient = f.client
    const response = await GET(new Request('https://internal.test/auth/callback?code=synthetic-code&sb_flow_id=' + 'a'.repeat(32) + '&type=signup&next=https://evil.test'))
    assert.equal(response.headers.get('location'), 'https://qrih-staging.netlify.app/restablecer-contrasena')
    assert.equal(response.headers.get('cache-control'), 'private, no-store')
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer')
    const cookie = response.headers.get('set-cookie')
    assert.match(cookie, /qrih-recovery=/); assert.match(cookie, /HttpOnly/i); assert.match(cookie, /Secure/i); assert.match(cookie, /SameSite=lax/i); assert.match(cookie, /Max-Age=600/)
    assert.ok(!cookie.includes(token)); assert.ok(!cookie.includes(A))
    assert.deepEqual(f.calls, [['exchange', 'synthetic-code', { flowId: 'a'.repeat(32) }], ['user', undefined]])
    for (const options of [{ user: null }, { user: { ...user, id: B } }, { userError: {} }]) {
      globalThis.__recoveryClient = fixture(options).client
      assert.equal(new URL((await GET(new Request('https://internal.test/auth/callback?code=x'))).headers.get('location')).pathname, '/recuperar-contrasena')
    }
    const invalidFlow = fixture(); globalThis.__recoveryClient = invalidFlow.client
    await GET(new Request('https://internal.test/auth/callback?code=x&sb_flow_id=invalid'))
    assert.equal(invalidFlow.calls.length, 0)
  } finally {
    delete globalThis.__recoveryClient
    if (oldId === undefined) delete process.env.SITE_ID; else process.env.SITE_ID = oldId
    if (oldUrl === undefined) delete process.env.URL; else process.env.URL = oldUrl
  }
})

function request(body = { password: 'Synthetic!123', confirmation: 'Synthetic!123' }, origin = 'https://qrih-staging.netlify.app') {
  return new Request('https://internal.test/api/auth/restablecer', { method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) }, body: JSON.stringify(body) })
}
test('POST real: mismo origen obligatorio, body acotado, sin sesión/marca no actualiza', async () => {
  const oldId = process.env.SITE_ID, oldUrl = process.env.URL
  process.env.SITE_ID = 'synthetic-site'; process.env.URL = 'https://qrih-staging.netlify.app'
  try {
    const f = fixture(); globalThis.__recoveryClient = f.client; globalThis.__recoveryMarker = undefined
    for (const origin of [null, 'https://evil.test', 'null']) assert.equal((await POST(request(undefined, origin))).status, 403)
    assert.equal((await POST(request())).status, 401)
    assert.equal((await POST(request({ password: 'x', confirmation: 'x' }))).status, 400)
    assert.equal((await POST(request({ password: 'x'.repeat(5000), confirmation: 'x'.repeat(5000) }))).status, 400)
    assert.equal(f.calls.length, 0)
    globalThis.__recoveryMarker = createRecoveryMarker(A, token)
    globalThis.__recoveryClient = fixture({ user: { ...user, id: B } }).client
    assert.equal((await POST(request())).status, 401)
  } finally {
    delete globalThis.__recoveryClient; delete globalThis.__recoveryMarker
    if (oldId === undefined) delete process.env.SITE_ID; else process.env.SITE_ID = oldId
    if (oldUrl === undefined) delete process.env.URL; else process.env.URL = oldUrl
  }
})
test('POST válido: sólo contraseña propia, logout global, marca retirada y error honesto', async () => {
  const oldId = process.env.SITE_ID, oldUrl = process.env.URL
  process.env.SITE_ID = 'synthetic-site'; process.env.URL = 'https://qrih-staging.netlify.app'
  try {
    globalThis.__recoveryMarker = createRecoveryMarker(A, token)
    for (const options of [{}, { signOutError: {} }, { signOutThrow: true }]) {
      const f = fixture(options); globalThis.__recoveryClient = f.client
      const response = await POST(request({ password: 'Synthetic!123', confirmation: 'Synthetic!123', role: 'admin', email: 'other@example.invalid', user_id: B }))
      assert.equal(response.status, 200)
      assert.deepEqual(await response.json(), { ok: true, signedOut: !options.signOutError && !options.signOutThrow })
      assert.match(response.headers.get('set-cookie'), /Max-Age=0/)
      assert.equal(response.headers.get('cache-control'), 'private, no-store')
      assert.deepEqual(f.calls.slice(2), [['update', { password: 'Synthetic!123' }], ['signout', { scope: 'global' }]])
    }
    for (const options of [{ updateError: { status: 400, message: 'private' } }, { updateThrow: true }, { updateUser: { ...user, id: B } }]) {
      const f = fixture(options); globalThis.__recoveryClient = f.client
      const response = await POST(request()); assert.ok(response.status >= 400)
      assert.ok(!(await response.text()).includes('private'))
      assert.ok(!f.calls.some(call => call[0] === 'signout'))
    }
  } finally {
    delete globalThis.__recoveryClient; delete globalThis.__recoveryMarker
    if (oldId === undefined) delete process.env.SITE_ID; else process.env.SITE_ID = oldId
    if (oldUrl === undefined) delete process.env.URL; else process.env.URL = oldUrl
  }
})

test('SDK SSR instalado: cookies PKCE aisladas + evento público + cambio, HTTP sintético sin correos', async () => {
  const oldId = process.env.SITE_ID, oldUrl = process.env.URL
  process.env.SITE_ID = 'synthetic-site'; process.env.URL = 'https://qrih-staging.netlify.app'
  const jar = new Map(), operations = []
  let challenge, recoveryRedirect
  const access = [Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
    Buffer.from(JSON.stringify({ sub: A, exp: Math.floor(Date.now()/1000)+3600 })).toString('base64url'), 'synthetic-signature'].join('.')
  const cookies = {
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    setAll: values => { for (const { name, value } of values) { if (value) jar.set(name, value); else jar.delete(name) } },
  }
  const fakeFetch = async (input, init = {}) => {
    const url = new URL(String(input)); const payload = init.body ? JSON.parse(init.body) : null
    operations.push([url.pathname, init.method ?? 'GET'])
    let response
    if (url.pathname === '/auth/v1/recover') {
      challenge = payload.code_challenge; recoveryRedirect = url.searchParams.get('redirect_to')
      assert.equal(payload.email, user.email); response = {}
    } else if (url.pathname === '/auth/v1/token') {
      assert.equal(url.searchParams.get('grant_type'), 'pkce')
      assert.equal(createHash('sha256').update(payload.code_verifier).digest('base64url'), challenge)
      response = { access_token: access, refresh_token: 'synthetic-refresh', token_type: 'bearer', expires_in: 3600, user }
    } else if (url.pathname === '/auth/v1/user') {
      if (init.method === 'PUT') assert.deepEqual(payload, { password: 'Synthetic!123', code_challenge: null, code_challenge_method: null })
      response = user
    } else if (url.pathname === '/auth/v1/logout') {
      assert.equal(url.searchParams.get('scope'), 'global'); response = {}
    } else throw Error('Unexpected SDK request')
    return new Response(JSON.stringify(response), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  const options = { cookies, global: { fetch: fakeFetch }, auth: { autoRefreshToken: false, detectSessionInUrl: false } }
  const browser = createBrowserClient('https://synthetic-project.supabase.co', 'sb_publishable_synthetic', { ...options, isSingleton: false })
  const server = createServerClient('https://synthetic-project.supabase.co', 'sb_publishable_synthetic', options)
  try {
    assert.equal(await requestPasswordRecovery(browser, user.email, process.env.URL), RECOVERY_NOTICE)
    assert.ok(jar.size > 0)
    const callback = new URL(recoveryRedirect); callback.searchParams.set('code', 'synthetic-valid-code')
    globalThis.__recoveryClient = server
    const response = await GET(new Request(callback))
    assert.equal(response.headers.get('location'), 'https://qrih-staging.netlify.app/restablecer-contrasena')
    globalThis.__recoveryMarker = response.cookies.get('qrih-recovery').value
    const update = await POST(request())
    assert.deepEqual(await update.json(), { ok: true, signedOut: true })
    assert.equal(operations.filter(([path]) => path === '/auth/v1/recover').length, 1)
    assert.equal(operations.filter(([path, method]) => path === '/auth/v1/user' && method === 'PUT').length, 1)
  } finally {
    browser.auth.stopAutoRefresh(); server.auth.stopAutoRefresh()
    delete globalThis.__recoveryClient; delete globalThis.__recoveryMarker
    if (oldId === undefined) delete process.env.SITE_ID; else process.env.SITE_ID = oldId
    if (oldUrl === undefined) delete process.env.URL; else process.env.URL = oldUrl
  }
})
