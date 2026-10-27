import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { assertSameOrigin, readForm, validUuid } from '@/lib/request-security'
import { parsePropertySubmission } from '@/lib/property-submission'

const json = (body: object, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } })

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    const supabase = await createServerSupabaseClient()
    if (!supabase) return json({ error: 'Servicio no disponible.' }, 503)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.is_anonymous) return json({ error: 'Necesitas iniciar sesión.' }, 401)
    const { data: profile } = await supabase.from('profiles').select('account_status').eq('id', user.id).single()
    if (profile?.account_status !== 'active') return json({ error: 'Necesitas una cuenta activa.' }, 403)

    // Metadata only. Each image retains the existing independent 3 MiB transport limit.
    const form = await readForm(request, 64 * 1024)
    const id = form.get('request_id')
    if (!validUuid(id) || !['draft', 'pending'].includes(String(form.get('submission_action')))) return json({ error: 'Envío inválido.' }, 400)
    const fields = parsePropertySubmission(form)
    const imageCount = Number(form.get('image_count'))
    if (!Number.isInteger(imageCount) || imageCount < 0 || imageCount > 7) return json({ error: 'Cantidad de fotografías inválida.' }, 400)
    const pending = form.get('submission_action') === 'pending'
    const finalize = form.get('finalize') === 'on'
    // PK is the durable idempotency key. Never upsert or modify an existing record.
    const previous = await supabase.from('properties').select('id,status').eq('id', id).eq('owner_id', user.id).maybeSingle()
    if (previous.error) return json({ error: 'No pudimos comprobar el envío. Reintenta sin descartar el borrador.' }, 503)
    if (previous.data && !finalize) return json({ id, status: previous.data.status, recover: previous.data.status === 'draft' })
    if (finalize) {
      if (!previous.data) return json({ error: 'No existe el borrador autorizado.' }, 403)
      if (previous.data.status !== 'draft') return json({ id, status: previous.data.status })
      const gallery = await supabase.from('property_images').select('storage_path').eq('property_id', id)
      if (gallery.error || gallery.data?.length !== imageCount) return json({ id, status: 'draft', recover: true })
      if (!pending) return json({ id, status: 'draft' })
      const result = await supabase.from('properties').update({ status: 'pending' }).eq('id', id).eq('owner_id', user.id)
        .eq('status', 'draft').select('id').single()
      if (result.error || !result.data) return json({ id, status: 'draft', recover: true })
      return json({ id, status: 'pending' })
    }
    const created = await supabase.from('properties').insert({
      ...fields, id, owner_id: user.id, slug: `${fields.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${id}`, status: 'draft',
      publication_authorized_at: pending ? new Date().toISOString() : null,
      terms_accepted_at: pending ? new Date().toISOString() : null,
    }).select('id').single()
    if (created.error || !created.data) {
      // A concurrent request may already have reserved this exact id. Do not upload.
      const retry = await supabase.from('properties').select('id,status').eq('id', id).eq('owner_id', user.id).maybeSingle()
      if (retry.data) return json({ id, status: retry.data.status, recover: retry.data.status === 'draft' })
      return json({ error: 'No pudimos confirmar la creación. Reintenta con el mismo borrador.' }, 503)
    }

    // Files travel individually through the existing verified ingestion endpoint.
    return json({ id, status: 'draft', prepared: true })
  } catch {
    return json({ error: 'No se pudo completar el envío. Revisa los datos y conserva el borrador para reintentar.' }, 400)
  }
}
