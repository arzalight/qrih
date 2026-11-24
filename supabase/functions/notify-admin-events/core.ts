export type AdminNotifyEventType =
  | 'profile_created'
  | 'property_pending'
  | 'property_pending_update'
  | 'demand_created'

export type AdminNotifyPayload = {
  event: AdminNotifyEventType
  entity_id?: string | null
  title?: string | null
  full_name?: string | null
  company?: string | null
  role?: string | null
  user_type?: string | null
  operation?: string | null
  zone_general?: string | null
  zone?: string | null
  total_area?: number | string | null
  area_min?: number | string | null
  area_max?: number | string | null
  price_display?: string | null
}

export type NotifyAdminHandlerDeps = {
  webhookSecret: string
  telegramBotToken: string
  telegramChatId: string
  portalUrl: string
  fetchImpl?: typeof fetch
}

const ALLOWED_EVENTS = new Set<AdminNotifyEventType>([
  'profile_created',
  'property_pending',
  'property_pending_update',
  'demand_created',
])

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'no-referrer',
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS })
}

export function constantTimeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder()
  const aBytes = enc.encode(a)
  const bBytes = enc.encode(b)
  const len = Math.max(aBytes.length, bBytes.length)
  let diff = aBytes.length ^ bBytes.length
  for (let i = 0; i < len; i += 1) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0)
  }
  return diff === 0
}

export function escapeHtml(value: unknown): string {
  const text = String(value ?? '').trim()
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function cleanText(value: unknown, maxLen = 140): string {
  const text = String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > maxLen ? `${text.slice(0, maxLen - 1)}…` : text
}

function formatNumber(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) return null
  return num.toLocaleString('es-MX')
}

function safePortalOrigin(raw: string): string {
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return 'https://qrih-staging.netlify.app'
    return url.origin
  } catch {
    return 'https://qrih-staging.netlify.app'
  }
}

export function formatTelegramMessage(payload: AdminNotifyPayload, portalOrigin: string): string {
  const origin = safePortalOrigin(portalOrigin)
  const entityId = typeof payload.entity_id === 'string' && UUID_RE.test(payload.entity_id)
    ? payload.entity_id
    : null

  if (payload.event === 'profile_created') {
    const name = escapeHtml(cleanText(payload.full_name || 'Sin nombre'))
    const company = cleanText(payload.company)
    const userType = payload.user_type === 'owner'
      ? 'Propietario'
      : payload.user_type === 'advisor'
        ? 'Asesor inmobiliario'
        : cleanText(payload.role || 'Usuario')
    const url = entityId ? `${origin}/admin/asesores/${entityId}` : `${origin}/admin/asesores`
    const lines = [
      '<b>Nuevo usuario en QRIH</b>',
      `<b>Nombre:</b> ${name}`,
      `<b>Tipo:</b> ${escapeHtml(userType)}`,
    ]
    if (company) lines.push(`<b>Empresa:</b> ${escapeHtml(company)}`)
    lines.push(`<a href="${escapeHtml(url)}">Abrir perfil en Admin</a>`)
    return lines.join('\n')
  }

  if (payload.event === 'property_pending' || payload.event === 'property_pending_update') {
    const heading = payload.event === 'property_pending_update'
      ? '<b>Edición de propiedad en revisión</b>'
      : '<b>Nueva propiedad enviada a revisión</b>'
    const title = escapeHtml(cleanText(payload.title || 'Propiedad sin título'))
    const operation = cleanText(payload.operation)
    const zoneParts = [cleanText(payload.zone_general), cleanText(payload.zone)].filter(Boolean)
    const area = formatNumber(payload.total_area)
    const price = cleanText(payload.price_display, 80)
    const url = entityId ? `${origin}/admin/${entityId}` : `${origin}/admin`
    const lines = [heading, `<b>Título:</b> ${title}`]
    if (operation) lines.push(`<b>Operación:</b> ${escapeHtml(operation)}`)
    if (zoneParts.length) lines.push(`<b>Zona:</b> ${escapeHtml(zoneParts.join(' · '))}`)
    if (area) lines.push(`<b>Superficie:</b> ${escapeHtml(area)} m²`)
    if (price) lines.push(`<b>Precio:</b> ${escapeHtml(price)}`)
    lines.push(`<a href="${escapeHtml(url)}">Revisar en Admin</a>`)
    return lines.join('\n')
  }

  const operation = cleanText(payload.operation)
  const zoneParts = [cleanText(payload.zone_general), cleanText(payload.zone)].filter(Boolean)
  const areaMin = formatNumber(payload.area_min)
  const areaMax = formatNumber(payload.area_max)
  const areaRange = areaMin && areaMax ? `${areaMin} a ${areaMax} m²` : areaMin ? `Desde ${areaMin} m²` : areaMax ? `Hasta ${areaMax} m²` : null
  const company = cleanText(payload.company)
  const lines = ['<b>Nuevo requerimiento (/busco-bodega)</b>']
  if (operation) lines.push(`<b>Operación:</b> ${escapeHtml(operation)}`)
  if (zoneParts.length) lines.push(`<b>Zona:</b> ${escapeHtml(zoneParts.join(' · '))}`)
  if (areaRange) lines.push(`<b>Superficie:</b> ${escapeHtml(areaRange)}`)
  if (company) lines.push(`<b>Empresa:</b> ${escapeHtml(company)}`)
  lines.push(`<a href="${escapeHtml(`${origin}/admin`)}">Abrir panel Admin</a>`)
  return lines.join('\n')
}

export function createNotifyAdminHandler(deps: NotifyAdminHandlerDeps) {
  const fetchFn = deps.fetchImpl ?? fetch

  return async function handle(req: Request): Promise<Response> {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405)
    }

    if (!deps.webhookSecret || deps.webhookSecret.length < 16) {
      return jsonResponse({ error: 'Webhook secret not configured' }, 503)
    }

    const providedSecret = req.headers.get('x-qrih-webhook-secret') ?? ''
    if (!providedSecret || !constantTimeEqual(providedSecret, deps.webhookSecret)) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    let payload: AdminNotifyPayload
    try {
      const raw = await req.json()
      if (!raw || typeof raw !== 'object' || !ALLOWED_EVENTS.has(raw.event)) {
        return jsonResponse({ error: 'Invalid event payload' }, 400)
      }
      payload = raw as AdminNotifyPayload
    } catch {
      return jsonResponse({ error: 'Invalid JSON payload' }, 400)
    }

    if (!deps.telegramBotToken || !deps.telegramChatId) {
      return jsonResponse({ ok: true, skipped: 'telegram_not_configured' }, 202)
    }

    const text = formatTelegramMessage(payload, deps.portalUrl)
    const telegramUrl = `https://api.telegram.org/bot${deps.telegramBotToken}/sendMessage`

    try {
      const telegramResponse = await fetchFn(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: deps.telegramChatId,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      })

      if (!telegramResponse.ok) {
        return jsonResponse({ error: 'Telegram delivery failed', status: telegramResponse.status }, 502)
      }

      return jsonResponse({ ok: true, delivered: true, event: payload.event }, 200)
    } catch {
      return jsonResponse({ error: 'Telegram request error' }, 502)
    }
  }
}
