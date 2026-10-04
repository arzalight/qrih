import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { rankDemandsForProperty } from '@/lib/matching'
import { AdminPropertyFilters } from '@/components/AdminPropertyFilters'
import { AdminPropertiesTable } from '@/components/AdminPropertiesTable'

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    success?: string
    status?: string
    operation?: string
    zone_general?: string
    zone?: string
    search?: string
  }>
}) {
  const { success, status, operation, zone_general, zone, search } = await searchParams

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

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, account_status')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'admin' || profile?.account_status !== 'active') {
    return (
      <main style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Acceso restringido</h1>
        <p>No tienes permisos para acceder al panel de administración.</p>
      </main>
    )
  }

  const { data: properties, error } = await supabase
    .from('properties')
    .select('*, profiles:owner_id(full_name, company_name)')
    .order('created_at', { ascending: false })

  if (error) {
console.warn('QRIH_APP_ADMIN_PAGE_57_FAILED')

    return (
      <main style={{ padding: '40px' }}>
        <h1>Error cargando propiedades</h1>
        <p>No se pudo cargar el panel. Intenta nuevamente.</p>
      </main>
    )
  }

  const { data: demandRequests, error: demandError } = await supabase
    .from('demand_requests')
    .select('*')
    .order('created_at', { ascending: false })


  if (demandError) {
console.warn('QRIH_APP_ADMIN_PAGE_76_FAILED')
  }

  const propertyMatches = (properties ?? []).map((property) => ({
    property,
    matches: rankDemandsForProperty(
      {
        operation: property.operation,
        zone_general: property.zone_general,
        zone: property.zone,
        surface_m2: property.total_area,
        price_value: property.price_value,
        price_unit: property.price_unit,
      },
      demandRequests ?? []
    ),
  }))

  const filteredProperties = properties?.filter((property) => {
    const searchText = (search || '').trim().toLowerCase()

    const matchesSearch =
      !searchText ||
      property.title?.toLowerCase().includes(searchText) ||
      property.address?.toLowerCase().includes(searchText) ||
      property.slug?.toLowerCase().includes(searchText)

    const matchesStatus =
      !status || status === 'all' || property.status === status

    const matchesOperation =
      !operation || operation === 'all' || property.operation === operation

    const matchesZoneGeneral =
      !zone_general ||
      zone_general === 'all' ||
      property.zone_general === zone_general

    const matchesZone =
      !zone ||
      zone === 'all' ||
      property.zone === zone

    return (
      matchesSearch &&
      matchesStatus &&
      matchesOperation &&
      matchesZoneGeneral &&
      matchesZone
    )
  })

  const propertyStats = {
    total: properties?.length ?? 0,
    draft: properties?.filter((property) => property.status === 'draft').length ?? 0,
    pending: properties?.filter((property) => property.status === 'pending').length ?? 0,
    published:
      properties?.filter((property) => property.status === 'published').length ?? 0,
    paused: properties?.filter((property) => property.status === 'paused').length ?? 0,
    rejected:
      properties?.filter((property) => property.status === 'rejected').length ?? 0,
    expired:
      properties?.filter((property) => property.status === 'expired').length ?? 0,
    pending_update:
      properties?.filter((property) => property.status === 'pending_update').length ?? 0,
  }

  const pendingProperties = properties?.filter(
    (property) => property.status === 'pending'
  )

return (
  <main
    style={{
      padding: '48px 32px',
      maxWidth: '1200px',
      margin: '0 auto',
    }}
  >
    <header
      style={{
        marginBottom: '28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '28px',
        flexWrap: 'wrap',
      }}
    >
      <div>
        <p
          style={{
            margin: '0 0 8px',
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#777',
          }}
        >
          QRO Industrial Hub
        </p>

        <h1
          style={{
            margin: 0,
            fontSize: '38px',
            lineHeight: 1.08,
            letterSpacing: '-0.035em',
            fontWeight: 750,
          }}
        >
          Panel de administración
        </h1>

        <p
          style={{
            margin: '12px 0 0',
            color: '#666',
            fontSize: '15px',
            lineHeight: 1.5,
          }}
        >
          Gestiona, revisa y supervisa las propiedades del portal.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
        }}
      >
        <Link
          href="/admin/asesores"
          style={{
            display: 'inline-block',
            padding: '11px 15px',
            border: '1px solid #d9d9d9',
            borderRadius: '10px',
            color: '#222',
            textDecoration: 'none',
            fontWeight: 650,
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          Gestionar asesores
        </Link>

        <Link
          href="/admin/historial"
          style={{
            display: 'inline-block',
            padding: '12px 16px',
            border: '1px solid #ddd',
            borderRadius: '10px',
            color: '#222',
            textDecoration: 'none',
            fontWeight: 600,
            background: '#fff',
          }}
        >
          Historial
        </Link>

        <Link
          href="/admin/configuracion"
          style={{
            display: 'inline-block',
            padding: '12px 16px',
            border: '1px solid #ddd',
            borderRadius: '10px',
            color: '#222',
            textDecoration: 'none',
            fontWeight: 600,
            background: '#fff',
          }}
        >
          Configuración
        </Link>

      </div>
    </header>

    <section
      aria-label="Resumen de propiedades"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '14px',
        marginBottom: '40px',
      }}
    >
      {[
        {
          label: 'Borradores',
          value: propertyStats.draft,
        },
        {
          label: 'Pendientes',
          value: propertyStats.pending,
        },
        {
          label: 'Publicadas',
          value: propertyStats.published,
        },
        {
          label: 'Pausadas',
          value: propertyStats.paused,
        },
        {
          label: 'Rechazadas',
          value: propertyStats.rejected,
        },
        {
          label: 'Expiradas',
          value: propertyStats.expired,
        },
        {
          label: 'Cambios pendientes',
          value: propertyStats.pending_update,
        },
      ].map((stat) => (
        <article
          key={stat.label}
          style={{
            padding: '20px 20px 18px',
            border: '1px solid #e7e7e7',
            borderRadius: '16px',
            background: '#fff',
            boxShadow: '0 4px 14px rgba(0,0,0,0.045)',
          }}
        >
          <div
            style={{
              fontSize: '32px',
              lineHeight: 1,
              fontWeight: 750,
              letterSpacing: '-0.035em',
            }}
          >
            {stat.value}
          </div>

          <div
            style={{
              marginTop: '10px',
              fontSize: '12px',
              lineHeight: 1.35,
              color: '#666',
              fontWeight: 650,
              letterSpacing: '0.01em',
            }}
          >
            {stat.label}
          </div>
        </article>
      ))}
    </section>

    {success === 'published' && (
      <div
        style={{
          marginTop: '20px',
          marginBottom: '24px',
          padding: '16px 20px',
          borderRadius: '10px',
          background: '#e8f5e9',
          border: '1px solid #a5d6a7',
          color: '#256029',
          fontWeight: 600,
        }}
      >
        ✓ Propiedad publicada correctamente.
      </div>
    )}

    {success === 'rejected' && (
      <div
        style={{
          marginTop: '20px',
          marginBottom: '24px',
          padding: '16px 20px',
          borderRadius: '10px',
          background: '#ffebee',
          border: '1px solid #ef9a9a',
          color: '#b71c1c',
          fontWeight: 600,
        }}
      >
        ✓ Propiedad rechazada correctamente.
      </div>
    )}

    {success === 'unpublished' && (
      <div
        style={{
          marginTop: '20px',
          marginBottom: '24px',
          padding: '16px 20px',
          borderRadius: '10px',
          background: '#fff3e0',
          border: '1px solid #ffcc80',
          color: '#8a4b08',
          fontWeight: 600,
        }}
      >
        ✓ Propiedad retirada de publicación correctamente.
      </div>
    )}

      <hr />

      <section
        style={{
          marginTop: '40px',
          marginBottom: '48px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            marginBottom: '20px',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '24px',
                letterSpacing: '-0.02em',
              }}
            >
              Propiedades pendientes
            </h2>

            <p
              style={{
                margin: '6px 0 0',
                color: '#666',
              }}
            >
              Propiedades que requieren revisión antes de publicarse.
            </p>
          </div>

          <div
            style={{
              padding: '8px 12px',
              borderRadius: '999px',
              background: '#fff3e0',
              color: '#8a4b08',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            {pendingProperties?.length || 0} pendientes
          </div>
        </div>

        {pendingProperties?.length ? (
          pendingProperties.map((property) => (
            <article
              key={property.id}
              style={{
                border: '1px solid #e7e7e7',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '16px',
                background: '#fff',
                boxShadow: '0 4px 14px rgba(0,0,0,0.045)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '20px',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '20px',
                      lineHeight: 1.25,
                      letterSpacing: '-0.015em',
                    }}
                  >
                    {property.title}
                  </h3>

                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap',
                      marginTop: '8px',
                      fontSize: '13px',
                      color: '#666',
                    }}
                  >
                    <span>{property.operation}</span>
                    <span aria-hidden="true">·</span>
                    <span>{property.zone}</span>
                  </div>
                </div>

                <div
                  style={{
                    padding: '7px 10px',
                    borderRadius: '999px',
                    background: '#fff3e0',
                    color: '#8a4b08',
                    fontSize: '12px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Pendiente de revisión
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '12px',
                  marginTop: '22px',
                }}
              >
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: '#f8f8f8',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#777',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Precio
                  </div>

                  <div
                    style={{
                      marginTop: '5px',
                      fontSize: '17px',
                      fontWeight: 700,
                    }}
                  >
                    {property.price_display}
                  </div>
                </div>

                <div
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: '#f8f8f8',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#777',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Superficie
                  </div>

                  <div
                    style={{
                      marginTop: '5px',
                      fontSize: '17px',
                      fontWeight: 700,
                    }}
                  >
                    {property.total_area || 'N/D'} m²
                  </div>
                </div>

                <div
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: '#f8f8f8',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#777',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Mejor coincidencia
                  </div>

                  <div
                    style={{
                      marginTop: '5px',
                      fontSize: '17px',
                      fontWeight: 700,
                    }}
                  >
                    {Math.round(
                      propertyMatches.find(
                        (item) => item.property.id === property.id
                      )?.matches[0]?.result.total ?? 0
                    )}%
                  </div>
                </div>

                <div
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: '#f8f8f8',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#777',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Creada
                  </div>

                  <div
                    style={{
                      marginTop: '5px',
                      fontSize: '14px',
                      fontWeight: 600,
                    }}
                  >
                    {new Date(property.created_at).toLocaleString('es-MX')}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap',
                  marginTop: '20px',
                  paddingTop: '18px',
                  borderTop: '1px solid #eeeeee',
                }}
              >
                <Link
                  href={`/admin/${property.id}`}
                  style={{
                    display: 'inline-block',
                    padding: '11px 18px',
                    borderRadius: '10px',
                    background: '#111',
                    color: '#fff',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  Ver información completa
                </Link>

                {property.status === 'published' && (
                  <Link
                    href={`/bodegas/${property.slug}`}
                    style={{
                      display: 'inline-block',
                      padding: '11px 18px',
                      borderRadius: '10px',
                      border: '1px solid #d8d8d8',
                      background: '#fff',
                      color: '#111',
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Ver propiedad publicada
                  </Link>
                )}
              </div>
            </article>
          ))
        ) : (
          <p>No hay propiedades pendientes de revisión.</p>
        )}
      </section>

      <hr />

      <h2 style={{ marginTop: '32px' }}>Todas las propiedades</h2>

      <AdminPropertyFilters
        status={status || 'all'}
        operation={operation || 'all'}
        zone_general={zone_general || 'all'}
        zone={zone || 'all'}
      />

      <AdminPropertiesTable properties={filteredProperties ?? []} />
    </main>
  )
}
