import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { registerHooks, stripTypeScriptTypes } from 'node:module'
import { after, test } from 'node:test'
import babel from '@babel/core'
import { calculateMatch, rankDemandsForProperty, rankPropertiesForDemand } from '../lib/matching.ts'

const matchingDemand = { operation: 'Renta', zone_general: 'El Marqués', zone: 'El Marqués', area_min: 234, area_max: 234 }
const matchingProperty = { operation: 'Renta', zone_general: 'El Marqués', zone: 'El Marqués' }
test('matching: reproduce falsos positivos 90/5440/5511m² y los excluye antes del top3 para 234m²', () => {
  assert.equal(calculateMatch({ ...matchingProperty, surface_m2: 5440 }, matchingDemand).total, 70)
  assert.ok(calculateMatch({ ...matchingProperty, surface_m2: 90 }, matchingDemand).total >= 75)
  const candidates = [90, 5440, 5511, 234].map(surface_m2 => ({ ...matchingProperty, surface_m2 }))
  const ranked = rankPropertiesForDemand(matchingDemand, candidates)
  assert.deepEqual(ranked.map(entry => entry.property.surface_m2), [234])
  assert.equal(ranked[0].result.total, calculateMatch(candidates[3], matchingDemand).total)
  assert.deepEqual(rankPropertiesForDemand(matchingDemand, candidates.slice(0, 3)), [])
})
for (const [bounds, expected] of [
  [{ area_min: 200, area_max: 300 }, [200, 234, 300]],
  [{ area_min: 234, area_max: null }, [234, 300, 5440]],
  [{ area_min: null, area_max: 234 }, [90, 200, 234]],
]) {
  test(`matching: extremos inclusivos y rango abierto ${JSON.stringify(bounds)}`, () => {
    const areas = [90, 200, 234, 300, 5440]
    const ranked = rankPropertiesForDemand({ ...matchingDemand, ...bounds }, areas.map(surface_m2 => ({ ...matchingProperty, surface_m2 })))
    assert.deepEqual(ranked.map(entry => entry.property.surface_m2).sort((a, b) => a - b), expected)
  })
}
test('matching: con rango no fabrica compatibilidad para superficie ausente o no finita', () => {
  for (const surface_m2 of [null, undefined, NaN, Infinity, -1]) {
    assert.deepEqual(rankPropertiesForDemand(matchingDemand, [{ ...matchingProperty, surface_m2 }]), [])
  }
  for (const bounds of [{ area_min: 300, area_max: 200 }, { area_min: NaN }, { area_max: Infinity }, { area_min: -1 }]) {
    assert.deepEqual(rankPropertiesForDemand({ ...matchingDemand, ...bounds }, [{ ...matchingProperty, surface_m2: 234 }]), [])
  }
})
test('matching: sin rango conserva clasificación y puntuaciones previas, sin tolerancia o moneda inventadas', () => {
  const demand = { ...matchingDemand, area_min: null, area_max: null }
  const properties = [90, 5440, null].map(surface_m2 => ({ ...matchingProperty, surface_m2 }))
  const expected = properties.map(property => ({ property, result: calculateMatch(property, demand) }))
    .sort((a, b) => b.result.total - a.result.total)
  assert.deepEqual(rankPropertiesForDemand(demand, properties), expected)
})
test('matching: ranking inverso de administración respeta el mismo rango de superficie', () => {
  const demands = [matchingDemand, { ...matchingDemand, area_min: 5000, area_max: 6000 }]
  assert.deepEqual(rankDemandsForProperty({ ...matchingProperty, surface_m2: 5440 }, demands).map(entry => entry.demand), [demands[1]])
})

registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === '@/lib/supabase-server') return {
    url: 'data:text/javascript,export async function createServerSupabaseClient(){return globalThis.__qrihOpportunityClient}',
    shortCircuit: true,
  }
  if (specifier === '@/lib/request-security') return nextResolve(new URL('../lib/request-security.ts', import.meta.url).href, context)
  if (specifier === 'next/server') return nextResolve(new URL('../node_modules/next/server.js', import.meta.url).href, context)
  return nextResolve(specifier, context)
} })
const { POST } = await import('../app/api/registrar-oportunidad/route.ts')
const A = '11111111-1111-4111-8111-111111111111'
const B = '22222222-2222-4222-8222-222222222222'
const C = '33333333-3333-4333-8333-333333333333'
const testOrigin = 'https://qrih-synthetic.invalid'
const inheritedProviderOrigin = { SITE_ID: process.env.SITE_ID, URL: process.env.URL }
process.env.SITE_ID = 'qrih-synthetic-test'
process.env.URL = testOrigin
after(() => {
  for (const [key, value] of Object.entries(inheritedProviderOrigin)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})
function fixture(options = {}) {
  const rpcs = []
  globalThis.__qrihOpportunityClient = options.noClient ? null : {
    auth: { async getUser() {
      if (options.throwAuth) throw new Error('sensitive synthetic error')
      return { data: { user: options.noUser ? null : { id: C, user_metadata: { role: 'admin' } } },
        error: options.authError ? { message: 'sensitive synthetic error' } : null }
    } },
    from() { assert.fail('La ruta no debe leer ni insertar tablas privadas directamente') },
    async rpc(name, args) {
      rpcs.push([name, args])
      if (options.throwRpc) throw new Error('sensitive synthetic error')
      return { data: options.data === undefined ? C : options.data,
        error: options.code ? { code: options.code, message: 'sensitive synthetic error' } : null }
    },
  }
  return rpcs
}
function request({ demand = A, property = B, origin = testOrigin } = {}) {
  const body = new FormData()
  body.set('demand_request_id', demand); body.set('property_id', property)
  body.set('registered_by', B); body.set('role', 'admin')
  return new Request(testOrigin + '/api/registrar-oportunidad', {
    method: 'POST', headers: { Origin: origin }, body,
  })
}
test('ruta real: actor de sesión, sólo dos IDs al RPC, cache privada y éxito verificado', async () => {
  const calls = fixture()
  const response = await POST(request())
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  assert.deepEqual(calls, [['qrih_register_opportunity', { p_demand_request_id: A, p_property_id: B }]])
  assert.equal((await response.json()).registration_id, C)
})
test('ruta real: sesión/origen/UUID inválidos no ejecutan RPC', async () => {
  for (const [options, input, status] of [[{ noClient: true }, {}, 500], [{ noUser: true }, {}, 401],
    [{ authError: true }, {}, 401], [{ throwAuth: true }, {}, 503], [{}, { origin: 'https://evil.invalid' }, 400],
    [{}, { property: 'invalid' }, 400], [{}, { demand: '' }, 400]]) {
    const calls = fixture(options); const response = await POST(request(input))
    assert.equal(response.status, status); assert.equal(calls.length, 0)
    assert.equal(response.headers.get('cache-control'), 'private, no-store')
  }
})
test('ruta real: duplicado/denegación/error y respuesta inválida no filtran detalles ni simulan éxito', async () => {
  for (const [options, status] of [[{ code: '23505' }, 409], [{ code: '42501' }, 403],
    [{ code: 'P0001' }, 403], [{ code: 'XX000' }, 503], [{ throwRpc: true }, 503],
    [{ data: null }, 503], [{ data: 'not-an-id' }, 503]]) {
    fixture(options); const response = await POST(request())
    assert.equal(response.status, status)
    assert.equal(response.headers.get('cache-control'), 'private, no-store')
    assert.doesNotMatch(await response.text(), /sensitive|registration_id|"success":true/)
  }
})

const source = readFileSync(new URL('../components/RegisterOpportunityButton.tsx', import.meta.url), 'utf8')
const ast = babel.parseSync(source, { filename: 'RegisterOpportunityButton.tsx', configFile: false, babelrc: false,
  plugins: [['@babel/plugin-syntax-typescript', { isTSX: true }]] })
let submitNode
babel.traverse(ast, { FunctionDeclaration(path) { if (path.node.id.name === 'submit') submitNode = path.node } })
assert.ok(submitNode)
function button(options = {}) {
  const state = { loading: false, registered: false, message: '', calls: 0, refreshes: 0 }
  const bindings = {
    loading: options.loading ?? false, registered: options.registered ?? false,
    demandRequestId: A, propertyId: B, FormData,
    setLoading(value) { state.loading = value }, setRegistered(value) { state.registered = value },
    setMessage(value) { state.message = value }, router: { refresh() { state.refreshes++ } },
    async fetch(url, init) {
      state.calls++; assert.equal(url, '/api/registrar-oportunidad'); assert.equal(init.method, 'POST')
      assert.deepEqual([...init.body.entries()], [['demand_request_id', A], ['property_id', B]])
      if (options.throw) throw new Error('sensitive synthetic error')
      return { ok: options.status === undefined || options.status === 200, status: options.status ?? 200 }
    },
  }
  const submit = new Function(...Object.keys(bindings),
    `return (${stripTypeScriptTypes(source.slice(submitNode.start, submitNode.end), { mode: 'strip' })})`)(...Object.values(bindings))
  return { state, submit }
}
test('botón real: éxito/duplicado conserva panel, marca registrado y refresca sin navegar a JSON', async () => {
  for (const status of [200, 409]) {
    const f = button({ status }); await f.submit()
    assert.equal(f.state.calls, 1); assert.equal(f.state.registered, true)
    assert.equal(f.state.loading, false); assert.equal(f.state.refreshes, 1)
    assert.match(f.state.message, /postulada/)
  }
  assert.match(source, /disabled=\{loading \|\| registered\}/)
})
test('botón real: bloqueado no envía; fallo o red incierta no reintenta ni finge registro', async () => {
  for (const options of [{ loading: true }, { registered: true }, { status: 403 }, { status: 503 }, { throw: true }]) {
    const f = button(options); await f.submit()
    assert.equal(f.state.calls, options.loading || options.registered ? 0 : 1)
    assert.equal(f.state.refreshes, 0); assert.equal(f.state.registered, false)
    assert.doesNotMatch(f.state.message, /sensitive/)
    if (options.throw) assert.match(f.state.message, /Recarga antes/)
  }
})
test('panel usa feed/listado autorizados y botón existente, sin formulario nativo a JSON', () => {
  const panel = readFileSync(new URL('../app/mis-propiedades/page.tsx', import.meta.url), 'utf8')
  assert.match(panel, /\.rpc\('qrih_opportunity_feed'\)/)
  assert.match(panel, /\.rpc\('qrih_opportunity_registrations'\)/)
  assert.match(panel, /<RegisterOpportunityButton/)
  assert.doesNotMatch(panel, /action="\/api\/registrar-oportunidad"/)
})
