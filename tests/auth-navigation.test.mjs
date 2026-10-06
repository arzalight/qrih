import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import babel from '@babel/core'
import { pendingConfirmationLoginPath, safeInternalPath } from '../lib/safe-navigation.ts'

// Handlers reales con dependencias sintéticas: nunca envía correo ni inicia sesión real.
function handler(file, name) {
  const source = readFileSync(new URL(file, import.meta.url), 'utf8')
  const ast = babel.parseSync(source, { filename: file, configFile: false, babelrc: false,
    plugins: [['@babel/plugin-syntax-typescript', { isTSX: true }]] })
  let found
  babel.traverse(ast, { FunctionDeclaration(path) {
    if (path.node.id?.name === name) found = path.node
  } })
  assert.ok(found, `Debe existir ${name}`)
  return stripTypeScriptTypes(source.slice(found.start, found.end), { mode: 'strip' })
}
const createSource = handler('../app/registro/page.tsx', 'handleCreate')
const loginSource = handler('../app/login/page.tsx', 'signIn')

function signupFixture({ error = null, session = null, profileOk = true, unavailable = false,
  next = '/mis-propiedades' } = {}) {
  const redirects = [], messages = [], requests = [], profileCalls = []
  const form = { email: ' synthetic@example.invalid ', password: 'Synthetic!123', name: 'Prueba',
    phone: '5555555555', company: '', userType: 'advisor' }
  const client = { auth: { signUp: async input => {
    requests.push(input)
    return { data: { user: { id: 'synthetic' }, session }, error }
  } } }
  const create = new Function('loading', 'setLoading', 'setMsg', 'supabase', 'window', 'form',
    'ensureOwnProfile', 'router', 'next', 'pendingConfirmationLoginPath', 'setTimeout',
    `${createSource}\nreturn handleCreate`)(false, () => {}, value => messages.push(value),
    unavailable ? null : client, { location: { origin: 'https://qrih-staging.netlify.app' } }, form,
    async value => { profileCalls.push(value); return { ok: profileOk } },
    { replace: value => redirects.push(value) }, next, pendingConfirmationLoginPath,
    () => 0) // El timeout no programa nada en esta fixture.
  return { create, redirects, messages, requests, profileCalls }
}

function loginFixture({ error = null, user = { id: 'synthetic' }, unavailable = false,
  profileOk = true, role = 'publisher', status = 'active', next = '/mis-propiedades' } = {}) {
  const redirects = [], messages = [], calls = []
  const client = { auth: { signInWithPassword: async value => {
    calls.push(value); return { data: { user }, error }
  } } }
  const login = new Function('loading', 'setLoading', 'setMessage', 'createClient', 'email', 'password',
    'ensureOwnProfile', 'router', 'next', `${loginSource}\nreturn signIn`)(false, () => {},
    value => messages.push(value), () => unavailable ? null : client,
    'synthetic@example.invalid', 'Synthetic!123', async () => ({ ok: profileOk,
      profile: { role, account_status: status } }),
    { replace: value => redirects.push(value), refresh() {} }, next)
  return { login: () => login({ preventDefault() {} }), redirects, messages, calls }
}

test('destino normal al panel; next local explícito conservado y externo rechazado', () => {
  for (const input of [null, undefined, '', 'https://evil.test', '//evil.test', '/%2Fevil.test', '/%5cevil.test']) {
    assert.equal(safeInternalPath(input), '/mis-propiedades')
  }
  for (const path of ['/publicar', '/bodegas/prueba?tab=contacto', '/mis-propiedades?view=requirements']) {
    assert.equal(safeInternalPath(path), path)
  }
})

test('aviso de login usa bandera fija y next seguro, sin identidad/credenciales en URL', () => {
  for (const next of [null, '//evil.test', '/bodegas/prueba']) {
    const url = new URL(pendingConfirmationLoginPath(next), 'https://qrih.invalid')
    assert.equal(url.pathname, '/login')
    assert.equal(url.searchParams.get('registro'), 'pendiente')
    assert.equal(url.searchParams.get('next'), safeInternalPath(next))
    assert.deepEqual([...url.searchParams.keys()], ['registro', 'next'])
  }
})

test('registro real sin sesión: login con aviso, PKCE callback intacto y sin crear perfil', async () => {
  const f = signupFixture({ next: '/bodegas/prueba' })
  await f.create()
  assert.deepEqual(f.redirects, [pendingConfirmationLoginPath('/bodegas/prueba')])
  assert.equal(f.profileCalls.length, 0)
  assert.equal(f.requests.length, 1)
  assert.equal(f.requests[0].options.emailRedirectTo, 'https://qrih-staging.netlify.app/auth/callback')
  assert.equal(f.requests[0].email, 'synthetic@example.invalid')
  assert.ok(!f.redirects[0].includes('synthetic'))
})

test('registro real: error/cliente ausente/perfil fallido no muestran éxito; sesión válida conserva next', async () => {
  for (const options of [{ error: { message: 'synthetic failure' } }, { unavailable: true },
    { session: { synthetic: true }, profileOk: false }]) {
    const f = signupFixture(options); await f.create()
    assert.equal(f.redirects.length, 0)
    assert.ok(f.messages.at(-1))
  }
  const f = signupFixture({ session: { synthetic: true }, next: '/publicar' })
  await f.create()
  assert.deepEqual(f.redirects, ['/publicar'])
  assert.equal(f.profileCalls.length, 1)
})

test('login real: panel default, next explícito y administrador activo preservados', async () => {
  for (const [options, target] of [[{}, '/mis-propiedades'],
    [{ next: '/bodegas/prueba' }, '/bodegas/prueba'],
    [{ role: 'admin', next: '/bodegas/prueba' }, '/admin']]) {
    const f = loginFixture(options); await f.login()
    assert.deepEqual(f.redirects, [target])
    assert.equal(f.calls.length, 1)
  }
})

test('login real: sin usuario/servicio, error Auth o perfil inválido no conceden navegación', async () => {
  for (const options of [{ error: { message: 'synthetic failure' } }, { user: null },
    { unavailable: true }, { profileOk: false }]) {
    const f = loginFixture(options); await f.login()
    assert.equal(f.redirects.length, 0)
    assert.ok(f.messages.at(-1))
  }
})
