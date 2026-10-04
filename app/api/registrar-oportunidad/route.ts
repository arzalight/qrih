import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { assertSameOrigin, readForm, validUuid } from '@/lib/request-security'

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()

  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase no está configurado correctamente.' },
      { status: 500 }
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Debes iniciar sesión para registrar una propiedad.' },
      { status: 401 }
    )
  }

  let formData: FormData
  try { assertSameOrigin(request); formData = await readForm(request) }
  catch { return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 }) }

  const demandRequestId = String(
    formData.get('demand_request_id') || ''
  ).trim()

  const propertyId = String(
    formData.get('property_id') || ''
  ).trim()

  if (!validUuid(demandRequestId) || !validUuid(propertyId)) {
    return NextResponse.json(
      { error: 'Faltan datos para registrar la oportunidad.' },
      { status: 400 }
    )
  }

  const { data: demandRequest, error: demandRequestError } = await supabase
    .from('demand_requests')
    .select('id')
    .eq('id', demandRequestId)
    .eq('user_id', user.id)
    .single()

  if (demandRequestError || !demandRequest) {
    return NextResponse.json(
      { error: 'El requerimiento no pertenece a tu cuenta.' },
      { status: 403 }
    )
  }

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id')
    .eq('id', propertyId)
    .eq('owner_id', user.id)
    .eq('status', 'published')
    .single()

  if (propertyError || !property) {
    return NextResponse.json(
      { error: 'La propiedad no está disponible para este registro.' },
      { status: 403 }
    )
  }

  const { data: registration, error: registrationError } =
    await supabase
      .from('opportunity_property_registrations')
      .insert({
        demand_request_id: demandRequestId,
        property_id: propertyId,
        registered_by: user.id,
      })
      .select('id')
      .single()

  if (registrationError) {
    if (registrationError.code === '23505') {
      return NextResponse.json(
        { error: 'Esta propiedad ya fue registrada para esta oportunidad.' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'No se pudo registrar la oportunidad.' },
      { status: 400 }
    )
  }

  // La notificación se registra mediante trigger dentro de la misma transacción.

  return NextResponse.json({
    success: true,
    registration_id: registration.id,
    message: 'Propiedad registrada para esta oportunidad.',
  })
}
