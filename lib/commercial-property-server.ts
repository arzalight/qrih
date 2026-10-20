import 'server-only'
import { createPublicServerSupabaseClient } from './supabase-public-server'
import { createSignedPropertyImageUrlMap, propertyImagePaths, PROPERTY_IMAGE_TTL_SECONDS } from './property-image-urls'

// Explicit allowlist shared by commercial HTML and PDF; never select owner/contact/internal fields.
export const COMMERCIAL_PROPERTY_COLUMNS = `id,slug,title,operation,status,zone,address,location_visibility,
price_display,price_value,price_value_text:price_value::text,price_currency,price_unit,price_plus_vat,price_plus_maintenance,negotiable,
total_area,covered_area,exterior_area,max_height,offices_area,parking,docks,description,share_commission,main_image_path,featured`
export async function loadCommercialProperty(slug: string, purpose: 'gallery' | 'pdf') {
  const supabase = createPublicServerSupabaseClient()
  if (!supabase) throw new Error('Servicio comercial no disponible.')
  const { data: property, error } = await supabase.from('properties_public')
    .select(COMMERCIAL_PROPERTY_COLUMNS).eq('slug', slug).eq('status', 'published').maybeSingle()
  if (error) throw new Error('No fue posible consultar la ficha.')
  if (!property) return null
  const { data: gallery, error: galleryError } = await supabase.from('property_images')
    .select('storage_path,title,position').eq('property_id', property.id).order('position')
  if (galleryError) throw new Error('No fue posible consultar las fotografías.')
  const paths = propertyImagePaths(property.main_image_path, gallery || [])
  const urls = await createSignedPropertyImageUrlMap(supabase, paths, PROPERTY_IMAGE_TTL_SECONDS[purpose])
  return { property: { ...property, address: property.location_visibility === 'address' ? property.address : null },
    images: paths.map(path => ({ url: urls.get(path)!, title: gallery?.find(image => image.storage_path === path)?.title || null })) }
}
