import { notFound, redirect } from 'next/navigation'
import { Header } from '@/components/Header'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { validUuid } from '@/lib/request-security'
import { createSignedPropertyImageUrlMap, PROPERTY_IMAGE_TTL_SECONDS } from '@/lib/property-image-urls'
import { EditarPropiedadForm } from '@/app/mis-propiedades/[id]/editar/EditarPropiedadForm'
import Publish from './PublicarForm'

export default async function PublicarPage({ searchParams }: {
  searchParams: Promise<{ duplicar?: string }>
}) {
  const { duplicar } = await searchParams
  if (duplicar === undefined) return <Publish />
  if (!validUuid(duplicar)) notFound()
  const supabase = await createServerSupabaseClient()
  if (!supabase) return <main className="form"><p>El servicio no está disponible.</p></main>
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('account_status').eq('id', user.id).single()
  if (profile?.account_status !== 'active') return <main className="form"><p>No puedes crear propiedades con esta cuenta.</p></main>
  // Explicit commercial projection; never send contacts, approvals or audit to the form.
  const { data: property, error } = await supabase.from('properties').select(`id,title,operation,
    price_display,price_value,price_value_text:price_value::text,price_unit,price_currency,price_plus_vat,price_plus_maintenance,negotiable,zone_general,zone,address,
    location_visibility,total_area,covered_area,exterior_area,max_height,offices_area,parking,docks,
    description,share_commission,main_image_path`).eq('id', duplicar).eq('owner_id', user.id).single()
  if (error || !property) notFound()
  const { data: gallery, error: galleryError } = await supabase.from('property_images')
    .select('storage_path,title,position').eq('property_id', property.id).order('position')
  if (galleryError) return <main className="form"><p>No fue posible cargar la galería. Recarga antes de continuar.</p></main>
  const ordered = [...(gallery || [])].sort((a, b) =>
    Number(b.storage_path === property.main_image_path) - Number(a.storage_path === property.main_image_path)
    || a.position - b.position)
  // Legacy cover without gallery remains a single starting image, not a shared reference at save.
  if (!ordered.length && property.main_image_path) ordered.push({ storage_path: property.main_image_path, title: '', position: 0 })
  let urls: Map<string, string>
  try { urls = await createSignedPropertyImageUrlMap(supabase, ordered.map(image => image.storage_path), PROPERTY_IMAGE_TTL_SECONDS.gallery) }
  catch { return <main className="form"><p>No fue posible cargar las fotografías autorizadas. Recarga antes de continuar.</p></main> }
  return <><Header /><main className="form">
    <small>SUBIR TU BODEGA · NUEVA PROPIEDAD</small><h1>Duplicar propiedad</h1>
    <p className="notice">Estás creando una nueva propiedad utilizando los datos de otra bodega. Revisa la información y guarda los cambios para continuar. Se guardará como borrador y no modificará la original.</p>
    <EditarPropiedadForm duplicate property={{ ...property, status: 'draft', rejection_reason: null }}
      initialImages={ordered.map((image, position) => ({ storagePath: image.storage_path,
        url: urls.get(image.storage_path)!, title: image.title || '', position }))} />
  </main></>
}
