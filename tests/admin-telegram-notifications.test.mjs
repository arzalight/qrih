import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
  createNotifyAdminHandler,
  formatTelegramMessage,
} from '../supabase/functions/notify-admin-events/core.ts'

const WEBHOOK_SECRET = 'synthetic-webhook-secret-32-chars-ok'
const BOT_TOKEN = '123456:SYNTHETIC_BOT_TOKEN_DO_NOT_LEAK'
const CHAT_ID = '987654321'
const PORTAL_URL = 'https://qrih-staging.netlify.app'

function makeRequest(body, secret = WEBHOOK_SECRET, method = 'POST') {
  return new Request('https://synthetic.supabase.co/functions/v1/notify-admin-events', {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(secret ? { 'x-qrih-webhook-secret': secret } : {}),
    },
    ...(method === 'POST' ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
  })
}

test('notify-admin-events: rechaza métodos no POST, secreto faltante/inválido y payloads fuera de lista', async () => {
  const calls = []
  const handler = createNotifyAdminHandler({
    webhookSecret: WEBHOOK_SECRET,
    telegramBotToken: BOT_TOKEN,
    telegramChatId: CHAT_ID,
    portalUrl: PORTAL_URL,
    fetchImpl: async (...args) => { calls.push(args); return new Response('{"ok":true}', { status: 200 }) },
  })

  assert.equal((await handler(makeRequest({}, WEBHOOK_SECRET, 'GET'))).status, 405)
  assert.equal((await handler(makeRequest({ event: 'profile_created' }, ''))).status, 401)
  assert.equal((await handler(makeRequest({ event: 'profile_created' }, 'wrong-secret'))).status, 401)
  assert.equal((await handler(makeRequest('{invalid-json'))).status, 400)
  assert.equal((await handler(makeRequest({ event: 'unknown_event' }))).status, 400)
  assert.equal(calls.length, 0)
})

test('notify-admin-events: omite limpiamente con 202 cuando faltan credenciales de Telegram', async () => {
  const handler = createNotifyAdminHandler({
    webhookSecret: WEBHOOK_SECRET,
    telegramBotToken: '',
    telegramChatId: '',
    portalUrl: PORTAL_URL,
  })
  const res = await handler(makeRequest({ event: 'profile_created', full_name: 'Prueba' }))
  assert.equal(res.status, 202)
  assert.deepEqual(await res.json(), { ok: true, skipped: 'telegram_not_configured' })
})

test('notify-admin-events: formatea los 4 eventos escapando HTML y enlaza al panel correcto', () => {
  const id = '11111111-1111-4111-8111-111111111111'
  const profileMsg = formatTelegramMessage({
    event: 'profile_created',
    entity_id: id,
    full_name: 'Ana <script> & Co',
    company: 'Parque "Norte"',
    user_type: 'advisor',
  }, PORTAL_URL)
  assert.match(profileMsg, /Ana &lt;script&gt; &amp; Co/)
  assert.match(profileMsg, /Asesor inmobiliario/)
  assert.match(profileMsg, /https:\/\/qrih-staging\.netlify\.app\/admin\/asesores\/11111111-1111-4111-8111-111111111111/)

  const propMsg = formatTelegramMessage({
    event: 'property_pending',
    entity_id: id,
    title: 'Nave <El Marqués>',
    operation: 'Renta',
    zone_general: 'El Marqués',
    zone: 'Aeropuerto',
    total_area: 1500,
    price_display: '$110 MXN m²/mes',
  }, PORTAL_URL)
  assert.match(propMsg, /Nueva propiedad enviada a revisión/)
  assert.match(propMsg, /Nave &lt;El Marqués&gt;/)
  assert.match(propMsg, /https:\/\/qrih-staging\.netlify\.app\/admin\/11111111-1111-4111-8111-111111111111/)

  const updateMsg = formatTelegramMessage({
    event: 'property_pending_update',
    entity_id: id,
    title: 'Nave Editada',
  }, PORTAL_URL)
  assert.match(updateMsg, /Edición de propiedad en revisión/)

  const demandMsg = formatTelegramMessage({
    event: 'demand_created',
    operation: 'Renta',
    zone_general: 'Colón',
    zone: 'Colón',
    area_min: 500,
    area_max: 1200,
    company: 'Logística QRO',
  }, PORTAL_URL)
  assert.match(demandMsg, /Nuevo requerimiento/)
  assert.match(demandMsg, /500 a 1,200 m²/)
})

test('notify-admin-events: envía mensaje a Telegram y nunca filtra el token en errores', async () => {
  const sent = []
  const okHandler = createNotifyAdminHandler({
    webhookSecret: WEBHOOK_SECRET,
    telegramBotToken: BOT_TOKEN,
    telegramChatId: CHAT_ID,
    portalUrl: PORTAL_URL,
    fetchImpl: async (url, init) => {
      sent.push({ url: String(url), body: JSON.parse(String(init?.body)) })
      return new Response('{"ok":true}', { status: 200 })
    },
  })

  const okRes = await okHandler(makeRequest({
    event: 'property_pending',
    entity_id: '11111111-1111-4111-8111-111111111111',
    title: 'Bodega Prueba',
  }))
  assert.equal(okRes.status, 200)
  assert.equal(sent.length, 1)
  assert.equal(sent[0].url, `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`)
  assert.equal(sent[0].body.chat_id, CHAT_ID)
  assert.equal(sent[0].body.parse_mode, 'HTML')

  const failHandler = createNotifyAdminHandler({
    webhookSecret: WEBHOOK_SECRET,
    telegramBotToken: BOT_TOKEN,
    telegramChatId: CHAT_ID,
    portalUrl: PORTAL_URL,
    fetchImpl: async () => new Response('Forbidden', { status: 403 }),
  })
  const failRes = await failHandler(makeRequest({ event: 'demand_created', operation: 'Venta' }))
  assert.equal(failRes.status, 502)
  const failText = await failRes.text()
  assert.doesNotMatch(failText, /SYNTHETIC_BOT_TOKEN_DO_NOT_LEAK/)
})

test('migración admin_telegram_notifications: SECURITY DEFINER con search_path vacío, REVOKE y sin secretos literales', () => {
  const sql = readFileSync(new URL('../supabase/migrations/20261124153000_admin_telegram_notifications.sql', import.meta.url), 'utf8')
  assert.match(sql, /SET search_path = ''/)
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.qrih_dispatch_admin_notification\(jsonb\) FROM PUBLIC, anon, authenticated;/)
  assert.match(sql, /FROM vault\.decrypted_secrets/)
  assert.match(sql, /EXCEPTION WHEN OTHERS THEN/)
  assert.doesNotMatch(sql, /api\.telegram\.org|SUPABASE_SERVICE_ROLE_KEY|sb_secret_/)
})
