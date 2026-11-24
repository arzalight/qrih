import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { assertSameOrigin, readJson, validUuid } from '@/lib/request-security'

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    const body = await readJson(request)
    const name = String(body.name || '').trim(), email = String(body.email || '').trim()
    const phone = String(body.phone || '').trim()
    const numbers = ['area_min','area_max','budget_min','budget_max'].map((key) => Number(body[key]))
    if (!name || name.length > 120 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      || !/^\d{10}$/.test(phone) || !['Renta','Venta'].includes(String(body.operation))
      || numbers.some((n) => !Number.isFinite(n) || n < 0 || n > 1e12)
      || numbers[0] > numbers[1] || numbers[2] > numbers[3]
      || String(body.notes || '').length > 3000 || String(body.company || '').length > 160
      || String(body.giro || '').length > 160 || String(body.zone || '').length > 160
      || String(body.zone_general || '').length > 160) throw new Error('inputs')
    const actor = await createServerSupabaseClient()
    if (!actor) return NextResponse.json({ error: 'Servicio no disponible.' }, { status: 503 })
    const { data: { user } } = await actor.auth.getUser()
    if (!user || user.is_anonymous) return NextResponse.json({ error: 'Necesitas iniciar sesión.' }, { status: 401 })
    if (!validUuid(body.request_id)) return NextResponse.json({ error: 'Envío inválido.' }, { status: 400 })
    const { data: profile } = await actor.from('profiles').select('account_status').eq('id', user.id).single()
    if (profile?.account_status !== 'active') return NextResponse.json({ error: 'Necesitas una cuenta activa.' }, { status: 403 })

    // La RPC transaccional deriva la identidad de auth.uid(), garantiza idempotencia por
    // p_request_id y aplica la cuota interna sin credenciales privilegiadas en Next.js.
    const { data, error } = await actor.rpc('qrih_submit_demand_request', {
      p_request_id: body.request_id,
      p_name: name,
      p_email: email,
      p_phone: phone,
      p_operation: body.operation,
      p_area_min: numbers[0],
      p_area_max: numbers[1],
      p_budget_min: numbers[2],
      p_budget_max: numbers[3],
      p_company: String(body.company || '').trim() || null,
      p_giro: String(body.giro || '').trim() || null,
      p_zone_general: String(body.zone_general || '').trim() || null,
      p_zone: String(body.zone || '').trim() || null,
      p_notes: String(body.notes || '').trim() || null,
    })
    if (error) {
      const code = typeof error.code === 'string' ? error.code : ''
      const message = typeof error.message === 'string' ? error.message : ''
      if (code === 'P0001' || message.includes('RATE_LIMIT_EXCEEDED')) {
        return NextResponse.json({ error: 'Demasiados envíos. Intenta más tarde.' }, { status: 429 })
      }
      if (code === '42501' && message.includes('ACCOUNT_INACTIVE')) {
        return NextResponse.json({ error: 'Necesitas una cuenta activa.' }, { status: 403 })
      }
      if (code === '42501' && message.includes('AUTH_REQUIRED')) {
        return NextResponse.json({ error: 'Necesitas iniciar sesión.' }, { status: 401 })
      }
      if (code === '42501' && message.includes('REQUEST_ID_CONFLICT')) {
        return NextResponse.json({ error: 'Envío inválido.' }, { status: 403 })
      }
      throw new Error('database')
    }
    if (typeof data !== 'string' || !validUuid(data)) throw new Error('database')
    return NextResponse.json({ id: data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch { return NextResponse.json({ error: 'No se pudo enviar. Revisa los datos y vuelve a intentar.' }, { status: 400 }) }
}
