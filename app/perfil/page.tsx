import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Header } from '@/components/Header'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ProfileSocialForm } from '@/components/ProfileSocialForm'
import { ProfileAvatarForm } from '@/components/ProfileAvatarForm'
import { ProfileInfoForm } from '@/components/ProfileInfoForm'

export default async function PerfilPage() {
  const supabase = await createServerSupabaseClient()

  if (!supabase) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Mi perfil</h1>
        <p>Supabase no está configurado correctamente.</p>
      </main>
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=%2Fperfil')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('public_id, full_name, phone, company_name, website, role, account_status, plan, avatar_url, whatsapp, instagram_url, facebook_url, linkedin_url, identity_change_locked_until')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    console.warn('QRIH_APP_PERFIL_PAGE_41_FAILED')
    return <><Header /><main style={{ padding: 40 }}><h1>Mi perfil</h1>
      <p role="alert">No fue posible cargar tu perfil. Inicia sesión de nuevo para recuperarlo.</p>
      <Link href="/login?error=profile">Iniciar sesión</Link></main></>
  }

  return (
    <>
      <Header />

      <main className="workspace-page profile-page">
        <div className="profile-header">
          <div>
            <h1>Mi perfil</h1>
            <p>
              Administra tu información y la forma en que aparecerá ante tus
              clientes.
            </p>
          </div>
          {profile.role === 'admin' && profile.account_status === 'active' && (
            <Link href="/admin" className="button">Administración</Link>
          )}
        </div>

        <section className="ui-panel profile-card">
          <h2>Mis propietarios</h2>
          <p>Administra tu directorio privado y las propiedades asociadas. Estos datos nunca se muestran en fichas comerciales.</p>
          <Link className="button button--secondary" href="/perfil/propietarios">Abrir Mis propietarios</Link>
        </section>

        <section className="ui-panel profile-card">
          <h2>Foto de perfil</h2>
          <p>Esta foto aparecerá en tu catálogo público.</p>

          <ProfileAvatarForm
            profileId={user.id}
            avatarUrl={profile?.avatar_url ?? null}
          />
        </section>

        <section className="ui-panel profile-card">
          <h2>Información personal y profesional</h2>
          <p>Estos datos aparecerán en tu perfil y catálogo público.</p>

          <ProfileInfoForm
            profileId={user.id}
            email={user.email ?? ''}
            fullName={profile?.full_name ?? ''}
            phone={profile?.phone ?? null}
            companyName={profile?.company_name ?? null}
            website={profile?.website ?? null}
            identityChangeLockedUntil={
              profile?.identity_change_locked_until ?? null
            }
          />

          <div className="profile-card__meta">
            Tipo de cuenta:{' '}
            <strong>
              {profile?.role === 'publisher'
                ? 'Asesor / publicador'
                : profile?.role || 'Sin definir'}
            </strong>
          </div>
        </section>

        <section className="ui-panel profile-card">
          <h2>Redes y contacto</h2>
          <p>
            Estos datos podrán aparecer en tu catálogo público para que tus
            clientes puedan contactarte.
          </p>

          <ProfileSocialForm
            profileId={user.id}
            whatsapp={profile?.whatsapp ?? null}
            instagramUrl={profile?.instagram_url ?? null}
            facebookUrl={profile?.facebook_url ?? null}
            linkedinUrl={profile?.linkedin_url ?? null}
          />
        </section>

        <section className="ui-panel profile-card">
          <h2>Mi catálogo</h2>
          <p>
            Aquí podrás administrar la información que utilizaremos para crear
            tu catálogo profesional y compartirlo con tus clientes.
          </p>

          <Link
            href={profile?.public_id ? `/asesor/${profile.public_id}` : '/mis-propiedades'}
            className="button"
          >
            Ver mi catálogo →
          </Link>
        </section>

        <section className="ui-panel profile-card">
          <h2>Seguridad</h2>
          <p>
            La administración de contraseña y otras opciones de seguridad se
            agregarán aquí.
          </p>
        </section>
      </main>
    </>
  )
}
