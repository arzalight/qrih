import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import { after, test } from 'node:test'

registerHooks({ resolve(specifier, context, nextResolve) {
  const aliases = {
    '@/lib/supabase-server': 'data:text/javascript,export async function createServerSupabaseClient(){return globalThis.__qrihWriteClient}',
    '@/lib/verified-media-server': 'data:text/javascript,export async function uploadVerifiedImage(file,owner,bucket){return globalThis.__qrihWriteUpload(file,owner,bucket)}',
  }
  if (aliases[specifier]) return { url: aliases[specifier], shortCircuit: true }
  if (specifier === '@/lib/property-save-server') return nextResolve(new URL('../lib/property-save-server.ts', import.meta.url).href, context)
  if (specifier === '@/lib/request-security') return nextResolve(new URL('../lib/request-security.ts', import.meta.url).href, context)
  if (specifier === 'next/server') return nextResolve(new URL('../node_modules/next/server.js', import.meta.url).href, context)
  return nextResolve(specifier, context)
} })
const { POST: edit } = await import('../app/api/editar-propiedad/route.ts')
const { POST: remove } = await import('../app/api/eliminar-propiedad/route.ts')
const owner = '11111111-1111-4111-8111-111111111111'
const property = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const oldPath = `${owner}/old.webp`, newPath = `${owner}/new.webp`
const origin = 'https://qrih-synthetic.invalid'

// Keep the real origin guard enabled, but never inherit a provider's live URL.
// Node runs each test file in a separate process; restore its env after the suite.
const inheritedProviderOrigin = { SITE_ID: process.env.SITE_ID, URL: process.env.URL }
process.env.SITE_ID = 'qrih-synthetic-test'
process.env.URL = origin
after(() => {
  for (const [key, value] of Object.entries(inheritedProviderOrigin)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

function fixture(options = {}) {
  const state = { committed: false, uploadAttempts: 0, uploads: [], removals: [], rpcs: [], filters: [] }
  globalThis.__qrihWriteUpload = async (file, actor, bucket) => {
    assert.equal(actor, owner); assert.equal(bucket, 'property-images')
    if (++state.uploadAttempts === options.uploadFailsAt) throw new Error('Synthetic conversion error')
    state.uploads.push(file.name)
    return { path: newPath }
  }
  globalThis.__qrihWriteClient = options.noClient ? null : {
    auth: { async getUser() { return { data: { user: options.noUser ? null : { id: owner } }, error: null } } },
    from(table) {
      const result = table === 'profiles' ? { data: { account_status: options.suspended ? 'suspended' : 'active' }, error: null }
        : table === 'properties' ? { data: options.foreign ? null : { id: property, owner_id: owner,
          status: 'draft', updated_at: '2026-01-01T00:00:00Z' }, error: null }
          : { data: [{ storage_path: oldPath, title: 'Synthetic old', position: 0 }], error: null }
      const query = { select() { return query }, eq(field, value) { state.filters.push([field, value]); return query },
        in() { return query }, order() { return query }, async single() { return result },
        then(yes, no) { return Promise.resolve(result).then(yes, no) } }
      return query
    },
    async rpc(name, args) {
      state.rpcs.push([name, args])
      if (options.lostResponse) state.committed = true
      if (options.throwRpc) throw new Error('Synthetic private transport error')
      if (options.lostResponse || options.rejectRpc) return { data: null, error: { code: '', message: 'Synthetic private transport error' } }
      state.committed = true
      return { data: name === 'qrih_delete_own_property' ? [oldPath] : property, error: null }
    },
    storage: { from(bucket) { assert.equal(bucket, 'property-images'); return {
      async remove(paths) {
        state.removals.push(paths)
        if (options.cleanupThrows) throw new Error('Synthetic private storage exception')
        return { data: [], error: options.cleanupFails ? { message: 'Synthetic private storage error' } : null }
      },
    } } },
  }
  return state
}
function editRequest({ crossOrigin = false, gallery = [{ kind: 'new', title: 'Nueva', file_index: 0 }], files = 1 } = {}) {
  const body = new FormData()
  for (const [key, value] of Object.entries({ id: property, title: 'Synthetic property', operation: 'Renta', price: '1000',
    zone_general: 'Querétaro Norte', zone: 'Jurica', visibility: 'zone', area: '500', submission_action: 'draft',
    gallery: JSON.stringify(gallery) })) body.set(key, value)
  for (let index = 0; index < files; index++) body.append('images', new File(['synthetic-image'], `new${index}.webp`, { type: 'image/webp' }))
  return new Request(origin + '/api/editar-propiedad', { method: 'POST', headers: { Origin: crossOrigin ? 'https://other.invalid' : origin }, body })
}
const deleteRequest = () => new Request(origin + '/api/eliminar-propiedad', {
  method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ propertyId: property }),
})

test('AUD-038 edición: respuesta RPC perdida no asegura rollback ni intenta borrar fotos potencialmente guardadas', async () => {
  const state = fixture({ lostResponse: true })
  const response = await edit(editRequest())
  assert.equal(state.committed, true, 'Simula commit remoto con respuesta perdida, no base de datos real')
  assert.equal(response.ok, false)
  assert.deepEqual(state.removals, [])
  assert.doesNotMatch(await response.text(), /conserva|Synthetic private/)
})
test('AUD-038 eliminación: respuesta RPC perdida no promete conservación ni reintenta', async () => {
  const state = fixture({ lostResponse: true })
  const response = await remove(deleteRequest())
  assert.equal(state.committed, true)
  assert.equal(response.ok, false)
  assert.equal(state.rpcs.length, 1)
  assert.deepEqual(state.removals, [])
  assert.doesNotMatch(await response.text(), /conserva|Synthetic private/)
})

test('AUD-038 RPC lanza excepción: respuesta503 constante y sin limpieza/reintento', async () => {
  for (const [handler, request] of [[edit, editRequest], [remove, deleteRequest]]) {
    const state = fixture({ lostResponse: true, throwRpc: true })
    const response = await handler(request())
    assert.equal(response.status, 503)
    assert.equal(state.committed, true)
    assert.equal(state.rpcs.length, 1)
    assert.deepEqual(state.removals, [])
    assert.doesNotMatch(await response.text(), /conserva|Synthetic private/)
  }
})
test('AUD-038 RPC devuelve error sin commit: no fabrica éxito ni distingue un rollback sin evidencia', async () => {
  for (const [handler, request] of [[edit, editRequest], [remove, deleteRequest]]) {
    const state = fixture({ rejectRpc: true })
    const response = await handler(request())
    assert.equal(response.status, 400)
    assert.equal(state.committed, false)
    assert.deepEqual(state.removals, [])
    assert.doesNotMatch(await response.text(), /conserva|"success":true|"ok":true|Synthetic private/)
  }
})
test('AUD-038 negativos: sin servicio/sesión/propiedad propia no ejecuta mutaciones', async () => {
  for (const [handler, request] of [[edit, editRequest], [remove, deleteRequest]]) {
    for (const options of [{ noClient: true }, { noUser: true }, { foreign: true }]) {
      const state = fixture(options)
      const response = await handler(request())
      assert.equal(response.ok, false)
      assert.deepEqual(state.rpcs, [])
      assert.deepEqual(state.uploads, [])
      assert.deepEqual(state.removals, [])
    }
  }
})
test('AUD-038 edición confirmada: conserva RPC/versionado y sólo limpia rutas anteriores', async () => {
  const state = fixture()
  const response = await edit(editRequest())
  assert.equal(response.status, 200)
  assert.equal((await response.json()).success, true)
  assert.equal(state.rpcs[0][0], 'qrih_update_property_with_images')
  assert.equal(state.rpcs[0][1].p_property_id, property)
  assert.equal(state.rpcs[0][1].p_expected_updated_at, '2026-01-01T00:00:00Z')
  assert.deepEqual(state.removals, [[oldPath]])
  assert.ok(state.filters.some(([field, value]) => field === 'owner_id' && value === owner))
})
test('AUD-038 eliminación confirmada: limpia rutas del RPC propio y conserva respuesta exitosa', async () => {
  const state = fixture()
  const response = await remove(deleteRequest())
  assert.equal(response.status, 200)
  assert.equal((await response.json()).ok, true)
  assert.deepEqual(state.rpcs, [['qrih_delete_own_property', { p_property_id: property }]])
  assert.deepEqual(state.removals, [[oldPath]])
  assert.ok(state.filters.some(([field, value]) => field === 'owner_id' && value === owner))
})
test('AUD-038 limpieza posterior falla/devuelve error: commit confirmado conserva éxito con warning', async () => {
  const previousWarn = console.warn, warnings = []
  console.warn = (...args) => warnings.push(args)
  try {
    for (const [handler, request] of [[edit, editRequest], [remove, deleteRequest]]) {
      for (const options of [{ cleanupFails: true }, { cleanupThrows: true }]) {
        const state = fixture(options)
        const response = await handler(request())
        const data = await response.json()
        assert.equal(state.committed, true)
        assert.equal(response.status, 200)
        assert.ok(data.success || data.ok)
        assert.ok(data.warning)
        assert.doesNotMatch(JSON.stringify(data), /Synthetic private/)
      }
    }
    assert.deepEqual(warnings, [['QRIH_DELETE_STORAGE_CLEANUP_FAILED'], ['QRIH_DELETE_STORAGE_CLEANUP_FAILED']])
  } finally { console.warn = previousWarn }
})
test('AUD-038 fallo de upload previo al RPC: limpia sólo objetos de este intento sin tocar galería previa', async () => {
  const state = fixture({ uploadFailsAt: 2 })
  const response = await edit(editRequest({ files: 2, gallery: [0, 1].map(index => ({ kind: 'new', title: 'Nueva', file_index: index })) }))
  assert.equal(response.status, 400)
  assert.deepEqual(state.rpcs, [])
  assert.equal(state.committed, false)
  assert.deepEqual(state.removals, [[newPath]])
})
