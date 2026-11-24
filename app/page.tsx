import { homeJsonLd, publicMetadata, publicOrigin, safeJsonLd } from '@/lib/seo'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { PropertyCard } from '@/components/PropertyCard'
import { PublicIndicators } from '@/components/PublicIndicators'
import { createPublicServerSupabaseClient } from '@/lib/supabase-public-server'
import {
  createSignedPropertyImageUrlMap,
  PROPERTY_IMAGE_TTL_SECONDS,
} from '@/lib/property-image-urls'
import { ZONAS_GENERALES } from '@/lib/zonas'

export function generateMetadata() {
  return publicMetadata(
    '/',
    'Bodegas y naves industriales en Querétaro | QRIH',
    'Consulta espacios industriales en renta y venta en el inventario público de QRO Industrial Hub.'
  )
}

export const dynamic = 'force-dynamic'

type FeaturedProperty = {
  id: string
  slug: string
  title: string
  operation: string
  zone: string
  price_display: string
  price_value?: number | string | null
  price_currency?: string | null
  price_unit?: string | null
  total_area: number | string | null
  covered_area: number | string | null
  max_height: string | null
  share_commission: boolean | null
  main_image: string | null
  main_image_path: string | null
}

type CorridorStat = {
  zone: string
  count: number
}

export default async function Home() {
  const supabase = createPublicServerSupabaseClient()
  let properties: FeaturedProperty[] = []
  let corridorStats: CorridorStat[] = []
  let rentCount = 0
  let saleCount = 0

  if (supabase) {
    const [featuredResult, catalogSummaryResult] = await Promise.all([
      supabase
        .from('properties_public')
        .select(
          'id, slug, title, operation, zone, price_display, price_value, price_value_text:price_value::text, price_currency, price_unit, total_area, covered_area, max_height, share_commission, main_image_path'
        )
        .eq('status', 'published')
        .order('featured', { ascending: false })
        .order('featured_priority', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(6),
      supabase
        .from('properties_public')
        .select('zone_general, operation')
        .eq('status', 'published'),
    ])

    const { data, error } = featuredResult

    if (error) {
      console.warn('QRIH_APP_PAGE_45_FAILED')
    } else {
      properties = (data || []).map((property) => ({ ...property, main_image: null }))

      const imageUrls = await createSignedPropertyImageUrlMap(
        supabase,
        properties.map((property) => property.main_image_path),
        PROPERTY_IMAGE_TTL_SECONDS.public,
      )

      properties = properties.map((property) => ({
        ...property,
        main_image:
          imageUrls.get(property.main_image_path || '') || null,
      }))
    }

    if (!catalogSummaryResult.error && catalogSummaryResult.data) {
      const counts = new Map<string, number>()
      for (const row of catalogSummaryResult.data) {
        if (row.operation === 'Renta') rentCount += 1
        else if (row.operation === 'Venta') saleCount += 1
        if (typeof row.zone_general === 'string' && row.zone_general.trim()) {
          counts.set(row.zone_general, (counts.get(row.zone_general) || 0) + 1)
        }
      }
      corridorStats = [...counts.entries()]
        .map(([zone, count]) => ({ zone, count }))
        .sort((a, b) => b.count - a.count || a.zone.localeCompare(b.zone, 'es'))
        .slice(0, 5)
    }
  }

  const structuredData = homeJsonLd(publicOrigin())

  return (
    <>
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(structuredData) }}
        />
      )}
      <Header />

      <section className="hero hero--marketplace">
        <div className="hero__shell">
          <div className="hero__header">
            <div className="hero__copy">
              <h1>Naves y bodegas industriales en Querétaro.</h1>
              <p>
                Inventario verificado en renta y venta para operaciones,
                logística y asesores.
              </p>
            </div>
            {(rentCount > 0 || saleCount > 0) && (
              <div className="hero__quick-ops" aria-label="Accesos por operación">
                {rentCount > 0 && (
                  <Link className="hero__op-pill" href="/inventario?operation=Renta">
                    <span>En renta</span>
                    <strong>{rentCount}</strong>
                  </Link>
                )}
                {saleCount > 0 && (
                  <Link className="hero__op-pill" href="/inventario?operation=Venta">
                    <span>En venta</span>
                    <strong>{saleCount}</strong>
                  </Link>
                )}
              </div>
            )}
          </div>

          <form className="search search--glass" action="/inventario">
            <select name="operation" aria-label="Operación">
              <option value="">Venta o renta</option>
              <option value="Renta">Renta</option>
              <option value="Venta">Venta</option>
            </select>
            <select name="zone_general" aria-label="Zona general">
              <option value="">Todas las zonas</option>
              {ZONAS_GENERALES.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
            <select name="area" aria-label="Rango de superficie">
              <option value="">Cualquier superficie</option>
              <option value="0-200">Menos de 200 m²</option>
              <option value="200-500">200 a 500 m²</option>
              <option value="500-1000">500 a 1,000 m²</option>
              <option value="1000-2000">1,000 a 2,000 m²</option>
              <option value="2000+">Más de 2,000 m²</option>
            </select>
            <button type="submit">BUSCAR BODEGA →</button>
          </form>

          {corridorStats.length > 0 && (
            <div className="hero__corridors" aria-label="Corredores con inventario activo">
              <span className="hero__corridors-label">Corredores activos:</span>
              <div className="hero__corridors-list">
                {corridorStats.map((corridor) => (
                  <Link
                    key={corridor.zone}
                    className="hero__corridor-chip"
                    href={`/inventario?zone_general=${encodeURIComponent(corridor.zone)}`}
                  >
                    <span>{corridor.zone}</span>
                    <b>{corridor.count}</b>
                  </Link>
                ))}
                <Link className="hero__corridor-chip hero__corridor-chip--all" href="/inventario">
                  Ver todos →
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <main className="home-main">
        <PublicIndicators />
        <div className="head home-selection__heading">
          <h2>Espacios que mueven industria</h2>
          <Link href="/inventario">Ver inventario completo →</Link>
        </div>

        {properties.length > 0 ? (
          <div className="cards home-selection__cards">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={{
                  ...property,
                  total_area: Number(property.total_area || 0),
                  covered_area: Number(property.covered_area || 0),
                }}
              />
            ))}
          </div>
        ) : (
          <p>No hay propiedades publicadas disponibles por el momento.</p>
        )}
      </main>

      <section className="home-capabilities home-capabilities--dark" aria-label="Cómo funciona QRIH">
        <div className="home-capabilities__inner">
          <div className="home-capabilities__intro">
            <small>CÓMO FUNCIONA QRIH</small>
            <h2>Industria conectada, sin procesos opacos.</h2>
            <p className="home-capabilities__lead">
              Un solo punto para explorar inventario verificado, publicar naves con control total o activar una búsqueda industrial a la medida.
            </p>
            <div className="home-capabilities__highlights" aria-label="Principios de la plataforma">
              <span>Inventario público verificado</span>
              <span>Red colaborable entre asesores</span>
            </div>
          </div>
          <div className="home-capabilities__grid">
            <article className="home-capability-card">
              <div className="home-capability-card__leading">
                <span className="home-capability-card__icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                </span>
                <span className="home-capability-card__number">01</span>
              </div>
              <div className="home-capability-card__body">
                <h3>Encuentra espacio</h3>
                <p>Filtra inventario industrial por operación, zona y superficie.</p>
              </div>
              <Link className="home-capability-card__action" href="/inventario">Explorar inventario →</Link>
            </article>
            <article className="home-capability-card">
              <div className="home-capability-card__leading">
                <span className="home-capability-card__icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18" />
                    <path d="M5 21V9l7-4 7 4v12" />
                    <path d="M12 11v6" />
                    <path d="M9 14h6" />
                  </svg>
                </span>
                <span className="home-capability-card__number">02</span>
              </div>
              <div className="home-capability-card__body">
                <h3>Publica y administra</h3>
                <p>Publica tu propiedad, envíala a revisión y sigue sus solicitudes.</p>
              </div>
              <Link className="home-capability-card__action" href="/publicar">Subir propiedad →</Link>
            </article>
            <article className="home-capability-card home-capability-card--accent">
              <div className="home-capability-card__leading">
                <span className="home-capability-card__icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17 17 7" />
                    <path d="M8 7h9v9" />
                  </svg>
                </span>
                <span className="home-capability-card__number">03</span>
              </div>
              <div className="home-capability-card__body">
                <h3>Comparte tu requerimiento</h3>
                <p>Describe lo que buscas y recibe oportunidades compatibles.</p>
              </div>
              <Link className="home-capability-card__action" href="/busco-bodega">Busco una bodega →</Link>
            </article>
          </div>
        </div>
      </section>

    </>
  )
}
