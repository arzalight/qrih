import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { assertSameOrigin, readJson, validUuid } from '@/lib/request-security'

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    const body = await readJson(request)
    if (!validUuid(body.propertyId) || body.confirmed !== true) return NextResponse.json({ error: 'Confirma la edición de una propiedad válida.' }, { status: 400 })
    const supabase = await createServerSupabaseClient()
    if (!supabase) return NextResponse.json({ error: 'Servicio no disponible.' }, { status: 503 })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Necesitas iniciar sesión.' }, { status: 401 })
    const { data: property } = await supabase.from('properties').select('id')
      .eq('id', body.propertyId).eq('owner_id', user.id).single()
    if (!property) return NextResponse.json({ error: 'Propiedad no disponible.' }, { status: 403 })
    const { error } = await supabase.rpc('qrih_withdraw_own_property', { p_property_id: body.propertyId })
    if (error) return NextResponse.json({ error: 'No pudimos confirmar el retiro. Revisa Mis propiedades antes de reintentar.' }, { status: 409 })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'No pudimos confirmar la operación. Revisa Mis propiedades.' }, { status: 400 }) }
}
