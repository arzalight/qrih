import { Header } from '@/components/Header'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'

type AdminAdvisorsPageProps = {
  searchParams: Promise<{
    busqueda?: string
  }>
}

export default async function AdminAdvisorsPage({
  searchParams,
}: AdminAdvisorsPageProps) {
  const { busqueda } = await searchParams
  const searchFilter = busqueda?.trim().toLowerCase() || null
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
        <p>No tienes permisos para acceder a la administración de asesores.</p>
      </main>
    )
  }

  const { data: advisors, error } = await supabase
    .from('profiles')
    .select(
      'id, public_id, full_name, phone, company_name, role, plan, trial_ends_at, is_verified, account_status, avatar_url, created_at'
    )
    .order('created_at', { ascending: true })

  if (error) {
console.warn('QRIH_APP_ADMIN_ASESORES_PAGE_53_FAILED')

    return (
      <main style={{ padding: '40px' }}>
        <h1>Error cargando asesores</h1>
        <p>No se pudo cargar el listado. Intenta nuevamente.</p>
      </main>
    )
  }

  const filteredAdvisors = searchFilter
    ? (advisors ?? []).filter((advisor) =>
        [
          advisor.full_name,
          advisor.company_name,
          advisor.public_id,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(searchFilter)
      )
    : advisors ?? []

  const advisorIds = (advisors ?? []).map((advisor) => advisor.id)

  const { data: properties } =
    advisorIds.length > 0
      ? await supabase
          .from('properties')
          .select('owner_id, status')
          .in('owner_id', advisorIds)
      : { data: [] }

  const propertyCounts = new Map<
    string,
    { total: number; published: number; pending: number }
  >()

  for (const property of properties ?? []) {
    const current = propertyCounts.get(property.owner_id) ?? {
      total: 0,
      published: 0,
      pending: 0,
    }

    current.total += 1

    if (property.status === 'published') {
      current.published += 1
    }

    if (property.status === 'pending') {
      current.pending += 1
    }

    propertyCounts.set(property.owner_id, current)
  }

  return (
    <><Header administration /><main className="admin-page"
      style={{
        padding: '48px 32px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      <header
        style={{
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '24px',
          flexWrap: 'wrap',
        }}
      >
        <div>
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
            Asesores
          </h1>

          <p
            style={{
              margin: '10px 0 0',
              color: "var(--muted)",
              fontSize: '16px',
            }}
          >
            Gestiona las cuentas y el estado de los asesores del portal.
          </p>
        </div>

        <div
          style={{
            minWidth: '150px',
            padding: '16px 20px',
            border: "1px solid var(--line)",
            borderRadius: '12px',
            background: "var(--surface-subtle)",
          }}
        >
          <div
            style={{
              fontSize: '28px',
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {filteredAdvisors.length}
          </div>

          <div
            style={{
              marginTop: '6px',
              fontSize: '13px',
              color: "var(--muted)",
            }}
          >
            Perfiles registrados
          </div>
        </div>
      </header>

      <form
        method="get"
        style={{
          marginBottom: '24px',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          border: "1px solid var(--line)",
          borderRadius: '12px',
          background: "var(--surface-subtle)",
        }}
      >
        <label
          htmlFor="busqueda"
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: "var(--muted)",
          }}
        >
          Buscar:
        </label>

        <input
          id="busqueda"
          type="search"
          name="busqueda"
          defaultValue={busqueda ?? ''}
          placeholder="Nombre, empresa o ID público"
          style={{
            width: '300px',
            maxWidth: '100%',
            padding: '10px 12px',
            border: '1px solid #d5d5d5',
            borderRadius: '9px',
            background: "var(--surface)",
            fontSize: '13px',
          }}
        />

        <button
          type="submit"
          style={{
            padding: '10px 16px',
            border: '1px solid #222',
            borderRadius: '9px',
            background: "var(--ink)",
            color: "var(--surface)",
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Filtrar
        </button>

        {searchFilter && (
          <Link
            href="/admin/asesores"
            style={{
              color: "var(--muted)",
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            Limpiar
          </Link>
        )}
      </form>

      <section
        style={{
          border: "1px solid var(--line)",
          borderRadius: '14px',
          overflow: 'hidden',
          background: "var(--surface)",
        }}
      >
        <div className="ui-table-scroll" role="region" aria-label="Tabla de asesores; desplázate horizontalmente para ver todas las columnas" tabIndex={0} style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: '900px',
            }}
          >
            <caption className="sr-only">Asesores y estado de sus cuentas</caption>
            <thead>
              <tr style={{ background: "var(--surface-subtle)" }}>
                {[
                  'Asesor',
                  'ID público',
                  'Rol',
                  'Plan',
                  'Propiedades',
                  'Verificación',
                  'Estado',
                  'Registro',
                  'Acciones',
                ].map((label) => (
                  <th scope="col"
                    key={label}
                    style={{
                      padding: '14px 16px',
                      borderBottom: "1px solid var(--line)",
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: "var(--muted)",
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
              {filteredAdvisors.map((advisor) => {
                const counts = propertyCounts.get(advisor.id) ?? {
                  total: 0,
                  published: 0,
                  pending: 0,
                }

                return (
                  <tr key={advisor.id}>
                    <td
                      style={{
                        padding: '16px',
                        borderBottom: "1px solid var(--line)",
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                        }}
                      >
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            border: "1px solid var(--line)",
                            background: '#f5f5f5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            fontWeight: 700,
                            color: "var(--muted)",
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
                          <div style={{ fontWeight: 700 }}>
                            {advisor.full_name}
                            {advisor.is_verified && (
                              <span
                                title="Asesor verificado"
                                aria-label="Asesor verificado"
                                style={{
                                  marginLeft: '6px',
                                  fontSize: '15px',
                                }}
                              >
                                ✓
                              </span>
                            )}
                          </div>

                          <div
                            style={{
                              marginTop: '3px',
                              fontSize: '13px',
                              color: "var(--muted)",
                            }}
                          >
                            {advisor.company_name || 'Sin empresa'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td
                      style={{
                        padding: '16px',
                        borderBottom: "1px solid var(--line)",
                        fontWeight: 600,
                      }}
                    >
                      {advisor.public_id}
                    </td>

                    <td
                      style={{
                        padding: '16px',
                        borderBottom: "1px solid var(--line)",
                      }}
                    >
                      {advisor.role}
                    </td>

                    <td
                      style={{
                        padding: '16px',
                        borderBottom: "1px solid var(--line)",
                        textTransform: 'capitalize',
                      }}
                    >
                      {advisor.plan}
                    </td>

                    <td
                      style={{
                        padding: '16px',
                        borderBottom: "1px solid var(--line)",
                      }}
                    >
                      <strong>{counts.total}</strong>
                      <div
                        style={{
                          marginTop: '3px',
                          fontSize: '12px',
                          color: "var(--muted)",
                        }}
                      >
                        {counts.published} publicadas · {counts.pending} pendientes
                      </div>
                    </td>

                    <td
                      style={{
                        padding: '16px',
                        borderBottom: "1px solid var(--line)",
                      }}
                    >
                      {advisor.is_verified ? (
                        <span style={{ fontWeight: 700 }}>✓ Verificado</span>
                      ) : (
                        <span style={{ color: "var(--muted)" }}>No verificado</span>
                      )}
                    </td>

                    <td
                      style={{
                        padding: '16px',
                        borderBottom: "1px solid var(--line)",
                      }}
                    >
                      {advisor.account_status === 'suspended' ? (
                        <span
                          style={{
                            fontWeight: 700,
                            color: '#b42318',
                          }}
                        >
                          🔴 Suspendido
                        </span>
                      ) : (
                        <span
                          style={{
                            fontWeight: 700,
                            color: '#027a48',
                          }}
                        >
                          🟢 Activo
                        </span>
                      )}
                    </td>

                    <td
                      style={{
                        padding: '16px',
                        borderBottom: "1px solid var(--line)",
                        color: "var(--muted)",
                        fontSize: '13px',
                      }}
                    >
                      {new Date(advisor.created_at).toLocaleDateString('es-MX')}
                    </td>

                    <td
                      style={{
                        padding: '16px',
                        borderBottom: "1px solid var(--line)",
                        textAlign: 'right',
                      }}
                    >
                      <Link
                        href={`/admin/asesores/${advisor.id}`}
                        style={{
                          display: 'inline-block',
                          padding: '8px 12px',
                          border: "1px solid var(--line)",
                          borderRadius: '8px',
                          color: "var(--ink)",
                          textDecoration: 'none',
                          fontSize: '13px',
                          fontWeight: 600,
                        }}
                      >
                        Ver asesor
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main></>
  )
}
