import { cache } from 'react'
import type { Metadata } from 'next'
import { publicMetadata, propertySeo, publicOrigin, safeJsonLd } from '@/lib/seo'
import { notFound } from 'next/navigation'
import { propertyPrice } from '@/lib/property-price'
import { Header } from '@/components/Header'
import { PropertyContactForm } from '@/components/PropertyContactForm'
import { ResponsiveContactPanel } from '@/components/ResponsiveContactPanel'
import { PropertyCard } from '@/components/PropertyCard'
import { rankSimilarProperties, similarPropertyRange } from '@/lib/matching'
import { PropertyImageGallery } from '@/components/PropertyImageGallery'
import { createPublicServerSupabaseClient } from '@/lib/supabase-public-server'
import { createPrivilegedServerSupabaseClient } from '@/lib/supabase-privileged-server'
import { createSignedPropertyImageUrlMap, propertyImagePaths, PROPERTY_IMAGE_TTL_SECONDS } from '@/lib/property-image-urls'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ slug: string }>
}

function showValue(value: string | number | boolean | null) {
  if (value === null || value === undefined || value === '') {
    return 'N/D'
  }

  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No'
  }

  return String(value)
}

const loadPublicProperty = cache(async (slug: string) => {
  const supabase = createPublicServerSupabaseClient()
  if (!supabase) throw new Error('Public catalog not configured')
  const { data: property, error } = await supabase
      .from('properties_public')
    .select(`
      id,
      slug,
      title,
      operation,
      status,
      zone_general,
      zone,
      address,
      location_visibility,
      price_display,
      price_value,
      price_value_text:price_value::text,
      price_currency,
      price_unit,
      price_plus_vat,
      price_plus_maintenance,
      negotiable,
      total_area,
      covered_area,
      exterior_area,
      max_height,
      offices_area,
      parking,
      docks,
      description,
      share_commission,
      main_image_path,
      featured
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error) {
    if (error.code === 'PGRST116') notFound()
    throw new Error('Public property unavailable')
  }
  if (!property) notFound()
  return property

})

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const property = await loadPublicProperty(slug)
  const seo = propertySeo(property)
  return publicMetadata(`/bodegas/${encodeURIComponent(slug)}`, seo.title, seo.description)
}

export default async function PropertyPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = createPublicServerSupabaseClient()

  if (!supabase) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Error de configuración</h1>
        <p>Supabase no está configurado correctamente.</p>
      </main>
    )
  }

  const property = await loadPublicProperty(slug)

  const { data: galleryImages } = await supabase
    .from('property_images')
    .select('storage_path, title, position')
    .eq('property_id', property.id)
    .order('position', { ascending: true })

  const paths = propertyImagePaths(property.main_image_path, galleryImages || [])
  const urls = await createSignedPropertyImageUrlMap(supabase, paths, PROPERTY_IMAGE_TTL_SECONDS.gallery)
  const propertyImages = paths.map((path) => ({
    url: urls.get(path)!,
    title: galleryImages?.find((image) => image.storage_path === path)?.title || null,
  }))

  try {
    const admin = createPrivilegedServerSupabaseClient()
    const { data: allowed } = await admin.rpc('qrih_take_server_limit', {
      p_subject: `public:${property.id}`, p_action: 'view',
    })
    if (allowed) await admin.from('property_views').insert({ property_id: property.id })
  } catch {
    console.warn('No se pudo registrar una visualización; ficha disponible.')
  }

  const visibleAddress =
    property.location_visibility === 'address'
      ? property.address
      : null

  const formattedPricePerM2 = ['m2', 'm²'].includes(property.price_unit || '') ? propertyPrice(property) : null
  const formattedTotalPrice = propertyPrice(property, true)
  const similaritySource = { ...property, surface_m2: property.total_area }
  const similarRange = similarPropertyRange(similaritySource)
  type SimilarProperty = Parameters<typeof PropertyCard>[0]['property']
  let similarProperties: SimilarProperty[] = []
  let similarUnavailable = false
  if (similarRange) {
    try {
      const { data: candidates, error: similarError } = await supabase
        .from('properties_public')
        .select('id,slug,title,operation,zone_general,zone,price_display,price_value,price_value_text:price_value::text,price_currency,price_unit,total_area,covered_area,max_height,share_commission,main_image_path')
        .eq('status', 'published')
        .neq('id', property.id)
        .eq('operation', property.operation)
        .eq('zone_general', property.zone_general)
        .gte('total_area', similarRange.area_min)
        .lte('total_area', similarRange.area_max)
        .order('created_at', { ascending: false })
        .limit(1000)
      if (similarError) throw new Error('Similar properties unavailable')
      const ranked = rankSimilarProperties(similaritySource,
        (candidates || []).map(candidate => ({ ...candidate, surface_m2: candidate.total_area })))
        .map(entry => entry.property)
      let similarUrls = new Map<string, string>()
      try {
        similarUrls = await createSignedPropertyImageUrlMap(supabase,
          ranked.map(candidate => candidate.main_image_path), PROPERTY_IMAGE_TTL_SECONDS.public)
      } catch { console.warn('QRIH_SIMILAR_COVERS_UNAVAILABLE') }
      similarProperties = ranked.map(candidate => ({ ...candidate,
        main_image: similarUrls.get(candidate.main_image_path) || null,
      }))
    } catch {
      similarUnavailable = true
      console.warn('QRIH_SIMILAR_PROPERTIES_UNAVAILABLE')
    }
  }

  return (
    <>
      <Header />
      {publicOrigin() && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd({
        '@context': 'https://schema.org', '@type': 'WebPage', name: propertySeo(property).title,
        description: propertySeo(property).description, url: `${publicOrigin()}/bodegas/${encodeURIComponent(slug)}`,
        inLanguage: 'es-MX',
      }) }} />}
      <main className="property-detail">
        <a className="property-back" href="/inventario">← Volver al inventario</a>
        <section className="property-main-grid">
          <div>
            {propertyImages.length ? <PropertyImageGallery images={propertyImages} propertyTitle={property.title} />
              : <div className="property-photo-empty">Fotografía no disponible</div>}
          </div>
          <div className="property-overview">
            <span className="property-operation">{property.operation}</span>
            <h1>{property.title}</h1>
            <p className="property-location">{property.zone}</p>
            <section className="property-price-panel" aria-label="Precio y condiciones">
              <small>PRECIO</small>
              {formattedPricePerM2 && <p className="property-price-announced">{formattedPricePerM2}</p>}
              <p className="property-price-total">{formattedTotalPrice || property.price_display || 'Consultar'}</p>
              <div className="property-conditions">
                {property.price_plus_vat && <span>Más IVA</span>}
                {property.price_plus_maintenance && <span>Más mantenimiento</span>}
                {property.negotiable && <span>Precio negociable</span>}
              </div>
            </section>
            <a className="button property-pdf" href={`/api/bodegas/${slug}/pdf`} download>Descargar PDF</a>
            <ResponsiveContactPanel>
              <PropertyContactForm key={property.id} propertyId={property.id} />
            </ResponsiveContactPanel>
            <section className="ui-panel property-detail-section">
              <h2>Ubicación</h2>
              <p><strong>Zona:</strong> {property.zone}</p>
              {visibleAddress ? <p><strong>Dirección:</strong> {visibleAddress}</p>
                : <p>La dirección exacta se proporciona únicamente al solicitar información.</p>}
            </section>
          </div>
        </section>
        <section className="ui-panel property-detail-section">
          <h2>Características</h2>
          <dl className="property-specs">
            {[['Superficie total', property.total_area, 'm²'], ['Superficie techada', property.covered_area, 'm²'],
              ['Superficie exterior', property.exterior_area, 'm²'], ['Altura máxima', property.max_height, ''],
              ['Área de oficinas', property.offices_area, 'm²'], ['Estacionamientos', property.parking, ''],
              ['Andenes', property.docks, ''], ['Comparte comisión', property.share_commission, '']].map(([label, value, unit]) => (
              <div key={String(label)}><dt>{label}</dt><dd>{showValue(value)} {unit}</dd></div>
            ))}
          </dl>
        </section>
        <section className="ui-panel property-detail-section">
          <h2>Descripción</h2>
          <p className="property-description">{showValue(property.description)}</p>
        </section>
        <section className="property-detail-section property-similar" aria-labelledby="property-similar-heading">
          <h2 id="property-similar-heading">Propiedades similares</h2>
          {similarProperties.length > 0
            ? <div className="cards">{similarProperties.map(candidate => <PropertyCard key={candidate.id} property={candidate} />)}</div>
            : <p>{similarUnavailable ? 'No fue posible cargar las propiedades similares.' : 'No hay propiedades similares disponibles con estos criterios.'}</p>}
        </section>
      </main>
    </>
  )
}
