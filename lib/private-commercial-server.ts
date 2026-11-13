import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from './supabase-server'
import type { PropertyPrivateDetails } from './private-commercial'

export const PRIVATE_OWNER_COLUMNS = 'id,advisor_id,name,company,phone,email,notes,archived_at,created_at,updated_at'
export async function privateCommercialActor() {
  const client = await createServerSupabaseClient()
  if (!client) return null
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) return null
  const { data: profile, error: profileError } = await client.from('profiles').select('role,account_status').eq('id', user.id).single()
  if (profileError || profile?.account_status !== 'active') return null
  return { client, id: user.id, admin: profile.role === 'admin' }
}
export async function loadPropertyPrivateDetails(client: SupabaseClient, propertyId: string): Promise<PropertyPrivateDetails | null> {
  const { data, error } = await client.from('property_private_details').select('internal_name,owner_contact_id').eq('property_id', propertyId).maybeSingle()
  // Additive rollout: no fabricated values, never fall back to service_role.
  if (error && !['PGRST205', '42P01'].includes(error.code)) throw Error('No se pudieron verificar los datos privados. Recarga antes de editar.')
  if (error || !data) return null
  const readiness = await client.rpc('qrih_owner_picker_ready')
  if (readiness.error?.code === 'PGRST202') return data
  if (readiness.error || !readiness.data) throw Error('No se pudo comprobar el propietario pendiente. Recarga antes de editar.')
  const pending = await client.from('property_private_details').select('pending_owner').eq('property_id', propertyId).maybeSingle()
  if (pending.error) throw Error('No se pudo recuperar el propietario pendiente. No guardes hasta recargar.')
  return { ...data, pending_owner: pending.data?.pending_owner || null }
}
export async function loadPrivateIdentities(client: SupabaseClient, ids: string[]) {
  if (!ids.length) return new Map<string, string>()
  const { data, error } = await client.from('property_private_details').select('property_id,internal_name').in('property_id', ids)
  return new Map<string, string>(error ? [] : (data || []).map(row => [row.property_id, row.internal_name || '']))
}
export async function loadUrgencies(client: SupabaseClient) {
  const { data, error } = await client.from('demand_urgencies').select('demand_request_id,activated_at,expires_at')
  return { available: !error, rows: error ? [] : data || [] }
}
