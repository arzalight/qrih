import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createPrivilegedServerSupabaseClient } from './supabase-privileged-server'

export function metricWindows(now = new Date()) {
  const day = 86400000
  return { now: now.toISOString(), start: new Date(+now - 30 * day).toISOString(),
    previous: new Date(+now - 60 * day).toISOString(), soon: new Date(+now + 7 * day).toISOString() }
}
export type Metric = { key: string; label: string; value: number | null; note: string; previous?: number | null }
export const ADMIN_METRICS_TTL_MS = 5 * 60 * 1000

// Private process memory only, scoped to a reauthorized administrator. Never
// serialize this cache or use a public/Next shared response cache for these data.
export function createAdminMetricsLoader() {
  const snapshots = new Map<string, { at: number; metrics: Metric[] }>()
  return async function loadAdminMetrics(actor: SupabaseClient, now = new Date()): Promise<Metric[]> {
    // Own authorization boundary: never use a privileged count based on a caller's claim.
    const { data: { user }, error } = await actor.auth.getUser()
    if (error || !user || user.is_anonymous) throw new Error('Restricted statistics')
    const { data: profile, error: profileError } = await actor.from('profiles').select('role,account_status').eq('id', user.id).single()
    if (profileError || profile?.role !== 'admin' || profile.account_status !== 'active') throw new Error('Restricted statistics')
    const w = metricWindows(now)
    let client: SupabaseClient | null = null
    try { client = createPrivilegedServerSupabaseClient() } catch { /* unavailable is not zero */ }
    async function count(table: string, filters: [string, string, string][] = []) {
      if (!client) return null
      try {
        let q = client.from(table).select('id', { count: 'exact', head: true })
        for (const [op, field, value] of filters) {
          if (op === 'eq') q = q.eq(field, value)
          if (op === 'gte') q = q.gte(field, value)
          if (op === 'lt') q = q.lt(field, value)
        }
        const result = await q
        return result.error ? null : result.count
      } catch { return null }
    }
    const status = (value: string) => count('properties', [['eq', 'status', value]])
    const period = (table: string, start: string, end: string) => count(table, [['gte', 'created_at', start], ['lt', 'created_at', end]])
    // Pending review remains live on each 30 s page refresh. General metrics use
    // their own five-minute snapshot, including a consistent historical window.
    const pendingPromise = status('pending')
    const cached = snapshots.get(user.id)
    let metrics = cached && +now >= cached.at && +now - cached.at < ADMIN_METRICS_TTL_MS ? cached.metrics : null
    if (!metrics) {
      const [published, expired, users, links, previousLinks, contacts, previousContacts, soon,
        draft, paused, rejected, updates, newUsers, previousUsers] = await Promise.all([
        status('published'), status('expired'), count('profiles'),
        period('opportunity_property_registrations', w.start, w.now), period('opportunity_property_registrations', w.previous, w.start),
        period('property_contacts', w.start, w.now), period('property_contacts', w.previous, w.start),
        count('properties', [['eq', 'status', 'published'], ['gte', 'verification_due_at', w.now], ['lt', 'verification_due_at', w.soon]]),
        status('draft'), status('paused'), status('rejected'), status('pending_update'),
        period('profiles', w.start, w.now), period('profiles', w.previous, w.start),
      ])
      metrics = [
        { key: 'published', label: 'Propiedades publicadas', value: published, note: 'Estado publicado; puede incluir cuentas con publicaciones deshabilitadas.' },
        { key: 'expired', label: 'Propiedades expiradas', value: expired, note: 'Estado expired.' },
        { key: 'users', label: 'Usuarios registrados · con perfil', value: users, note: 'Perfiles únicos de QRIH; no incluye altas Auth sin perfil.' },
        { key: 'pending', label: 'Pendientes de revisión', value: null, note: 'Estado pending; cambios pendientes por separado.' },
        { key: 'links', label: 'Vinculaciones · 30 días', value: links, previous: previousLinks, note: 'Postulaciones creadas; par requerimiento–propiedad único. Incluye canceladas; no representa cierres.' },
        { key: 'visits', label: 'Visitas al sitio · 30 días', value: null, note: 'No configurado: falta fuente de sesiones. Las vistas de fichas no son visitas al sitio.' },
        { key: 'contacts', label: 'Solicitudes de contacto · 30 días', value: contacts, previous: previousContacts, note: 'Filas únicas de property_contacts; reenvíos pueden ser la misma persona. No equivale a prospectos únicos.' },
        { key: 'soon', label: 'Próximas a expirar · 7 días', value: soon, note: 'Publicadas con verification_due_at en los próximos 7 días; no incluye vencidas sin procesar.' },
        { key: 'draft', label: 'Borradores', value: draft, note: 'Estado draft.' },
        { key: 'paused', label: 'Pausadas', value: paused, note: 'Estado paused.' },
        { key: 'rejected', label: 'Rechazadas', value: rejected, note: 'Estado rejected.' },
        { key: 'updates', label: 'Cambios pendientes', value: updates, note: 'Estado pending_update.' },
        { key: 'newUsers', label: 'Nuevos usuarios · 30 días', value: newUsers, previous: previousUsers, note: 'Perfiles creados en cada ventana.' },
      ]
      // Do not freeze an unavailable integration/query as a successful snapshot.
      if (metrics.every(metric => ['visits', 'pending'].includes(metric.key) || metric.value != null && metric.previous !== null)) {
        for (const [id, snapshot] of snapshots) if (+now < snapshot.at || +now - snapshot.at >= ADMIN_METRICS_TTL_MS) snapshots.delete(id)
        if (snapshots.size >= 100) snapshots.delete(snapshots.keys().next().value!)
        snapshots.set(user.id, { at: +now, metrics })
      }
    }
    const pending = await pendingPromise
    // Callers cannot mutate another render's cached snapshot.
    return metrics.map(metric => ({ ...metric, ...(metric.key === 'pending' ? { value: pending } : {}) }))
  }
}

export const loadAdminMetrics = createAdminMetricsLoader()
