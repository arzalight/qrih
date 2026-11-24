'use client'

import { createClient } from '@/lib/supabase'
import { Suspense, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { safeInternalPath } from '@/lib/safe-navigation'
import { ensureOwnProfile } from '@/lib/auth-profile'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const busy = useRef(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = safeInternalPath(searchParams.get('next'))
  const pendingConfirmation = searchParams.get('registro') === 'pendiente'
  const callbackMessage = searchParams.get('error') === 'confirmation'
    ? 'La confirmación no pudo completar el acceso. Si tu correo ya está confirmado, inicia sesión aquí.'
    : searchParams.get('error') === 'profile'
      ? 'No fue posible preparar tu perfil. Inicia sesión para reintentarlo.'
      : searchParams.get('error') === 'config' ? 'El servicio de acceso no está disponible.'
        : searchParams.get('password') === 'updated' ? 'Contraseña actualizada. Inicia sesión con tu nueva contraseña.' : ''

  async function signIn(e: React.FormEvent) {
    e.preventDefault()
    if (busy.current) return
    busy.current = true
    setLoading(true)
    setMessage('')
    try {
      const supabase = createClient()
      if (!supabase) {
        return setMessage('El servicio de acceso no está disponible.')
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) return setMessage(error.code === 'email_not_confirmed'
        ? 'Confirma tu correo antes de iniciar sesión. Revisa también Spam o Correo no deseado.'
        : error.status === 429 ? 'Has realizado varios intentos. Espera unos minutos antes de volver a intentar.'
          : 'No fue posible iniciar sesión. Revisa tu correo y contraseña e intenta nuevamente.')
      if (!data.user) return setMessage('No fue posible iniciar sesión.')

      const result = await ensureOwnProfile(supabase)
      if (!result.ok) {
        return setMessage('Tu sesión está iniciada, pero no se pudo preparar tu perfil. No puedes publicar todavía. Intenta iniciar sesión de nuevo o contacta a soporte.')
      }
      router.replace(
        !searchParams.has('next') && result.profile.role === 'admin' && result.profile.account_status === 'active'
          ? '/admin'
          : next
      )
      router.refresh()
    } catch {
      setMessage('No fue posible completar el acceso. Intenta nuevamente.')
    } finally {
      busy.current = false
      setLoading(false)
    }
  }

  return (
    <>
      <Header />

      <main className="form auth-access auth-access--split">
        <div className="auth-split">
          <aside className="auth-split__brand" aria-label="Ventajas de tu cuenta QRIH">
            <div className="auth-split__brand-top">
              <span className="auth-split__monogram" aria-hidden="true">Q</span>
              <span className="auth-split__brand-name">QRO INDUSTRIAL HUB</span>
            </div>

            <div className="auth-split__brand-copy">
              <h2>Accede a tu espacio industrial.</h2>
              <p>
                Gestiona tu cartera, recibe solicitudes calificadas y colabora con asesores en Querétaro.
              </p>
            </div>

            <ul className="auth-split__points">
              <li>
                <span className="auth-split__point-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18" />
                    <path d="M5 21V9l7-4 7 4v12" />
                    <path d="M9 21v-5h6v5" />
                  </svg>
                </span>
                <span>Publica y actualiza tus propiedades con control total</span>
              </li>
              <li>
                <span className="auth-split__point-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                </span>
                <span>Recibe y da seguimiento a solicitudes directas</span>
              </li>
              <li>
                <span className="auth-split__point-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </span>
                <span>Conecta con asesores en red colaborable</span>
              </li>
            </ul>
          </aside>

          <section className="auth-access__card auth-split__panel" aria-label="Inicio de sesión">
            <div className="auth-split__header">
              <h1>Iniciar sesión</h1>
              <p>Ingresa con tu correo y contraseña para abrir tu panel.</p>
            </div>

            {pendingConfirmation && (
              <section className="email-confirmation-notice" role="status" aria-labelledby="email-confirmation-title">
                <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 6 9 7 9-7" />
                </svg>
                <div>
                  <h2 id="email-confirmation-title">Cuenta creada: confirma tu correo</h2>
                  <p>Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.</p>
                  <p>Si no aparece en tu bandeja de entrada, revisa Spam o Correo no deseado. Abre el enlace más reciente en el mismo navegador donde te registraste.</p>
                </div>
              </section>
            )}

            <form onSubmit={signIn} aria-busy={loading} className="auth-split__form">
              <div className="auth-field">
                <label htmlFor="login-email">Correo electrónico</label>
                <input
                  id="login-email"
                  autoComplete="email"
                  type="email"
                  required
                  disabled={loading}
                  placeholder="nombre@empresa.com"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="auth-field">
                <div className="auth-field__row">
                  <label htmlFor="login-password">Contraseña</label>
                  <Link className="auth-access__recovery" href="/recuperar-contrasena" prefetch={false}>
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="auth-password">
                  <input
                    id="login-password"
                    autoComplete="current-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={loading}
                    placeholder="••••••••"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="auth-password__toggle"
                    disabled={loading}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={showPassword}
                    title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <path d="m1 1 22 22" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button disabled={loading} className="auth-split__submit">
                {loading ? 'INICIANDO SESIÓN…' : 'INICIAR SESIÓN →'}
              </button>

              {(message || callbackMessage) && (
                <p className="notice" role="status" aria-live="polite">
                  {message || callbackMessage}
                </p>
              )}
            </form>

            <p className="auth-split__footer">
              ¿No tienes cuenta?{' '}
              <Link href={`/registro?next=${encodeURIComponent(next)}`}>
                Regístrate →
              </Link>
            </p>
          </section>
        </div>
      </main>
    </>
  )
}

export default function Login() {
  return (
    <Suspense fallback={<main className="form"><p className="ui-loading" role="status">Preparando acceso…</p></main>}>
      <LoginForm />
    </Suspense>
  )
}
