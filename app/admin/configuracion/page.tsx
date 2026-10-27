import { Header } from '@/components/Header'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { PlatformSettingsForm } from '@/components/PlatformSettingsForm'

export default async function AdminConfigurationPage() {
  const supabase = await createServerSupabaseClient()

  if (!supabase) {
    return <p>Error: Supabase no está configurado.</p>
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=%2Fadmin%2Fconfiguracion')
  }

  const { data: adminProfile, error: adminError } = await supabase
    .from('profiles')
    .select('role, account_status')
    .eq('id', user.id)
    .single()

  if (adminError || adminProfile?.role !== 'admin' || adminProfile?.account_status !== 'active') {
    return (
      <main style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Acceso restringido</h1>
        <p>No tienes permisos para acceder a la configuración.</p>
      </main>
    )
  }

  const { data: settings, error: settingsError } = await supabase
    .from('platform_settings')
    .select('support_email, updated_at')
    .eq('id', true)
    .single()

  if (settingsError) {
console.warn('QRIH_APP_ADMIN_CONFIGURACION_PAGE_43_FAILED')

    return (
      <main style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Error cargando configuración</h1>
        <p>{settingsError.message}</p>
      </main>
    )
  }

  return (
    <><Header administration /><main className="admin-page"
      style={{
        padding: '48px 32px',
        maxWidth: '900px',
        margin: '0 auto',
      }}
    >
      <header style={{ marginBottom: '32px' }}>
        <Link
          href="/admin"
          style={{
            display: 'inline-block',
            marginBottom: '14px',
            color: "var(--muted)",
            textDecoration: 'none',
            fontSize: '14px',
          }}
        >
          ← Volver al panel
        </Link>

        <p
          style={{
            margin: '0 0 8px',
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: "var(--muted)",
          }}
        >
          Administración
        </p>

        <h1
          style={{
            margin: 0,
            fontSize: '36px',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
          }}
        >
          Configuración
        </h1>

        <p
          style={{
            margin: '10px 0 0',
            color: "var(--muted)",
            fontSize: '16px',
          }}
        >
          Configura los datos generales que utiliza el portal en sus avisos.
        </p>
      </header>

      <section
        style={{
          padding: 24,
          border: "1px solid var(--line)",
          borderRadius: 14,
          background: "var(--surface-subtle)",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 20,
          }}
        >
          Soporte y contacto
        </h2>

        <p
          style={{
            margin: '8px 0 0',
            color: "var(--muted)",
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          Administra el correo que podrán utilizar los usuarios cuando su
          cuenta esté suspendida.
        </p>

        <PlatformSettingsForm
          initialSupportEmail={settings?.support_email ?? ''}
        />

        {settings?.updated_at && (
          <p
            style={{
              margin: '14px 0 0',
              color: '#9ca3af',
              fontSize: 12,
            }}
          >
            Última actualización:{' '}
            {new Date(settings.updated_at).toLocaleString('es-MX')}
          </p>
        )}
      </section>
    </main></>
  )
}
