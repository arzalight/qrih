import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { assertSameOrigin, readForm, validUuid } from '@/lib/request-security'

function reply(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } })
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()

    if (!supabase) {
      return reply(
        { error: 'Supabase no está configurado correctamente.' },
        500
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return reply(
        { error: 'Debes iniciar sesión para registrar una propiedad.' },
        401
      )
    }

    let formData: FormData
    try { assertSameOrigin(request); formData = await readForm(request) }
    catch { return reply({ error: 'Solicitud inválida.' }, 400) }

    const demandRequestId = String(
      formData.get('demand_request_id') || ''
    ).trim()

    const propertyId = String(
      formData.get('property_id') || ''
    ).trim()

    if (!validUuid(demandRequestId) || !validUuid(propertyId)) {
      return reply(
        { error: 'Faltan datos para registrar la oportunidad.' },
        400
      )
    }

    // El RPC valida actor, propiedad propia publicada y requerimiento elegible,
    // sin abrir la lectura de filas privadas ni confiar en IDs del formulario.
    const { data: registration, error: registrationError } = await supabase.rpc(
      'qrih_register_opportunity',
      { p_demand_request_id: demandRequestId, p_property_id: propertyId }
    )

    if (registrationError || typeof registration !== 'string' || !validUuid(registration)) {
      if (registrationError?.code === '23505') {
        return reply(
          { error: 'Esta propiedad ya fue registrada para esta oportunidad.' },
          409
        )
      }

      return reply(
        { error: 'La propiedad o el requerimiento no están disponibles para esta postulación.' },
        registrationError?.code === '42501' || registrationError?.code === 'P0001' ? 403 : 503
      )
    }

    // La notificación se registra mediante trigger dentro de la misma transacción.

    return reply({
      success: true,
      registration_id: registration,
      message: 'Propiedad registrada para esta oportunidad.',
    })
  } catch {
    return reply({ error: 'No se pudo completar la postulación.' }, 503)
  }
}
