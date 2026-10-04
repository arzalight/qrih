import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { assertSameOrigin, readJson, validUuid } from '@/lib/request-security'

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
      { error: 'Necesitas iniciar sesión.' },
      { status: 401 }
    )
  }

  let body: Record<string, unknown>
  try { assertSameOrigin(request); body = await readJson(request) }
  catch { return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 }) }
  const authorizationId = String(body.authorization_id || '').trim()
  const status = String(body.status || '').trim()

  if (!validUuid(authorizationId) || !['authorized', 'declined'].includes(status)) {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 })
  }

  const { error: responseError } = await supabase.rpc(
    'respond_property_contact_authorization',
    {
      p_authorization_id: authorizationId,
      p_status: status,
    }
  )

  if (responseError) {
    return NextResponse.json(
      { error: 'No se pudo responder. Comprueba que la solicitud siga pendiente y pertenezca a tu cuenta.' },
      { status: 400 }
    )
  }

  return NextResponse.json({
    success: true,
    status,
  })
}
