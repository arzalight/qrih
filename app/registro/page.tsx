'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [confirming])

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

  if (confirming) {
    return (
      <main className="registration-page">
        <div className="registration-shell">
          <div>
            <Link
              href={`/login?next=${encodeURIComponent(next)}`}
              className="registration-back"
            >
              QRO INDUSTRIAL HUB
            </Link>
          </div>

          <div className="registration-card">
            <h1 ref={heading} tabIndex={-1}>
              ¿Tus datos son correctos?
            </h1>

            <p>
              Revisa la información antes de crear tu cuenta.
            </p>

            <dl className="registration-summary">
              <div>
                <dt>
                  Nombre
                </dt>
                <dd>
                  {form.name}
                </dd>
              </div>

              <div>
                <dt>
                  Teléfono
                </dt>
                <dd>
                  {form.phone}
                </dd>
              </div>

              <div>
                <dt>
                  Empresa
                </dt>
                <dd>
                  {form.company || 'No indicada'}
                </dd>
              </div>

              <div>
                <dt>
                  Tipo de usuario
                </dt>
                <dd>
                  {form.userType === 'advisor'
                    ? 'Asesor inmobiliario'
                    : 'Propietario de inmuebles'}
                </dd>
              </div>

              <div>
                <dt>
                  Correo
                </dt>
                <dd>
                  {form.email}
                </dd>
              </div>
            </dl>

            {msg && (
              <p className="auth-message" role="alert">
                {msg}
              </p>
            )}

            <div className="registration-actions">
              <button
                type="button"
                onClick={() => {
                  setConfirming(false)
                  setMsg('')
                }}
                disabled={loading}
                className="registration-secondary"
              >
                Editar datos
              </button>

              <button
                type="button"
                onClick={handleCreate}
                disabled={loading}
                className="registration-primary"
              >
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="registration-page">
      <div className="registration-shell">
        <div>
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="registration-back"
          >
            QRO INDUSTRIAL HUB
          </Link>
        </div>

        <div className="registration-card">
          <h1 ref={heading} tabIndex={-1}>
            Crear cuenta
          </h1>

          <p>
            Crea tu cuenta para publicar y contactar propiedades.
          </p>

          <form
            onSubmit={handleContinue}
            className="registration-form"
          >
            <div className="registration-field">
              <label htmlFor="registration-name">
                Nombre completo *
              </label>
              <input id="registration-name" autoComplete="name"
                value={form.name}
                onChange={(e) =>
                  update('name', e.target.value)
                }
              />
            </div>

            <div className="registration-field">
              <label htmlFor="registration-phone">
                Teléfono *
              </label>
              <input id="registration-phone" autoComplete="tel"
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

            <div className="registration-field">
              <label htmlFor="registration-company">
                Empresa
              </label>
              <input id="registration-company" autoComplete="organization"
                value={form.company}
                onChange={(e) =>
                  update('company', e.target.value)
                }
              />
            </div>

            <div className="registration-field">
              <label htmlFor="registration-userType">
                Soy *
              </label>
              <select id="registration-userType"
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

            <div className="registration-field">
              <label htmlFor="registration-email">
                Correo electrónico *
              </label>
              <input id="registration-email" autoComplete="email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  update('email', e.target.value)
                }
              />
            </div>

            <div className="registration-field">
              <label htmlFor="registration-password">
                Contraseña *
              </label>
              <input id="registration-password" autoComplete="new-password"
                type="password"
                value={form.password}
                onChange={(e) =>
                  update('password', e.target.value)
                }
              />
            </div>

            {msg && (
              <p className="auth-message" role="alert">
                {msg}
              </p>
            )}

            <button
              type="submit"
              className="registration-primary"
            >
              Continuar
            </button>
          </form>

          <p style={{ margin: '24px 0 0', textAlign: 'center', color: 'var(--muted)' }}>
            ¿Ya tienes cuenta?{' '}
            <Link
              href={`/login?next=${encodeURIComponent(next)}`}
              style={{ fontWeight: 700, textDecoration: 'underline' }}
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
