import Link from 'next/link'
import { Header } from '@/components/Header'
import { PropertyCard } from '@/components/PropertyCard'
import { createPublicServerSupabaseClient } from '@/lib/supabase-public-server'
import {
  createSignedPropertyImageUrlMap,
  PROPERTY_IMAGE_TTL_SECONDS,
} from '@/lib/property-image-urls'
import { ZONAS_GENERALES } from '@/lib/zonas'

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

export default async function Home() {
  const supabase = createPublicServerSupabaseClient()
  let properties: FeaturedProperty[] = []

  if (supabase) {
    const { data, error } = await supabase
      .from('properties_public')
      .select(
        'id, slug, title, operation, zone, price_display, price_value, price_value_text:price_value::text, price_currency, price_unit, total_area, covered_area, max_height, share_commission, main_image_path'
      )
      .eq('status', 'published')
      .order('featured', { ascending: false })
      .order('featured_priority', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(3)

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
  }

  return (
    <>
      <Header />

      <section className="hero">
        <div>
          <small>ESPECIALISTAS EN INDUSTRIAL · QUERÉTARO</small>
          <h1>Conecta tu operación con el espacio correcto.</h1>
          <p>
            Inventario industrial en Querétaro para encontrar, publicar y
            gestionar oportunidades con confianza.
          </p>

          <form className="search" action="/inventario">
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
        </div>
      </section>

      <main>
        <div className="head">
          <div>
            <small>SELECCIÓN QRIH</small>
            <h2>Espacios que mueven industria</h2>
          </div>
          <Link href="/inventario">Ver inventario completo →</Link>
        </div>

        {properties.length > 0 ? (
          <div className="cards">
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

      <section className="home-capabilities" aria-label="Cómo funciona QRIH">
        <div>
          <small>UNA PLATAFORMA, TRES CAMINOS</small>
          <h2>Industria conectada, sin procesos opacos.</h2>
        </div>
        <div className="home-capabilities__grid">
          <article className="home-capability-card">
            <span className="home-capability-card__number">01</span>
            <span className="home-capability-card__icon" aria-hidden="true">⌕</span>
            <h3>Encuentra espacio</h3>
            <p>Filtra inventario industrial por operación, zona y superficie.</p>
            <Link href="/inventario">Explorar inventario →</Link>
          </article>
          <article className="home-capability-card">
            <span className="home-capability-card__number">02</span>
            <span className="home-capability-card__icon" aria-hidden="true">＋</span>
            <h3>Publica y administra</h3>
            <p>Publica tu propiedad, envíala a revisión y sigue sus solicitudes.</p>
            <Link href="/publicar">Subir propiedad →</Link>
          </article>
          <article className="home-capability-card">
            <span className="home-capability-card__number">03</span>
            <span className="home-capability-card__icon" aria-hidden="true">↗</span>
            <h3>Comparte tu requerimiento</h3>
            <p>Describe lo que buscas y recibe oportunidades compatibles.</p>
            <Link href="/busco-bodega">Busco una bodega →</Link>
          </article>
        </div>
      </section>

      <section className="band">
        <div>
          <small>NO TE CONFORMES CON LO DISPONIBLE</small>
          <h2>¿Buscas algo más específico?</h2>
          <p>
            Comparte tu requerimiento. Nuestro equipo industrial lo convierte
            en oportunidades concretas.
          </p>
        </div>
        <Link href="/busco-bodega">BUSCO UNA BODEGA →</Link>
      </section>
    </>
  )
}
