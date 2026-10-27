import type { SupabaseClient } from '@supabase/supabase-js'

export const NOTIFICATIONS_CHANGED = 'qrih:notifications-changed'

// User client and ownership filter, never a privileged client. RLS remains authoritative.
export async function markNotificationsRead(client: SupabaseClient, id?: string) {
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) throw new Error('Inicia sesión para actualizar tus notificaciones.')
  let query = client.from('notifications').update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id).is('read_at', null)
  if (id) query = query.eq('id', id)
  const result = await query.select('id')
  if (result.error) throw new Error('No fue posible marcar las notificaciones. Vuelve a intentar.')
  return result.data?.length || 0
}
