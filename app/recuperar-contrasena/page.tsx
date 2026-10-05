'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { createClient } from '@/lib/supabase'
import { requestPasswordRecovery } from '@/lib/password-recovery'

function RecoveryForm() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const busy = useRef(false)
  const params = useSearchParams()
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown(value => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy.current || cooldown > 0) return
    busy.current = true
    setLoading(true)
    setMessage('')
    try {
      const supabase = createClient()
      if (!supabase) { setMessage('El servicio de acceso no está disponible.'); return }
      setCooldown(60)
      setMessage(await requestPasswordRecovery(supabase, email, window.location.origin))
    } finally {
      busy.current = false
      setLoading(false)
    }
  }

  return <>
    <Header />
    <main className="form">
      <h1>Recuperar contraseña</h1>
      <p>Solicita un enlace nuevo desde aquí y ábrelo en este mismo navegador. Los enlaces enviados anteriormente desde el panel no completan este flujo.</p>
      {params.get('error') === 'link' && <p className="notice" role="alert">El enlace no es válido, venció o pertenece a otra sesión. Solicita uno nuevo.</p>}
      <form onSubmit={submit}>
        <label htmlFor="recovery-email">Correo electrónico</label>
        <input id="recovery-email" type="email" autoComplete="email" required maxLength={254}
          value={email} onChange={event => setEmail(event.target.value)} />
        <button disabled={loading || cooldown > 0}>{loading ? 'ENVIANDO…' : cooldown > 0 ? `ESPERA ${cooldown} S` : 'ENVIAR ENLACE DE RECUPERACIÓN →'}</button>
        {message && <p className="notice" role="status">{message}</p>}
      </form>
      <p><Link href="/login" prefetch={false}>Volver a iniciar sesión</Link></p>
    </main>
  </>
}

export default function RecoveryPage() {
  return <Suspense fallback={<p>Preparando recuperación…</p>}><RecoveryForm /></Suspense>
}
