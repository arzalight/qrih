import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getRecoveryUser, RECOVERY_COOKIE } from '@/lib/password-recovery-server'
import { ResetPasswordForm } from './ResetPasswordForm'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Restablecer contraseña | QRIH', referrer: 'no-referrer' }

export default async function ResetPasswordPage() {
  let email: string | null = null
  try {
    const supabase = await createServerSupabaseClient()
    const store = await cookies()
    if (supabase) email = (await getRecoveryUser(supabase, store.get(RECOVERY_COOKIE)?.value))?.email ?? null
  } catch { /* Sin enlaces, tokens ni errores privados en logs. */ }
  return <>
    <Header />
    <main className="form">
      <h1>Restablecer contraseña</h1>
      {email ? <ResetPasswordForm email={email} /> : <>
        <p role="alert">El enlace no es válido, venció o pertenece a otra sesión. Solicita uno nuevo y ábrelo en el mismo navegador.</p>
        <p><Link href="/recuperar-contrasena" prefetch={false}>Solicitar un nuevo enlace</Link></p>
      </>}
    </main>
  </>
}
