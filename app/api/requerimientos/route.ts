import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createPrivilegedServerSupabaseClient } from '@/lib/supabase-privileged-server'
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
    if (user) {
      const { data: profile } = await actor.from('profiles').select('account_status').eq('id',user.id).single()
      if (profile?.account_status !== 'active') return NextResponse.json({ error: 'Necesitas una cuenta activa.' }, { status: 403 })
    }
    const admin = createPrivilegedServerSupabaseClient()
    const previous = await admin.from('demand_requests').select('id').eq('id', body.request_id).eq('user_id', user.id).maybeSingle()
    if (previous.error) throw new Error('lookup')
    if (previous.data) return NextResponse.json({ id: previous.data.id }, { headers: { 'Cache-Control': 'no-store' } })
    // The authenticated actor owns both the quota and the idempotent record.
    const { data: allowed } = await admin.rpc('qrih_take_server_limit', { p_subject: user.id, p_action: 'demand' })
    if (!allowed) return NextResponse.json({ error: 'Demasiados envíos. Intenta más tarde.' }, { status: 429 })
    const { data, error } = await admin.from('demand_requests').insert({
      id: body.request_id, name, email, phone, company: String(body.company || '').trim() || null,
      giro: String(body.giro || '').trim() || null, operation: body.operation,
      zone_general: String(body.zone_general || '').trim() || null, zone: String(body.zone || '').trim() || null,
      area_min: numbers[0], area_max: numbers[1], budget_min: numbers[2], budget_max: numbers[3],
      area_requirement: `${numbers[0]} - ${numbers[1]} m²`, budget: `$${numbers[2]} - $${numbers[3]}`,
      notes: String(body.notes || '').trim() || null, user_id: user.id, status: 'new',
    }).select('id').single()
    if (error || !data) {
      const retry = await admin.from('demand_requests').select('id').eq('id', body.request_id).eq('user_id', user.id).maybeSingle()
      if (retry.data) return NextResponse.json({ id: retry.data.id }, { headers: { 'Cache-Control': 'no-store' } })
      throw new Error('database')
    }
    return NextResponse.json({ id: data.id }, { headers: { 'Cache-Control': 'no-store' } })
  } catch { return NextResponse.json({ error: 'No se pudo enviar. Revisa los datos y vuelve a intentar.' }, { status: 400 }) }
}
