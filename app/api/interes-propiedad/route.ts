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
      { error: 'Debes iniciar sesión para mostrar interés.' },
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
      { error: 'Faltan datos para registrar tu interés.' },
      { status: 400 }
    )
  }

  const { data: demandRequest, error: demandError } = await supabase
    .from('demand_requests')
    .select('id')
    .eq('id', demandRequestId)
    .eq('user_id', user.id)
    .single()

  if (demandError || !demandRequest) {
    return NextResponse.json(
      { error: 'El requerimiento no pertenece a tu cuenta.' },
      { status: 403 }
    )
  }

  const { data: property, error: propertyError } = await supabase
    .from('properties_public').select('id').eq('id', propertyId).single()

  if (propertyError || !property) {
    return NextResponse.json(
      { error: 'La propiedad ya no está disponible.' },
      { status: 404 }
    )
  }

  const { data: existingInterest } = await supabase
    .from('property_interest_requests')
    .select('id, status')
    .eq('demand_request_id', demandRequestId)
    .eq('property_id', propertyId)
    .maybeSingle()

  if (existingInterest) {
    return NextResponse.json({
      success: true,
      already_registered: true,
      message: 'Tu interés ya está registrado para esta propiedad.',
    })
  }

  const { data: interest, error: interestError } = await supabase
    .from('property_interest_requests')
    .insert({
      demand_request_id: demandRequestId,
      property_id: propertyId,
      user_id: user.id,
    })
    .select('id')
    .single()

  if (interestError) {
    if (interestError.code === '23505') {
      return NextResponse.json({
        success: true,
        already_registered: true,
        message: 'Tu interés ya está registrado para esta propiedad.',
      })
    }

    return NextResponse.json(
      { error: 'No se pudo registrar tu interés.' },
      { status: 400 }
    )
  }

  return NextResponse.json({
    success: true,
    interest_id: interest.id,
    message: 'Tu interés fue registrado correctamente.',
  })
}
