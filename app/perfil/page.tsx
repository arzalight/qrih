import Link from 'next/link'
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
    return (
      <main style={{ padding: 40 }}>
        <h1>Mi perfil</h1>
        <p>Necesitas iniciar sesión para ver tu perfil.</p>
        <Link href="/login">Iniciar sesión</Link>
      </main>
    )
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

      <main
        className="workspace-page profile-page"
        style={{
          maxWidth: 1000,
          margin: '0 auto',
          padding: '40px 20px 80px',
        }}
      >
        <div style={{ marginBottom: 32 }}>
          <small
            style={{
              color: "var(--muted)",
              fontWeight: 600,
              letterSpacing: 1,
            }}
          >
            MI CUENTA
          </small>

          <h1
            style={{
              margin: '8px 0 8px',
              fontSize: 32,
              color: "var(--ink)",
            }}
          >
            Mi perfil
          </h1>
          {profile.role === 'admin' && profile.account_status === 'active' && (
            <Link href="/admin" className="button">Administración</Link>
          )}

          <p
            style={{
              margin: 0,
              color: "var(--muted)",
            }}
          >
            Administra tu información y la forma en que aparecerá ante tus
            clientes.
          </p>
        </div>

        <section
          style={{
            marginBottom: 20,
            padding: 24,
            border: "1px solid var(--line)",
            borderRadius: 14,
            background: "var(--surface)",
          }}
        >
          <h2
            style={{
              margin: '0 0 8px',
              fontSize: 20,
              color: "var(--ink)",
            }}
          >
            Foto de perfil
          </h2>

          <p
            style={{
              margin: '0 0 20px',
              color: "var(--muted)",
            }}
          >
            Esta foto aparecerá en tu catálogo público.
          </p>

          <ProfileAvatarForm
            profileId={user.id}
            avatarUrl={profile?.avatar_url ?? null}
          />
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: 20,
          }}
        >
          <section
            style={{
              gridColumn: '1 / -1',
              padding: 24,
              border: "1px solid var(--line)",
              borderRadius: 14,
              background: "var(--surface)",
            }}
          >
            <h2
              style={{
                margin: '0 0 8px',
                fontSize: 20,
                color: "var(--ink)",
              }}
            >
              Información personal y profesional
            </h2>

            <p
              style={{
                margin: '0 0 20px',
                color: "var(--muted)",
              }}
            >
              Estos datos aparecerán en tu perfil y catálogo público.
            </p>

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

            <div
              style={{
                marginTop: 20,
                paddingTop: 16,
                borderTop: "1px solid var(--line)",
                color: "var(--muted)",
                fontSize: 13,
              }}
            >
              Tipo de cuenta:{' '}
              <strong style={{ color: "var(--ink)" }}>
                {profile?.role === 'publisher'
                  ? 'Asesor / publicador'
                  : profile?.role || 'Sin definir'}
              </strong>
            </div>
          </section>
        </section>

        <section
          style={{
            marginTop: 20,
            padding: 24,
            border: "1px solid var(--line)",
            borderRadius: 14,
            background: "var(--surface)",
          }}
        >
          <h2
            style={{
              margin: '0 0 8px',
              fontSize: 20,
              color: "var(--ink)",
            }}
          >
            Redes y contacto
          </h2>

          <p
            style={{
              margin: '0 0 20px',
              color: "var(--muted)",
            }}
          >
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

        <section
          style={{
            marginTop: 20,
            padding: 24,
            border: "1px solid var(--line)",
            borderRadius: 14,
            background: "var(--surface)",
          }}
        >
          <h2
            style={{
              margin: '0 0 8px',
              fontSize: 20,
              color: "var(--ink)",
            }}
          >
            Mi catálogo
          </h2>

          <p
            style={{
              margin: '0 0 18px',
              color: "var(--muted)",
            }}
          >
            Aquí podrás administrar la información que utilizaremos para crear
            tu catálogo profesional y compartirlo con tus clientes.
          </p>

          <Link
            href={profile?.public_id ? `/asesor/${profile.public_id}` : "/mis-propiedades"}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '10px 16px',
              borderRadius: 9,
              background: "var(--ink)",
              color: "var(--surface)",
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Ver mi catálogo
          </Link>
        </section>

        <section
          style={{
            marginTop: 20,
            padding: 24,
            border: "1px solid var(--line)",
            borderRadius: 14,
            background: "var(--surface)",
          }}
        >
          <h2
            style={{
              margin: '0 0 8px',
              fontSize: 20,
              color: "var(--ink)",
            }}
          >
            Seguridad
          </h2>

          <p
            style={{
              margin: 0,
              color: "var(--muted)",
            }}
          >
            La administración de contraseña y otras opciones de seguridad se
            agregarán aquí.
          </p>
        </section>
      </main>
    </>
  )
}
