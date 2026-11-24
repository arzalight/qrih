import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

export function metricWindows(now = new Date()) {
  const day = 86400000
  return { now: now.toISOString(), start: new Date(+now - 30 * day).toISOString(),
    previous: new Date(+now - 60 * day).toISOString(), soon: new Date(+now + 7 * day).toISOString() }
}
export type Metric = { key: string; label: string; value: number | null; note: string; previous?: number | null }
export const ADMIN_METRICS_TTL_MS = 5 * 60 * 1000

function safeCount(value: unknown): number | null {
  if (typeof value === 'number') return Number.isSafeInteger(value) && value >= 0 ? value : null
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const parsed = Number(value)
    return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null
  }
  return null
}

// Private process memory only, scoped to a reauthorized administrator. Never
// serialize this cache or use a public/Next shared response cache for these data.
export function createAdminMetricsLoader() {
  const snapshots = new Map<string, { at: number; metrics: Metric[] }>()
  return async function loadAdminMetrics(actor: SupabaseClient, now = new Date()): Promise<Metric[]> {
    // Own authorization boundary: never invoke metrics RPC based on a caller's claim.
    const { data: { user }, error } = await actor.auth.getUser()
    if (error || !user || user.is_anonymous) throw new Error('Restricted statistics')
    const { data: profile, error: profileError } = await actor.from('profiles').select('role,account_status').eq('id', user.id).single()
    if (profileError || profile?.role !== 'admin' || profile.account_status !== 'active') throw new Error('Restricted statistics')

    const callSnapshot = async (onlyPending: boolean): Promise<Record<string, unknown> | null> => {
      try {
        const result = await actor.rpc('qrih_admin_metrics_snapshot', { p_only_pending: onlyPending })
        if (result.error || !result.data || typeof result.data !== 'object' || Array.isArray(result.data)) {
          return null
        }
        return result.data as Record<string, unknown>
      } catch {
        return null
      }
    }

    // Pending review remains live on each 30 s page refresh. General metrics use
    // their own five-minute snapshot, including a consistent historical window.
    const cached = snapshots.get(user.id)
    let metrics = cached && +now >= cached.at && +now - cached.at < ADMIN_METRICS_TTL_MS ? cached.metrics : null
    let pending: number | null = null

    if (metrics) {
      const pendingSnapshot = await callSnapshot(true)
      pending = pendingSnapshot ? safeCount(pendingSnapshot.pending) : null
    } else {
      const fullSnapshot = await callSnapshot(false)
      const pick = (field: string) => (fullSnapshot ? safeCount(fullSnapshot[field]) : null)
      pending = pick('pending')
      metrics = [
        { key: 'published', label: 'Propiedades publicadas', value: pick('published'), note: 'Estado publicado; puede incluir cuentas con publicaciones deshabilitadas.' },
        { key: 'expired', label: 'Propiedades expiradas', value: pick('expired'), note: 'Estado expired.' },
        { key: 'users', label: 'Usuarios registrados · con perfil', value: pick('users'), note: 'Perfiles únicos de QRIH; no incluye altas Auth sin perfil.' },
        { key: 'pending', label: 'Pendientes de revisión', value: null, note: 'Estado pending; cambios pendientes por separado.' },
        { key: 'links', label: 'Vinculaciones · 30 días', value: pick('links'), previous: pick('previous_links'), note: 'Postulaciones creadas; par requerimiento–propiedad único. Incluye canceladas; no representa cierres.' },
        { key: 'visits', label: 'Visitas al sitio · 30 días', value: pick('visits'), previous: pick('previous_visits'), note: 'Sesiones públicas únicas por día UTC (sin cookies ni bots).' },
        { key: 'contacts', label: 'Solicitudes de contacto · 30 días', value: pick('contacts'), previous: pick('previous_contacts'), note: 'Filas únicas de property_contacts; reenvíos pueden ser la misma persona. No equivale a prospectos únicos.' },
        { key: 'soon', label: 'Próximas a expirar · 7 días', value: pick('soon'), note: 'Publicadas con verification_due_at en los próximos 7 días; no incluye vencidas sin procesar.' },
        { key: 'draft', label: 'Borradores', value: pick('draft'), note: 'Estado draft.' },
        { key: 'paused', label: 'Pausadas', value: pick('paused'), note: 'Estado paused.' },
        { key: 'rejected', label: 'Rechazadas', value: pick('rejected'), note: 'Estado rejected.' },
        { key: 'updates', label: 'Cambios pendientes', value: pick('updates'), note: 'Estado pending_update.' },
        { key: 'newUsers', label: 'Nuevos usuarios · 30 días', value: pick('new_users'), previous: pick('previous_users'), note: 'Perfiles creados en cada ventana.' },
      ]
      // Do not freeze an unavailable integration/query as a successful snapshot.
      if (metrics.every(metric => ['visits', 'pending'].includes(metric.key) || (metric.value != null && metric.previous !== null))) {
        for (const [id, snapshot] of snapshots) if (+now < snapshot.at || +now - snapshot.at >= ADMIN_METRICS_TTL_MS) snapshots.delete(id)
        if (snapshots.size >= 100) snapshots.delete(snapshots.keys().next().value!)
        snapshots.set(user.id, { at: +now, metrics })
      }
    }
    // Callers cannot mutate another render's cached snapshot.
    return metrics.map(metric => ({ ...metric, ...(metric.key === 'pending' ? { value: pending } : {}) }))
  }
}

export const loadAdminMetrics = createAdminMetricsLoader()
