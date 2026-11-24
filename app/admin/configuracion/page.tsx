import { Header } from '@/components/Header'
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
    <><Header administration /><main className="admin-page admin-shell">
      <header className="admin-header">
        <div>
          <h1>Configuración</h1>
          <p>Configura los datos generales que utiliza el portal en sus avisos.</p>
        </div>
      </header>

      <section className="ui-panel admin-config-card">
        <h2>Soporte y contacto</h2>
        <p className="admin-config-card__lead">
          Administra el correo que podrán utilizar los usuarios cuando su cuenta esté suspendida.
        </p>

        <PlatformSettingsForm
          initialSupportEmail={settings?.support_email ?? ''}
        />

        {settings?.updated_at && (
          <p className="admin-config-card__meta">
            Última actualización:{' '}
            {new Date(settings.updated_at).toLocaleString('es-MX')}
          </p>
        )}
      </section>
    </main></>
  )
}
