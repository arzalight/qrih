import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import { after, test } from 'node:test'

registerHooks({ resolve(specifier, context, next) {
  if (specifier === '@/lib/supabase-server') return { shortCircuit: true, url: 'data:text/javascript,export async function createServerSupabaseClient(){return globalThis.__deferredClient}' }
  if (specifier === '@/lib/supabase-privileged-server') return { shortCircuit: true, url: 'data:text/javascript,export function createPrivilegedServerSupabaseClient(){return globalThis.__deferredClient}' }
  if (specifier === '@/lib/verified-media-server') return { shortCircuit: true, url: 'data:text/javascript,export async function uploadVerifiedImage(){globalThis.__deferredUploads++;return {path:globalThis.__deferredOwner+"/verified.webp"}}' }
  if (specifier.startsWith('@/lib/')) return next(new URL(`../lib/${specifier.slice(6)}.ts`, import.meta.url).href, context)
  if (specifier === './property-price') return next(new URL('../lib/property-price.ts', import.meta.url).href, context)
  if (specifier === 'next/server') return next(new URL('../node_modules/next/server.js', import.meta.url).href, context)
  return next(specifier, context)
} })
const { POST: property } = await import('../app/api/publicar-propiedad/route.ts')
const { POST: demand } = await import('../app/api/requerimientos/route.ts')
const { POST: image } = await import('../app/api/imagenes/route.ts')
const { parsePropertySubmission } = await import('../lib/property-submission.ts')
const owner = '11111111-1111-4111-8111-111111111111'
const other = '22222222-2222-4222-8222-222222222222'
const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const origin = 'https://synthetic-deferred.invalid'
const inherited = { SITE_ID: process.env.SITE_ID, URL: process.env.URL }
process.env.SITE_ID = 'synthetic-deferred'; process.env.URL = origin
after(() => { for (const [key, value] of Object.entries(inherited)) { if (value === undefined) delete process.env[key]; else process.env[key] = value } })

function fixture(options = {}) {
  const rows = new Map(), gallery = [], writes = [], filters = [], removals = []
  if (options.existing) rows.set(id, options.existing)
  globalThis.__deferredUploads = 0; globalThis.__deferredOwner = owner
  const state = { rows, gallery, writes, filters, removals }
  globalThis.__deferredClient = {
    auth: { async getUser() { return { data: { user: options.noUser ? null : { id: owner, is_anonymous: !!options.anonymous } } } } },
    from(table) {
      let criteria = {}, operation = 'read', changes
      function execute() {
        filters.push({ table, ...criteria })
        if (table === 'profiles') return { data: { account_status: options.suspended ? 'suspended' : 'active' }, error: null }
        if (table === 'property_images') return { data: gallery, error: null }
        const matches = row => row && Object.entries(criteria).every(([key, value]) => row[key] === value)
        if (operation === 'insert') {
          if (rows.has(changes.id)) return { data: null, error: { code: '23505' } }
          rows.set(changes.id, changes); writes.push(changes)
          if (options.lostResponse) throw new Error('Synthetic ambiguous response')
          return { data: { id: changes.id }, error: null }
        }
        if (operation === 'update') {
          const row = rows.get(criteria.id)
          if (!matches(row)) return { data: null, error: { code: 'denied' } }
          Object.assign(row, changes); return { data: { id: row.id }, error: null }
        }
        const row = rows.get(criteria.id)
        return { data: matches(row) ? row : null, error: null }
      }
      const query = { select() { return query }, eq(key, value) { criteria[key] = value; return query }, order() { return query },
        insert(data) { operation = 'insert'; changes = data; return query }, update(data) { operation = 'update'; changes = data; return query },
        async single() { return execute() }, async maybeSingle() { return execute() }, then(ok, fail) { return Promise.resolve().then(execute).then(ok, fail) } }
      return query
    },
    async rpc(name, args) {
      if (name === 'qrih_take_server_limit') return { data: true, error: null }
      if (options.galleryError) return { error: { code: options.galleryCode || 'denied' } }
      gallery.splice(0, gallery.length, ...args.p_images)
      return { data: null, error: null }
    },
    storage: { from() { return { async remove(paths) { removals.push(...paths); return { error: null } } } } },
  }
  return state
}
function propertyForm(overrides = {}) {
  const form = new FormData()
  const fields = { request_id: id, title: 'Nave sintética', operation: 'Renta', price: '7.50', price_currency: 'USD',
    area: '100', zone_general: 'Zona', zone: 'Parque', publication_authorized: 'on', terms_accepted: 'on',
    submission_action: 'pending', image_count: '0', ...overrides }
  for (const [key, value] of Object.entries(fields)) form.set(key, value)
  return form
}
function post(path, body, crossOrigin = false) {
  return new Request(`${origin}${path}`, { method: 'POST', headers: { origin: crossOrigin ? 'https://evil.invalid' : origin,
    ...(body instanceof FormData ? {} : { 'content-type': 'application/json' }) }, body: body instanceof FormData ? body : JSON.stringify(body) })
}
const demandData = { request_id: id, name: 'Synthetic', email: 'synthetic@example.invalid', phone: '5555555555', operation: 'Renta',
  area_min: 100, area_max: 200, budget_min: 10, budget_max: 20 }

test('envíos públicos: sin sesión, sesión anónima o suspendida no escriben ni suben fotos', async () => {
  for (const options of [{ noUser: true }, { anonymous: true }, { suspended: true }]) {
    for (const [handler, path, data] of [[property, '/api/publicar-propiedad', propertyForm()], [demand, '/api/requerimientos', demandData]]) {
      const state = fixture(options)
      assert.equal((await handler(post(path, data))).status, options.suspended ? 403 : 401)
      assert.equal(state.writes.length, 0); assert.equal(globalThis.__deferredUploads, 0)
    }
  }
})
test('propiedad: reserva con PK estable, fotos separadas y moderación sólo al finalizar', async () => {
  const state = fixture()
  const reserved = await property(post('/api/publicar-propiedad', propertyForm({ image_count: '1' })))
  assert.equal((await reserved.json()).prepared, true)
  assert.equal(state.rows.get(id).status, 'draft')
  const photo = new FormData()
  photo.set('image', new File(['synthetic'], 'photo.webp', { type: 'image/webp' })); photo.set('kind', 'property')
  photo.set('draft_id', id); photo.set('position', '0'); photo.set('title', 'Foto recuperada')
  assert.equal((await image(post('/api/imagenes', photo))).status, 200)
  assert.equal(state.gallery.length, 1)
  const completed = await property(post('/api/publicar-propiedad', propertyForm({ image_count: '1', finalize: 'on' })))
  assert.equal((await completed.json()).status, 'pending')
  assert.equal(state.rows.get(id).owner_id, owner)
  assert.equal(state.rows.get(id).price_value, '7.5')
  assert.equal(state.writes.length, 1)
})
test('reintentos y peticiones concurrentes sólo crean una propiedad o un requerimiento', async () => {
  for (const [handler, path, data] of [[property, '/api/publicar-propiedad', () => propertyForm()], [demand, '/api/requerimientos', () => demandData]]) {
    const state = fixture()
    const results = await Promise.all([handler(post(path, data())), handler(post(path, data()))])
    assert.ok(results.every(response => response.ok))
    assert.equal(state.writes.length, 1)
    assert.equal((await handler(post(path, data()))).status, 200)
    assert.equal(state.writes.length, 1)
  }
})
test('respuesta de escritura perdida conserva id: siguiente intento recupera la misma fila', async () => {
  const state = fixture({ lostResponse: true })
  assert.ok(!(await property(post('/api/publicar-propiedad', propertyForm()))).ok)
  const repeated = await property(post('/api/publicar-propiedad', propertyForm()))
  assert.equal((await repeated.json()).recover, true)
  assert.equal(state.writes.length, 1)
})
test('IDs manipulados no adoptan registros ajenos ni permiten finalizar o adjuntar fotos', async () => {
  const state = fixture({ existing: { id, owner_id: other, user_id: other, status: 'draft' } })
  assert.equal((await property(post('/api/publicar-propiedad', propertyForm({ finalize: 'on' })))).status, 403)
  const photo = new FormData(); photo.set('kind', 'property'); photo.set('draft_id', id); photo.set('position', '0')
  photo.set('image', new File(['synthetic'], 'p.webp', { type: 'image/webp' }))
  assert.equal((await image(post('/api/imagenes', photo))).status, 403)
  assert.ok(!(await demand(post('/api/requerimientos', demandData))).ok)
  assert.equal(globalThis.__deferredUploads, 0); assert.equal(state.writes.length, 0)
})
test('validaciones de servidor: precio/superficie/consentimiento/archivos/rangos/origen', async () => {
  const state = fixture()
  for (const fields of [{ price: '-1' }, { area: '-5' }, { docks: 'NaN' }, { publication_authorized: '' }, { image_count: '8' }]) {
    assert.equal((await property(post('/api/publicar-propiedad', propertyForm(fields)))).status, 400)
  }
  assert.throws(() => parsePropertySubmission(propertyForm({ parking: '1.5' })))
  assert.equal((await demand(post('/api/requerimientos', { ...demandData, area_min: 999 }))).status, 400)
  assert.equal((await property(post('/api/publicar-propiedad', propertyForm(), true))).status, 400)
  const oversized = new FormData(); oversized.set('kind', 'property')
  oversized.set('image', new File([new Uint8Array(3 * 1024 * 1024 + 1)], 'big.webp', { type: 'image/webp' }))
  assert.equal((await image(post('/api/imagenes', oversized))).status, 400)
  assert.equal(state.writes.length, 0); assert.equal(globalThis.__deferredUploads, 0)
})
test('galería incompleta no pasa a revisión; fallo de adjunto mantiene un único borrador', async () => {
  const state = fixture({ galleryError: true })
  await property(post('/api/publicar-propiedad', propertyForm({ image_count: '1' })))
  const response = await property(post('/api/publicar-propiedad', propertyForm({ image_count: '1', finalize: 'on' })))
  assert.equal((await response.json()).recover, true)
  assert.equal(state.rows.get(id).status, 'draft')
  assert.equal(state.writes.length, 1)
})

test('sesión caducada entre reserva y fotos devuelve 401 sin subir; reintento recupera el mismo draft', async () => {
  const options = {}, state = fixture(options)
  await property(post('/api/publicar-propiedad', propertyForm({ image_count: '1' })))
  options.noUser = true
  const photo = new FormData(); photo.set('kind', 'property'); photo.set('draft_id', id); photo.set('position', '0')
  photo.set('image', new File(['synthetic'], 'p.webp', { type: 'image/webp' }))
  assert.equal((await image(post('/api/imagenes', photo))).status, 401)
  assert.equal((await property(post('/api/publicar-propiedad', propertyForm({ finalize: 'on' })))).status, 401)
  assert.equal(globalThis.__deferredUploads, 0)
  options.noUser = false
  const recovered = await property(post('/api/publicar-propiedad', propertyForm()))
  assert.equal((await recovered.json()).recover, true)
  assert.equal(state.writes.length, 1)
})
test('siete fotos se transportan por separado; repetir una posición no vuelve a subirla', async () => {
  const state = fixture()
  await property(post('/api/publicar-propiedad', propertyForm({ image_count: '7' })))
  const photo = position => { const form = new FormData(); form.set('kind', 'property'); form.set('draft_id', id)
    form.set('position', String(position)); form.set('image', new File(['synthetic'], 'p.webp', { type: 'image/webp' })); return form }
  for (let index = 0; index < 7; index++) assert.equal((await image(post('/api/imagenes', photo(index)))).status, 200)
  assert.equal((await image(post('/api/imagenes', photo(0)))).status, 409)
  assert.equal((await image(post('/api/imagenes', photo(7)))).status, 400)
  assert.equal(globalThis.__deferredUploads, 7)
  assert.equal(state.gallery.length, 7)
  const done = await property(post('/api/publicar-propiedad', propertyForm({ image_count: '7', finalize: 'on' })))
  assert.equal((await done.json()).status, 'pending')
})

 test('un adjunto ambiguo nunca borra objetos; rechazo SQL confirmado permite limpiar', async () => {
  for (const galleryCode of ['', '42501']) {
    const state = fixture({ galleryError: true, galleryCode })
    await property(post('/api/publicar-propiedad', propertyForm({ image_count: '1' })))
    const photo = new FormData(); photo.set('kind', 'property'); photo.set('draft_id', id); photo.set('position', '0')
    photo.set('image', new File(['synthetic'], 'p.webp', { type: 'image/webp' }))
    assert.equal((await image(post('/api/imagenes', photo))).status, 409)
    assert.equal(state.removals.length, galleryCode ? 1 : 0)
    assert.equal(state.rows.get(id).status, 'draft')
  }
})
