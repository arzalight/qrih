import type { SupabaseClient } from '@supabase/supabase-js'

export const RECOVERY_NOTICE = 'Si la dirección corresponde a una cuenta, recibirás un correo para restablecer tu contraseña. Revisa también Spam y abre el enlace en este mismo navegador.'

export function recoveryCallbackUrl(origin: string) {
  const url = new URL(origin)
  if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) ||
    url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Origen inválido.')
  }
  return new URL('/auth/callback', url.origin).href
}

export async function requestPasswordRecovery(supabase: SupabaseClient, email: string, origin: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: recoveryCallbackUrl(origin),
    })
    if (error?.status === 429) return 'Espera unos minutos antes de solicitar otro correo.'
    if (error && (!error.status || error.status >= 500)) return 'El servicio de correo no está disponible. Intenta más tarde.'
    // No mostrar errores específicos de cuenta ni confirmar que una dirección existe.
    return RECOVERY_NOTICE
  } catch {
    return 'No fue posible solicitar el correo. Intenta más tarde.'
  }
}

export function passwordRecoveryValidation(password: unknown, confirmation: unknown): string | null {
  if (typeof password !== 'string' || typeof confirmation !== 'string') return 'Solicitud inválida.'
  if (password.length < 8 || password.length > 128 || password.trim().length === 0) {
    return 'Usa una contraseña de entre 8 y 128 caracteres.'
  }
  if (password !== confirmation) return 'Las contraseñas no coinciden.'
  return null
}
