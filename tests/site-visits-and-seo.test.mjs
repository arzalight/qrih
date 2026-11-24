import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { after, test } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'server-only') return { url: 'data:text/javascript,export {}', shortCircuit: true }
    if (specifier === '@/lib/supabase-public-server') {
      return {
        url: 'data:text/javascript,export function createPublicServerSupabaseClient(){return globalThis.__visitsSupabase}',
        shortCircuit: true,
      }
    }
    if (specifier.startsWith('@/')) {
      return nextResolve(new URL('file://' + root + specifier.slice(2) + '.ts').href, context)
    }
    if (specifier === 'next/server') {
      return nextResolve(new URL('../node_modules/next/server.js', import.meta.url).href, context)
    }
    return nextResolve(specifier, context)
  },
})

const { classifyPublicVisitPath, hashVisitSession, isLikelyBotUserAgent } = await import('../lib/site-visits.ts')
const { POST: postVisit } = await import('../app/api/visits/route.ts')
const { createAdminMetricsLoader } = await import('../lib/admin-metrics.ts')
const { googleSiteVerification, homeJsonLd, publicMetadata } = await import('../lib/seo.ts')

const savedEnv = Object.fromEntries(
  ['QRIH_PUBLIC_ORIGIN', 'QRIH_INDEXING_ENABLED', 'QRIH_GOOGLE_SITE_VERIFICATION', 'CONTEXT', 'URL', 'SITE_ID'].map(
    (k) => [k, process.env[k]]
  )
)

after(() => {
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
})

test('site-visits: clasifica rutas públicas y excluye rutas privadas/admin/auth', () => {
  assert.equal(classifyPublicVisitPath('/'), 'home')
  assert.equal(classifyPublicVisitPath('/inventario?operation=Renta'), 'inventory')
  assert.equal(classifyPublicVisitPath('/bodegas/nave-industrial-qro'), 'property')
  assert.equal(classifyPublicVisitPath('/busco-bodega'), 'demand')
  assert.equal(classifyPublicVisitPath('/asesor/1001'), 'advisor')
  assert.equal(classifyPublicVisitPath('/privacidad'), 'legal')
  assert.equal(classifyPublicVisitPath('/terminos'), 'legal')

  for (const blocked of ['/admin', '/admin/asesores', '/perfil', '/mis-propiedades', '/notificaciones', '/login', '/registro', '/publicar', '/ficha/abc', '/api/visits']) {
    assert.equal(classifyPublicVisitPath(blocked), null)
  }
})

test('site-visits: filtra bots conocidos y acepta navegadores reales', () => {
  for (const bot of ['', 'curl/8.7.1', 'Googlebot/2.1', 'Mozilla/5.0 HeadlessChrome/130.0', 'WhatsApp/2.24', 'Mozilla/5.0 (compatible; AhrefsBot/7.0)']) {
    assert.equal(isLikelyBotUserAgent(bot), true)
  }
  const realChrome = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  const realSafariIos = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
  assert.equal(isLikelyBotUserAgent(realChrome), false)
  assert.equal(isLikelyBotUserAgent(realSafariIos), false)
})

test('site-visits: hash SHA-256 por sesión y día UTC valida UUID y no guarda el token crudo', () => {
  const sid = '11111111-2222-4333-8444-555555555555'
  const h1 = hashVisitSession(sid, '2026-11-24')
  const h2 = hashVisitSession(sid, '2026-11-25')
  assert.match(h1, /^[0-9a-f]{64}$/)
  assert.notEqual(h1, h2)
  assert.ok(!h1.includes(sid))
  assert.equal(hashVisitSession('not-a-uuid', '2026-11-24'), null)
})

test('POST /api/visits: valida origen, ignora bots/privadas, invoca RPC anónimo y responde privado', async () => {
  delete process.env.SITE_ID
  const rpcCalls = []
  globalThis.__visitsSupabase = {
    async rpc(name, args) {
      rpcCalls.push({ name, args })
      return { data: true, error: null }
    },
  }

  const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36'
  const sid = '11111111-2222-4333-8444-555555555555'

  const badOrigin = await postVisit(new Request('http://localhost:3000/api/visits', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://evil.example', 'user-agent': ua },
    body: JSON.stringify({ sessionId: sid, path: '/' }),
  }))
  assert.equal(badOrigin.status, 403)
  assert.equal(rpcCalls.length, 0)

  const botRes = await postVisit(new Request('http://localhost:3000/api/visits', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:3000', 'user-agent': 'Googlebot/2.1' },
    body: JSON.stringify({ sessionId: sid, path: '/' }),
  }))
  assert.equal(botRes.status, 200)
  assert.equal((await botRes.json()).ignored, 'bot')
  assert.equal(rpcCalls.length, 0)

  const adminPathRes = await postVisit(new Request('http://localhost:3000/api/visits', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:3000', 'user-agent': ua },
    body: JSON.stringify({ sessionId: sid, path: '/admin' }),
  }))
  assert.equal(adminPathRes.status, 200)
  assert.equal((await adminPathRes.json()).ignored, 'non_public_path')
  assert.equal(rpcCalls.length, 0)

  const okRes = await postVisit(new Request('http://localhost:3000/api/visits', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:3000', 'user-agent': ua },
    body: JSON.stringify({ sessionId: sid, path: '/inventario' }),
  }))
  assert.equal(okRes.status, 200)
  assert.match(okRes.headers.get('cache-control') || '', /no-store/)
  assert.deepEqual(await okRes.json(), { ok: true, recorded: true })
  assert.equal(rpcCalls.length, 1)
  assert.equal(rpcCalls[0].name, 'qrih_record_site_visit')
  assert.equal(rpcCalls[0].args.p_landing_group, 'inventory')
  assert.match(rpcCalls[0].args.p_session_hash, /^[0-9a-f]{64}$/)
})

test('admin-metrics: muestra visitas y comparativa cuando qrih_admin_metrics_snapshot las entrega', async () => {
  const loader = createAdminMetricsLoader()
  const mockActor = {
    auth: { async getUser() { return { data: { user: { id: 'admin-1', is_anonymous: false } }, error: null } } },
    from() { return { select() { return this }, eq() { return this }, async single() { return { data: { role: 'admin', account_status: 'active' }, error: null } } } },
    async rpc() {
      return {
        data: {
          published: 20, expired: 1, users: 15, pending: 2,
          links: 5, previous_links: 3, contacts: 8, previous_contacts: 4,
          visits: 142, previous_visits: 110,
          soon: 0, draft: 1, paused: 0, rejected: 2, updates: 1, new_users: 4, previous_users: 2,
        },
        error: null,
      }
    },
  }
  const metrics = await loader(mockActor)
  const visits = metrics.find((m) => m.key === 'visits')
  assert.equal(visits.value, 142)
  assert.equal(visits.previous, 110)
})

test('SEO: imagen OG, Search Console solo en producción y JSON-LD Home', () => {
  Object.assign(process.env, {
    QRIH_PUBLIC_ORIGIN: 'https://qrih.example.com',
    QRIH_INDEXING_ENABLED: 'true',
    QRIH_GOOGLE_SITE_VERIFICATION: 'abc123_XYZ-9876543210',
    CONTEXT: 'production',
    URL: 'https://qrih.example.com',
  })

  assert.equal(googleSiteVerification(), 'abc123_XYZ-9876543210')
  assert.equal(googleSiteVerification({ ...process.env, CONTEXT: 'branch-deploy' }), null)
  assert.equal(googleSiteVerification({ ...process.env, QRIH_GOOGLE_SITE_VERIFICATION: '<script>' }), null)

  const meta = publicMetadata('/', 'Inicio | QRIH', 'Descripción')
  assert.equal(meta.openGraph.images[0].url, 'https://qrih.example.com/og-qrih.png')
  assert.equal(meta.twitter.card, 'summary_large_image')

  const ld = homeJsonLd('https://qrih.example.com')
  assert.equal(ld['@graph'].length, 2)
  assert.equal(ld['@graph'][0]['@type'], 'Organization')
  assert.equal(ld['@graph'][1]['@type'], 'WebSite')
  assert.equal(homeJsonLd(null), null)
})

test('assets SEO y migración site_visits: archivos generados y contrato de seguridad', () => {
  for (const rel of ['app/icon.png', 'app/apple-icon.png', 'public/icons/icon-192.png', 'public/icons/icon-512.png', 'public/og-qrih.png']) {
    assert.ok(existsSync(root + rel), `Falta asset SEO ${rel}`)
  }

  const sql = readFileSync(root + 'supabase/migrations/20261124160000_site_visits_analytics.sql', 'utf8')
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/i)
  assert.match(sql, /REVOKE ALL ON TABLE public\.site_visits FROM PUBLIC, anon, authenticated/i)
  assert.match(sql, /SECURITY DEFINER/i)
  assert.match(sql, /SET search_path = ''/i)
  assert.match(sql, /'visits', v_visits/)
  assert.match(sql, /'previous_visits', v_previous_visits/)
})
