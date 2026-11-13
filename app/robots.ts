import type { MetadataRoute } from 'next'
import { indexingEnabled, publicOrigin } from '@/lib/seo'
export const dynamic = 'force-dynamic'
export default function robots(): MetadataRoute.Robots {
  // Allow crawlers to read noindex; robots.txt is not authorization.
  return { rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    ...(indexingEnabled() ? { sitemap: `${publicOrigin()}/sitemap.xml` } : {}) }
}
