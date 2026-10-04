'use client'

import { createClient } from '@/lib/supabase'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { safeInternalPath } from '@/lib/safe-navigation'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = safeInternalPath(searchParams.get('next'))

  async function signIn(e: React.FormEvent) {
    e.preventDefault()

    const supabase = createClient()

    if (!supabase) {
      return setMessage(
        'Agrega tus credenciales de Supabase en .env.local para activar el acceso.'
      )
    }

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    if (error) return setMessage(error.message)

    if (!data.user) {
      return setMessage(
        'No fue posible iniciar sesión.'
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    router.replace(
      profile?.role === 'admin'
        ? '/admin'
        : next
    )
  }

  return (
    <>
      <Header />

      <main className="form">
        <small>ACCESO PARA PUBLICAR</small>

        <h1>Inicia sesión</h1>

        <form onSubmit={signIn}>
          <input
            type="email"
            required
            placeholder="Correo electrónico"
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

          <input
            type="password"
            required
            placeholder="Contraseña"
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />

          <button>
            INICIAR SESIÓN →
          </button>

          {message && (
            <p className="notice">
              {message}
            </p>
          )}
        </form>

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
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
