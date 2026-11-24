import { createPublicServerSupabaseClient } from '@/lib/supabase-public-server'
import { countPublicProperties, countConfirmedConnections } from '@/lib/public-indicators'

export const dynamic = 'force-dynamic'

// Fixed aggregate, no parameters, no auth cookies, no raw tables/PII in the response.
export async function GET() {
  const client = createPublicServerSupabaseClient()
  const properties = await countPublicProperties(client)
  let confirmed: Awaited<ReturnType<typeof countConfirmedConnections>> = { connections: null, connectionsStatus: 'unavailable' }
  if (client) {
    try { confirmed = await countConfirmedConnections(client) } catch { /* unavailable, never a fabricated zero */ }
  }
  return Response.json({ properties, ...confirmed }, {
    headers: { 'Cache-Control': 'public, max-age=0, s-maxage=60', 'X-Content-Type-Options': 'nosniff' },
  })
}
