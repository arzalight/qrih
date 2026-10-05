import type { SupabaseClient } from '@supabase/supabase-js'

type OwnProfile = { id: string; role: string; account_status: string }
type ProfileResult =
  | { ok: true; profile: OwnProfile }
  | { ok: false; stage: 'session' | 'lookup' | 'metadata' | 'insert' | 'verify' }

// Compartido por login y callback; sólo sesión del actor, nunca cliente privilegiado.
export async function ensureOwnProfile(supabase: SupabaseClient): Promise<ProfileResult> {
  let stage: Extract<ProfileResult, { ok: false }>['stage'] = 'session'
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user || !user.email_confirmed_at || user.is_anonymous) return { ok: false, stage }

    const lookup = () => supabase.from('profiles')
      .select('id,role,account_status').eq('id', user.id).maybeSingle()
    const valid = (profile: OwnProfile | null): profile is OwnProfile =>
      !!profile && profile.id === user.id &&
      ['publisher', 'admin'].includes(profile.role) &&
      ['active', 'suspended'].includes(profile.account_status)

    stage = 'lookup'
    const existing = await lookup()
    if (existing.error) return { ok: false, stage }
    if (existing.data) return valid(existing.data)
      ? { ok: true, profile: existing.data } : { ok: false, stage }

    // Metadata sólo para campos editables; permisos/defaults proceden de la BD.
    stage = 'metadata'
    const metadata = user.user_metadata || {}
    const fullName = typeof metadata.full_name === 'string'
      ? metadata.full_name.trim().slice(0, 120) : ''
    if (!fullName) return { ok: false, stage }

    stage = 'insert'
    const inserted = await supabase.from('profiles').insert({
      id: user.id,
      full_name: fullName,
      phone: typeof metadata.phone === 'string' ? metadata.phone.trim().slice(0, 30) : null,
      company_name: typeof metadata.company_name === 'string'
        ? metadata.company_name.trim().slice(0, 160) : null,
      user_type: ['advisor', 'owner'].includes(metadata.user_type) ? metadata.user_type : null,
    })
    // Una carrera puede haber creado la fila; nunca UPDATE/upsert ni eliminación.
    if (inserted.error && inserted.error.code !== '23505') return { ok: false, stage }

    stage = 'verify'
    const verified = await lookup()
    return !verified.error && valid(verified.data)
      ? { ok: true, profile: verified.data } : { ok: false, stage }
  } catch {
    return { ok: false, stage }
  }
}
