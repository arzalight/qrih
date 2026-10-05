import 'server-only'
import { createHash, timingSafeEqual } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export const RECOVERY_COOKIE = 'qrih-recovery'
export const RECOVERY_MAX_AGE = 600

function binding(userId: string, accessToken: string) {
  return createHash('sha256').update(`qrih-password-recovery:${userId}:${accessToken}`).digest('hex')
}

// Marca de flujo/UX, NO una credencial ni permiso. Cada uso valida el token con Auth.
// Ligada al token exacto para no cambiar la contraseña de otra sesión anterior.
export function createRecoveryMarker(userId: string, accessToken: string, now = Date.now()) {
  return `${Math.floor(now / 1000)}.${binding(userId, accessToken)}`
}

export async function getRecoveryUser(supabase: SupabaseClient, marker: string | undefined, now = Date.now()) {
  if (!marker || !/^\d{10}\.[a-f0-9]{64}$/.test(marker)) return null
  const [issuedAt, digest] = marker.split('.')
  const age = Math.floor(now / 1000) - Number(issuedAt)
  if (age < 0 || age >= RECOVERY_MAX_AGE) return null
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !session?.access_token) return null
  // getSession sólo proporciona el token candidato, nunca la identidad confiable.
  const { data: { user }, error } = await supabase.auth.getUser(session.access_token)
  if (error || !user || !user.email_confirmed_at || user.is_anonymous || user.id !== session.user.id) return null
  return timingSafeEqual(Buffer.from(digest), Buffer.from(binding(user.id, session.access_token))) ? user : null
}
