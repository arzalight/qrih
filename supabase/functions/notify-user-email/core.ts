export type UserNotificationType =
  | 'property_published'
  | 'property_rejected'
  | 'property_contact_request'
  | 'property_contact_authorized'
  | 'opportunity_property_registered'

export type UserEmailPayload = {
  notification_id?: string | null
  type: UserNotificationType
  to_email: string
  recipient_name?: string | null
  title: string
  message: string
  property_title?: string | null
  property_slug?: string | null
}

export type NotifyUserEmailDeps = {
  webhookSecret: string
  resendApiKey: string
  resendFrom: string
  portalUrl: string
  overrideTo?: string
  replyTo?: string
  fetchImpl?: typeof fetch
}

const ALLOWED_TYPES = new Set<UserNotificationType>([
  'property_published',
  'property_rejected',
  'property_contact_request',
  'property_contact_authorized',
  'opportunity_property_registered',
])

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"\r\n]+@[^\s@<>()[\]\\,;:"\r\n]+\.[^\s@<>()[\]\\,;:"\r\n]{2,}$/
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,160}$/i

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
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function cleanLine(value: unknown, maxLen = 180): string {
  const text = String(value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > maxLen ? `${text.slice(0, maxLen - 1)}…` : text
}

function cleanMessage(value: unknown, maxLen = 1200): string {
  const text = String(value ?? '')
    .replace(/\r\n/g, '\n')
    .trim()
  return text.length > maxLen ? `${text.slice(0, maxLen - 1)}…` : text
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

function isValidEmail(email: string): boolean {
  return email.length <= 254 && EMAIL_RE.test(email)
}

type NotificationPresentation = {
  badge: string
  badgeBg: string
  badgeColor: string
  ctaLabel: string
  ctaUrl: string
}

function resolvePresentation(payload: UserEmailPayload, origin: string): NotificationPresentation {
  const slug = typeof payload.property_slug === 'string' && SLUG_RE.test(payload.property_slug.trim())
    ? payload.property_slug.trim()
    : null

  switch (payload.type) {
    case 'property_published':
      return {
        badge: 'Publicación aprobada',
        badgeBg: '#dcfce7',
        badgeColor: '#166534',
        ctaLabel: slug ? 'Ver propiedad publicada' : 'Ir a mis propiedades',
        ctaUrl: slug ? `${origin}/bodegas/${encodeURIComponent(slug)}` : `${origin}/mis-propiedades`,
      }
    case 'property_rejected':
      return {
        badge: 'Revisión requerida',
        badgeBg: '#fee2e2',
        badgeColor: '#991b1b',
        ctaLabel: 'Revisar en Mis propiedades',
        ctaUrl: `${origin}/mis-propiedades`,
      }
    case 'property_contact_request':
      return {
        badge: 'Nueva solicitud de contacto',
        badgeBg: '#e0e7ff',
        badgeColor: '#3730a3',
        ctaLabel: 'Revisar solicitud en QRIH',
        ctaUrl: `${origin}/notificaciones`,
      }
    case 'property_contact_authorized':
      return {
        badge: 'Contacto autorizado',
        badgeBg: '#dcfce7',
        badgeColor: '#166534',
        ctaLabel: 'Ver datos de contacto',
        ctaUrl: `${origin}/notificaciones`,
      }
    case 'opportunity_property_registered':
      return {
        badge: 'Nueva oportunidad vinculada',
        badgeBg: '#e0e7ff',
        badgeColor: '#3730a3',
        ctaLabel: 'Ver notificación en QRIH',
        ctaUrl: `${origin}/notificaciones`,
      }
  }
}

export function renderNotificationEmail(
  payload: UserEmailPayload,
  portalUrl: string,
  options: { redirectedFrom?: string | null } = {}
): { subject: string; html: string; text: string } {
  const origin = safePortalOrigin(portalUrl)
  const pres = resolvePresentation(payload, origin)
  const title = cleanLine(payload.title, 140) || pres.badge
  const message = cleanMessage(payload.message, 1200)
  const recipientName = cleanLine(payload.recipient_name, 80)
  const propertyTitle = cleanLine(payload.property_title, 140)
  const isStagingRedirect = Boolean(options.redirectedFrom)
  const subject = `${isStagingRedirect ? '[STAGING] ' : ''}${title} — QRO Industrial Hub`

  const greeting = recipientName ? `Hola ${recipientName},` : 'Hola,'
  const htmlMessage = escapeHtml(message).replaceAll('\n', '<br />')

  const stagingBanner = isStagingRedirect
    ? `<div style="margin:0 0 18px;padding:10px 14px;border-radius:8px;background:#fef3c7;border:1px solid #f59e0b;color:#92400e;font-size:12px;line-height:1.5;">
         <strong>Modo STAGING:</strong> correo redirigido para pruebas. Destinatario original: ${escapeHtml(options.redirectedFrom)}
       </div>`
    : ''

  const propertyBlock = propertyTitle
    ? `<div style="margin:0 0 18px;padding:12px 14px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:14px;color:#0f172a;">
         <span style="display:block;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#64748b;margin-bottom:4px;">Propiedad relacionada</span>
         <strong>${escapeHtml(propertyTitle)}</strong>
       </div>`
    : ''

  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:24px 12px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
      <tr>
        <td style="padding:22px 28px;background:linear-gradient(135deg,#0b1323 0%,#162747 100%);color:#ffffff;">
          <div style="font-size:16px;font-weight:800;letter-spacing:0.04em;">QRO INDUSTRIAL HUB</div>
          <div style="font-size:11px;letter-spacing:0.22em;color:#93c5fd;margin-top:3px;">Q R I H</div>
        </td>
      </tr>
      <tr>
        <td style="padding:28px;">
          ${stagingBanner}
          <div style="display:inline-block;padding:5px 11px;border-radius:999px;background:${pres.badgeBg};color:${pres.badgeColor};font-size:12px;font-weight:700;margin-bottom:14px;">
            ${escapeHtml(pres.badge)}
          </div>
          <h1 style="margin:0 0 14px;font-size:21px;line-height:1.3;color:#0f172a;">${escapeHtml(title)}</h1>
          <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#334155;">${escapeHtml(greeting)}</p>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#1e293b;">${htmlMessage}</p>
          ${propertyBlock}
          <div style="margin:24px 0 8px;">
            <a href="${escapeHtml(pres.ctaUrl)}" style="display:inline-block;padding:12px 20px;border-radius:10px;background:#4f6bc0;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">
              ${escapeHtml(pres.ctaLabel)}
            </a>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.5;color:#64748b;">
          Recibiste este aviso automático porque tienes una cuenta activa en QRO Industrial Hub.<br />
          También puedes consultar todas tus alertas en <a href="${escapeHtml(`${origin}/notificaciones`)}" style="color:#4f6bc0;text-decoration:underline;">${escapeHtml(`${origin}/notificaciones`)}</a>.
        </td>
      </tr>
    </table>
  </body>
</html>`

  const textLines = [
    isStagingRedirect ? `[STAGING] Destinatario original: ${options.redirectedFrom}` : '',
    `QRO INDUSTRIAL HUB (QRIH) — ${pres.badge}`,
    '',
    greeting,
    '',
    title,
    message,
    propertyTitle ? `Propiedad: ${propertyTitle}` : '',
    '',
    `${pres.ctaLabel}: ${pres.ctaUrl}`,
    `Todas tus notificaciones: ${origin}/notificaciones`,
  ].filter((line, idx, arr) => !(line === '' && arr[idx - 1] === ''))

  return { subject, html, text: textLines.join('\n').trim() }
}

export function createNotifyUserEmailHandler(deps: NotifyUserEmailDeps) {
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

    let payload: UserEmailPayload
    try {
      const raw = await req.json()
      if (!raw || typeof raw !== 'object' || !ALLOWED_TYPES.has(raw.type)) {
        return jsonResponse({ error: 'Invalid notification payload' }, 400)
      }
      const toEmail = typeof raw.to_email === 'string' ? raw.to_email.trim().toLowerCase() : ''
      if (!isValidEmail(toEmail)) {
        return jsonResponse({ error: 'Invalid recipient email' }, 400)
      }
      const title = cleanLine(raw.title, 140)
      const message = cleanMessage(raw.message, 1200)
      if (!title || !message) {
        return jsonResponse({ error: 'Missing title or message' }, 400)
      }
      payload = {
        notification_id: typeof raw.notification_id === 'string' ? raw.notification_id : null,
        type: raw.type as UserNotificationType,
        to_email: toEmail,
        recipient_name: typeof raw.recipient_name === 'string' ? raw.recipient_name : null,
        title,
        message,
        property_title: typeof raw.property_title === 'string' ? raw.property_title : null,
        property_slug: typeof raw.property_slug === 'string' ? raw.property_slug : null,
      }
    } catch {
      return jsonResponse({ error: 'Invalid JSON payload' }, 400)
    }

    if (!deps.resendApiKey || !deps.resendFrom) {
      return jsonResponse({ ok: true, skipped: 'email_not_configured' }, 202)
    }

    const overrideTo = (deps.overrideTo ?? '').trim().toLowerCase()
    const useOverride = Boolean(overrideTo && isValidEmail(overrideTo))
    const finalTo = useOverride ? overrideTo : payload.to_email

    const { subject, html, text } = renderNotificationEmail(payload, deps.portalUrl, {
      redirectedFrom: useOverride && overrideTo !== payload.to_email ? payload.to_email : null,
    })

    const resendBody: Record<string, unknown> = {
      from: deps.resendFrom,
      to: [finalTo],
      subject,
      html,
      text,
    }
    const replyTo = (deps.replyTo ?? '').trim()
    if (replyTo && isValidEmail(replyTo)) {
      resendBody.reply_to = replyTo
    }

    try {
      const resendResponse = await fetchFn('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${deps.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resendBody),
      })

      if (!resendResponse.ok) {
        return jsonResponse({ error: 'Email delivery failed', status: resendResponse.status }, 502)
      }

      return jsonResponse(
        {
          ok: true,
          delivered: true,
          type: payload.type,
          redirected: useOverride,
        },
        200
      )
    } catch {
      return jsonResponse({ error: 'Email request error' }, 502)
    }
  }
}
