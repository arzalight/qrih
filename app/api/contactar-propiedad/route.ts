import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { validUuid, readForm, assertSameOrigin } from '@/lib/request-security'

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    const supabase = await createServerSupabaseClient()
    if (!supabase) return NextResponse.json({ error: 'Servicio no disponible.' }, { status: 503 })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Necesitas iniciar sesión.' }, { status: 401 })
    const form = await readForm(request)
    const id = String(form.get('property_id') || '').trim()
    if (!validUuid(id)) return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 })
    const { data, error } = await supabase.rpc('qrih_request_property_contact', {
      p_property_id: id,
      p_name: String(form.get('name') || '').trim(),
      p_phone: String(form.get('phone') || '').trim(),
      p_email: String(form.get('email') || '').trim(),
      p_company: String(form.get('company') || '').trim(),
      p_message: String(form.get('message') || '').trim(),
    })
    if (error || !data) return NextResponse.json({ error: 'No se pudo solicitar contacto. Revisa los datos, la disponibilidad y el límite de solicitudes.' }, { status: 400 })
    const { data: contacts } = data.authorization_status === 'authorized'
      ? await supabase.rpc('get_property_publisher_contact', { p_property_id: id })
      : { data: null }
    return NextResponse.json({
      success: true, ...data,
      message: contacts?.length ? 'Contacto disponible.' : 'Solicitud enviada correctamente.',
      ...(contacts?.length ? { owner: contacts[0] } : {}),
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 })
  }
}
