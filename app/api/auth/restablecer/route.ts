import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { canonicalRequestOrigin, limitedBody } from '@/lib/request-security'
import { passwordRecoveryValidation } from '@/lib/password-recovery'
import { getRecoveryUser, RECOVERY_COOKIE } from '@/lib/password-recovery-server'

const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' }

export async function POST(request: Request) {
  const failure = (error: string, status: number) => NextResponse.json({ error }, { status, headers })
  let updated = false
  try {
    if (request.headers.get('origin') !== canonicalRequestOrigin(request)) return failure('Origen inválido.', 403)
    if (!request.headers.get('content-type')?.startsWith('application/json')) return failure('Solicitud inválida.', 400)
    let body
    try { body = JSON.parse(new TextDecoder().decode(await limitedBody(request, 4096))) }
    catch { return failure('Solicitud inválida.', 400) }
    const invalid = passwordRecoveryValidation(body?.password, body?.confirmation)
    if (invalid) return failure(invalid, 400)
    const supabase = await createServerSupabaseClient()
    if (!supabase) return failure('Servicio no disponible.', 503)
    const store = await cookies()
    const user = await getRecoveryUser(supabase, store.get(RECOVERY_COOKIE)?.value)
    if (!user) return failure('El enlace no es válido o venció. Solicita uno nuevo.', 401)
    const { data, error } = await supabase.auth.updateUser({ password: body.password })
    if (error) return failure(error.status === 429 ? 'Espera unos minutos antes de reintentar.' : 'No fue posible guardar la contraseña. Usa una diferente o solicita otro enlace.', 400)
    if (data.user?.id !== user.id) return failure('No se pudo confirmar el resultado. Intenta iniciar sesión con la nueva contraseña.', 503)
    updated = true
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'global' })
    const response = NextResponse.json({ ok: true, signedOut: !signOutError }, { headers })
    response.cookies.set(RECOVERY_COOKIE, '', { httpOnly: true, secure: canonicalRequestOrigin(request).startsWith('https:'), sameSite: 'lax', path: '/', maxAge: 0 })
    return response
  } catch {
    // No falsear un fallo de contraseña si el cambio ya ocurrió y falló el logout.
    if (updated) {
      const response = NextResponse.json({ ok: true, signedOut: false }, { headers })
      response.cookies.set(RECOVERY_COOKIE, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 })
      return response
    }
    return failure('No fue posible completar el cambio. Intenta más tarde.', 503)
  }
}
