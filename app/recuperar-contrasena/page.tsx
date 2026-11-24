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

  return (
    <>
      <Header />

      <main className="form auth-access auth-access--split">
        <div className="auth-split">
          <aside className="auth-split__brand" aria-label="Información de seguridad">
            <div className="auth-split__brand-top">
              <span className="auth-split__monogram" aria-hidden="true">Q</span>
              <span className="auth-split__brand-name">QRO INDUSTRIAL HUB</span>
            </div>

            <div className="auth-split__brand-copy">
              <h2>Recupera el acceso a tu cuenta.</h2>
              <p>
                Por seguridad, el enlace de restablecimiento es temporal y solo se completa desde este mismo navegador.
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
                <span>Enlace de un solo uso con vigencia limitada</span>
              </li>
              <li>
                <span className="auth-split__point-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M3 12h18" />
                    <path d="M12 3a14 14 0 0 1 0 18" />
                    <path d="M12 3a14 14 0 0 0 0 18" />
                  </svg>
                </span>
                <span>Ábrelo en el mismo navegador donde lo solicitas</span>
              </li>
              <li>
                <span className="auth-split__point-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                </span>
                <span>Si no llega en un minuto, revisa Spam o Correo no deseado</span>
              </li>
            </ul>
          </aside>

          <section className="auth-access__card auth-split__panel" aria-label="Recuperar contraseña">
            <div className="auth-split__header">
              <h1>Recuperar contraseña</h1>
              <p>
                Solicita un enlace nuevo desde aquí y ábrelo en este mismo navegador. Los enlaces enviados anteriormente desde el panel no completan este flujo.
              </p>
            </div>

            {params.get('error') === 'link' && (
              <p className="auth-message" role="alert">
                El enlace no es válido, venció o pertenece a otra sesión. Solicita uno nuevo.
              </p>
            )}

            <form onSubmit={submit} className="auth-split__form" aria-busy={loading}>
              <div className="auth-field">
                <label htmlFor="recovery-email">Correo electrónico</label>
                <input
                  id="recovery-email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  placeholder="nombre@empresa.com"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                />
              </div>

              <button disabled={loading || cooldown > 0} className="auth-split__submit">
                {loading ? 'ENVIANDO…' : cooldown > 0 ? `ESPERA ${cooldown} S` : 'ENVIAR ENLACE DE RECUPERACIÓN →'}
              </button>

              {message && <p className="notice" role="status">{message}</p>}
            </form>

            <p className="auth-split__footer">
              <Link href="/login" prefetch={false}>← Volver a iniciar sesión</Link>
            </p>
          </section>
        </div>
      </main>
    </>
  )
}

export default function RecoveryPage() {
  return (
    <Suspense fallback={<main className="form auth-access auth-access--split"><p className="ui-loading" role="status">Preparando recuperación…</p></main>}>
      <RecoveryForm />
    </Suspense>
  )
}
