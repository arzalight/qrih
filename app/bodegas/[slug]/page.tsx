import { notFound } from 'next/navigation'
import { propertyPrice } from '@/lib/property-price'
import { Header } from '@/components/Header'
import { PropertyContactForm } from '@/components/PropertyContactForm'
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

  const { data: property, error } = await supabase
      .from('properties_public')
    .select(`
      id,
      slug,
      title,
      operation,
      status,
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

  if (error || !property) {
    notFound()
  }

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

  return (
    <>
      <Header />

      <main
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '32px 24px 80px',
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <a href="/inventario">← Volver al inventario</a>
        </div>

        <section
          className="property-main-grid"
          style={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(0, 1.5fr) minmax(320px, 1fr)',
            gap: 32,
            alignItems: 'start',
          }}
        >
          <div>
            {propertyImages.length ? (
              <PropertyImageGallery
                images={propertyImages}
                propertyTitle={property.title}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: 520,
                  borderRadius: 16,
                  background: '#f1f1f1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Sin fotografía
              </div>
            )}

          </div>

          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '7px 12px',
                borderRadius: '999px',
                background:
                  property.operation?.toLowerCase() === 'renta'
                    ? '#ecfdf3'
                    : '#fff8e1',
                color:
                  property.operation?.toLowerCase() === 'renta'
                    ? '#18794e'
                    : '#9a6700',
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {property.operation}
            </div>

            <h1
              style={{
                fontSize: 42,
                lineHeight: 1.1,
                margin: '12px 0 16px',
              }}
            >
              {property.title}
            </h1>

            <p style={{ fontSize: 18, marginBottom: 24 }}>
              {property.zone}
            </p>

            <div
              style={{
                padding: 24,
                border: '1px solid #ddd',
                borderRadius: 14,
                marginBottom: 24,
                background: '#fff',
              }}
            >
              <small
                style={{
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                PRECIO
              </small>

              {formattedPricePerM2 && (
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    marginTop: 10,
                  }}
                >
                  {formattedPricePerM2}
                </div>
              )}

              <div
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  marginTop: 6,
                }}
              >
                {formattedTotalPrice || property.price_display || 'Consultar'}
              </div>

              {formattedPricePerM2 && formattedTotalPrice && (
                <p
                  style={{
                    margin: '8px 0 0',
                    color: '#666',
                    fontSize: 14,
                  }}
                >
    
                </p>
              )}

              <div style={{ marginTop: 16 }}>
                {property.price_plus_vat && (
                  <p style={{ margin: '4px 0' }}>
                    Precio más IVA
                  </p>
                )}

                {property.price_plus_maintenance && (
                  <p style={{ margin: '4px 0' }}>
                    Precio más mantenimiento
                  </p>
                )}

                {property.negotiable && (
                  <p style={{ margin: '4px 0' }}>
                    Precio negociable
                  </p>
                )}
              </div>
            </div>

            <a
              href={`/api/bodegas/${slug}/pdf`}
              download
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                boxSizing: 'border-box',
                padding: '13px 18px',
                marginBottom: 24,
                borderRadius: 10,
                background: '#111827',
                color: '#fff',
                textDecoration: 'none',
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              Descargar PDF
            </a>

            <section
              style={{
                padding: 24,
                border: '1px solid #ddd',
                borderRadius: 14,
              }}
            >
              <h2>Solicitar información</h2>

              <PropertyContactForm
  key={property.id}
  propertyId={property.id}
/>
            </section>
          </div>
        </section>

        <section
          style={{
            marginTop: 40,
            padding: 28,
            border: '1px solid #ddd',
            borderRadius: 16,
          }}
        >
          <h2>Características</h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 20,
              marginTop: 24,
            }}
          >
            <div>
              <strong>Superficie total</strong>
              <p>{showValue(property.total_area)} m²</p>
            </div>

            <div>
              <strong>Superficie techada</strong>
              <p>{showValue(property.covered_area)} m²</p>
            </div>

            <div>
              <strong>Superficie exterior</strong>
              <p>{showValue(property.exterior_area)} m²</p>
            </div>

            <div>
              <strong>Altura máxima</strong>
              <p>{showValue(property.max_height)}</p>
            </div>

            <div>
              <strong>Área de oficinas</strong>
              <p>{showValue(property.offices_area)} m²</p>
            </div>

            <div>
              <strong>Estacionamientos</strong>
              <p>{showValue(property.parking)}</p>
            </div>

            <div>
              <strong>Andenes</strong>
              <p>{showValue(property.docks)}</p>
            </div>

            <div>
              <strong>Comparte comisión</strong>
              <p>{showValue(property.share_commission)}</p>
            </div>
          </div>
        </section>

        <section style={{ marginTop: 40 }}>
          <h2>Descripción</h2>

          <p
            style={{
              whiteSpace: 'pre-wrap',
              lineHeight: 1.7,
            }}
          >
            {showValue(property.description)}
          </p>
        </section>

        <section
          style={{
            marginTop: 40,
            padding: 28,
            border: '1px solid #ddd',
            borderRadius: 16,
          }}
        >
          <h2>Ubicación</h2>

          <p>
            <strong>Zona:</strong> {property.zone}
          </p>

          {visibleAddress ? (
            <p>
              <strong>Dirección:</strong> {visibleAddress}
            </p>
          ) : (
            <p>
              La dirección exacta se proporciona únicamente al
              solicitar información.
            </p>
          )}
        </section>
      </main>
      
    </>
  )
}
