import { notFound, redirect } from 'next/navigation'
import { Header } from '@/components/Header'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createSignedPropertyImageUrlMap, PROPERTY_IMAGE_TTL_SECONDS } from '@/lib/property-image-urls'
import { EditarPropiedadForm } from './EditarPropiedadForm'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EditarPropiedadPage({
  params,
}: PageProps) {
  const { id } = await params

  const supabase = await createServerSupabaseClient()

  if (!supabase) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Error de configuración</h1>
        <p>Supabase no está configurado correctamente.</p>
      </main>
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: property, error } = await supabase
    .from('properties')
    .select(`
      id,
      title,
      operation,
      price_display,
      price_value,
      price_value_text:price_value::text,
      price_unit,
      price_currency,
      price_plus_vat,
      price_plus_maintenance,
      negotiable,
zone_general,
      zone,
      address,
      location_visibility,
      total_area,
      covered_area,
      exterior_area,
      max_height,
      offices_area,
      parking,
      docks,
      description,
      share_commission,
      rejection_reason,
      status
    `)
    .eq('id', id)
    .eq('owner_id', user.id)
    .in('status', ['draft', 'rejected'])
    .single()

  if (error || !property) {
    notFound()
  }

  const { data: galleryImages, error: galleryError } = await supabase
    .from('property_images')
    .select('storage_path, title, position')
    .eq('property_id', property.id)
    .order('position', { ascending: true })

  if (galleryError) {
    console.warn('QRIH_APP_MIS_PROPIEDADES_ID_EDITAR_PAGE_78_FAILED')
  }

  const urls = await createSignedPropertyImageUrlMap(supabase,
    (galleryImages || []).map((image) => image.storage_path), PROPERTY_IMAGE_TTL_SECONDS.gallery)
  const initialImages = (galleryImages || []).map((image) => ({
    storagePath: image.storage_path,
    url: urls.get(image.storage_path)!,
    title: image.title || '',
    position: image.position ?? 0,
  }))

  return (
    <>
      <Header />

      <main className="form">
        <small>EDITA TU PROPIEDAD</small>

        <h1>
          {property.status === 'rejected'
            ? 'Corrige y reenvía tu propiedad.'
            : 'Edita tu borrador.'}
        </h1>

        {property.status === 'rejected' && (
          <div
            style={{
              marginBottom: 32,
              padding: 20,
              borderRadius: 12,
              border: '1px solid #e2caca',
              background: '#fff7f7',
            }}
          >
            <strong>Motivo del rechazo</strong>

            <p style={{ marginBottom: 0 }}>
              {property.rejection_reason ||
                'No se especificó un motivo de rechazo.'}
            </p>
          </div>
        )}

        <EditarPropiedadForm
          property={property}
          initialImages={initialImages}
        />

      </main>
    </>
  )
}
