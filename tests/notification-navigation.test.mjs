import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import babel from '@babel/core'
import { moderationNotificationPath } from '../lib/safe-navigation.ts'
import { markNotificationsRead, NOTIFICATIONS_CHANGED } from '../lib/notification-read.ts'

// Ejecuta el handler real con cliente/estado/window sintéticos, sin sesión ni red.
const source = readFileSync(new URL('../components/Header.tsx', import.meta.url), 'utf8')
const ast = babel.parseSync(source, { filename: 'Header.tsx', configFile: false, babelrc: false,
  plugins: [['@babel/plugin-syntax-typescript', { isTSX: true }]] })
let handler
babel.traverse(ast, { FunctionDeclaration(path) {
  if (path.node.id?.name === 'handleNotificationClick') handler = path.node
} })
assert.ok(handler, 'Debe existir el handler del menú')
assert.match(source, /import\s*\{\s*moderationNotificationPath\s*\}\s*from\s*['"]@\/lib\/safe-navigation['"]/)
const javascript = stripTypeScriptTypes(source.slice(handler.start, handler.end), { mode: 'strip' })

function fixture({ error = null, unavailable = false } = {}) {
  const notices = [{ id: 'synthetic-notice', read_at: null }]
  const updates = []
  let state = notices
  const window = { location: { href: '' }, dispatchEvent() {} }
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: 'synthetic-owner' } }, error: null }) },
    from(table) {
      assert.equal(table, 'notifications')
      return {
        update(values) {
          assert.deepEqual(Object.keys(values), ['read_at'])
          assert.ok(Number.isFinite(Date.parse(values.read_at)))
          const q = {
            eq(field, id) {
              assert.ok((field === 'id' && id === 'synthetic-notice') || (field === 'user_id' && id === 'synthetic-owner'))
              return q
            },
            is() { return q },
            async select() { updates.push(values); return { error, data: error ? null : [{ id: 'synthetic-notice' }] } },
          }
          return q
        },
      }
    },
  }
  const click = new Function('createClient', 'setNotifications', 'window', 'moderationNotificationPath', 'markNotificationsRead', 'setUnreadCount', 'NOTIFICATIONS_CHANGED',
    `${javascript}\nreturn handleNotificationClick`)(
    () => unavailable ? null : client,
    update => { state = update(state) },
    window,
    moderationNotificationPath,
    markNotificationsRead, () => {}, NOTIFICATIONS_CHANGED,
  )
  return { click, window, updates, state: () => state }
}

test('moderación navega al panel existente, no a ficha pública ni URL externa', () => {
  for (const type of ['property_published', 'property_rejected']) {
    assert.equal(moderationNotificationPath(type), '/mis-propiedades')
  }
})

test('panel real: Mis notificaciones enlaza al historial existente fuera de las vistas condicionales', () => {
  const panelSource = readFileSync(new URL('../app/mis-propiedades/page.tsx', import.meta.url), 'utf8')
  const panelAst = babel.parseSync(panelSource, { filename: 'page.tsx', configFile: false, babelrc: false,
    plugins: [['@babel/plugin-syntax-typescript', { isTSX: true }]] })
  const links = []
  let toggleStart
  babel.traverse(panelAst, { JSXElement(path) {
    const opening = path.node.openingElement
    if (opening.name.type !== 'JSXIdentifier') return
    if (opening.name.name === 'AutoApproveContactsToggle') toggleStart = path.node.start
    if (opening.name.name !== 'Link') return
    const href = opening.attributes.find(attribute => attribute.type === 'JSXAttribute' && attribute.name.name === 'href')
    if (href?.value?.type !== 'StringLiteral' || href.value.value !== '/notificaciones') return
    links.push(path.node)
    assert.equal(path.node.children.filter(child => child.type === 'JSXText').map(child => child.value).join('').trim(),
      'Mis notificaciones')
    assert.equal(path.findParent(parent => parent.isConditionalExpression() || parent.isLogicalExpression()), null,
      'El acceso debe estar presente en Propiedades, Requerimientos y Oportunidades, incluso sin publicaciones')
    assert.ok(path.findParent(parent => parent.isReturnStatement()), 'Debe formar parte del panel renderizado')
  } })
  assert.equal(links.length, 1, 'Debe haber un único acceso directo al historial')
  assert.ok(links[0].start < toggleStart, 'El acceso debe aparecer en la cabecera del panel')
})

test('tipos ajenos a moderación no alteran sus destinos ni aceptan URL como tipo', () => {
  for (const type of ['opportunity_property_registered', 'property_contact_request',
    'property_contact_authorized', 'unknown', '', 'https://evil.test', '//evil.test']) {
    assert.equal(moderationNotificationPath(type), null)
  }
})

test('Header real: publicación/rechazo leídos, no leídos y error read_at navegan al panel', async () => {
  for (const type of ['property_published', 'property_rejected']) {
    for (const scenario of ['unread', 'read', 'update-error']) {
      const f = fixture({ error: scenario === 'update-error' ? { message: 'synthetic' } : null })
      await f.click({ id: 'synthetic-notice', type,
        read_at: scenario === 'read' ? '2026-10-05T00:00:00Z' : null,
        property_id: null, url: 'https://evil.test', metadata: { next: '//evil.test' } })
      assert.equal(f.window.location.href, '/mis-propiedades')
      assert.equal(f.updates.length, scenario === 'read' ? 0 : 1)
      assert.equal(Boolean(f.state()[0].read_at), scenario === 'unread')
    }
  }
})

test('Header real: contactos y requerimientos conservan navegación previa', async () => {
  const propertyId = '11111111-1111-4111-8111-111111111111'
  for (const [type, destination] of [
    ['opportunity_property_registered', '/mis-propiedades?view=requirements'],
    ['property_contact_request', `/mis-propiedades/${propertyId}/solicitudes`],
    ['property_contact_authorized', '/notificaciones'],
  ]) {
    const f = fixture()
    await f.click({ id: 'synthetic-notice', type, property_id: propertyId, read_at: '2026-10-05T00:00:00Z' })
    assert.equal(f.window.location.href, destination)
    assert.equal(f.updates.length, 0)
  }
})

test('Header real: cliente ausente no navega ni escribe; aviso no relacionado no se redirige', async () => {
  const missing = fixture({ unavailable: true })
  await missing.click({ id: 'synthetic-notice', type: 'property_published', read_at: null })
  assert.equal(missing.window.location.href, '')
  assert.equal(missing.updates.length, 0)
  const other = fixture()
  await other.click({ id: 'synthetic-notice', type: 'unknown', read_at: '2026-10-05T00:00:00Z' })
  assert.equal(other.window.location.href, '')
})
