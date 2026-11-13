import { privateCommercialActor, PRIVATE_OWNER_COLUMNS } from '@/lib/private-commercial-server'
import { ownerInput } from '@/lib/private-commercial'
import { assertSameOrigin, canonicalRequestOrigin, readJson, validUuid } from '@/lib/request-security'

const reply = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } })
export async function GET(request: Request) {
  try {
    const actor = await privateCommercialActor()
    if (!actor) return reply({ error: 'Necesitas una cuenta activa.' }, 401)
    const query = new URL(request.url).searchParams
    const advisor = query.get('advisor') || actor.id
    if (!validUuid(advisor) || (advisor !== actor.id && !actor.admin)) return reply({ error: 'Directorio no disponible.' }, 403)
    if (query.get('picker') === '1') {
      // Even an administrator's property picker is scoped to their OWN directory.
      if (advisor !== actor.id) return reply({ error: 'Directorio no disponible.' }, 403)
      const ready = await actor.client.rpc('qrih_owner_picker_ready')
      if (ready.error || !ready.data) return reply({ error: 'Selector privado por habilitar.', code: ready.error?.code === 'PGRST202' ? 'not_enabled' : 'unavailable' }, 503)
      const selection = query.get('selection')
      if (selection) {
        if (!validUuid(selection)) return reply({ error: 'Contacto inválido.' }, 400)
        const result = await actor.client.from('advisor_owners').select('id,name,company').eq('advisor_id', actor.id).eq('id', selection).maybeSingle()
        return result.error || !result.data ? reply({ error: 'No se pudo comprobar el propietario seleccionado.' }, 409) : reply({ owner: result.data })
      }
      const q = decodeURIComponent(request.headers.get('x-qrih-owner-search') || '').trim()
      if (q.length > 160 || /\u0000/.test(q)) return reply({ error: 'Búsqueda inválida.' }, 400)
      if (q.length < 2) return reply({ owners: [] })
      const result = await actor.client.rpc('qrih_search_own_owners', { p_query: q })
      return result.error ? reply({ error: 'No se pudo buscar. Conservamos lo que escribiste; vuelve a intentar.' }, 503) : reply({ owners: result.data || [] })
    }
    const ready = await actor.client.rpc('qrih_private_property_ready')
    if (ready.error || !ready.data) return reply({ error: 'Herramientas privadas por habilitar.', code: ready.error?.code === 'PGRST202' ? 'not_enabled' : 'unavailable' }, 503)
    if (query.get('choices') === 'properties') {
      const page = Math.floor(Math.max(0, Math.min(10000, Number(query.get('page')) || 0)))
      const result = await actor.client.from('properties').select('id,title', { count: 'exact' }).eq('owner_id', advisor).order('created_at', { ascending: false }).order('id').range(page * 50, page * 50 + 49)
      return result.error ? reply({ error: 'No fue posible consultar tus propiedades.' }, 503) : reply({ properties: result.data || [], count: result.count, editable: advisor === actor.id })
    }
    let read = actor.client.from('advisor_owners').select(PRIVATE_OWNER_COLUMNS, { count: 'exact' }).eq('advisor_id', advisor)
    // Private names must not become URL/query strings in access logs or history.
    const q = decodeURIComponent(request.headers.get('x-qrih-owner-search') || '').trim()
    if (q.length > 160) return reply({ error: 'Búsqueda demasiado larga.' }, 400)
    if (q) read = read.ilike('name', '%' + q.replace(/[\\%_]/g, '\\$&') + '%')
    if (query.get('archived') !== '1') read = read.is('archived_at', null)
    const id = query.get('id')
    if (id && !validUuid(id)) return reply({ error: 'Contacto inválido.' }, 400)
    if (id) read = read.eq('id', id)
    const page = Math.floor(Math.max(0, Math.min(10000, Number(query.get('page')) || 0)))
    const { data, error, count } = await read.order('created_at', { ascending: false }).order('id').range(page * 50, page * 50 + 49)
    if (error) return reply({ error: 'No fue posible consultar el directorio.' }, 503)
    let properties: { id: string; title: string; internal_name: string | null }[] = []
    if (id && data?.length) {
      const links = await actor.client.from('property_private_details').select('property_id,internal_name').eq('owner_contact_id', id)
      if (links.error) return reply({ error: 'No fue posible consultar las asociaciones.' }, 503)
      if (links.data?.length) {
        const result = await actor.client.from('properties').select('id,title').in('id', links.data.map(p => p.property_id))
        if (result.error) return reply({ error: 'No fue posible consultar las propiedades.' }, 503)
        properties = (result.data || []).map(p => ({ ...p, internal_name: links.data.find(link => link.property_id === p.id)?.internal_name || null }))
      }
    }
    return reply({ owners: data || [], count, properties, editable: advisor === actor.id })
  } catch { return reply({ error: 'No fue posible consultar el directorio.' }, 503) }
}
export async function POST(request: Request) {
  try {
    const actor = await privateCommercialActor()
    if (!actor) return reply({ error: 'Necesitas una cuenta activa.' }, 401)
    assertSameOrigin(request)
    if (request.headers.get('origin') !== canonicalRequestOrigin(request)) return reply({ error: 'Origen inválido.' }, 403)
    const body = await readJson(request)
    const action = body.action
    if (action === 'associate') {
      if (!validUuid(body.property_id) || (body.owner_contact_id !== null && !validUuid(body.owner_contact_id))) return reply({ error: 'Asociación inválida.' }, 400)
      const result = await actor.client.rpc('qrih_set_property_private_details', { p_property_id: body.property_id, p_details: { owner_contact_id: body.owner_contact_id } })
      return result.error ? reply({ error: 'No fue posible asociar la propiedad. Comprueba que ambos registros sean tuyos.' }, 403) : reply({ success: true })
    }
    if (!validUuid(body.id)) return reply({ error: 'Contacto inválido.' }, 400)
    if (action === 'create') {
      const values = ownerInput(body)
      const previous = await actor.client.from('advisor_owners').select(PRIVATE_OWNER_COLUMNS).eq('id', body.id).eq('advisor_id', actor.id).maybeSingle()
      if (previous.error) return reply({ error: 'El directorio no está disponible.' }, 503)
      if (previous.data) return reply({ owner: previous.data })
      const result = await actor.client.from('advisor_owners').insert({ id: body.id, advisor_id: actor.id, ...values }).select(PRIVATE_OWNER_COLUMNS).single()
      return result.error ? reply({ error: 'No pudimos confirmar el registro. Revisa Mis propietarios antes de reintentar.' }, 503) : reply({ owner: result.data })
    }
    if (!['update', 'archive', 'restore'].includes(String(action))) return reply({ error: 'Acción inválida.' }, 400)
    const values = action === 'update' ? ownerInput(body) : { archived_at: action === 'archive' ? new Date().toISOString() : null }
    const write = actor.client.from('advisor_owners').update(values).eq('id', body.id).eq('advisor_id', actor.id)
    if (typeof body.updated_at === 'string') write.eq('updated_at', body.updated_at)
    const result = await write.select(PRIVATE_OWNER_COLUMNS).maybeSingle()
    return result.error ? reply({ error: 'No fue posible actualizar el contacto.' }, 503) : !result.data ? reply({ error: 'El contacto no está disponible o cambió. Recarga el directorio.' }, 409) : reply({ owner: result.data })
  } catch { return reply({ error: 'Revisa los datos y el origen de la solicitud.' }, 400) }
}
