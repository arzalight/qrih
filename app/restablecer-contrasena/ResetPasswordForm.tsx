'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { passwordRecoveryValidation } from '@/lib/password-recovery'

export function ResetPasswordForm({ email }: { email: string }) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
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

  return <>
    <p>Contraseña nueva para <strong>{email}</strong>. Si no es tu cuenta, no continúes.</p>
    {!completed && <form onSubmit={submit}>
      <label htmlFor="new-password">Nueva contraseña</label>
      <input id="new-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128}
        value={password} onChange={event => setPassword(event.target.value)} />
      <label htmlFor="confirm-password">Confirma la nueva contraseña</label>
      <input id="confirm-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128}
        value={confirmation} onChange={event => setConfirmation(event.target.value)} />
      <button disabled={loading}>{loading ? 'GUARDANDO…' : 'GUARDAR NUEVA CONTRASEÑA →'}</button>
    </form>}
    {message && <p className="notice" role="alert">{message}</p>}
    <p><Link href="/recuperar-contrasena" prefetch={false}>Solicitar otro enlace</Link></p>
    <p><Link href="/login" prefetch={false}>Volver a iniciar sesión</Link></p>
  </>
}
