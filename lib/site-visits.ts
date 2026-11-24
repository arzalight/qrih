import { createHash } from 'node:crypto'
import { validUuid } from '@/lib/request-security'

export type VisitLandingGroup =
  | 'home'
  | 'inventory'
  | 'property'
  | 'demand'
  | 'advisor'
  | 'legal'

const BOT_UA_PATTERN =
  /bot\b|crawl|spider|slurp|mediapartners|lighthouse|pagespeed|gtmetrix|pingdom|uptime|headlesschrome|playwright|puppeteer|selenium|phantomjs|curl\/|wget\/|python-requests|python-urllib|go-http-client|axios\/|node-fetch|ahrefs|semrush|mj12bot|dotbot|bytespider|bingpreview|facebookexternalhit|whatsapp|telegrambot|twitterbot|linkedinbot|slackbot|discordbot|applebot|yandex|baidu|duckduckbot|petalbot/i

export function classifyPublicVisitPath(rawPath: unknown): VisitLandingGroup | null {
  if (typeof rawPath !== 'string') return null
  const pathname = rawPath.split(/[?#]/, 1)[0].trim()
  if (!pathname.startsWith('/')) return null
  if (pathname === '/') return 'home'
  if (pathname === '/inventario') return 'inventory'
  if (/^\/bodegas\/[^/]+$/.test(pathname)) return 'property'
  if (pathname === '/busco-bodega') return 'demand'
  if (/^\/asesor\/[^/]+$/.test(pathname)) return 'advisor'
  if (pathname === '/privacidad' || pathname === '/terminos') return 'legal'
  return null
}

export function isLikelyBotUserAgent(userAgent: string | null | undefined): boolean {
  const ua = (userAgent ?? '').trim()
  if (!ua || ua.length < 10) return true
  return BOT_UA_PATTERN.test(ua)
}

export function utcDayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10)
}

export function hashVisitSession(sessionId: string, dayKey = utcDayKey()): string | null {
  if (!validUuid(sessionId)) return null
  return createHash('sha256')
    .update(`qrih-visit-v1:${dayKey}:${sessionId.toLowerCase()}`)
    .digest('hex')
}
