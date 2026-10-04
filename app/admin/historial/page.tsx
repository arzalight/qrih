import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'

type AuditLog = {
  id: number
  actor_id: string | null
  entity_type: string
  entity_id: string | null
  action: string
  metadata: Record<string, unknown> | null
  created_at: string
}

function actionLabel(action: string, metadata: Record<string, unknown> | null) {
  if (
    action === 'property_updated' &&
    metadata?.previous_status &&
    metadata?.status === 'pending'
  ) {
    return 'Propiedad reenviada a revisión'
  }

  const labels: Record<string, string> = {
    property_created: 'Propiedad creada',
    property_updated: 'Propiedad modificada',
    property_published: 'Propiedad publicada',
    property_rejected: 'Propiedad rechazada',
    property_unpublished: 'Propiedad retirada',
    profile_verified: 'Asesor verificado',
    profile_unverified: 'Verificación retirada',
    profile_suspended: 'Asesor suspendido',
    profile_reactivated: 'Asesor reactivado',
  }

  return labels[action] || action
}

function entityLabel(entityType: string) {
  if (entityType === 'property') return 'Propiedad'
  if (entityType === 'profile') return 'Perfil'
  return entityType
}

function getReason(metadata: Record<string, unknown> | null) {
  if (!metadata) return null

  const reason = metadata.reason ?? metadata.rejection_reason

  return typeof reason === 'string' && reason.trim() ? reason : null
}

type AdminHistoryPageProps = {
  searchParams: Promise<{
    entidad?: string
    accion?: string
    busqueda?: string
    desde?: string
    hasta?: string
  }>
}

export default async function AdminHistoryPage({
  searchParams,
}: AdminHistoryPageProps) {
  const { entidad, accion, busqueda, desde, hasta } = await searchParams
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
        <p>No tienes permisos para acceder al historial.</p>
      </main>
    )
  }

  const entityFilter =
    entidad === 'property' || entidad === 'profile' ? entidad : null

  const actionFilter = [
    'property_created',
    'property_updated',
    'property_published',
    'property_rejected',
    'property_unpublished',
    'profile_verified',
    'profile_unverified',
    'profile_suspended',
    'profile_reactivated',
  ].includes(accion ?? '')
    ? accion
    : null

  let auditQuery = supabase
    .from('audit_logs')
    .select('id, actor_id, entity_type, entity_id, action, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (entityFilter) {
    auditQuery = auditQuery.eq('entity_type', entityFilter)
  }

  if (actionFilter) {
    auditQuery = auditQuery.eq('action', actionFilter)
  }

  if (desde) {
    auditQuery = auditQuery.gte('created_at', `${desde}T00:00:00`)
  }

  if (hasta) {
    auditQuery = auditQuery.lt('created_at', `${hasta}T23:59:59.999`)
  }

  const { data: auditLogs, error: auditError } = await auditQuery

  if (auditError) {
console.warn('QRIH_APP_ADMIN_HISTORIAL_PAGE_138_FAILED')

    return (
      <main style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
        <h1>Error cargando historial</h1>
        <p>{auditError.message}</p>
      </main>
    )
  }

  const logs = (auditLogs ?? []) as AuditLog[]

  const searchFilter = busqueda?.trim().toLowerCase() || null

  const actorIds = Array.from(
    new Set(logs.map((log) => log.actor_id).filter(Boolean))
  ) as string[]

  const entityIds = Array.from(
    new Set(logs.map((log) => log.entity_id).filter(Boolean))
  ) as string[]

  const profileEntityIds = logs
    .filter((log) => log.entity_type === 'profile' && log.entity_id)
    .map((log) => log.entity_id as string)

  const propertyEntityIds = logs
    .filter((log) => log.entity_type === 'property' && log.entity_id)
    .map((log) => log.entity_id as string)

  const profileIds = Array.from(
    new Set([...actorIds, ...profileEntityIds])
  )

  const propertyIds = Array.from(new Set(propertyEntityIds))

  const [{ data: profiles }, { data: properties }] = await Promise.all([
    profileIds.length
      ? supabase
          .from('profiles')
          .select('id, full_name, company_name')
          .in('id', profileIds)
      : Promise.resolve({ data: [] }),
    propertyIds.length
      ? supabase
          .from('properties')
          .select('id, title, slug')
          .in('id', propertyIds)
      : Promise.resolve({ data: [] }),
  ])

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile])
  )

  const propertyMap = new Map(
    (properties ?? []).map((property) => [property.id, property])
  )

  const filteredLogs = searchFilter
    ? logs.filter((log) => {
        const property =
          log.entity_type === 'property' && log.entity_id
            ? propertyMap.get(log.entity_id)
            : null

        const profile =
          log.entity_type === 'profile' && log.entity_id
            ? profileMap.get(log.entity_id)
            : null

        const actor = log.actor_id ? profileMap.get(log.actor_id) : null

        const searchableText = [
          property?.title,
          profile?.full_name,
          profile?.company_name,
          actor?.full_name,
          actor?.company_name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return searchableText.includes(searchFilter)
      })
    : logs

  return (
    <main
      style={{
        padding: '48px 32px',
        maxWidth: '1100px',
        margin: '0 auto',
      }}
    >
      <header style={{ marginBottom: '32px' }}>
        <Link
          href="/admin"
          style={{
            display: 'inline-block',
            marginBottom: '14px',
            color: '#666',
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
            color: '#777',
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
          Historial
        </h1>

        <p
          style={{
            margin: '10px 0 0',
            color: '#666',
            fontSize: '16px',
          }}
        >
          Registro de cambios y acciones administrativas del portal.
        </p>
      </header>

      <form
        method="get"
        style={{
          marginBottom: '24px',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'nowrap',
          border: '1px solid #e7e7e7',
          borderRadius: '12px',
          background: '#fafafa',
        }}
      >
        <label
          htmlFor="entidad"
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#555',
          }}
        >
          Mostrar:
        </label>

        <select
          id="entidad"
          name="entidad"
          defaultValue={entityFilter ?? ''}
          style={{
            padding: '9px 12px',
            border: '1px solid #d5d5d5',
            borderRadius: '9px',
            background: '#fff',
            fontSize: '13px',
          }}
        >
          <option value="">Todas</option>
          <option value="property">Propiedades</option>
          <option value="profile">Asesores</option>
        </select>

        <input
          type="date"
          name="desde"
          defaultValue={desde ?? ''}
          aria-label="Desde"
          style={{
            padding: '9px 12px',
            border: '1px solid #d5d5d5',
            borderRadius: '9px',
            background: '#fff',
            fontSize: '13px',
          }}
        />

        <input
          type="date"
          name="hasta"
          defaultValue={hasta ?? ''}
          aria-label="Hasta"
          style={{
            padding: '9px 12px',
            border: '1px solid #d5d5d5',
            borderRadius: '9px',
            background: '#fff',
            fontSize: '13px',
          }}
        />

        <input
          type="search"
          name="busqueda"
          defaultValue={busqueda ?? ''}
          placeholder="Buscar propiedad o asesor"
          style={{
            width: '210px',
            padding: '9px 12px',
            border: '1px solid #d5d5d5',
            borderRadius: '9px',
            background: '#fff',
            fontSize: '13px',
          }}
        />

        <select
          id="accion"
          name="accion"
          defaultValue={actionFilter ?? ''}
          style={{
            padding: '9px 12px',
            border: '1px solid #d5d5d5',
            borderRadius: '9px',
            background: '#fff',
            fontSize: '13px',
          }}
        >
          <option value="">Todas las acciones</option>
          <option value="property_created">Propiedad creada</option>
          <option value="property_updated">Propiedad modificada</option>
          <option value="property_published">Propiedad publicada</option>
          <option value="property_rejected">Propiedad rechazada</option>
          <option value="property_unpublished">Propiedad retirada</option>
          <option value="profile_verified">Asesor verificado</option>
          <option value="profile_unverified">Verificación retirada</option>
          <option value="profile_suspended">Asesor suspendido</option>
          <option value="profile_reactivated">Asesor reactivado</option>
        </select>

        <button
          type="submit"
          style={{
            padding: '9px 14px',
            border: '1px solid #222',
            borderRadius: '9px',
            background: '#222',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Filtrar
        </button>
      </form>

      <section
        style={{
          border: '1px solid #e5e5e5',
          borderRadius: '14px',
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        {filteredLogs.length === 0 ? (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: '#666',
            }}
          >
            No hay eventos que coincidan con los filtros.
          </div>
        ) : (
          <div>
            {filteredLogs.map((log, index) => {
              const actor = log.actor_id
                ? profileMap.get(log.actor_id)
                : null

              const property =
                log.entity_type === 'property' && log.entity_id
                  ? propertyMap.get(log.entity_id)
                  : null

              const profile =
                log.entity_type === 'profile' && log.entity_id
                  ? profileMap.get(log.entity_id)
                  : null

              const reason = getReason(log.metadata)

              return (
                <article
                  key={log.id}
                  style={{
                    padding: '20px 24px',
                    borderBottom:
                      index === filteredLogs.length - 1
                        ? 'none'
                        : '1px solid #eee',
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
                      <div
                        style={{
                          fontSize: '16px',
                          fontWeight: 700,
                          color: '#222',
                        }}
                      >
                        {actionLabel(log.action, log.metadata)}
                      </div>

                      <div
                        style={{
                          marginTop: '6px',
                          fontSize: '13px',
                          color: '#666',
                        }}
                      >
                        {entityLabel(log.entity_type)}
                        {property && ` · ${property.title}`}
                        {profile && ` · ${profile.full_name}`}
                      </div>
                    </div>

                    <time
                      dateTime={log.created_at}
                      style={{
                        fontSize: '13px',
                        color: '#777',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {new Date(log.created_at).toLocaleString('es-MX')}
                    </time>
                  </div>

                  <div
                    style={{
                      marginTop: '10px',
                      fontSize: '12px',
                      color: '#777',
                    }}
                  >
                    Realizado por{' '}
                    <span style={{ fontWeight: 600, color: '#555' }}>
                      {actor?.full_name ||
                        actor?.company_name ||
                        'Usuario no disponible'}
                    </span>
                    {' · '}
                    {property ? (
                      <Link
                        href={`/admin/${property.id}?from=historial`}
                        style={{
                          color: '#555',
                          textDecoration: 'none',
                          fontWeight: 600,
                        }}
                      >
                        Ver propiedad
                      </Link>
                    ) : profile ? (
                      <Link
                        href={`/admin/asesores/${profile.id}`}
                        style={{
                          color: '#555',
                          textDecoration: 'none',
                          fontWeight: 600,
                        }}
                      >
                        Ver asesor
                      </Link>
                    ) : (
                      'Entidad no disponible'
                    )}
                  </div>

                  {reason && (
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: '#fff8f7',
                        border: '1px solid #f3d1cc',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#9f2d20',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        Motivo
                      </div>

                      <div
                        style={{
                          marginTop: '5px',
                          fontSize: '14px',
                          color: '#444',
                          lineHeight: 1.5,
                        }}
                      >
                        {reason}
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
