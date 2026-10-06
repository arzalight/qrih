import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import babel from '@babel/core'
import { loadOwnPropertyContact } from '../lib/property-contact-state.ts'

const syntheticContact = { name: 'Prueba', phone: '5555555555', email: 'owner@example.invalid', company: null }
function fixture({ user = { id: 'actor-a' }, authError = null, authorization = { id: 'auth-a', status: 'authorized' },
  lookupError = null, contacts = [syntheticContact], rpcError = null, throws = false } = {}) {
  const reads = [], filters = [], rpcs = []
  const client = {
    auth: { async getUser() { if (throws) throw new Error('synthetic'); return { data: { user }, error: authError } } },
    from(table) {
      reads.push(table)
      const query = {
        select(fields) { assert.equal(fields, 'id, status'); return query },
        eq(field, value) { filters.push([field, value]); return query },
        in(field, values) { assert.equal(field, 'status'); assert.deepEqual(values, ['pending', 'authorized']); return query },
        order(field, options) { assert.equal(field, 'created_at'); assert.deepEqual(options, { ascending: false }); return query },
        limit(count) { assert.equal(count, 1); return query },
        async maybeSingle() { return { data: authorization, error: lookupError } },
      }
      return query
    },
    async rpc(name, args) { rpcs.push([name, args]); return { data: contacts, error: rpcError } },
  }
  return { client, reads, filters, rpcs }
}

test('contacto autorizado se recupera en dos cargas independientes, sólo lecturas propias', async () => {
  const f = fixture()
  for (let i = 0; i < 2; i++) {
    assert.deepEqual(await loadOwnPropertyContact(f.client, 'property-a'), {
      authorizationId: 'auth-a', status: 'authorized', owner: syntheticContact,
    })
  }
  assert.deepEqual(f.reads, ['property_contact_authorizations', 'property_contact_authorizations'])
  assert.deepEqual(f.filters, [['property_id', 'property-a'], ['advisor_id', 'actor-a'],
    ['property_id', 'property-a'], ['advisor_id', 'actor-a']])
  assert.deepEqual(f.rpcs, Array(2).fill(['get_property_publisher_contact', { p_property_id: 'property-a' }]))
})

test('pending se restaura sin llamar RPC de contacto ni enviar solicitudes', async () => {
  const f = fixture({ authorization: { id: 'auth-a', status: 'pending' } })
  assert.deepEqual(await loadOwnPropertyContact(f.client, 'property-a'), {
    authorizationId: 'auth-a', status: 'pending', owner: null,
  })
  assert.equal(f.rpcs.length, 0)
})

test('sin sesión/error Auth no consulta datos; metadata admin no otorga autorización', async () => {
  for (const options of [{ user: null }, { authError: { message: 'synthetic' } }, { throws: true }]) {
    const f = fixture(options)
    assert.equal(await loadOwnPropertyContact(f.client, 'property-a'), null)
    assert.equal(f.reads.length, 0)
    assert.equal(f.rpcs.length, 0)
  }
  const f = fixture({ user: { id: 'actor-b', user_metadata: { role: 'admin' } }, authorization: null })
  assert.equal(await loadOwnPropertyContact(f.client, 'property-a'), null)
  assert.deepEqual(f.filters, [['property_id', 'property-a'], ['advisor_id', 'actor-b']])
  assert.equal(f.rpcs.length, 0)
})

test('sin autorización/declined/estado extraño/error RLS no revela contacto', async () => {
  for (const options of [{ authorization: null }, { authorization: { id: 'old', status: 'declined' } },
    { authorization: { id: 'old', status: 'unknown' } }, { lookupError: { message: 'synthetic' } }]) {
    const f = fixture(options)
    assert.equal(await loadOwnPropertyContact(f.client, 'property-a'), null)
    assert.equal(f.rpcs.length, 0)
  }
})

test('RPC denegado/suspendida/no pública/error red no muestra contacto privado', async () => {
  for (const options of [{ contacts: [] }, { rpcError: { message: 'synthetic' } }, { contacts: null }]) {
    const f = fixture(options)
    assert.deepEqual(await loadOwnPropertyContact(f.client, 'property-a'), {
      authorizationId: 'auth-a', status: 'authorized', owner: null,
    })
  }
  const f = fixture(); f.client.rpc = async () => { throw new Error('synthetic') }
  assert.equal(await loadOwnPropertyContact(f.client, 'property-a'), null)
})

// Efectos reales extraídos de la UI, con React/Supabase/intervalos sintéticos.
const source = readFileSync(new URL('../components/PropertyContactForm.tsx', import.meta.url), 'utf8')
const ast = babel.parseSync(source, { filename: 'PropertyContactForm.tsx', configFile: false, babelrc: false,
  plugins: [['@babel/plugin-syntax-typescript', { isTSX: true }]] })
const effects = []
babel.traverse(ast, { CallExpression(path) {
  if (path.node.callee.name === 'useEffect') effects.push(path.node.arguments[0])
} })
function effectWith(marker, bindings) {
  const node = effects.find(node => source.slice(node.start, node.end).includes(marker))
  assert.ok(node, `Efecto real ${marker}`)
  return new Function(...Object.keys(bindings),
    `return (${stripTypeScriptTypes(source.slice(node.start, node.end), { mode: 'strip' })})`)(...Object.values(bindings))
}
function stateFixture() {
  const state = { owner: null, authorizationId: null, authorizationStatus: null, restoring: false }
  const bindings = { contactEpoch: { current: 0 }, propertyId: 'property-a' }
  for (const key of ['Owner', 'AuthorizationId', 'AuthorizationStatus', 'Restoring', 'Message', 'Loading', 'Name', 'Phone', 'Email', 'Company']) {
    const field = key[0].toLowerCase() + key.slice(1)
    bindings['set' + key] = value => { state[field] = value }
  }
  return { state, bindings }
}
const flush = () => new Promise(resolve => setImmediate(resolve))

test('efecto UI real restaura authorized y pending después de montar, sin POST', async () => {
  for (const status of ['authorized', 'pending']) {
    const f = stateFixture()
    const cleanup = effectWith('async function restoreContact', { ...f.bindings, supabase: {},
      loadOwnPropertyContact: async () => ({ authorizationId: 'auth-a', status, owner: status === 'authorized' ? syntheticContact : null }) })()
    await flush()
    assert.equal(f.state.restoring, false)
    assert.equal(f.state.authorizationStatus, status)
    assert.equal(f.state.owner, status === 'authorized' ? syntheticContact : null)
    if (status === 'pending') assert.match(f.state.message, /pendiente/)
    cleanup()
  }
})

test('efecto UI real descarta lectura tardía al desmontar o cambiar actor', async () => {
  for (const cancel of ['unmount', 'actor']) {
    const f = stateFixture(); let resolve
    const cleanup = effectWith('async function restoreContact', { ...f.bindings, supabase: {},
      loadOwnPropertyContact: () => new Promise(done => { resolve = done }) })()
    if (cancel === 'unmount') cleanup(); else f.bindings.contactEpoch.current++
    resolve({ authorizationId: 'old', status: 'authorized', owner: syntheticContact })
    await flush()
    assert.equal(f.state.owner, null)
    assert.equal(f.state.authorizationId, null)
    cleanup()
  }
})

test('callback Auth real es síncrono, limpia contacto y sólo reacciona a cambio de actor', () => {
  const f = stateFixture(); let callback, unsubscribed = false, revisions = 0
  const cleanup = effectWith('onAuthStateChange', { ...f.bindings,
    setAuthVersion: update => { revisions = update(revisions) },
    supabase: { auth: { onAuthStateChange(fn) { callback = fn; return { data: {
      subscription: { unsubscribe() { unsubscribed = true } },
    } } } } },
  })()
  callback('INITIAL_SESSION', { user: { id: 'actor-a' } })
  f.state.owner = syntheticContact
  callback('TOKEN_REFRESHED', { user: { id: 'actor-a' } })
  assert.equal(revisions, 1)
  assert.equal(f.state.owner, syntheticContact)
  assert.equal(callback('SIGNED_IN', { user: { id: 'actor-b' } }), undefined)
  assert.equal(f.state.owner, null)
  assert.equal(f.state.loading, false)
  callback('SIGNED_OUT', null)
  assert.equal(revisions, 3)
  assert.equal(f.bindings.contactEpoch.current, 3)
  cleanup(); assert.equal(unsubscribed, true)
})

test('polling real actualiza owner antes de cambiar status y conserva intervalo de 10 s', async () => {
  const f = stateFixture(); let tick, cleared = 0; const calls = []
  const supabase = { from() { return { select() { return this }, eq() { return this },
    async single() { return { data: { status: 'authorized' }, error: null } } } },
  async rpc() { calls.push('rpc'); return { data: [syntheticContact], error: null } } }
  const cleanup = effectWith('window.setInterval', { ...f.bindings, supabase,
    authorizationId: 'auth-a', authorizationStatus: 'pending',
    setOwner: value => { calls.push('owner'); f.state.owner = value },
    setAuthorizationStatus: value => { calls.push('status'); f.state.authorizationStatus = value },
    window: { setInterval(fn, ms) { tick = fn; assert.equal(ms, 10000); return 1 }, clearInterval() { cleared++ } },
  })()
  await tick()
  assert.deepEqual(calls, ['rpc', 'owner', 'status'])
  assert.equal(f.state.owner, syntheticContact)
  assert.equal(cleared, 1)
  cleanup()
})

test('polling real descarta RPC tardío al cambiar actor; errores de red no filtran contacto', async () => {
  for (const scenario of ['actor', 'network']) {
    const f = stateFixture(); let tick, resolve
    const cleanup = effectWith('window.setInterval', { ...f.bindings,
      authorizationId: 'auth-a', authorizationStatus: 'pending',
      supabase: { from() { return { select() { return this }, eq() { return this }, async single() {
        if (scenario === 'network') throw new Error('synthetic')
        return { data: { status: 'authorized' }, error: null }
      } } }, rpc: () => new Promise(done => { resolve = done }) },
      window: { setInterval(fn) { tick = fn; return 1 }, clearInterval() {} },
    })()
    const pending = tick(); await flush()
    if (scenario === 'actor') { f.bindings.contactEpoch.current++; resolve({ data: [syntheticContact], error: null }) }
    await pending
    assert.equal(f.state.owner, null)
    assert.equal(f.state.authorizationStatus, null)
    cleanup()
  }
})

let submitNode
babel.traverse(ast, { FunctionDeclaration(path) {
  if (path.node.id?.name === 'handleSubmit') submitNode = path.node
} })
assert.ok(submitNode)
const submitSource = stripTypeScriptTypes(source.slice(submitNode.start, submitNode.end), { mode: 'strip' })
function submitFixture({ loading = false, restoring = false, status = null } = {}) {
  const f = stateFixture(); let resolve, posts = 0
  const bindings = { ...f.bindings, loading, restoring, authorizationStatus: status,
    FormData: class { set() {} }, window: { location: { pathname: '/bodegas/prueba', search: '' } },
    router: { push() { throw new Error('No debe navegar tras cambio de actor') } },
    fetch: () => { posts++; return new Promise(done => { resolve = done }) },
  }
  const submit = new Function(...Object.keys(bindings), `${submitSource}\nreturn handleSubmit`)(...Object.values(bindings))
  return { ...f, submit: () => submit({ preventDefault() {}, currentTarget: {} }), posts: () => posts,
    finish: () => resolve({ status: 200, ok: true, json: async () => ({
      owner: syntheticContact, authorization_id: 'old', authorization_status: 'authorized',
    }) }) }
}

test('submit UI real: carga/restauración/pending impiden repetir POST', async () => {
  for (const options of [{ loading: true }, { restoring: true }, { status: 'pending' }]) {
    const f = submitFixture(options); await f.submit()
    assert.equal(f.posts(), 0)
  }
})

test('submit UI real: cambio de actor descarta contacto de respuesta anterior', async () => {
  const f = submitFixture(); const pending = f.submit()
  assert.equal(f.posts(), 1)
  f.bindings.contactEpoch.current++
  f.finish(); await pending
  assert.equal(f.state.owner, null)
  assert.equal(f.state.authorizationId, null)
})
