'use client'

import { createClient } from '@/lib/supabase'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { safeInternalPath } from '@/lib/safe-navigation'
import { ensureOwnProfile } from '@/lib/auth-profile'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
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
    if (loading) return
    setLoading(true)
    setMessage('')
    try {
      const supabase = createClient()
      if (!supabase) {
        return setMessage('El servicio de acceso no está disponible.')
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return setMessage(error.message)
      if (!data.user) return setMessage('No fue posible iniciar sesión.')

      const result = await ensureOwnProfile(supabase)
      if (!result.ok) {
        return setMessage('Tu sesión está iniciada, pero no se pudo preparar tu perfil. No puedes publicar todavía. Intenta iniciar sesión de nuevo o contacta a soporte.')
      }
      router.replace(
        result.profile.role === 'admin' && result.profile.account_status === 'active'
          ? '/admin'
          : next
      )
      router.refresh()
    } catch {
      setMessage('No fue posible completar el acceso. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />

      <main className="form">
        <small>ACCESO A TU PANEL</small>

        <h1>Inicia sesión</h1>

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

        <form onSubmit={signIn}>
          <label htmlFor="login-email">Correo electrónico</label>
          <input id="login-email" autoComplete="email"
            type="email"
            required
            placeholder="Correo electrónico"
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

          <label htmlFor="login-password">Contraseña</label>
          <input id="login-password" autoComplete="current-password"
            type="password"
            required
            placeholder="Contraseña"
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />

          <button disabled={loading}>
            {loading ? 'INICIANDO SESIÓN…' : 'INICIAR SESIÓN →'}
          </button>

          {(message || callbackMessage) && (
            <p className="notice" role="status" aria-live="polite">
              {message || callbackMessage}
            </p>
          )}
        </form>

        <p><Link href="/recuperar-contrasena" prefetch={false}>Olvidé mi contraseña</Link></p>

        <p
          style={{
            marginTop: 24,
            textAlign: 'center',
          }}
        >
          ¿No tienes cuenta?{' '}
          <Link
            href={`/registro?next=${encodeURIComponent(next)}`}
            style={{
              textDecoration: 'underline',
              fontWeight: 600,
            }}
          >
            Regístrate
          </Link>
        </p>
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
