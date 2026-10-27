import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Header } from '@/components/Header'
import { PrivatePropertySummary } from '@/components/PrivatePropertySummary'
import { PropertyImageGallery } from '@/components/PropertyImageGallery'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createSignedPropertyImageUrlMap, PROPERTY_IMAGE_TTL_SECONDS } from '@/lib/property-image-urls'
import { propertyPrice } from '@/lib/property-price'
import { validUuid } from '@/lib/request-security'
import { loginPath } from '@/lib/safe-navigation'

// Private owner preview. No publication, contact request or shared/PDF route is enabled here.
export default async function OwnPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!validUuid(id)) notFound()
  const client = await createServerSupabaseClient()
  if (!client) return <main><p>Servicio no disponible.</p></main>
  const { data: { user } } = await client.auth.getUser()
  if (!user) redirect(loginPath(`/mis-propiedades/${id}`))
  const { data: profile } = await client.from('profiles').select('account_status').eq('id', user.id).single()
  if (profile?.account_status !== 'active') return <main><p>Necesitas una cuenta activa para abrir esta vista.</p></main>
  const { data: property, error } = await client.from('properties')
    .select('id,title,operation,status,price_value,price_currency,price_unit,price_display,zone,description,total_area,covered_area')
    .eq('id', id).eq('owner_id', user.id).single()
  if (error || !property) notFound()
  const { data: images, error: imageError } = await client.from('property_images')
    .select('storage_path,title,position').eq('property_id', id).order('position')
  let urls = new Map<string, string>()
  try {
    if (!imageError) urls = await createSignedPropertyImageUrlMap(client,
      (images || []).map(image => image.storage_path), PROPERTY_IMAGE_TTL_SECONDS.gallery)
  } catch { /* Neutral fallback; never issue public URLs or widen signing access. */ }
  return <><Header /><main className="property-detail">
    <Link href="/mis-propiedades">← Volver a mis propiedades</Link>
    <p className="notice">Vista privada del propietario. Esta vista no publica ni comparte el inmueble.</p>
    <h1>{property.title}</h1>
    <PrivatePropertySummary propertyId={property.id} />
    <p>{propertyPrice(property)}</p><p>{property.operation} · {property.zone}</p>
    <PropertyImageGallery propertyTitle={property.title} images={(images || [])
      .filter(image => urls.has(image.storage_path)).map(image => ({ url: urls.get(image.storage_path)!, title: image.title }))} />
    <section className="ui-panel property-detail-section"><h2>Características</h2>
      <p>Superficie total: {property.total_area ?? 'N/D'} m²</p>
      <p>Superficie techada: {property.covered_area ?? 'N/D'} m²</p>
    </section>
    <section className="ui-panel property-detail-section"><h2>Descripción</h2><p className="property-description">{property.description || 'Sin descripción'}</p></section>
    {['draft', 'rejected'].includes(property.status) && <Link className="button" href={`/mis-propiedades/${id}/editar`}>Editar propiedad</Link>}
  </main></>
}
