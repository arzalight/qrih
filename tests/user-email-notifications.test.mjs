import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  createNotifyUserEmailHandler,
  renderNotificationEmail,
} from '../supabase/functions/notify-user-email/core.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
const TEST_SECRET = 'synthetic_user_email_webhook_secret_0123456789'

test('notify-user-email: rechaza métodos no POST, secreto faltante/inválido y payloads inválidos', async () => {
  const unconfigured = createNotifyUserEmailHandler({
    webhookSecret: '',
    resendApiKey: '',
    resendFrom: '',
    portalUrl: 'https://qrih-staging.netlify.app',
  })
  assert.equal((await unconfigured(new Request('https://fn.test', { method: 'GET' }))).status, 405)
  assert.equal((await unconfigured(new Request('https://fn.test', { method: 'POST', body: '{}' }))).status, 503)

  const handler = createNotifyUserEmailHandler({
    webhookSecret: TEST_SECRET,
    resendApiKey: 're_test_key',
    resendFrom: 'QRIH <onboarding@resend.dev>',
    portalUrl: 'https://qrih-staging.netlify.app',
  })

  assert.equal(
    (await handler(new Request('https://fn.test', { method: 'POST', headers: { 'x-qrih-webhook-secret': 'wrong' }, body: '{}' }))).status,
    401
  )

  for (const badBody of [
    { type: 'unknown_type', to_email: 'user@example.com', title: 'T', message: 'M' },
    { type: 'property_published', to_email: 'bad-email\r\nBcc:evil@x.com', title: 'T', message: 'M' },
    { type: 'property_published', to_email: 'user@example.com', title: '', message: 'M' },
  ]) {
    const res = await handler(new Request('https://fn.test', {
      method: 'POST',
      headers: { 'x-qrih-webhook-secret': TEST_SECRET, 'content-type': 'application/json' },
      body: JSON.stringify(badBody),
    }))
    assert.equal(res.status, 400)
  }
})

test('notify-user-email: omite limpiamente con 202 si faltan credenciales de Resend', async () => {
  const handler = createNotifyUserEmailHandler({
    webhookSecret: TEST_SECRET,
    resendApiKey: '',
    resendFrom: '',
    portalUrl: 'https://qrih-staging.netlify.app',
  })
  const res = await handler(new Request('https://fn.test', {
    method: 'POST',
    headers: { 'x-qrih-webhook-secret': TEST_SECRET, 'content-type': 'application/json' },
    body: JSON.stringify({
      type: 'property_published',
      to_email: 'asesor@example.com',
      title: 'Tu propiedad fue publicada',
      message: 'Ya es visible en el inventario.',
    }),
  }))
  assert.equal(res.status, 202)
  assert.deepEqual(await res.json(), { ok: true, skipped: 'email_not_configured' })
})

test('notify-user-email: escapa HTML en los 5 tipos y genera enlaces seguros', () => {
  const pub = renderNotificationEmail(
    {
      type: 'property_published',
      to_email: 'asesor@example.com',
      recipient_name: '<b>Fabián</b>',
      title: 'Tu propiedad fue publicada',
      message: 'Lista para <script>alert(1)</script> visitas.',
      property_title: 'Nave & Bodega El Marqués',
      property_slug: 'nave-el-marques',
    },
    'https://qrih.mx'
  )
  assert.match(pub.html, /&lt;b&gt;Fabián&lt;\/b&gt;/)
  assert.doesNotMatch(pub.html, /<script>/)
  assert.match(pub.html, /https:\/\/qrih\.mx\/bodegas\/nave-el-marques/)
  assert.match(pub.text, /https:\/\/qrih\.mx\/bodegas\/nave-el-marques/)

  const rej = renderNotificationEmail(
    {
      type: 'property_rejected',
      to_email: 'asesor@example.com',
      title: 'Tu propiedad fue rechazada',
      message: 'Falta fotografía interior.',
    },
    'https://qrih.mx'
  )
  assert.match(rej.html, /https:\/\/qrih\.mx\/mis-propiedades/)

  for (const type of ['property_contact_request', 'property_contact_authorized', 'opportunity_property_registered']) {
    const mail = renderNotificationEmail(
      { type, to_email: 'user@example.com', title: 'Aviso', message: 'Detalle' },
      'https://qrih.mx',
      { redirectedFrom: 'original@example.com' }
    )
    assert.match(mail.subject, /^\[STAGING\] /)
    assert.match(mail.html, /original@example\.com/)
    assert.match(mail.html, /https:\/\/qrih\.mx\/notificaciones/)
  }
})

test('notify-user-email: envía vía Resend, soporta RESEND_OVERRIDE_TO en STAGING y no filtra API key', async () => {
  const calls = []
  const fakeKey = 're_synthetic_never_leak_999'
  const handler = createNotifyUserEmailHandler({
    webhookSecret: TEST_SECRET,
    resendApiKey: fakeKey,
    resendFrom: 'QRO Industrial Hub <onboarding@resend.dev>',
    portalUrl: 'https://qrih-staging.netlify.app',
    overrideTo: 'staging-owner@example.com',
    replyTo: 'contacto@example.com',
    fetchImpl: async (url, init) => {
      calls.push({ url, init })
      return new Response(JSON.stringify({ id: 'email_123' }), { status: 200 })
    },
  })

  const res = await handler(new Request('https://fn.test', {
    method: 'POST',
    headers: { 'x-qrih-webhook-secret': TEST_SECRET, 'content-type': 'application/json' },
    body: JSON.stringify({
      type: 'property_contact_request',
      to_email: 'cliente-real@example.com',
      recipient_name: 'Laura',
      title: 'Nueva solicitud de contacto',
      message: 'Tienes un nuevo interesado en tu bodega.',
    }),
  }))

  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { ok: true, delivered: true, type: 'property_contact_request', redirected: true })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, 'https://api.resend.com/emails')
  assert.equal(calls[0].init.headers.Authorization, `Bearer ${fakeKey}`)
  const sentBody = JSON.parse(calls[0].init.body)
  assert.deepEqual(sentBody.to, ['staging-owner@example.com'])
  assert.equal(sentBody.reply_to, 'contacto@example.com')
  assert.match(sentBody.subject, /^\[STAGING\] Nueva solicitud de contacto/)

  const failing = createNotifyUserEmailHandler({
    webhookSecret: TEST_SECRET,
    resendApiKey: fakeKey,
    resendFrom: 'QRIH <onboarding@resend.dev>',
    portalUrl: 'https://qrih-staging.netlify.app',
    fetchImpl: async () => new Response('Forbidden', { status: 403 }),
  })
  const errRes = await failing(new Request('https://fn.test', {
    method: 'POST',
    headers: { 'x-qrih-webhook-secret': TEST_SECRET, 'content-type': 'application/json' },
    body: JSON.stringify({
      type: 'property_published',
      to_email: 'user@example.com',
      title: 'Publicada',
      message: 'Ok',
    }),
  }))
  assert.equal(errRes.status, 502)
  assert.ok(!(await errRes.text()).includes(fakeKey))
})

test('migración user_email_notifications: SECURITY DEFINER, search_path vacío, REVOKE y filtro de usuarios confirmados/activos', () => {
  const sql = readFileSync(root + 'supabase/migrations/20261124163000_user_email_notifications.sql', 'utf8')
  assert.match(sql, /SECURITY DEFINER/i)
  assert.match(sql, /SET search_path = ''/i)
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.qrih_dispatch_user_email_notification/i)
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.qrih_trg_notify_user_email/i)
  assert.match(sql, /email_confirmed_at IS NOT NULL/i)
  assert.match(sql, /account_status IS DISTINCT FROM 'active'/i)
  assert.doesNotMatch(sql, /re_[A-Za-z0-9]{16,}/)
})
