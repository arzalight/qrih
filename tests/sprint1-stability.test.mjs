import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import babel from '@babel/core'
import { gallerySwipeIndex } from '../lib/gallery-swipe.ts'
import { markNotificationsRead } from '../lib/notification-read.ts'

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
const editor = read('app/mis-propiedades/[id]/editar/EditarPropiedadForm.tsx')
const ast = babel.parseSync(editor, { configFile: false, babelrc: false, parserOpts: { plugins: ['jsx', 'typescript'] } })
let submit
babel.traverse(ast, { JSXAttribute(path) {
  if (path.node.name.name === 'onSubmit') submit = stripTypeScriptTypes(editor.slice(path.node.value.expression.start, path.node.value.expression.end), { mode: 'strip' })
} })
function editorFixture({ duplicate = false, imagesProcessing = false, files = false, failUpload = false } = {}) {
  const calls = [], routes = [], progress = [], errors = []
  const busy = { current: false }
  const resultId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  class FixtureFormData extends FormData { constructor() { super(); this.set('id', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') } }
  const bindings = { duplicate, imagesProcessing, busy, requestId: { current: null }, uploadedForAttempt: { current: new Map() },
    images: files ? [{ kind: 'new', id: 'new1', file: new File(['x'], 'synthetic.webp'), title: '' }] : [],
    setLoading() {}, setError(value) { errors.push(value) },
    setUploadStates(value) { progress.push(typeof value === 'function' ? value(progress.at(-1) || []) : value) },
    FormData: FixtureFormData, crypto, privatePropertyInput: form => { assert.equal(form.get('private_fields_present'), null);return null },
    fetch: async (url, options) => { calls.push({ url, action: options.body.get('submission_action') });
      if (url === '/api/imagenes') return { ok: !failUpload, json: async () => failUpload ? {} : { path: 'synthetic/1.webp' } }
      return { ok: true, json: async () => ({ id: resultId }) }
    },
    createClient: () => null, router: { push(url) { routes.push(url) }, refresh() {} },
  }
  const handler = new Function(...Object.keys(bindings), `return (${submit})`)(...Object.values(bindings))
  return { calls, routes, progress, errors, busy, resultId, handler,
    event: action => ({ preventDefault() {}, currentTarget: {}, nativeEvent: { submitter: { name: 'submission_action', value: action } } }) }
}
test('Sprint1 duplicación: original sólo fuente; draft y continuación al editor del ID nuevo', async () => {
  const f = editorFixture({ duplicate: true })
  await f.handler(f.event('pending'))
  assert.deepEqual(f.calls, [{ url: '/api/duplicar-propiedad', action: 'draft' }])
  assert.deepEqual(f.routes, [`/mis-propiedades/${f.resultId}/editar`])
  assert.notEqual(f.resultId, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
})
test('Sprint1 editor del nuevo draft conserva guardar borrador y enviar pending, sin publicar', async () => {
  for (const action of ['draft', 'pending']) {
    const f = editorFixture()
    await f.handler(f.event(action))
    assert.deepEqual(f.calls, [{ url: '/api/editar-propiedad', action }])
    assert.deepEqual(f.routes, ['/mis-propiedades'])
  }
})
test('Sprint1 bloqueo de doble envío y de guardado durante optimización', async () => {
  const f = editorFixture({ imagesProcessing: true })
  await f.handler(f.event('pending')); assert.equal(f.calls.length, 0)
  const g = editorFixture()
  await Promise.all([g.handler(g.event('pending')), g.handler(g.event('pending'))])
  assert.equal(g.calls.length, 1)
})
test('Sprint1 carga: pendiente/subiendo/completado;error preserva la foto y permite reintento', async () => {
  const f = editorFixture({ files: true })
  await f.handler(f.event('draft'))
  assert.deepEqual(f.progress, [['pending'], ['uploading'], ['completed']])
  const g = editorFixture({ files: true, failUpload: true })
  await g.handler(g.event('draft'))
  assert.deepEqual(g.progress, [['pending'], ['uploading'], ['error']])
  assert.equal(g.busy.current, false); assert.equal(g.routes.length, 0)
  assert.equal(g.calls.length, 1); assert.ok(g.errors.at(-1))
})
test('Sprint1 swipe: horizontal cambia,vertical/tap/multilímite no salta de extremo', () => {
  assert.equal(gallerySwipeIndex(0, 3, -100, 10), 1)
  assert.equal(gallerySwipeIndex(1, 3, 100, 10), 0)
  for (const [dx, dy] of [[20, 0], [-80, 100], [0, 120]]) assert.equal(gallerySwipeIndex(1, 3, dx, dy), 1)
  assert.equal(gallerySwipeIndex(0, 3, 100, 0), 0)
  assert.equal(gallerySwipeIndex(2, 3, -100, 0), 2)
  assert.equal(gallerySwipeIndex(0, 1, -100, 0), 0)
})
test('Sprint1 notificaciones: marcado individual/todas usa actor validado,user_id e is(null)', async () => {
  for (const id of [undefined, 'noticeA']) {
    const calls = []
    const q = { update(value) { assert.deepEqual(Object.keys(value), ['read_at']); return q },
      eq(key, value) { calls.push([key, value]); return q }, is(key, value) { calls.push([key, value]); return q },
      select: async () => ({ data: [{ id: 'noticeA' }], error: null }) }
    const client = { auth: { getUser: async () => ({ data: { user: { id: 'A' } }, error: null }) }, from: () => q }
    assert.equal(await markNotificationsRead(client, id), 1)
    assert.deepEqual(calls, [['user_id', 'A'], ['read_at', null], ...(id ? [['id', id]] : [])])
  }
})
test('Sprint1 notificaciones: anónimo/revocada/error no confirma marcado', async () => {
  for (const user of [null, { id: 'A' }]) {
    const client = { auth: { getUser: async () => ({ data: { user }, error: user ? 'revoked' : null }) }, from() { throw Error('No query allowed') } }
    await assert.rejects(markNotificationsRead(client))
  }
})
test('Sprint1 contador: COUNT exacto independiente de5,refresh sin solapamiento y listener limpiado', () => {
  const source = read('components/Header.tsx')
  assert.match(source, /limit\(5\)/)
  assert.match(source, /select\('id', \{ count: 'exact', head: true \}\)/)
  assert.doesNotMatch(source, /notifications.filter\(/)
  assert.match(source, /if \(inFlight\) \{ refreshQueued = true; return \}/)
  assert.match(source, /removeEventListener\(NOTIFICATIONS_CHANGED, loadUserAndNotifications\)/)
})
test('Sprint1 contador ejecutado:11 sin leer aunque las5 recientes estén leídas', async () => {
  const source = read('components/Header.tsx')
  const ast = babel.parseSync(source, { configFile: false, babelrc: false, parserOpts: { plugins: ['jsx', 'typescript'] } })
  let load
  babel.traverse(ast, { FunctionDeclaration(path) {
    if (path.node.id?.name === 'loadUserAndNotifications') load = stripTypeScriptTypes(source.slice(path.node.start, path.node.end), { mode: 'strip' })
  } })
  const recent = Array.from({ length: 5 }, (_, index) => ({ id: String(index), read_at: '2026-10-01' }))
  const state = {}, filters = []
  const client = { auth: { getUser: async () => ({ data: { user: { id: 'A', email: 'synthetic@example.invalid' } } }) },
    from() { const q = { select(_columns, options) { q.count = options?.count; return q },
      eq(key, value) { filters.push([key, value]); return q }, order() { return q },
      limit: async limit => { assert.equal(limit, 5); return { data: recent, error: null } },
      is: async () => { assert.equal(q.count, 'exact'); return { count: 11, error: null } } }; return q } }
  const values = { client, setUserName() {}, setUserEmail() {}, setNotifications(value) { state.recent = value }, setUnreadCount(value) { state.count = value } }
  const run = new Function(...Object.keys(values), `let disposed=false,inFlight=false,refreshQueued=false; ${load}; return loadUserAndNotifications`)(...Object.values(values))
  await run()
  assert.equal(state.count, 11); assert.equal(state.recent.length, 5)
  assert.deepEqual(filters, [['user_id', 'A'], ['user_id', 'A']])
})
test('Sprint1 tarjeta: enlace principal separado de acciones;preview propietario no público', () => {
  const source = read('app/mis-propiedades/page.tsx')
  assert.match(source, /className="own-property-card__detail-link"/)
  assert.match(source, /`\/mis-propiedades\/\$\{property.id\}`/)
  const own = read('app/mis-propiedades/[id]/page.tsx')
  assert.ok(own.indexOf('auth.getUser()') < own.indexOf("from('properties')"))
  assert.match(own, /eq\('id', id\).eq\('owner_id', user.id\)/)
  assert.match(own, /if \(error \|\| !property\) notFound\(\)/)
  assert.doesNotMatch(own, /getPublicUrl|\.insert\(|\.update\(|SUPABASE_SERVICE_ROLE_KEY/)
})
test('Sprint1 un solo volver y Admin sólo desde perfil servidor roleadmin+active', () => {
  const page = read('app/mis-propiedades/[id]/editar/page.tsx')
  assert.doesNotMatch(page, /Volver a mis propiedades/)
  assert.equal((editor.match(/Volver a mis propiedades/g) || []).length, 1)
  assert.match(read('app/perfil/page.tsx'), /profile.role === 'admin' && profile.account_status === 'active'/)
  assert.match(read('app/admin/page.tsx'), /profile\?\.role !== 'admin' \|\| profile\?\.account_status !== 'active'/)
})
