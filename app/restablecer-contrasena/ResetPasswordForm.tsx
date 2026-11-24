'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { passwordRecoveryValidation } from '@/lib/password-recovery'

export function ResetPasswordForm({ email }: { email: string }) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const busy = useRef(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy.current || completed) return
    const invalid = passwordRecoveryValidation(password, confirmation)
    if (invalid) { setMessage(invalid); return }
    busy.current = true
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/auth/restablecer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmation }), cache: 'no-store',
      })
      const result = await response.json()
      if (!response.ok || result.ok !== true) {
        setMessage(typeof result.error === 'string' ? result.error : 'No fue posible actualizar la contraseña.')
        return
      }
      setPassword(''); setConfirmation(''); setCompleted(true)
      if (result.signedOut) window.location.replace('/login?password=updated')
      else setMessage('Tu contraseña fue actualizada, pero no pudimos cerrar todas las sesiones. Cierra sesión manualmente y vuelve a entrar con la nueva contraseña.')
    } catch {
      setMessage('No se pudo confirmar el resultado. Si perdiste la conexión, prueba iniciar sesión con la nueva contraseña antes de solicitar otro enlace.')
    } finally { busy.current = false; setLoading(false) }
  }

  return (
    <>
      <p className="auth-reset-identity">
        Contraseña nueva para <strong>{email}</strong>. Si no es tu cuenta, no continúes.
      </p>
      {!completed && (
        <form onSubmit={submit} className="auth-split__form" aria-busy={loading}>
          <div className="auth-field">
            <label htmlFor="new-password">Nueva contraseña</label>
            <div className="auth-password">
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={event => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="auth-password__toggle"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword(value => !value)}
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

          <div className="auth-field">
            <label htmlFor="confirm-password">Confirma la nueva contraseña</label>
            <div className="auth-password">
              <input
                id="confirm-password"
                type={showConfirmation ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                placeholder="Repite tu nueva contraseña"
                value={confirmation}
                onChange={event => setConfirmation(event.target.value)}
              />
              <button
                type="button"
                className="auth-password__toggle"
                aria-label={showConfirmation ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                aria-pressed={showConfirmation}
                onClick={() => setShowConfirmation(value => !value)}
              >
                {showConfirmation ? (
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
            {loading ? 'GUARDANDO…' : 'GUARDAR NUEVA CONTRASEÑA →'}
          </button>
        </form>
      )}
      {message && <p className="notice" role="alert">{message}</p>}
      <div className="auth-split__footer auth-split__footer--links">
        <Link href="/recuperar-contrasena" prefetch={false}>Solicitar otro enlace</Link>
        <Link href="/login" prefetch={false}>← Volver a iniciar sesión</Link>
      </div>
    </>
  )
}
