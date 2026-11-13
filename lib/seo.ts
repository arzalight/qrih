import type { Metadata } from 'next'

// Opt-in only on the verified production context; never infer identity from Host.
export function publicOrigin(env: NodeJS.ProcessEnv = process.env): string | null {
  try {
    const url = new URL(env.QRIH_PUBLIC_ORIGIN || '')
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash
      || /localhost|staging|preview|--|\.invalid$|\.supabase\./i.test(url.hostname)) return null
    return url.origin
  } catch { return null }
}
export function indexingEnabled(env: NodeJS.ProcessEnv = process.env) {
  return env.QRIH_INDEXING_ENABLED === 'true' && env.CONTEXT === 'production' && !!publicOrigin(env)
    && env.URL === publicOrigin(env)
}
export function indexablePath(path: string) {
  return ['/', '/inventario', '/privacidad', '/terminos'].includes(path)
    || /^\/bodegas\/[^/]+$/.test(path)
}
export function publicMetadata(path: string, title: string, description: string): Metadata {
  const origin = publicOrigin()
  const url = origin ? origin + path : undefined
  return { title, description, alternates: url ? { canonical: url } : undefined,
    robots: { index: indexingEnabled(), follow: true },
    openGraph: { type: 'website', locale: 'es_MX', siteName: 'QRO Industrial Hub', title, description, url },
    twitter: { card: 'summary', title, description } }
}
export type PublicPropertySeo = { slug: string; title: string; operation: string; zone: string | null;
  total_area: number | string | null; covered_area?: number | string | null; max_height?: string | null; docks?: number | null }
export function propertySeo(property: PublicPropertySeo) {
  const area = Number(property.total_area)
  const surface = Number.isFinite(area) && area > 0 ? `${area.toLocaleString('es-MX')} m²` : null
  const title = [property.title, property.operation, surface, property.zone].filter(Boolean).join(' | ') + ' | QRIH'
  const details = [surface && `Superficie total: ${surface}`, property.max_height && `Altura: ${property.max_height}`,
    property.docks != null && `Andenes: ${property.docks}`].filter(Boolean).join('. ')
  // Only public technical fields; no private address, contact or free-form text.
  const description = `${property.title}. ${property.operation}${property.zone ? ` en ${property.zone}` : ''}. ${details}. Consulta características y disponibilidad en QRO Industrial Hub.`
  return { title, description }
}
export function safeJsonLd(value: unknown) { return JSON.stringify(value).replace(/</g, '\\u003c') }
