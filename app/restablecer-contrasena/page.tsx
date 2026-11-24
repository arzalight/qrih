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
  return (
    <>
      <Header />

      <main className="form auth-access auth-access--split">
        <div className="auth-split">
          <aside className="auth-split__brand" aria-label="Seguridad de contraseña">
            <div className="auth-split__brand-top">
              <span className="auth-split__monogram" aria-hidden="true">Q</span>
              <span className="auth-split__brand-name">QRO INDUSTRIAL HUB</span>
            </div>

            <div className="auth-split__brand-copy">
              <h2>Define una nueva contraseña segura.</h2>
              <p>
                Al guardar tu nueva contraseña cerraremos tus sesiones anteriores para proteger tu cuenta y tus propiedades.
              </p>
            </div>

            <ul className="auth-split__points">
              <li>
                <span className="auth-split__point-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="11" width="16" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>
                </span>
                <span>Mínimo 8 caracteres para proteger tu acceso</span>
              </li>
              <li>
                <span className="auth-split__point-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                  </svg>
                </span>
                <span>Cierre automático de sesiones previas al confirmar</span>
              </li>
            </ul>
          </aside>

          <section className="auth-access__card auth-split__panel" aria-label="Restablecer contraseña">
            <div className="auth-split__header">
              <h1>Restablecer contraseña</h1>
            </div>
            {email ? (
              <ResetPasswordForm email={email} />
            ) : (
              <>
                <p className="auth-message" role="alert">
                  El enlace no es válido, venció o pertenece a otra sesión. Solicita uno nuevo y ábrelo en el mismo navegador.
                </p>
                <p className="auth-split__footer">
                  <Link href="/recuperar-contrasena" prefetch={false}>Solicitar un nuevo enlace →</Link>
                </p>
              </>
            )}
          </section>
        </div>
      </main>
    </>
  )
}
