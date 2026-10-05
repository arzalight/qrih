import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ensureOwnProfile } from '@/lib/auth-profile'
import { canonicalRequestOrigin } from '@/lib/request-security'

export async function GET(request: Request) {
  let stage = 'origin'
  try {
    // Reutiliza origen canónico de AUD-022 sin confiar en Host/forwarded headers.
    const origin = canonicalRequestOrigin(request)
    const redirect = (path: string) => {
      const response = NextResponse.redirect(new URL(path, origin))
      response.headers.set('Cache-Control', 'private, no-store')
      return response
    }
    const fail = (error: 'confirmation' | 'config' | 'profile') => {
      console.warn('QRIH_AUTH_CALLBACK_FAILURE', JSON.stringify({ stage }))
      return redirect(`/login?error=${error}`)
    }
    stage = 'code'
    const code = new URL(request.url).searchParams.get('code')
    if (!code) return fail('confirmation')

    stage = 'config'
    const supabase = await createServerSupabaseClient()
    if (!supabase) return fail('config')

    stage = 'exchange'
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return fail('confirmation')

    const result = await ensureOwnProfile(supabase)
    if (!result.ok) {
      stage = `profile_${result.stage}`
      return fail('profile')
    }
    return redirect('/publicar')
  } catch {
    // Sólo etapa constante; nunca código, cookies, JWT, email ni errores arbitrarios.
    console.warn('QRIH_AUTH_CALLBACK_FAILURE', JSON.stringify({ stage }))
    return NextResponse.json({ error: 'No fue posible completar la confirmación. Inicia sesión de nuevo.' },
      { status: 503, headers: { 'Cache-Control': 'private, no-store' } })
  }
}
