import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { uploadVerifiedImage } from '@/lib/verified-media-server'
import { assertSameOrigin, readForm, validUuid } from '@/lib/request-security'
import { createPrivilegedServerSupabaseClient } from '@/lib/supabase-privileged-server'

export async function POST(request: Request) {
  // Sólo etapas constantes en logs privados: nunca objetos de error, rutas o datos del usuario.
  let stage: string = 'origin'
  let imageKind = 'unknown'
  const reportFailure = () => console.warn('QRIH_IMAGE_INGEST_FAILURE', JSON.stringify({ stage, kind: imageKind }))
  try {
    assertSameOrigin(request)
    stage = 'session'
    const supabase = await createServerSupabaseClient()
    if (!supabase) return NextResponse.json({ error: 'Servicio no disponible.' }, { status: 503 })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.is_anonymous) return NextResponse.json({ error: 'Necesitas iniciar sesión.' }, { status: 401 })
    stage = 'profile'
    const { data: profile } = await supabase.from('profiles').select('account_status,avatar_url').eq('id', user.id).single()
    if (profile?.account_status !== 'active') return NextResponse.json({ error: 'Necesitas una cuenta activa.' }, { status: 403 })
    stage = 'multipart'
    const form = await readForm(request, 3 * 1024 * 1024 + 64 * 1024)
    const file = form.get('image')
    const kind = form.get('kind')
    imageKind = kind === 'property' || kind === 'avatar' ? kind : 'unknown'
    stage = 'form_validation'
    if (!(file instanceof File) || file.size > 3 * 1024 * 1024 || !['property', 'avatar'].includes(String(kind))) {
      reportFailure()
      return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 })
    }
    const draftId = form.get('draft_id')
    const position = Number(form.get('position'))
    let previousImages: { storage_path: string; title: string }[] = []
    if (draftId !== null) {
      if (kind !== 'property' || !validUuid(draftId) || !Number.isInteger(position) || position < 0 || position >= 7
        || String(form.get('title') || '').length > 120) return NextResponse.json({ error: 'Borrador inválido.' }, { status: 400 })
      const own = await supabase.from('properties').select('id').eq('id', draftId).eq('owner_id', user.id).eq('status', 'draft').single()
      if (own.error || !own.data) return NextResponse.json({ error: 'No puedes adjuntar fotografías a este borrador.' }, { status: 403 })
      const gallery = await supabase.from('property_images').select('storage_path,title').eq('property_id', draftId).order('position')
      if (gallery.error || gallery.data?.length !== position) return NextResponse.json({ error: 'Revisa las fotografías desde el editor del borrador.' }, { status: 409 })
      previousImages = gallery.data
    }
    const bucket = kind === 'avatar' ? 'profile-images' : 'property-images'
    const result = await uploadVerifiedImage(file, user.id, bucket, current => { stage = current })
    if (draftId !== null) {
      const attached = await supabase.rpc('replace_property_images', { p_property_id: draftId,
        p_images: [...previousImages, { storage_path: result.path, title: String(form.get('title') || '') }] })
      if (attached.error) {
        // A lost RPC response may still commit. Only confirmed SQL rejections permit cleanup;
        // preserve an uncertain object rather than delete a photograph that may be attached.
        if (/^(?:22|23|42|P0)[0-9A-Z]{3}$/.test(attached.error.code || '')) {
          const check = await supabase.from('property_images').select('storage_path').eq('property_id', draftId).eq('storage_path', result.path)
          if (!check.error && !check.data?.length) await createPrivilegedServerSupabaseClient().storage.from(bucket).remove([result.path])
        }
        return NextResponse.json({ error: 'Revisa el borrador antes de continuar.' }, { status: 409 })
      }
    }
    if (bucket === 'profile-images') {
      stage = 'avatar_profile'
      const { error } = await supabase.from('profiles').update({ avatar_url: result.publicUrl }).eq('id', user.id)
      if (error) {
        reportFailure()
        await createPrivilegedServerSupabaseClient().storage.from(bucket).remove([result.path])
        return NextResponse.json({ error: 'No se pudo guardar el avatar.' }, { status: 400 })
      }
      // Nunca usar un nombre/ruta del formulario para borrar. Sólo el avatar anterior propio.
      const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile-images/${user.id}/`
      if (profile.avatar_url?.startsWith(prefix)) {
        const oldName = profile.avatar_url.slice(prefix.length)
        if (/^[a-zA-Z0-9._-]+\.(webp|jpg|jpeg|png)$/.test(oldName)) {
          await supabase.storage.from(bucket).remove([`${user.id}/${oldName}`])
        }
      }
    }
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    reportFailure()
    return NextResponse.json({ error: 'No se pudo subir la imagen. Revisa formato, tamaño y límite de fotografías.' }, { status: 400 })
  }
}
