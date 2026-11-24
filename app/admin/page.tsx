import { loadAdminMetrics } from '@/lib/admin-metrics'
import { AdminStatistics } from '@/components/AdminStatistics'
import { Header } from '@/components/Header'
import Link from 'next/link'
import { propertyPrice } from '@/lib/property-price'
import { redirect } from 'next/navigation'
import { loginPath } from '@/lib/safe-navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { rankDemandsForProperty } from '@/lib/matching'
import { AdminPropertyFilters } from '@/components/AdminPropertyFilters'
import { AdminPropertiesTable } from '@/components/AdminPropertiesTable'
import { AdminAutoRefresh } from '@/components/AdminAutoRefresh'
import { createSignedPropertyImageUrlMap, PROPERTY_IMAGE_TTL_SECONDS } from '@/lib/property-image-urls'

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
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries({ status, operation, zone_general, zone, search })) if (value) query.set(key, value)
    redirect(loginPath(`/admin${query.size ? '?' + query.toString() : ''}`))
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
    .select('*, price_value_text:price_value::text, profiles:owner_id(full_name, company_name)')
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
        price_currency: property.price_currency,
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

  let coverUrls = new Map<string, string>()
  try {
    coverUrls = await createSignedPropertyImageUrlMap(supabase,
      (filteredProperties || []).map(property => property.main_image_path), PROPERTY_IMAGE_TTL_SECONDS.admin)
  } catch { console.warn('QRIH_ADMIN_COVERS_UNAVAILABLE') }
  const tableProperties = (filteredProperties || []).map(property => ({
    ...property, coverUrl: coverUrls.get(property.main_image_path) || null,
  }))

  const metrics = await loadAdminMetrics(supabase)

  const pendingProperties = properties?.filter(
    (property) => property.status === 'pending'
  )

return (
  <><Header administration /><main className="admin-page admin-shell">
    <AdminAutoRefresh scopeKey={JSON.stringify({ status, operation, zone_general, zone, search })} />
    <header className="admin-header">
      <div>
        <h1>Panel de administración</h1>
        <p>Gestiona, revisa y supervisa las propiedades del portal.</p>
      </div>
      <div className={`admin-pending-pill${(pendingProperties?.length || 0) > 0 ? ' admin-pending-pill--active' : ''}`}>
        {pendingProperties?.length || 0} {(pendingProperties?.length || 0) === 1 ? 'pendiente' : 'pendientes'} de revisión
      </div>
    </header>

    <AdminStatistics metrics={metrics} />

    {success === 'published' && (
      <div className="admin-alert admin-alert--success" role="status">
        Propiedad publicada correctamente.
      </div>
    )}

    {success === 'rejected' && (
      <div className="admin-alert admin-alert--danger" role="status">
        Propiedad rechazada correctamente.
      </div>
    )}

    {success === 'unpublished' && (
      <div className="admin-alert admin-alert--warning" role="status">
        Propiedad retirada de publicación correctamente.
      </div>
    )}

      <section className="admin-section">
        <div className="admin-section__head">
          <div>
            <h2>Propiedades pendientes</h2>
            <p>Propiedades que requieren revisión antes de publicarse.</p>
          </div>
          <span className="status pending">
            {pendingProperties?.length || 0} pendientes
          </span>
        </div>

        {pendingProperties?.length ? (
          pendingProperties.map((property) => (
            <article key={property.id} className="admin-pending-card">
              <div className="admin-pending-card__top">
                <div>
                  <h3>{property.title}</h3>
                  <div className="admin-pending-card__meta">
                    <span>{property.operation}</span>
                    <span aria-hidden="true">·</span>
                    <span>{property.zone}</span>
                  </div>
                </div>
                <span className="status pending">Pendiente de revisión</span>
              </div>

              <div className="admin-pending-card__grid">
                <div>
                  <span>Precio</span>
                  <strong>{propertyPrice(property)}</strong>
                </div>
                <div>
                  <span>Superficie</span>
                  <strong>{property.total_area ? `${property.total_area} m²` : 'N/D'}</strong>
                </div>
                <div>
                  <span>Mejor coincidencia</span>
                  <strong>
                    {Math.round(
                      propertyMatches.find(
                        (item) => item.property.id === property.id
                      )?.matches[0]?.result.total ?? 0
                    )}%
                  </strong>
                </div>
                <div>
                  <span>Creada</span>
                  <strong>{new Date(property.created_at).toLocaleString('es-MX')}</strong>
                </div>
              </div>

              <div className="admin-pending-card__actions">
                <Link href={`/admin/${property.id}`} className="button">
                  Ver información completa
                </Link>

                {property.status === 'published' && (
                  <Link href={`/bodegas/${property.slug}`} className="button button--secondary">
                    Ver propiedad publicada
                  </Link>
                )}
              </div>
            </article>
          ))
        ) : (
          <p className="ui-empty">No hay propiedades pendientes de revisión.</p>
        )}
      </section>

      <section className="admin-section">
        <div className="admin-section__head">
          <div>
            <h2>Todas las propiedades</h2>
            <p>Filtra y administra el inventario completo del portal.</p>
          </div>
        </div>

      <AdminPropertyFilters
        status={status || 'all'}
        operation={operation || 'all'}
        zone_general={zone_general || 'all'}
        zone={zone || 'all'}
      />

      <AdminPropertiesTable key={JSON.stringify({ status, operation, zone_general, zone, search })} properties={tableProperties} />
      </section>
    </main></>
  )
}
