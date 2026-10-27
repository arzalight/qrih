import { privateCommercialActor } from '@/lib/private-commercial-server'
import { assertSameOrigin, canonicalRequestOrigin, readJson, validUuid } from '@/lib/request-security'

export async function POST(request: Request) {
  const reply = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } })
  try {
    const actor = await privateCommercialActor()
    if (!actor) return reply({ error: 'Necesitas una cuenta activa.' }, 401)
    assertSameOrigin(request)
    if (request.headers.get('origin') !== canonicalRequestOrigin(request)) return reply({ error: 'Origen inválido.' }, 403)
    const body = await readJson(request)
    if (!validUuid(body.id) || !['activate', 'renew', 'remove'].includes(String(body.action))) return reply({ error: 'Acción inválida.' }, 400)
    const { data, error } = await actor.client.rpc('qrih_change_demand_urgency', { p_id: body.id, p_action: body.action })
    if (error) return reply({ error: error.code === '23505' ? 'Ya tienes otro requerimiento urgente. Retíralo o espera a que venza.' : 'No fue posible cambiar la urgencia. Revisa vigencia y permisos.' }, error.code === '23505' ? 409 : 403)
    return reply({ success: true, urgency: data })
  } catch { return reply({ error: 'Solicitud inválida.' }, 400) }
}
