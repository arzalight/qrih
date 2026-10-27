import type { SupabaseClient } from '@supabase/supabase-js'

export type PublicIndicatorCounts = {
  properties: number | null
  connections: number | null
  connectionsStatus: 'confirmed' | 'not_enabled' | 'unavailable'
}

export function exactCount(value: unknown): number | null {
  if (typeof value !== 'number' && !(typeof value === 'string' && /^\d+$/.test(value))) return null
  const number = Number(value)
  return Number.isSafeInteger(number) && number >= 0 ? number : null
}

// Public projection is the sole authority for published/current inventory.
export async function countPublicProperties(client: SupabaseClient | null): Promise<number | null> {
  try {
    if (!client) return null
    const { count, error } = await client.from('properties_public')
      .select('id', { count: 'exact', head: true }).eq('status', 'published')
    return error ? null : exactCount(count)
  } catch { return null }
}

// Server-only caller supplies the privileged client; never return records or SDK errors.
// RPC is a proposal, not yet installed remotely. Missing RPC means not enabled, not zero.
export async function countConfirmedConnections(client: SupabaseClient): Promise<Pick<PublicIndicatorCounts, 'connections' | 'connectionsStatus'>> {
  try {
    const { data, error } = await client.rpc('qrih_confirmed_connections_count')
    if (error) return { connections: null, connectionsStatus: error.code === 'PGRST202' || error.code === '42883' ? 'not_enabled' : 'unavailable' }
    const connections = exactCount(data)
    return { connections, connectionsStatus: connections === null ? 'unavailable' : 'confirmed' }
  } catch { return { connections: null, connectionsStatus: 'unavailable' } }
}
