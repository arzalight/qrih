import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ensureOwnProfile } from '@/lib/auth-profile'
import { canonicalRequestOrigin } from '@/lib/request-security'
import { createRecoveryMarker, RECOVERY_COOKIE, RECOVERY_MAX_AGE } from '@/lib/password-recovery-server'

export async function GET(request: Request) {
  let stage = 'origin'
  try {
    // Reutiliza origen canónico de AUD-022 sin confiar en Host/forwarded headers.
    const origin = canonicalRequestOrigin(request)
    const redirect = (path: string) => {
      const response = NextResponse.redirect(new URL(path, origin))
      response.headers.set('Cache-Control', 'private, no-store')
      response.headers.set('Referrer-Policy', 'no-referrer')
      return response
    }
    const fail = (error: 'confirmation' | 'config' | 'profile') => {
      console.warn('QRIH_AUTH_CALLBACK_FAILURE', JSON.stringify({ stage }))
      return redirect(`/login?error=${error}`)
    }
    stage = 'code'
    const params = new URL(request.url).searchParams
    const code = params.get('code')
    if (!code) return fail('confirmation')
    // SDK instalado admite flujos PKCE aislados; no tomar el verifier de otro envío.
    const flowId = params.get('sb_flow_id')
    if (flowId !== null && !/^[a-f0-9]{32}$/.test(flowId)) return fail('confirmation')

    stage = 'config'
    const supabase = await createServerSupabaseClient()
    if (!supabase) return fail('config')

    stage = 'exchange'
    let isRecovery = false
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      // No llamadas Auth ni await dentro del listener: el SDK espera su resolución.
      if (event === 'PASSWORD_RECOVERY') isRecovery = true
    })
    const exchanged = await supabase.auth.exchangeCodeForSession(code,
      flowId ? { flowId } : undefined).finally(() => subscription.unsubscribe())
    const { data, error } = exchanged
    if (error) return fail('confirmation')

    // Evento del SDK tras intercambio PKCE exitoso, no type/next de URL.
    // No crear perfiles ni conceder permisos durante recuperación.
    if (isRecovery) {
      stage = 'recovery_session'
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user?.email_confirmed_at || user.is_anonymous ||
        !data.session?.access_token || user.id !== data.user?.id) {
        return redirect('/recuperar-contrasena?error=link')
      }
      const response = redirect('/restablecer-contrasena')
      response.cookies.set(RECOVERY_COOKIE, createRecoveryMarker(user.id, data.session.access_token), {
        httpOnly: true, secure: origin.startsWith('https:'), sameSite: 'lax', path: '/', maxAge: RECOVERY_MAX_AGE,
      })
      return response
    }

    const result = await ensureOwnProfile(supabase)
    if (!result.ok) {
      stage = `profile_${result.stage}`
      return fail('profile')
    }
    return redirect('/mis-propiedades')
  } catch {
    // Sólo etapa constante; nunca código, cookies, JWT, email ni errores arbitrarios.
    console.warn('QRIH_AUTH_CALLBACK_FAILURE', JSON.stringify({ stage }))
    return NextResponse.json({ error: 'No fue posible completar la confirmación. Inicia sesión de nuevo.' },
      { status: 503, headers: { 'Cache-Control': 'private, no-store' } })
  }
}
