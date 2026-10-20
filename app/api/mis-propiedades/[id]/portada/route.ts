import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createSignedPropertyImageUrlMap, PROPERTY_IMAGE_TTL_SECONDS } from '@/lib/property-image-urls'
import { validUuid } from '@/lib/request-security'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const headers = { 'Cache-Control': 'private, no-store' }
  try {
    const { id } = await params
    if (!validUuid(id)) return NextResponse.json({ error: 'Propiedad no disponible.' }, { status: 404, headers })
    const supabase = await createServerSupabaseClient()
    if (!supabase) return NextResponse.json({ error: 'Servicio no disponible.' }, { status: 503, headers })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Necesitas iniciar sesión.' }, { status: 401, headers })
    const { data: property } = await supabase.from('properties').select('main_image_path').eq('id', id).eq('owner_id', user.id).single()
    if (!property) return NextResponse.json({ error: 'Propiedad no disponible.' }, { status: 404, headers })
    const urls = await createSignedPropertyImageUrlMap(supabase, [property.main_image_path], PROPERTY_IMAGE_TTL_SECONDS.gallery)
    return NextResponse.json({ url: urls.get(property.main_image_path) || null }, { headers })
  } catch { return NextResponse.json({ error: 'No fue posible cargar la portada.' }, { status: 503, headers }) }
}
