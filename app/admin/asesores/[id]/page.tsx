import Link from 'next/link'
import { propertyPrice } from '@/lib/property-price'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { VerifiedBadge } from '@/components/VerifiedBadge'

type Props = {
  params: Promise<{ id: string }>
}

async function toggleAdvisorVerification(formData: FormData) {
  'use server'

  const advisorId = String(formData.get('advisor_id') || '')
  const nextVerified = String(formData.get('next_verified') || '') === 'true'

  if (!advisorId) {
    throw new Error('Falta el asesor.')
  }

  const supabase = await createServerSupabaseClient()

  if (!supabase) {
    throw new Error('Supabase no está configurado.')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: adminProfile, error: adminError } = await supabase
    .from('profiles')
    .select('role, account_status')
    .eq('id', user.id)
    .single()

  if (adminError || adminProfile?.role !== 'admin' || adminProfile?.account_status !== 'active') {
    throw new Error('No tienes permisos para modificar la verificación.')
  }

  const { data: updatedProfile, error: updateError } = await supabase.rpc(
    'admin_set_profile_verified',
    {
      target_profile_id: advisorId,
      verified: nextVerified,
    }
  )

  if (updateError) {
    throw new Error(updateError.message)
  }

  const { error: auditError } = await supabase.from('audit_logs').insert({
    actor_id: user.id,
    entity_type: 'profile',
    entity_id: advisorId,
    action: nextVerified ? 'profile_verified' : 'profile_unverified',
    metadata: {
      verified: nextVerified,
    },
  })

  if (auditError) {
console.warn('QRIH_APP_ADMIN_ASESORES_ID_PAGE_68_FAILED')
  }

  revalidatePath('/admin/asesores')
  revalidatePath(`/admin/asesores/${advisorId}`)

  if (!updatedProfile) {
    throw new Error('No se pudo actualizar la verificación.')
  }

  redirect(`/admin/asesores/${advisorId}`)
}



async function toggleAdvisorAccountStatus(formData: FormData) {
  'use server'

  const advisorId = String(formData.get('advisor_id') || '')
  const nextStatus = String(formData.get('next_status') || '')
  const reason = String(formData.get('reason') || '').trim()

  if (!advisorId) {
    throw new Error('Falta el asesor.')
  }

  if (nextStatus !== 'active' && nextStatus !== 'suspended') {
    throw new Error('Estado de cuenta no válido.')
  }

  if (nextStatus === 'suspended' && !reason) {
    throw new Error('Debes indicar un motivo para suspender la cuenta.')
  }

  const supabase = await createServerSupabaseClient()

  if (!supabase) {
    throw new Error('Supabase no está configurado.')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: adminProfile, error: adminError } = await supabase
    .from('profiles')
    .select('role, account_status')
    .eq('id', user.id)
    .single()

  if (adminError || adminProfile?.role !== 'admin' || adminProfile?.account_status !== 'active') {
    throw new Error('No tienes permisos para cambiar el estado de la cuenta.')
  }

  const { data: updatedProfile, error: updateError } = await supabase.rpc(
    'admin_set_profile_account_status',
    {
      target_profile_id: advisorId,
      next_status: nextStatus,
      reason: nextStatus === 'suspended' ? reason : null,
    }
  )

  if (updateError) {
    throw new Error(updateError.message)
  }

  const { error: auditError } = await supabase.from('audit_logs').insert({
    actor_id: user.id,
    entity_type: 'profile',
    entity_id: advisorId,
    action:
      nextStatus === 'suspended'
        ? 'profile_suspended'
        : 'profile_reactivated',
    metadata: {
      account_status: nextStatus,
      reason: nextStatus === 'suspended' ? reason : null,
    },
  })

  if (auditError) {
console.warn('QRIH_APP_ADMIN_ASESORES_ID_PAGE_154_FAILED')
  }

  revalidatePath('/admin/asesores')
  revalidatePath(`/admin/asesores/${advisorId}`)

  if (!updatedProfile) {
    throw new Error('No se pudo actualizar el estado de la cuenta.')
  }

  redirect(`/admin/asesores/${advisorId}`)
}

export default async function AdminAdvisorDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  if (!supabase) {
    return <p>Error: Supabase no está configurado.</p>
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
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
        <p>No tienes permisos para administrar asesores.</p>
      </main>
    )
  }

  const { data: advisor, error } = await supabase
    .from('profiles')
    .select(
      'id, public_id, full_name, phone, company_name, website, role, plan, trial_ends_at, is_verified, account_status, suspension_reason, suspended_at, suspended_by, avatar_url, whatsapp, instagram_url, facebook_url, linkedin_url, created_at, identity_last_changed_at, identity_change_locked_until'
    )
    .eq('id', id)
    .single()

  if (error || !advisor) {
    notFound()
  }

  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select(
      'id, slug, title, operation, status, zone, price_display, price_value, price_value_text:price_value::text, price_currency, price_unit, created_at, updated_at'
    )
    .eq('owner_id', advisor.id)
    .order('created_at', { ascending: false })

  if (propertiesError) {
console.warn('QRIH_APP_ADMIN_ASESORES_ID_PAGE_219_FAILED')
  }

  const totalProperties = properties?.length ?? 0
  const publishedProperties =
    properties?.filter((property) => property.status === 'published').length ?? 0
  const pendingProperties =
    properties?.filter((property) => property.status === 'pending').length ?? 0

  return (
    <main
      style={{
        padding: '48px 32px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      <header style={{ marginBottom: '32px' }}>
        <Link
          href="/admin/asesores"
          style={{
            display: 'inline-block',
            marginBottom: '18px',
            color: '#666',
            textDecoration: 'none',
            fontSize: '14px',
          }}
        >
          ← Volver a asesores
        </Link>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              width: '76px',
              height: '76px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '1px solid #ddd',
              background: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: '28px',
              fontWeight: 700,
              color: '#666',
            }}
          >
            {advisor.avatar_url ? (
              <img
                src={advisor.avatar_url}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              advisor.full_name.charAt(0).toUpperCase()
            )}
          </div>

          <div>
            <p
              style={{
                margin: '0 0 6px',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#777',
              }}
            >
              Asesor · {advisor.public_id}
            </p>

            <h1
              style={{
                margin: 0,
                fontSize: '36px',
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
              }}
            >
              {advisor.full_name}
              {advisor.is_verified && (
                <span style={{ marginLeft: '8px' }}>
                  <VerifiedBadge />
                </span>
              )}
            </h1>

            <p
              style={{
                margin: '8px 0 0',
                color: '#666',
                fontSize: '16px',
              }}
            >
              {advisor.company_name || 'Sin empresa'}
            </p>

            <form
              action={toggleAdvisorVerification}
              style={{
                marginTop: '14px',
              }}
            >
              <input type="hidden" name="advisor_id" value={advisor.id} />
              <input
                type="hidden"
                name="next_verified"
                value={advisor.is_verified ? 'false' : 'true'}
              />

              <button
                type="submit"
                style={{
                  padding: '9px 14px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  background: '#fff',
                  color: '#222',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                {advisor.is_verified
                  ? 'Quitar verificación'
                  : 'Verificar asesor'}
              </button>
            </form>
          </div>
        </div>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '28px',
        }}
      >
        {[
          ['Propiedades', totalProperties],
          ['Publicadas', publishedProperties],
          ['Pendientes', pendingProperties],
          ['Plan', advisor.plan],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              padding: '18px',
              border: '1px solid #e5e5e5',
              borderRadius: '12px',
              background: '#fafafa',
            }}
          >
            <div
              style={{
                fontSize: '13px',
                color: '#666',
                marginBottom: '6px',
              }}
            >
              {label}
            </div>

            <div
              style={{
                fontSize: '24px',
                fontWeight: 700,
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
          marginBottom: '28px',
        }}
      >
        <div
          style={{
            border: '1px solid #e5e5e5',
            borderRadius: '14px',
            padding: '24px',
            background: '#fff',
          }}
        >
          <h2 style={{ margin: '0 0 18px', fontSize: '20px' }}>
            Información de cuenta
          </h2>

          <dl
            style={{
              margin: 0,
              display: 'grid',
              gridTemplateColumns: '140px 1fr',
              gap: '12px',
              fontSize: '14px',
            }}
          >
            <dt style={{ color: '#777' }}>ID público</dt>
            <dd style={{ margin: 0, fontWeight: 600 }}>{advisor.public_id}</dd>

            <dt style={{ color: '#777' }}>Rol</dt>
            <dd style={{ margin: 0 }}>{advisor.role}</dd>

            <dt style={{ color: '#777' }}>Plan</dt>
            <dd style={{ margin: 0 }}>{advisor.plan}</dd>

            <dt style={{ color: '#777' }}>Verificación</dt>
            <dd style={{ margin: 0 }}>
              {advisor.is_verified ? '✓ Verificado' : 'No verificado'}
            </dd>

            <dt style={{ color: '#777' }}>Estado</dt>
            <dd style={{ margin: 0, fontWeight: 700 }}>
              {advisor.account_status === 'suspended'
                ? '🔴 Suspendido'
                : '🟢 Activo'}
            </dd>

            {advisor.account_status === 'suspended' && (
              <>
                <dt style={{ color: '#777' }}>Motivo</dt>
                <dd style={{ margin: 0 }}>
                  {advisor.suspension_reason || 'Sin motivo registrado'}
                </dd>

                <dt style={{ color: '#777' }}>Suspendido</dt>
                <dd style={{ margin: 0 }}>
                  {advisor.suspended_at
                    ? new Date(advisor.suspended_at).toLocaleDateString(
                        'es-MX'
                      )
                    : '—'}
                </dd>
              </>
            )}

            <dt style={{ color: '#777' }}>Registro</dt>
            <dd style={{ margin: 0 }}>
              {new Date(advisor.created_at).toLocaleDateString('es-MX')}
            </dd>

            <dt style={{ color: '#777' }}>Trial termina</dt>
            <dd style={{ margin: 0 }}>
              {advisor.trial_ends_at
                ? new Date(advisor.trial_ends_at).toLocaleDateString('es-MX')
                : '—'}
            </dd>
          </dl>

          <div
            style={{
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid #eee',
            }}
          >
            {advisor.account_status === 'suspended' ? (
              <form action={toggleAdvisorAccountStatus}>
                <input type="hidden" name="advisor_id" value={advisor.id} />
                <input type="hidden" name="next_status" value="active" />

                <button
                  type="submit"
                  style={{
                    border: 0,
                    borderRadius: '8px',
                    padding: '10px 16px',
                    background: '#027a48',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Reactivar asesor
                </button>
              </form>
            ) : (
              <form action={toggleAdvisorAccountStatus}>
                <input type="hidden" name="advisor_id" value={advisor.id} />
                <input type="hidden" name="next_status" value="suspended" />

                <label
                  htmlFor="suspension-reason"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  Motivo de suspensión
                </label>

                <textarea
                  id="suspension-reason"
                  name="reason"
                  required
                  rows={3}
                  placeholder="Indica por qué se suspende esta cuenta."
                  style={{
                    width: '100%',
                    maxWidth: '620px',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    resize: 'vertical',
                    font: 'inherit',
                    marginBottom: '12px',
                  }}
                />

                <div>
                  <button
                    type="submit"
                    style={{
                      border: 0,
                      borderRadius: '8px',
                      padding: '10px 16px',
                      background: '#b42318',
                      color: '#fff',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Suspender asesor
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div
          style={{
            border: '1px solid #e5e5e5',
            borderRadius: '14px',
            padding: '24px',
            background: '#fff',
          }}
        >
          <h2 style={{ margin: '0 0 18px', fontSize: '20px' }}>
            Contacto y presencia
          </h2>

          <dl
            style={{
              margin: 0,
              display: 'grid',
              gridTemplateColumns: '140px 1fr',
              gap: '12px',
              fontSize: '14px',
            }}
          >
            <dt style={{ color: '#777' }}>Teléfono</dt>
            <dd style={{ margin: 0 }}>{advisor.phone || '—'}</dd>

            <dt style={{ color: '#777' }}>WhatsApp</dt>
            <dd style={{ margin: 0 }}>{advisor.whatsapp || '—'}</dd>

            <dt style={{ color: '#777' }}>Sitio web</dt>
            <dd style={{ margin: 0 }}>{advisor.website || '—'}</dd>

            <dt style={{ color: '#777' }}>Instagram</dt>
            <dd style={{ margin: 0 }}>{advisor.instagram_url || '—'}</dd>

            <dt style={{ color: '#777' }}>Facebook</dt>
            <dd style={{ margin: 0 }}>{advisor.facebook_url || '—'}</dd>

            <dt style={{ color: '#777' }}>LinkedIn</dt>
            <dd style={{ margin: 0 }}>{advisor.linkedin_url || '—'}</dd>
          </dl>
        </div>
      </section>

      <section
        style={{
          border: '1px solid #e5e5e5',
          borderRadius: '14px',
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e5e5e5',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '20px' }}>
            Propiedades del asesor
          </h2>
        </div>

        {properties && properties.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: '800px',
              }}
            >
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  {[
                    'Propiedad',
                    'Operación',
                    'Zona',
                    'Precio',
                    'Estado',
                    '',
                  ].map((label) => (
                    <th
                      key={label}
                      style={{
                        padding: '13px 16px',
                        borderBottom: '1px solid #e5e5e5',
                        textAlign: 'left',
                        fontSize: '12px',
                        color: '#666',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {properties.map((property) => (
                  <tr key={property.id}>
                    <td
                      style={{
                        padding: '16px',
                        borderBottom: '1px solid #eee',
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{property.title}</div>
                      <div
                        style={{
                          marginTop: '4px',
                          fontSize: '12px',
                          color: '#777',
                        }}
                      >
                        {property.slug}
                      </div>
                    </td>

                    <td
                      style={{
                        padding: '16px',
                        borderBottom: '1px solid #eee',
                      }}
                    >
                      {property.operation}
                    </td>

                    <td
                      style={{
                        padding: '16px',
                        borderBottom: '1px solid #eee',
                      }}
                    >
                      {property.zone}
                    </td>

                    <td
                      style={{
                        padding: '16px',
                        borderBottom: '1px solid #eee',
                      }}
                    >
                      {propertyPrice(property)}
                    </td>

                    <td
                      style={{
                        padding: '16px',
                        borderBottom: '1px solid #eee',
                      }}
                    >
                      {property.status}
                    </td>

                    <td
                      style={{
                        padding: '16px',
                        borderBottom: '1px solid #eee',
                        textAlign: 'right',
                      }}
                    >
                      <Link
                        href={`/admin/${property.id}`}
                        style={{
                          display: 'inline-block',
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          color: '#222',
                          textDecoration: 'none',
                          fontSize: '13px',
                          fontWeight: 600,
                        }}
                      >
                        Ver propiedad
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '24px', color: '#666' }}>
            Este asesor todavía no tiene propiedades registradas.
          </div>
        )}
      </section>
    </main>
  )
}
