import type { MetadataRoute } from 'next'
import { createPublicServerSupabaseClient } from '@/lib/supabase-public-server'
import { indexingEnabled, publicOrigin } from '@/lib/seo'
export const dynamic = 'force-dynamic'
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!indexingEnabled()) return []
  const origin = publicOrigin()!
  const client = createPublicServerSupabaseClient()
  if (!client) throw new Error('Sitemap catalog not configured')
  const urls = new Set<string>()
  // Stable keyset pages avoid the REST row cap and offset drift.
  let cursor: string | null = null
  for (;;) {
    let query = client.from('properties_public').select('id,slug').eq('status', 'published').order('id').limit(500)
    if (cursor) query = query.gt('id', cursor)
    const { data, error } = await query
    if (error || !data) throw new Error('Sitemap catalog unavailable')
    for (const row of data) urls.add(`${origin}/bodegas/${encodeURIComponent(row.slug)}`)
    if (urls.size > 49000) throw new Error('Sitemap requires partitioning')
    if (data.length < 500) break
    cursor = data[data.length - 1].id
  }
  return ['/', '/inventario', '/privacidad', '/terminos'].map(path => ({ url: origin + path }))
    .concat([...urls].map(url => ({ url })))
}
