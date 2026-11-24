import { Header } from '@/components/Header'
import { AdminAutoRefresh } from '@/components/AdminAutoRefresh'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { loginPath } from '@/lib/safe-navigation'
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
    redirect(loginPath(`/admin/asesores${busqueda ? '?busqueda=' + encodeURIComponent(busqueda) : ''}`))
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
    <><Header administration /><main className="admin-page admin-shell">
      <AdminAutoRefresh scopeKey={searchFilter || ''} />
      <header className="admin-header">
        <div>
          <h1>Asesores</h1>
          <p>Gestiona las cuentas y el estado de los asesores del portal.</p>
        </div>

        <div className="admin-count-card">
          <strong>{filteredAdvisors.length}</strong>
          <span>Perfiles registrados</span>
        </div>
      </header>

      <form method="get" className="admin-filter-bar">
        <label htmlFor="busqueda">Buscar:</label>
        <input
          id="busqueda"
          type="search"
          name="busqueda"
          defaultValue={busqueda ?? ''}
          placeholder="Nombre, empresa o ID público"
        />
        <button type="submit">Filtrar</button>
        {searchFilter && (
          <Link href="/admin/asesores" className="admin-filter-bar__clear">
            Limpiar
          </Link>
        )}
      </form>

      <section className="admin-table-card">
        <div className="ui-table-scroll" role="region" aria-label="Tabla de asesores; desplázate horizontalmente para ver todas las columnas" tabIndex={0}>
          <table className="admin-advisors-table">
            <caption className="sr-only">Asesores y estado de sus cuentas</caption>
            <thead>
              <tr>
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
                  <th scope="col" key={label}>
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

                const roleLabel =
                  advisor.role === 'admin'
                    ? 'Administrador'
                    : advisor.role === 'publisher'
                      ? 'Asesor'
                      : advisor.role

                return (
                  <tr key={advisor.id}>
                    <td>
                      <div className="admin-advisor-identity">
                        <div className="admin-advisor-avatar">
                          {advisor.avatar_url ? (
                            <img src={advisor.avatar_url} alt="" />
                          ) : (
                            advisor.full_name.charAt(0).toUpperCase()
                          )}
                        </div>

                        <div>
                          <div className="admin-advisor-name">
                            {advisor.full_name}
                            {advisor.is_verified && (
                              <span
                                title="Asesor verificado"
                                aria-label="Asesor verificado"
                                className="admin-advisor-verified-mark"
                              >
                                ✓
                              </span>
                            )}
                          </div>
                          <div className="admin-advisor-company">
                            {advisor.company_name || 'Sin empresa'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="admin-cell-nowrap">
                      <strong>{advisor.public_id}</strong>
                    </td>

                    <td className="admin-cell-nowrap">{roleLabel}</td>

                    <td className="admin-cell-nowrap admin-cell-capitalize">
                      {advisor.plan}
                    </td>

                    <td className="admin-cell-nowrap">
                      <strong>{counts.total}</strong>
                      <div className="admin-advisor-sub">
                        {counts.published} pub. · {counts.pending} pend.
                      </div>
                    </td>

                    <td className="admin-cell-nowrap">
                      {advisor.is_verified ? (
                        <span className="status published">Verificado</span>
                      ) : (
                        <span className="status draft">No verificado</span>
                      )}
                    </td>

                    <td className="admin-cell-nowrap">
                      {advisor.account_status === 'suspended' ? (
                        <span className="status rejected">Suspendido</span>
                      ) : (
                        <span className="status published">Activo</span>
                      )}
                    </td>

                    <td className="admin-cell-nowrap admin-cell-muted">
                      {new Date(advisor.created_at).toLocaleDateString('es-MX')}
                    </td>

                    <td className="admin-cell-nowrap admin-cell-right">
                      <Link
                        href={`/admin/asesores/${advisor.id}`}
                        className="button button--secondary admin-row-action"
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
