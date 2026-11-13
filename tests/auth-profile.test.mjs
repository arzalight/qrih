import assert from 'node:assert/strict'
import { test } from 'node:test'
import { registerHooks } from 'node:module'

registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === '@/lib/supabase-server') return {
    url: 'data:text/javascript,export async function createServerSupabaseClient(){return globalThis.__qrihAuthTestClient}',
    shortCircuit: true,
  }
  if (specifier === '@/lib/auth-profile') return nextResolve(new URL('../lib/auth-profile.ts', import.meta.url).href, context)
  if (specifier === '@/lib/request-security') return nextResolve(new URL('../lib/request-security.ts', import.meta.url).href, context)
  if (specifier === '@/lib/password-recovery-server') return nextResolve(new URL('../lib/password-recovery-server.ts', import.meta.url).href, context)
  if (specifier === 'server-only') return { url: 'data:text/javascript,export {}', shortCircuit: true }
  if (specifier === 'next/server') return nextResolve(new URL('../node_modules/next/server.js', import.meta.url).href, context)
  return nextResolve(specifier, context)
}})
const { ensureOwnProfile } = await import('../lib/auth-profile.ts')
const { GET } = await import('../app/auth/callback/route.ts')
const A = '11111111-1111-4111-8111-111111111111'
const B = '22222222-2222-4222-8222-222222222222'
const defaults = { id: A, role: 'publisher', account_status: 'active' }

function fixture(options = {}) {
  let row = options.row ?? null
  let reads = 0
  const writes = []
  const user = options.user === undefined ? {
    id: A, email_confirmed_at: '2026-10-04T00:00:00Z',
    user_metadata: { full_name: ' Synthetic Name ', phone: '0'.repeat(40),
      company_name: 'x'.repeat(180), user_type: 'advisor', id: B, role: 'admin', plan: 'paid',
      account_status: 'suspended', is_verified: true, publications_enabled: false, public_id: 9 },
  } : options.user
  const client = {
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      getUser: async () => {
        if (options.throwSession) throw new Error('sensitive synthetic error')
        return { data: { user }, error: options.sessionError ?? null }
      },
      exchangeCodeForSession: async () => ({ error: options.exchangeError ?? null }),
    },
    from(table) {
      assert.equal(table, 'profiles')
      return {
        select(columns) {
          assert.equal(columns, 'id,role,account_status')
          return { eq(column, id) {
            assert.equal(column, 'id'); assert.equal(id, A)
            return { maybeSingle: async () => {
              reads++
              if (options.lookupError || (options.verifyError && reads > 1)) {
                return { data: null, error: { code: '42501' } }
              }
              return { data: row, error: null }
            } }
          } }
        },
        async insert(value) {
          writes.push(value)
          if (options.insertError) {
            if (options.conflictRow) row = options.conflictRow
            return { error: { code: options.insertError } }
          }
          if (row) return { error: { code: '23505' } }
          if (!options.omitInsertedRow) row = { ...value, ...defaults }
          return { error: null }
        },
      }
    },
  }
  return { client, writes, get row() { return row }, get reads() { return reads } }
}

test('perfil propio faltante: INSERT whitelist, identidad validada y defaults de BD', async () => {
  const f = fixture()
  const result = await ensureOwnProfile(f.client)
  assert.equal(result.ok, true)
  assert.equal(result.profile.role, 'publisher')
  assert.equal(result.profile.account_status, 'active')
  assert.deepEqual(Object.keys(f.writes[0]).sort(), ['id', 'full_name', 'phone', 'company_name', 'user_type'].sort())
  assert.equal(f.writes[0].id, A)
  assert.equal(f.writes[0].full_name, 'Synthetic Name')
  assert.equal(f.writes[0].phone.length, 30)
  assert.equal(f.writes[0].company_name.length, 160)
  assert.equal(f.reads, 2)
})
test('perfil existente, admin y suspendido nunca se sobrescriben', async () => {
  for (const role of ['publisher', 'admin']) for (const status of ['active', 'suspended']) {
    const row = { ...defaults, role, account_status: status, full_name: 'existing', plan: 'existing' }
    const f = fixture({ row })
    assert.deepEqual(await ensureOwnProfile(f.client), { ok: true, profile: row })
    assert.equal(f.writes.length, 0)
    assert.equal(f.row, row)
  }
})
test('sin usuario, sesión inválida, no confirmado o anónimo: sin lectura/escritura', async () => {
  for (const options of [{ user: null }, { sessionError: {} }, { throwSession: true },
    { user: { id: A } }, { user: { id: A, email_confirmed_at: 'synthetic', is_anonymous: true } }]) {
    const f = fixture(options)
    assert.deepEqual(await ensureOwnProfile(f.client), { ok: false, stage: 'session' })
    assert.equal(f.writes.length, 0); assert.equal(f.reads, 0)
  }
})
test('lookup denegado no se interpreta como perfil faltante', async () => {
  const f = fixture({ lookupError: true })
  assert.deepEqual(await ensureOwnProfile(f.client), { ok: false, stage: 'lookup' })
  assert.equal(f.writes.length, 0)
})
test('metadata inválida no fabrica identidad ni nombre; user_type sin privilegios', async () => {
  for (const full_name of ['', '  ', null, { toString: () => 'forged' }]) {
    const f = fixture({ user: { id: A, email_confirmed_at: 'synthetic', user_metadata: { full_name } } })
    assert.deepEqual(await ensureOwnProfile(f.client), { ok: false, stage: 'metadata' })
    assert.equal(f.writes.length, 0)
  }
  const f = fixture({ user: { id: A, email_confirmed_at: 'synthetic', user_metadata: {
    full_name: 'n'.repeat(160), phone: {}, company_name: 10, user_type: 'admin', role: 'admin', id: B,
  } } })
  assert.equal((await ensureOwnProfile(f.client)).ok, true)
  assert.equal(f.writes[0].full_name.length, 120)
  assert.equal(f.writes[0].phone, null); assert.equal(f.writes[0].company_name, null)
  assert.equal(f.writes[0].user_type, null)
})
test('INSERT fallido y verificación fallida no permiten continuar', async () => {
  for (const options of [{ insertError: '42501' }, { insertError: 'P0001' },
    { verifyError: true }, { omitInsertedRow: true }]) {
    const f = fixture(options)
    assert.equal((await ensureOwnProfile(f.client)).ok, false)
    assert.equal(f.writes.length, 1)
  }
})
test('23505 sólo acepta fila propia verificada; no oculta conflicto de otra columna', async () => {
  for (const conflictRow of [null, { ...defaults, id: B }, { ...defaults, role: 'invalid' }]) {
    assert.equal((await ensureOwnProfile(fixture({ insertError: '23505', conflictRow }).client)).ok, false)
  }
  const f = fixture({ insertError: '23505', conflictRow: { ...defaults, account_status: 'suspended' } })
  assert.equal((await ensureOwnProfile(f.client)).profile.account_status, 'suspended')
})
test('inicialización concurrente e idempotencia: una fila sin UPDATE/upsert', async () => {
  const f = fixture()
  const results = await Promise.all([ensureOwnProfile(f.client), ensureOwnProfile(f.client)])
  assert.ok(results.every(result => result.ok))
  assert.equal(f.row.id, A)
  const before = f.writes.length
  assert.equal((await ensureOwnProfile(f.client)).ok, true)
  assert.equal(f.writes.length, before)
})
test('callback ejecuta la ruta real: origen canónico, cache privada y fallos seguros', async () => {
  const previousId = process.env.SITE_ID, previousUrl = process.env.URL
  const previousWarn = console.warn
  const logs = []
  process.env.SITE_ID = 'synthetic-site'; process.env.URL = 'https://qrih-staging.netlify.app'
  console.warn = (...values) => logs.push(values.join(' '))
  try {
    for (const [options, code, target] of [
      [{}, '', '/login?error=confirmation'],
      [{ exchangeError: { message: 'sensitive synthetic error' } }, 'used-code', '/login?error=confirmation'],
      [{ user: null }, 'test-code', '/login?error=profile'],
      [{ insertError: '42501' }, 'test-code', '/login?error=profile'],
      [{}, 'test-code', '/mis-propiedades'],
    ]) {
      const f = fixture(options); globalThis.__qrihAuthTestClient = f.client
      const response = await GET(new Request(`https://internal.test/auth/callback?code=${code}&type=recovery&next=https://evil.test`, {
        headers: { Host: 'evil.test', 'X-Forwarded-Host': 'evil.test' },
      }))
      assert.equal(response.status, 307)
      assert.equal(response.headers.get('location'), `https://qrih-staging.netlify.app${target}`)
      assert.equal(response.headers.get('cache-control'), 'private, no-store')
      assert.ok(!response.headers.get('set-cookie')?.includes('qrih-recovery'))
      if (!code || options.exchangeError) assert.equal(f.writes.length, 0)
    }
    for (const next of ['/publicar', '/busco-bodega']) {
      globalThis.__qrihAuthTestClient = fixture().client
      const resumed = await GET(new Request(`https://internal.test/auth/callback?code=test&next=${encodeURIComponent(next)}`))
      assert.equal(resumed.headers.get('location'), `https://qrih-staging.netlify.app${next}`)
    }
    globalThis.__qrihAuthTestClient = null
    assert.match((await GET(new Request('https://internal.test/auth/callback?code=test'))).headers.get('location'), /error=config$/)
    process.env.URL = 'http://evil.test'
    assert.equal((await GET(new Request('https://internal.test/auth/callback?code=test'))).status, 503)
    assert.ok(logs.length > 0)
    for (const log of logs) assert.match(log, /^QRIH_AUTH_CALLBACK_FAILURE \{"stage":"(?:origin|code|config|exchange|profile_(?:session|lookup|metadata|insert|verify))"\}$/)
  } finally {
    console.warn = previousWarn; delete globalThis.__qrihAuthTestClient
    if (previousId === undefined) delete process.env.SITE_ID; else process.env.SITE_ID = previousId
    if (previousUrl === undefined) delete process.env.URL; else process.env.URL = previousUrl
  }
})
