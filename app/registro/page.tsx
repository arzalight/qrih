'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { createClient } from '@/lib/supabase'
import { pendingConfirmationLoginPath, safeInternalPath } from '@/lib/safe-navigation'
import { ensureOwnProfile } from '@/lib/auth-profile'

export default function RegistroPage() {
  const router = useRouter()
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const next = safeInternalPath(searchParams.get('next'))
  const supabase = createClient()

  const [form, setForm] = useState({
    name: '',
    phone: '',
    company: '',
    userType: 'advisor',
    email: '',
    password: '',
  })

  const [confirming, setConfirming] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  const didMount = useRef(false)
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true
      return
    }
    heading.current?.focus()
  }, [confirming])

  function update(
    field: keyof typeof form,
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  function handleContinue(e: FormEvent) {
    e.preventDefault()
    setMsg('')

    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.email.trim() ||
      !form.password
    ) {
      setMsg('Completa los campos obligatorios.')
      return
    }

    if (!/^\d{10}$/.test(form.phone.trim())) {
      setMsg('El teléfono debe tener 10 dígitos.')
      return
    }

    if (form.password.length < 6) {
      setMsg('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setConfirming(true)
  }

  async function handleCreate() {
    if (loading) return
    setLoading(true)
    setMsg('')

    if (!supabase) {
      setMsg('No se pudo conectar con el servicio. Intenta nuevamente.')
      setLoading(false)
      return
    }

    try {
      const emailRedirectTo = `${window.location.origin}/auth/callback${['/publicar', '/busco-bodega'].includes(next) ? `?next=${encodeURIComponent(next)}` : ''}`

      const result = await Promise.race([
        supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            emailRedirectTo,
            data: {
              full_name: form.name.trim(),
              phone: form.phone.trim(),
              company_name: form.company.trim() || null,
              user_type: form.userType,
            },
          },
        }),
        new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  'La conexión con el servicio tardó demasiado.'
                )
              ),
            15000
          )
        ),
      ])

      const { data, error } = result as Awaited<
        ReturnType<typeof supabase.auth.signUp>
      >

      if (error) {
        setMsg(error.message)
        setLoading(false)
        return
      }

      if (data.session && data.user) {
        const profileResult = await ensureOwnProfile(supabase)
        if (!profileResult.ok) {
          setMsg(
            'La cuenta fue creada, pero no se pudo crear el perfil. Vuelve a iniciar sesión para reintentarlo.'
          )
          setLoading(false)
          return
        }

        router.replace(next)
        return
      }

      router.replace(pendingConfirmationLoginPath(next))
    } catch (error) {
      setMsg(
        error instanceof Error
          ? error.message
          : 'No se pudo crear la cuenta. Intenta nuevamente.'
      )
    }

    setLoading(false)
  }

  const brandPanel = (
    <aside className="auth-split__brand" aria-label="Ventajas de crear tu cuenta en QRIH">
      <div className="auth-split__brand-top">
        <span className="auth-split__monogram" aria-hidden="true">Q</span>
        <span className="auth-split__brand-name">QRO INDUSTRIAL HUB</span>
      </div>

      <div className="auth-split__brand-copy">
        <h2>Únete a la red industrial de Querétaro.</h2>
        <p>
          Crea tu cuenta en menos de un minuto para publicar naves, responder solicitudes y colaborar con asesores.
        </p>
      </div>

      <ul className="auth-split__points">
        <li>
          <span className="auth-split__point-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <span>Publicación verificada en el inventario industrial</span>
        </li>
        <li>
          <span className="auth-split__point-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
          </span>
          <span>Seguimiento centralizado de solicitudes y prospectos</span>
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
          <span>Cuenta diseñada para asesores y propietarios</span>
        </li>
      </ul>
    </aside>
  )

  if (confirming) {
    return (
      <>
        <Header />

        <main className="form auth-access auth-access--split auth-access--register">
          <div className="auth-split">
            {brandPanel}

            <section className="auth-access__card auth-split__panel" aria-label="Confirmación de registro">
              <div className="auth-split__header">
                <span className="auth-step-pill">Paso 2 de 2</span>
                <h1 ref={heading} tabIndex={-1}>
                  ¿Tus datos son correctos?
                </h1>
                <p>Revisa tu información antes de crear tu cuenta.</p>
              </div>

              <dl className="auth-summary">
                <div>
                  <dt>Nombre</dt>
                  <dd>{form.name}</dd>
                </div>

                <div>
                  <dt>Teléfono</dt>
                  <dd>{form.phone}</dd>
                </div>

                <div>
                  <dt>Empresa</dt>
                  <dd>{form.company || 'No indicada'}</dd>
                </div>

                <div>
                  <dt>Tipo de usuario</dt>
                  <dd>
                    {form.userType === 'advisor'
                      ? 'Asesor inmobiliario'
                      : 'Propietario de inmuebles'}
                  </dd>
                </div>

                <div className="auth-summary__full">
                  <dt>Correo electrónico</dt>
                  <dd>{form.email}</dd>
                </div>
              </dl>

              {msg && (
                <p className="auth-message" role="alert">
                  {msg}
                </p>
              )}

              <div className="auth-split__actions">
                <button
                  type="button"
                  onClick={() => {
                    setConfirming(false)
                    setMsg('')
                  }}
                  disabled={loading}
                  className="button--secondary"
                >
                  Editar datos
                </button>

                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={loading}
                >
                  {loading ? 'Creando cuenta…' : 'Crear cuenta →'}
                </button>
              </div>
            </section>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />

      <main className="form auth-access auth-access--split auth-access--register">
        <div className="auth-split">
          {brandPanel}

          <section className="auth-access__card auth-split__panel" aria-label="Registro de cuenta">
            <div className="auth-split__header">
              <span className="auth-step-pill">Paso 1 de 2</span>
              <h1 ref={heading} tabIndex={-1}>
                Crear cuenta
              </h1>
              <p>Crea tu cuenta para publicar y contactar propiedades.</p>
            </div>

            <form
              onSubmit={handleContinue}
              className="auth-split__form"
            >
              <div className="auth-field">
                <label htmlFor="registration-name">
                  Nombre completo *
                </label>
                <input
                  id="registration-name"
                  autoComplete="name"
                  placeholder="Nombre y apellido"
                  value={form.name}
                  onChange={(e) =>
                    update('name', e.target.value)
                  }
                />
              </div>

              <div className="auth-field-grid">
                <div className="auth-field">
                  <label htmlFor="registration-phone">
                    Teléfono *
                  </label>
                  <input
                    id="registration-phone"
                    autoComplete="tel"
                    placeholder="10 dígitos"
                    value={form.phone}
                    onChange={(e) =>
                      update(
                        'phone',
                        e.target.value.replace(/\D/g, '').slice(0, 10)
                      )
                    }
                    inputMode="numeric"
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="registration-userType">
                    Soy *
                  </label>
                  <select
                    id="registration-userType"
                    value={form.userType}
                    onChange={(e) =>
                      update('userType', e.target.value)
                    }
                  >
                    <option value="advisor">
                      Asesor inmobiliario
                    </option>
                    <option value="owner">
                      Propietario de inmuebles
                    </option>
                  </select>
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="registration-company">
                  Empresa
                </label>
                <input
                  id="registration-company"
                  autoComplete="organization"
                  placeholder="Inmobiliaria o empresa (opcional)"
                  value={form.company}
                  onChange={(e) =>
                    update('company', e.target.value)
                  }
                />
              </div>

              <div className="auth-field">
                <label htmlFor="registration-email">
                  Correo electrónico *
                </label>
                <input
                  id="registration-email"
                  autoComplete="email"
                  type="email"
                  placeholder="nombre@empresa.com"
                  value={form.email}
                  onChange={(e) =>
                    update('email', e.target.value)
                  }
                />
              </div>

              <div className="auth-field">
                <label htmlFor="registration-password">
                  Contraseña *
                </label>
                <div className="auth-password">
                  <input
                    id="registration-password"
                    autoComplete="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={form.password}
                    onChange={(e) =>
                      update('password', e.target.value)
                    }
                  />
                  <button
                    type="button"
                    className="auth-password__toggle"
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

              {msg && (
                <p className="auth-message" role="alert">
                  {msg}
                </p>
              )}

              <button
                type="submit"
                className="auth-split__submit"
              >
                CONTINUAR →
              </button>
            </form>

            <p className="auth-split__footer">
              ¿Ya tienes cuenta?{' '}
              <Link href={`/login?next=${encodeURIComponent(next)}`}>
                Inicia sesión →
              </Link>
            </p>
          </section>
        </div>
      </main>
    </>
  )
}
