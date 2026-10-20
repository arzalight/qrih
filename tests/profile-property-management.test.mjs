import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { registerHooks, stripTypeScriptTypes } from 'node:module'
import { after, test } from 'node:test'
import babel from '@babel/core'

registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === '@/lib/supabase-server') return { url: 'data:text/javascript,export async function createServerSupabaseClient(){return globalThis.__managementClient}', shortCircuit: true }
  if (specifier === '@/lib/verified-media-server') return { url: 'data:text/javascript,export async function uploadVerifiedImage(file,owner,bucket){return globalThis.__managementUpload(file,owner,bucket)}', shortCircuit: true }
  if (specifier === '@/lib/property-image-urls') return { url: 'data:text/javascript,export const PROPERTY_IMAGE_TTL_SECONDS={gallery:900};export async function createSignedPropertyImageUrlMap(client,paths,ttl){return globalThis.__managementSign(client,paths,ttl)}', shortCircuit: true }
  if (specifier === '@/lib/property-save-server') return nextResolve(new URL('../lib/property-save-server.ts', import.meta.url).href, context)
  if (specifier === '@/lib/request-security') return nextResolve(new URL('../lib/request-security.ts', import.meta.url).href, context)
  if (specifier === 'next/server') return nextResolve(new URL('../node_modules/next/server.js', import.meta.url).href, context)
  return nextResolve(specifier, context)
} })
const { POST: duplicate } = await import('../app/api/duplicar-propiedad/route.ts')
const { POST: withdraw } = await import('../app/api/retirar-propiedad/route.ts')
const { GET: cover } = await import('../app/api/mis-propiedades/[id]/portada/route.ts')
const owner = '11111111-1111-4111-8111-111111111111'
const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const attempt = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const newId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const path = `${owner}/source.webp`
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
function setup(options = {}) {
  const state = { rpc: [], copies: [], deleted: [], filters: [], signs: [], downloads: [], uploadCalls: 0 }
  globalThis.__managementUpload = async (_file, actor, bucket) => {
    assert.equal(actor, owner); assert.equal(bucket, 'property-images')
    if (options.copyFails || ++state.uploadCalls === options.copyFailsAt) throw new Error('Synthetic internal detail')
    const copy = `${owner}/copy-${state.copies.length}.webp`
    state.copies.push(copy)
    return { path: copy }
  }
  globalThis.__managementSign = async (_client, paths, ttl) => {
    state.signs.push({ paths, ttl })
    return new Map([[path, 'https://synthetic.invalid/ephemeral-image']])
  }
  globalThis.__managementClient = {
    auth: { getUser: async () => ({ data: { user: options.anonymous ? null : { id: owner } } }) },
    from(table) {
      const result = { data: table === 'properties' ? (options.foreign ? null : { id, main_image_path: path, status: 'published' })
        : table === 'profiles' ? { account_status: options.suspended ? 'suspended' : 'active' }
          : [{ storage_path: path, title: 'Original', position: 0 }, ...(options.twoImages
            ? [{ storage_path: `${owner}/source2.webp`, title: 'Segunda', position: 1 }] : [])], error: null }
      const q = { select() { return q }, in() { return q }, order() { return q },
        eq(key, value) { state.filters.push([table, key, value]); return q },
        single: async () => result, then: (yes, no) => Promise.resolve(result).then(yes, no) }
      return q
    },
    rpc: async (name, params) => {
      state.rpc.push({ name, params })
      if (options.missingRpc) return { error: { message: 'Synthetic internal detail' } }
      if (name === 'qrih_duplicate_property' && params.p_changes === null) return { data: options.alreadySaved ? newId : null, error: null }
      if (options.ambiguous) throw new Error('Synthetic internal detail')
      return { data: name === 'qrih_duplicate_property' ? newId : id, error: null }
    },
    storage: { from: () => ({
      download: async name => { state.downloads.push(name); return { data: new Blob(['synthetic'], { type: 'image/webp' }), error: null } },
      remove: async paths => { state.deleted.push(paths); return { error: null } },
    }) },
  }
  return state
}
function duplicateRequest({ imagePath = path, kind = 'existing', count = 1, foreignOrigin = false, requestId = attempt } = {}) {
  const form = new FormData()
  for (const [k, v] of Object.entries({ id, request_id: requestId, title: 'Nueva bodega', operation: 'Renta',
    price: '1000', zone_general: 'Querétaro Norte', zone: 'Jurica', area: '500',
    submission_action: 'pending', gallery: JSON.stringify(Array.from({ length: count }, () => ({ kind, storage_path: imagePath, title: 'Portada' }))) })) form.set(k, v)
  return new Request(origin + '/api/duplicar-propiedad', { method: 'POST', body: form,
    headers: { Origin: foreignOrigin ? 'https://foreign.invalid' : origin } })
}
function withdrawal(confirmed = true, foreignOrigin = false) {
  return new Request(origin + '/api/retirar-propiedad', { method: 'POST', headers: {
    Origin: foreignOrigin ? 'https://foreign.invalid' : origin, 'Content-Type': 'application/json',
  }, body: JSON.stringify({ propertyId: id, confirmed }) })
}
test('duplicar: nueva portada propia, rutas independientes, draft forzado y ninguna limpieza del origen', async () => {
  const state = setup(), response = await duplicate(duplicateRequest())
  assert.deepEqual(await response.json(), { success: true, id: newId, status: 'draft' })
  assert.deepEqual(state.downloads, [path])
  assert.equal(state.copies.length, 1)
  const commit = state.rpc[1].params
  assert.equal(commit.p_changes.status, 'draft')
  assert.equal(commit.p_source_id, id)
  assert.equal(commit.p_request_id, attempt)
  assert.equal(commit.p_changes.price_value, 1000)
  assert.equal(commit.p_changes.price_unit, 'm2')
  assert.equal(commit.p_changes.price_display, '$1000/m²')
  assert.notEqual(commit.p_images[0].storage_path, path)
  for (const forbidden of ['owner_id', 'id', 'slug', 'featured', 'previous_data', 'publication_authorized_at', 'terms_accepted_at']) assert.ok(!(forbidden in commit.p_changes))
  assert.deepEqual(state.deleted, [])
  assert.ok(state.filters.some(([table, key, value]) => table === 'properties' && key === 'owner_id' && value === owner))
})
test('duplicar: intento ya confirmado retorna mismo ID sin copiar ni insertar otra vez', async () => {
  const state = setup({ alreadySaved: true }), response = await duplicate(duplicateRequest())
  assert.equal((await response.json()).id, newId)
  assert.equal(state.rpc.length, 1)
  assert.deepEqual(state.copies, [])
})
test('duplicar: borrador nuevo sin fotos no copia objetos ni impone publicación', async () => {
  const state = setup(), response = await duplicate(duplicateRequest({ count: 0 }))
  assert.equal(response.status, 200)
  assert.deepEqual(state.copies, [])
  assert.deepEqual(state.rpc[1].params.p_images, [])
  assert.equal(state.rpc[1].params.p_changes.status, 'draft')
})
test('duplicar: respuesta perdida después de copiar no borra imágenes posiblemente confirmadas', async () => {
  const state = setup({ ambiguous: true }), response = await duplicate(duplicateRequest())
  assert.equal(response.status, 503)
  assert.equal(state.copies.length, 1)
  assert.deepEqual(state.deleted, [])
  assert.doesNotMatch(await response.text(), /Synthetic internal/)
})
test('duplicar: RPC aún no instalado falla antes de descargar/copiar', async () => {
  const state = setup({ missingRpc: true }), response = await duplicate(duplicateRequest())
  assert.equal(response.status, 503)
  assert.deepEqual(state.downloads, [])
  assert.deepEqual(state.copies, [])
})
test('duplicar: ajena, anónimo y suspendido no producen imágenes ni commit', async () => {
  for (const options of [{ foreign: true }, { anonymous: true }, { suspended: true }]) {
    const state = setup(options), response = await duplicate(duplicateRequest())
    assert.equal(response.ok, false)
    assert.deepEqual(state.rpc, [])
    assert.deepEqual(state.copies, [])
  }
})
test('duplicar: ruta ajena, ruta fuera de galería y octava asociación denegadas', async () => {
  for (const options of [{ imagePath: 'other/source.webp' }, { imagePath: `${owner}/other.webp` }, { count: 8 }]) {
    const state = setup(), response = await duplicate(duplicateRequest(options))
    assert.equal(response.status, 400)
    assert.deepEqual(state.downloads, [])
    assert.deepEqual(state.copies, [])
    assert.ok(state.rpc.every(call => call.params.p_changes === null))
  }
})
test('duplicar: origen ajeno o intento inválido se rechaza sin RPC', async () => {
  for (const options of [{ foreignOrigin: true }, { requestId: 'invalid' }]) {
    const state = setup(), response = await duplicate(duplicateRequest(options))
    assert.equal(response.status, 400)
    assert.deepEqual(state.rpc, [])
  }
})
test('duplicar: fallo de copia no ejecuta el commit ni borra rutas originales', async () => {
  const state = setup({ copyFails: true }), response = await duplicate(duplicateRequest())
  assert.equal(response.status, 400)
  assert.equal(state.rpc.length, 1)
  assert.deepEqual(state.deleted, [])
})
test('duplicar: copia parcial falla y sólo intenta retirar las rutas nuevas de ese intento', async () => {
  const state = setup({ twoImages: true, copyFailsAt: 2 })
  const body = await duplicateRequest().formData()
  body.set('gallery', JSON.stringify([path, `${owner}/source2.webp`].map(storage_path => ({ kind: 'existing', storage_path, title: '' }))))
  const response = await duplicate(new Request(origin + '/api/duplicar-propiedad', { method: 'POST', body, headers: { Origin: origin } }))
  assert.equal(response.status, 400)
  assert.equal(state.rpc.length, 1)
  assert.deepEqual(state.deleted, [[`${owner}/copy-0.webp`]])
  assert.ok(!state.deleted.flat().includes(path))
})
test('editar publicada: confirmación obligatoria; cancelar no provoca RPC', async () => {
  const state = setup(), response = await withdraw(withdrawal(false))
  assert.equal(response.status, 400)
  assert.deepEqual(state.rpc, [])
})
test('editar publicada: POST sólo envía ID propio al RPC transaccional', async () => {
  const state = setup(), response = await withdraw(withdrawal())
  assert.equal(response.status, 200)
  assert.deepEqual(state.rpc, [{ name: 'qrih_withdraw_own_property', params: { p_property_id: id } }])
  assert.ok(state.filters.some(([, key, value]) => key === 'owner_id' && value === owner))
})
test('editar publicada: sesión, propiedad ajena y origen ajeno rechazados', async () => {
  for (const options of [{ anonymous: true }, { foreign: true }, { foreignOrigin: true }]) {
    const state = setup(options), response = await withdraw(withdrawal(true, options.foreignOrigin))
    assert.equal(response.ok, false)
    assert.deepEqual(state.rpc, [])
  }
})
test('portada: firma propia renovable con no-store; ajena y anónimo sin firma', async () => {
  let state = setup()
  let response = await cover(new Request(origin), { params: Promise.resolve({ id }) })
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  assert.deepEqual(state.signs, [{ paths: [path], ttl: 900 }])
  for (const options of [{ foreign: true }, { anonymous: true }]) {
    state = setup(options)
    response = await cover(new Request(origin), { params: Promise.resolve({ id }) })
    assert.equal(response.ok, false)
    assert.deepEqual(state.signs, [])
  }
})
test('SQL versionado: inspección de estados estrechos, audit, bloqueo y concesiones mínimas', () => {
  const sql = readFileSync(new URL('../supabase/migrations/20261019212016_051_profile_property_management.sql', import.meta.url), 'utf8')
  assert.match(sql, /old\.status::text='published' and new\.status::text='draft'/)
  assert.match(sql, /to_jsonb\(new\)-array\['status','updated_at'\]/)
  assert.match(sql, /property_withdrawn_for_edit/)
  assert.match(sql, /for update/)
  assert.match(sql, /pg_advisory_xact_lock/)
  assert.match(sql, /qrih_duplicate_request_unique/)
  assert.match(sql, /v_id:=gen_random_uuid\(\)/)
  assert.match(sql, /revoke all on function public\.qrih_duplicate_property/)
  assert.doesNotMatch(sql, /disable row level security|create policy|delete from|update storage\./i)
})
test('URLs de edición/duplicación son lectura; formulario conserva estado y protege doble envío', () => {
  const edit = readFileSync(new URL('../app/mis-propiedades/[id]/editar/page.tsx', import.meta.url), 'utf8')
  const publish = readFileSync(new URL('../app/publicar/page.tsx', import.meta.url), 'utf8')
  const form = readFileSync(new URL('../app/mis-propiedades/[id]/editar/EditarPropiedadForm.tsx', import.meta.url), 'utf8')
  for (const source of [edit, publish]) assert.doesNotMatch(source, /\.insert\(|\.update\(|\.remove\(|uploadVerifiedImage/)
  assert.match(form, /if \(busy\.current\) return/)
  assert.match(form, /requestId\.current \|\|= crypto\.randomUUID/)
  assert.match(form, /uploadedForAttempt/)
  assert.match(form, /!duplicate && <button/)
})
function actionAst() {
  const source = readFileSync(new URL('../components/ManagePropertyActions.tsx', import.meta.url), 'utf8')
  const ast = babel.parseSync(source, { filename: 'actions.tsx', configFile: false, babelrc: false,
    plugins: [['@babel/plugin-syntax-typescript', { isTSX: true }]] })
  return { source, ast }
}
test('UI real: Cancelar sólo cierra confirmación y limpia error, sin fetch', () => {
  const { source, ast } = actionAst()
  let arrow
  babel.traverse(ast, { JSXElement(path) {
    if (path.node.openingElement.name.name !== 'button'
      || !path.node.children.some(child => child.type === 'JSXText' && child.value.trim() === 'Cancelar')) return
    arrow = path.node.openingElement.attributes.find(attribute => attribute.name?.name === 'onClick').value.expression
  } })
  assert.ok(arrow)
  const values = [], errors = []
  const cancel = new Function('setConfirming', 'setError', `return (${source.slice(arrow.start, arrow.end)})`)(value => values.push(value), value => errors.push(value))
  cancel()
  assert.deepEqual(values, [false])
  assert.deepEqual(errors, [''])
})
test('UI real: doble confirmación hace un POST; navega sólo después de éxito', async () => {
  const { source, ast } = actionAst()
  let fn
  babel.traverse(ast, { FunctionDeclaration(path) { if (path.node.id?.name === 'withdraw') fn = path.node } })
  const code = stripTypeScriptTypes(source.slice(fn.start, fn.end), { mode: 'strip' })
  const calls = [], navigation = [], errors = []
  let release
  const handler = new Function('busy', 'setLoading', 'setError', 'fetch', 'propertyId', 'router', `${code};return withdraw`)(
    { current: false }, () => {}, value => errors.push(value), async (...args) => {
      calls.push(args)
      await new Promise(resolve => { release = resolve })
      return { ok: true }
    }, id, { push: path => navigation.push(path), refresh: () => {} })
  const pending = handler()
  await handler()
  assert.equal(calls.length, 1)
  assert.deepEqual(navigation, [])
  release()
  await pending
  assert.deepEqual(navigation, [`/mis-propiedades/${id}/editar`])
  assert.deepEqual(errors, [''])
})
