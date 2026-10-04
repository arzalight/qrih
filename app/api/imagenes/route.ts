import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { uploadVerifiedImage } from '@/lib/verified-media-server'
import { assertSameOrigin, readForm } from '@/lib/request-security'
import { createPrivilegedServerSupabaseClient } from '@/lib/supabase-privileged-server'

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    const supabase = await createServerSupabaseClient()
    if (!supabase) return NextResponse.json({ error: 'Servicio no disponible.' }, { status: 503 })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Necesitas iniciar sesión.' }, { status: 401 })
    const { data: profile } = await supabase.from('profiles').select('account_status,avatar_url').eq('id', user.id).single()
    if (profile?.account_status !== 'active') return NextResponse.json({ error: 'Necesitas una cuenta activa.' }, { status: 403 })
    const form = await readForm(request, 3 * 1024 * 1024 + 64 * 1024)
    const file = form.get('image')
    const kind = form.get('kind')
    if (!(file instanceof File) || file.size > 3 * 1024 * 1024 || !['property', 'avatar'].includes(String(kind))) {
      return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 })
    }
    const bucket = kind === 'avatar' ? 'profile-images' : 'property-images'
    const result = await uploadVerifiedImage(file, user.id, bucket)
    if (bucket === 'profile-images') {
      const { error } = await supabase.from('profiles').update({ avatar_url: result.publicUrl }).eq('id', user.id)
      if (error) {
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
    return NextResponse.json({ error: 'No se pudo subir la imagen. Revisa formato, tamaño y límite de fotografías.' }, { status: 400 })
  }
}
