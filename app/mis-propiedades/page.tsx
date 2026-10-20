import Link from 'next/link'
import { SharePropertyButton } from '@/components/SharePropertyButton'
import { propertyPrice } from '@/lib/property-price'
import { Header } from '@/components/Header'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { rankPropertiesForDemand, type MatchingDemand } from '@/lib/matching'
import { AutoApproveContactsToggle } from '@/components/AutoApproveContactsToggle'
import { DeletePropertyButton } from '@/components/DeletePropertyButton'
import { AccountSuspensionNotice } from '@/components/AccountSuspensionNotice'
import { RegisterOpportunityButton } from '@/components/RegisterOpportunityButton'
import { OwnPropertyCover } from '@/components/OwnPropertyCover'
import { ManagePropertyActions } from '@/components/ManagePropertyActions'
import { createSignedPropertyImageUrlMap, PROPERTY_IMAGE_TTL_SECONDS } from '@/lib/property-image-urls'
type Opportunity = MatchingDemand & { id: string; status: string; created_at: string }
type OpportunityRegistration = {
  demand_request_id: string
  property_id: string
  status: string
  property: {
    id: string; slug: string | null; title: string; operation: string | null
    zone: string | null; total_area: number | null; price_display: string | null; price_value?: number | null; price_currency?: string | null; price_unit?: string | null
  } | null
}
function getStatusLabel(status: string) {
  switch (status) {
    case 'pending':
      return 'Pendiente'
    case 'pending_update':
      return 'Actualización en revisión'
    case 'published':
      return 'Publicada'
    case 'rejected':
      return 'Rechazada'
    case 'paused':
      return 'Pausada'
    case 'expired':
      return 'Expirada'
    case 'draft':
      return 'Borrador'
    default:
      return status
  }
}
function getStatusClass(status: string) {
  switch (status) {
    case 'published':
      return 'status published'
    case 'rejected':
      return 'status rejected'
    case 'paused':
      return 'status paused'
    case 'expired':
      return 'status expired'
    case 'draft':
      return 'status draft'
    default:
      return 'status pending'
  }
}
export default async function MisPropiedadesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  const activeView =
    view === 'requirements'
      ? 'requirements'
      : view === 'opportunities'
        ? 'opportunities'
        : 'properties'

  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Mis propiedades</h1>
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
        <h1>Mis propiedades</h1>
        <p>Necesitas iniciar sesión para ver tus propiedades.</p>
        <Link href="/login">Iniciar sesión</Link>
      </main>
    )
  }
  let viewCounts: Record<string, number> = {}
let weeklyViews = [0, 0, 0, 0]
let weeklyContacts = [0, 0, 0, 0]
const weekLabels = [0, 1, 2, 3]
  .map((index) => {
    const end = new Date()
    end.setDate(end.getDate() - index * 7)
    const start = new Date(end)
    start.setDate(start.getDate() - 6)
    return {
      start,
      end,
    }
  })
  .reverse()
  .map(
    ({ start, end }) =>
      `${start.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
      })} – ${end.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
      })}`
  )
let totalViews = 0
let totalContacts = 0
let conversionRate = 0
let topPropertyTitle = 'Sin datos'
let topPropertyContacts = 0
  const { data: profile } = await supabase
    .from('profiles')
    .select('auto_approve_contact_requests, account_status, publications_enabled')
    .eq('id', user.id)
    .single()

  const autoApproveContactRequests =
    profile?.auto_approve_contact_requests ?? false

  const { data: properties, error } = await supabase
    .from('properties')
    .select(
      'id, slug, title, operation, status, zone_general, zone, total_area, price_value, price_value_text:price_value::text, price_unit, price_currency, price_display, created_at, rejection_reason, main_image_path'
    )
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const { data: demandRequests, error: demandError } =
    await supabase
      .from('demand_requests')
      .select(
        'id, name, company, operation, zone_general, zone, area_min, area_max, budget_min, budget_max, status, created_at'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

  if (demandError) {
    console.warn('QRIH_APP_MIS_PROPIEDADES_PAGE_133_FAILED')
  }

  const { data: publishedProperties, error: publishedPropertiesError } =
    await supabase
      .from('properties')
      .select(
        'id, slug, title, operation, zone_general, zone, total_area, price_value, price_value_text:price_value::text, price_unit, price_currency, price_display'
      )
      .eq('status', 'published')

  if (publishedPropertiesError) {
    console.warn('QRIH_APP_MIS_PROPIEDADES_PAGE_148_FAILED')
  }

  const demandMatches = (demandRequests || []).map((request) => ({
    request,
    matches: rankPropertiesForDemand(
      {
        operation: request.operation,
        zone_general: request.zone_general,
        zone: request.zone,
        area_min: request.area_min,
        area_max: request.area_max,
        budget_min: request.budget_min,
        budget_max: request.budget_max,
      },
      (publishedProperties || []).map((property) => ({
        ...property,
        surface_m2: property.total_area,
      }))
    ).slice(0, 3),
  }))

  const { data: activeOpportunities, error: opportunitiesError } =
    await supabase
      .rpc('qrih_opportunity_feed')

  if (opportunitiesError) {
    console.warn('QRIH_APP_MIS_PROPIEDADES_PAGE_187_FAILED')
  }

  const { data: opportunityRegistrations, error: registrationsError } =
    await supabase
      .rpc('qrih_opportunity_registrations')

  if (registrationsError) {
    console.warn('QRIH_APP_MIS_PROPIEDADES_PAGE_221_FAILED')
  }

  const safeOpportunityRegistrations: OpportunityRegistration[] =
    Array.isArray(opportunityRegistrations) ? opportunityRegistrations : []
  const safeActiveOpportunities: Opportunity[] =
    Array.isArray(activeOpportunities) ? activeOpportunities : []

  const userPublishedProperties = (properties || [])
    .filter((property) => property.status === 'published')

  const opportunityMatches = safeActiveOpportunities
    .map((opportunity) => ({
      opportunity,
      matches: rankPropertiesForDemand(
        {
          operation: opportunity.operation,
          zone_general: opportunity.zone_general,
          zone: opportunity.zone,
          area_min: opportunity.area_min,
          area_max: opportunity.area_max,
          budget_min: opportunity.budget_min,
          budget_max: opportunity.budget_max,
        },
        (userPublishedProperties || []).map((property) => ({
          operation: property.operation,
          zone_general: property.zone_general,
          zone: property.zone,
          surface_m2: property.total_area,
          price_value: property.price_value,
          price_value_text: property.price_value_text,
          price_unit: property.price_unit,
          price_currency: property.price_currency,
          price_display: property.price_display,
          id: property.id,
          slug: property.slug,
          title: property.title,
        }))
      )
        .filter((match) => match.result.total > 0)
        .slice(0, 3),
    }))
    .filter(({ matches }) => matches.length > 0)
  let contactCounts: Record<string, number> = {}
  if (properties && properties.length > 0) {
    const propertyIds = properties.map(
      (property) => property.id
    )
    const { data: contacts, error: contactsError } =
      await supabase
        .from('property_contacts')
        .select('id, property_id, created_at')
        .in('property_id', propertyIds)
    if (contactsError) {
      console.warn('QRIH_APP_MIS_PROPIEDADES_PAGE_273_FAILED')
    } else {
totalContacts = (contacts || []).length
      contactCounts = (contacts || []).reduce(
        (counts, contact) => {
          counts[contact.property_id] =
            (counts[contact.property_id] || 0) + 1
          return counts
        },
        {} as Record<string, number>
      )
const topProperty = properties.reduce(
  (best, property) => {
    const count = contactCounts[property.id] || 0
    if (count > best.count) {
      return {
        id: property.id,
        title: property.title,
        count,
      }
    }
    return best
  },
  {
    id: '',
    title: 'Sin datos',
    count: 0,
  }
)
topPropertyTitle = topProperty.title
topPropertyContacts = topProperty.count
      ;(contacts || []).forEach((contact) => {
        const contactDate = new Date(contact.created_at)
        const daysAgo =
          (Date.now() - contactDate.getTime()) /
          (1000 * 60 * 60 * 24)
        if (daysAgo < 7) {
          weeklyContacts[3]++
        } else if (daysAgo < 14) {
          weeklyContacts[2]++
        } else if (daysAgo < 21) {
          weeklyContacts[1]++
        } else if (daysAgo < 28) {
          weeklyContacts[0]++
        }
      })
    }
  }
  if (properties && properties.length > 0) {
    const propertyIds = properties.map(
      (property) => property.id
    )
    const fourWeeksAgo = new Date()
    fourWeeksAgo.setDate(
      fourWeeksAgo.getDate() - 28
    )
    const { data: views, error: viewsError } =
      await supabase
        .from('property_views')
        .select('id, property_id, created_at')
        .in('property_id', propertyIds)
        .gte(
          'created_at',
          fourWeeksAgo.toISOString()
        )
    if (viewsError) {
      console.warn('QRIH_APP_MIS_PROPIEDADES_PAGE_342_FAILED')
    } else {
totalViews = (views || []).length
      viewCounts = (views || []).reduce(
        (counts, view) => {
          counts[view.property_id] =
            (counts[view.property_id] || 0) + 1
          return counts
        },
        {} as Record<string, number>
      )
    ;(views || []).forEach((view) => {
      const viewDate = new Date(view.created_at)
      const daysAgo =
        (Date.now() - viewDate.getTime()) /
        (1000 * 60 * 60 * 24)
      if (daysAgo < 7) {
        weeklyViews[3]++
      } else if (daysAgo < 14) {
        weeklyViews[2]++
      } else if (daysAgo < 21) {
        weeklyViews[1]++
      } else if (daysAgo < 28) {
        weeklyViews[0]++
      }
    })
    }
  }
if (totalViews > 0) {
  conversionRate = (totalContacts / totalViews) * 100
}
  if (error) {
    console.warn('QRIH_APP_MIS_PROPIEDADES_PAGE_377_FAILED')
    return (
      <main style={{ padding: 40 }}>
        <h1>Mis propiedades</h1>
        <p>No fue posible cargar tus propiedades.</p>
      </main>
    )
  }
  let coverUrls = new Map<string, string>()
  try {
    coverUrls = await createSignedPropertyImageUrlMap(supabase,
      (properties || []).map(property => property.main_image_path), PROPERTY_IMAGE_TTL_SECONDS.gallery)
  } catch { console.warn('QRIH_OWN_COVERS_UNAVAILABLE') }
return (
  <>
    <Header />
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: '0.04em',
            marginBottom: 8,
          }}
        >
          HOLA, FABIÁN
        </div>
        <h1>Aquí están tus publicaciones</h1>
        <p>
          Aquí puedes consultar y administrar lo que has publicado en QRO INDUSTRIAL HUB.
        </p>

        <div style={{ marginTop: 16, marginBottom: 24 }}>
          <Link
            href="/notificaciones"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '12px 20px',
              border: '1px solid #111827',
              borderRadius: 8,
              background: '#111827',
              color: '#ffffff',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Mis notificaciones
          </Link>
        </div>

        {profile?.account_status === 'suspended' && <AccountSuspensionNotice />}

        <AutoApproveContactsToggle
          initialValue={autoApproveContactRequests}
        />

        <div
          style={{
            display: 'flex',
            gap: 24,
            marginTop: 24,
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <Link
            href="/mis-propiedades?view=properties"
            style={{
              paddingBottom: 12,
              borderBottom:
                activeView === 'properties'
                  ? '2px solid #111827'
                  : '2px solid transparent',
              fontWeight:
                activeView === 'properties' ? 600 : 400,
              color:
                activeView === 'properties'
                  ? '#111827'
                  : '#6b7280',
              textDecoration: 'none',
            }}
          >
            Propiedades
          </Link>

          <Link
            href="/mis-propiedades?view=requirements"
            style={{
              paddingBottom: 12,
              borderBottom:
                activeView === 'requirements'
                  ? '2px solid #111827'
                  : '2px solid transparent',
              fontWeight:
                activeView === 'requirements' ? 600 : 400,
              color:
                activeView === 'requirements'
                  ? '#111827'
                  : '#6b7280',
              textDecoration: 'none',
            }}
          >
            Requerimientos
          </Link>

          <Link
            href="/mis-propiedades?view=opportunities"
            style={{
              paddingBottom: 12,
              borderBottom:
                activeView === 'opportunities'
                  ? '2px solid #111827'
                  : '2px solid transparent',
              fontWeight:
                activeView === 'opportunities' ? 600 : 400,
              color:
                activeView === 'opportunities'
                  ? '#111827'
                  : '#6b7280',
              textDecoration: 'none',
            }}
          >
            Oportunidades
          </Link>
        </div>
      </div>
{activeView === 'properties' && (
<section
  style={{
    marginBottom: 40,
    padding: 24,
    border: '1px solid #ddd',
    borderRadius: 16,
  }}
>
  <small>RENDIMIENTO</small>
  <h2 style={{ margin: '8px 0 24px' }}>
    Actividad de tus propiedades
  </h2>
<div
  style={{
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
    marginBottom: 32,
  }}
>
  <div
  style={{
    padding: 24,
    border: '1px solid #e7e2d8',
    borderRadius: 16,
    background: '#ffffff',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  }}
>
    <small>VISUALIZACIONES</small>
    <div
  style={{
    fontSize: 34,
    fontWeight: 700,
    marginTop: 10,
    letterSpacing: '-0.03em',
      }}
    >
      {totalViews}
    </div>
    <small>Últimos 28 días</small>
  </div>
  <div
    style={{
      padding: 24,
border: '1px solid #e7e2d8',
borderRadius: 16,
background: '#ffffff',
boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
    }}
  >
    <small>SOLICITUDES</small>
    <div
  style={{
    fontSize: 34,
    fontWeight: 700,
    marginTop: 10,
    letterSpacing: '-0.03em',
      }}
    >
      {totalContacts}
    </div>
    <small>Últimos 28 días</small>
  </div>
  <div
    style={{
      padding: 24,
border: '1px solid #e7e2d8',
borderRadius: 16,
background: '#ffffff',
boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
    }}
  >
    <small>CONVERSIÓN</small>
    <div
        style={{
    fontSize: 34,
    fontWeight: 700,
    marginTop: 10,
    letterSpacing: '-0.03em',
      }}
    >
      {conversionRate.toFixed(1)}%
    </div>
    <small>Solicitudes / Visualizaciones</small>
  </div>
  <div
    style={{
      padding: 24,
border: '1px solid #e7e2d8',
borderRadius: 16,
background: '#ffffff',
boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
display: 'flex',
flexDirection: 'column',
height: '100%',
    }}
  >
    <small>MAYOR INTERÉS</small>
    <div
      style={{
        fontSize: 18,
        fontWeight: 700,
        marginTop: 8,
      }}
    >
      {topPropertyTitle}
    </div>
    <small>
      {topPropertyContacts} solicitud
      {topPropertyContacts === 1 ? '' : 'es'}
    </small>
  </div>
</div>
 <div
  style={{
    marginTop: 24,
    paddingTop: 24,
    borderTop: '1px solid #eee',
  }}
>
<h3
  style={{
    marginBottom: 6,
    fontSize: 20,
    letterSpacing: '-0.01em',
  }}
>
  Actividad de las últimas 4 semanas
</h3>
<p
  style={{
    margin: 0,
    color: '#6b7280',
    fontSize: 14,
  }}
>
  Visualizaciones y solicitudes de información
</p>
  <div
    style={{
      display: 'grid',
      gridTemplateColumns:
        'repeat(4, minmax(0, 1fr))',
      gap: 16,
      alignItems: 'end',
    }}
  >
    {[0, 1, 2, 3].map((index) => {
      const maxValue = Math.max(
        ...weeklyViews,
        ...weeklyContacts,
        1
      )
      const viewHeight =
        (weeklyViews[index] / maxValue) * 150
      const contactHeight =
        (weeklyContacts[index] / maxValue) * 150
      return (
        <div
          key={index}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: '100%',
              height: 170,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: 6,
              borderBottom: '1px solid #ddd',
            }}
          >
            <div
              title={`${weeklyViews[index]} visualizaciones`}
              style={{
                width: '28%',
                height: `${Math.max(viewHeight, 4)}px`,
                background: '#111827',
                borderRadius: '6px 6px 0 0',
              }}
            />
            <div
              title={`${weeklyContacts[index]} solicitudes`}
              style={{
                width: '28%',
                height: `${Math.max(contactHeight, 4)}px`,
                background: '#c9a227',
                borderRadius: '6px 6px 0 0',
              }}
            />
          </div>
         <strong
  style={{
    fontSize: 13,
    fontWeight: 600,
    textAlign: 'center',
  }}
>
  {weekLabels[index]}
</strong>
          <small>
            👁 {weeklyViews[index]} · 📩{' '}
            {weeklyContacts[index]}
          </small>
        </div>
      )
    })}
  </div>
  <div
    style={{
      display: 'flex',
      gap: 24,
      marginTop: 20,
      fontSize: 13,
    }}
  >
    <span
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }}
>
  <span
    style={{
      width: 10,
      height: 10,
      borderRadius: 3,
      background: '#111827',
      display: 'inline-block',
    }}
  />
  Visualizaciones
</span>
<span
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }}
>
  <span
    style={{
      width: 10,
      height: 10,
      borderRadius: 3,
      background: '#c9a227',
      display: 'inline-block',
    }}
  />
  Solicitudes
</span>
  </div>
</div>
      {properties.length === 0 ? (
        <section
          style={{
            padding: 32,
            border: '1px solid #ddd',
            borderRadius: 12,
          }}
        >
          <h2>Aún no tienes propiedades cargadas</h2>
          <p>Cuando publiques una propiedad aparecerá aquí.</p>
          <Link href="/publicar">Publicar una propiedad</Link>
        </section>
      ) : (
        <section
  style={{
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
    gap: 20,
alignItems: 'stretch',
  }}
>
          {properties.map((property) => (
            <article
              key={property.id}
              className="own-property-card"
              style={{
                border: '1px solid #ddd',
                borderRadius: 12,
                padding: 24,
                minWidth: 0,
                overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
              }}
            >
              <div style={{ position: 'relative', margin: '-24px -24px 20px' }}>
                <OwnPropertyCover key={`${property.id}:${coverUrls.get(property.main_image_path) || ''}`} propertyId={property.id}
                  initialUrl={coverUrls.get(property.main_image_path) || null} title={property.title} />
                <span className={getStatusClass(property.status)} style={{ position: 'absolute', top: 12, left: 12 }}>
                  {getStatusLabel(property.status)}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 20,
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <small>{property.zone}</small>
                  <h2 style={{ margin: '8px 0' }}>
                    {property.title}
                  </h2>
                  <p>
                    {property.operation} · {propertyPrice(property)}
                  </p>
                  <p>{property.total_area != null ? `${Number(property.total_area).toLocaleString('es-MX')} m²` : 'Superficie no especificada'}</p>
                  <p>
                    Registrada el{' '}
                    {new Date(property.created_at).toLocaleDateString(
                      'es-MX'
                    )}
                  </p>
<div
  style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginTop: 20,
  }}
>
  <div
    style={{
      padding: 14,
      borderRadius: 12,
      background: '#f7f7f7',
    }}
  >
    <small
      style={{
        display: 'block',
        color: '#6b7280',
        marginBottom: 4,
      }}
    >
      Visualizaciones
    </small>
    <strong
      style={{
        fontSize: 24,
      }}
    >
      {viewCounts[property.id] || 0}
    </strong>
    <small
      style={{
        display: 'block',
        color: '#6b7280',
        marginTop: 2,
      }}
    >
      Últimos 28 días
    </small>
  </div>
  <div
    style={{
      padding: 14,
      borderRadius: 12,
      background: '#f7f7f7',
    }}
  >
    <small
      style={{
        display: 'block',
        color: '#6b7280',
        marginBottom: 4,
      }}
    >
      Solicitudes
    </small>
    <strong
      style={{
        fontSize: 24,
      }}
    >
      {contactCounts[property.id] || 0}
    </strong>
  </div>
</div>
                </div>
              </div>
              {property.status === 'rejected' &&
                property.rejection_reason && (
                  <div
                    style={{
                      marginTop: 20,
                      padding: 16,
                      borderRadius: 8,
                      background: '#f8f8f8',
                    }}
                  >
                    <strong>Motivo del rechazo</strong>
                    <p>{property.rejection_reason}</p>
                  </div>
                )}
{property.status === 'pending' && (
  <div
    style={{
      marginTop: '16px',
      padding: '14px 16px',
      borderRadius: '10px',
      background: '#f7f7f7',
      border: '1px solid #e5e5e5',
      fontSize: '14px',
      lineHeight: 1.5,
    }}
  >
    <strong>En revisión</strong>
    <p style={{ margin: '6px 0 0' }}>
      Tu propiedad fue enviada correctamente y está siendo
      revisada por nuestro equipo. Una vez aprobada,
      aparecerá publicada en el inventario.
    </p>
  </div>
)}
        <div
  style={{
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginTop: 'auto',
    paddingTop: 20,
alignItems: 'center',
width: '100%',
marginBottom: 4,
  }}
>
<Link
  href={`/mis-propiedades/${property.id}/solicitudes`}
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 16px',
    borderRadius: 10,
    background: '#111827',
    color: '#ffffff',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 600,
width: '180px',
  }}
>
  Ver solicitudes
</Link>
  {property.status === 'published' && (
<Link
  href={`/bodegas/${property.slug}`}
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 16px',
    borderRadius: 10,
    border: '1px solid #c9a227',
    background: '#ffffff',
    color: '#8a6d13',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 600,
width: '180px',
  }}
>
  Ver propiedad
</Link>
  )}
  <ManagePropertyActions propertyId={property.id} status={property.status} disabled={profile?.account_status !== 'active'} />
  <SharePropertyButton slug={property.slug} title={property.title} status={property.status} disabled={profile?.account_status !== 'active' || profile?.publications_enabled !== true} />

  <DeletePropertyButton propertyId={property.id} />
</div>
            </article>
          ))}
        </section>
      )}

</section>
)}

      {activeView === 'opportunities' && (
        <section
          style={{
            marginTop: 40,
            padding: 24,
            border: '1px solid #ddd',
            borderRadius: 16,
          }}
        >
          <small>OPORTUNIDADES</small>
          <h2 style={{ margin: '8px 0 8px' }}>
            Oportunidades para tus propiedades
          </h2>
          <p
            style={{
              margin: '0 0 24px',
              color: '#6b7280',
            }}
          >
            Requerimientos de clientes que coinciden con alguna de tus propiedades publicadas.
          </p>

          {opportunityMatches.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gap: 16,
              }}
            >
              {opportunityMatches.map(({ opportunity, matches }) => (
                <article
                  key={opportunity.id}
                  style={{
                    padding: 20,
                    border: '1px solid #e5e7eb',
                    borderRadius: 12,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 16,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 18 }}>
                        Oportunidad compatible
                      </strong>

                      <p
                        style={{
                          margin: '8px 0 0',
                          color: '#374151',
                        }}
                      >
                        {opportunity.operation}
                        {opportunity.zone_general
                          ? ` · ${opportunity.zone_general}`
                          : ''}
                        {opportunity.zone
                          ? ` · ${opportunity.zone}`
                          : ''}
                      </p>

                      <p
                        style={{
                          margin: '8px 0 0',
                        }}
                      >
                        {opportunity.area_min != null &&
                        opportunity.area_max != null
                          ? `${opportunity.area_min.toLocaleString('es-MX')}–${opportunity.area_max.toLocaleString('es-MX')} m²`
                          : opportunity.area_min != null
                            ? `Desde ${opportunity.area_min.toLocaleString('es-MX')} m²`
                            : opportunity.area_max != null
                              ? `Hasta ${opportunity.area_max.toLocaleString('es-MX')} m²`
                              : 'Superficie no especificada'}
                      </p>

                      <p
                        style={{
                          margin: '8px 0 0',
                        }}
                      >
                        {opportunity.budget_min != null &&
                        opportunity.budget_max != null
                          ? `$${opportunity.budget_min.toLocaleString('es-MX')}–$${opportunity.budget_max.toLocaleString('es-MX')}`
                          : opportunity.budget_min != null
                            ? `Desde $${opportunity.budget_min.toLocaleString('es-MX')}`
                            : opportunity.budget_max != null
                              ? `Hasta $${opportunity.budget_max.toLocaleString('es-MX')}`
                              : 'Presupuesto no especificado'}
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 18,
                      paddingTop: 18,
                      borderTop: '1px solid #eee',
                    }}
                  >
                    <small>
                      Esta oportunidad no muestra datos de contacto del cliente.
                    </small>

                    <div
                      style={{
                        display: 'grid',
                        gap: 12,
                        marginTop: 14,
                      }}
                    >
                      {matches.map(({ property, result }) => {
                        const isRegistered =
                          safeOpportunityRegistrations.some(
                            (registration) =>
                              registration.demand_request_id === opportunity.id &&
                              registration.property_id === property.id
                          )

                        return (
                          <div
                            key={property.id}
                            style={{
                              padding: '14px 16px',
                              border: '1px solid #e5e7eb',
                              borderRadius: 10,
                              background: '#fafafa',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: 16,
                                flexWrap: 'wrap',
                              }}
                            >
                              <div>
                                <strong>{property.title}</strong>

                                <p
                                  style={{
                                    margin: '6px 0 0',
                                    color: '#4b5563',
                                    fontSize: 14,
                                  }}
                                >
                                  {property.surface_m2 || 'N/D'} m² ·{' '}
                                  {propertyPrice(property)}
                                </p>

                                <p
                                  style={{
                                    margin: '6px 0 0',
                                    color: '#6b7280',
                                    fontSize: 13,
                                  }}
                                >
                                  Coincidencia: {Math.round(result.total)}%
                                </p>
                              </div>

                              {isRegistered ? (
                                <div
                                  style={{
                                    padding: '9px 14px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 8,
                                    background: '#f9fafb',
                                    color: '#111827',
                                    fontWeight: 600,
                                    fontSize: 13,
                                  }}
                                >
                                  Propiedad registrada ✓
                                </div>
                              ) : (
                                <RegisterOpportunityButton
                                  demandRequestId={opportunity.id}
                                  propertyId={property.id}
                                />
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: 24,
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                background: '#fafafa',
              }}
            >
              <strong>Aún no tienes oportunidades compatibles.</strong>
              <p
                style={{
                  margin: '8px 0 0',
                  color: '#6b7280',
                }}
              >
                Cuando exista un requerimiento compatible con alguna de tus propiedades publicadas, aparecerá aquí.
              </p>
            </div>
          )}
        </section>
      )}

      {activeView === 'requirements' && (
      <section
        style={{
          marginTop: 40,
          padding: 24,
          border: '1px solid #ddd',
          borderRadius: 16,
        }}
      >
        <small>REQUERIMIENTOS</small>
        <h2 style={{ margin: '8px 0 20px' }}>
          Mis requerimientos
        </h2>

        {demandRequests && demandRequests.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gap: 16,
            }}
          >
            {demandMatches.map(({ request, matches }) => (
              <article
                key={request.id}
                style={{
                  padding: 20,
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 18 }}>
                      {request.company || request.name}
                    </strong>
                    <p style={{ margin: '8px 0 0' }}>
                      {request.operation}
                      {request.zone_general
                        ? ` · ${request.zone_general}`
                        : ''}
                      {request.zone
                        ? ` · ${request.zone}`
                        : ''}
                    </p>
                  </div>

                  <span
                    style={{
                      padding: '6px 10px',
                      borderRadius: 999,
                      background:
                        request.status === 'active'
                          ? '#f3f4f6'
                          : '#e5e7eb',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {request.status === 'active'
                      ? 'Activo'
                      : request.status}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 24,
                    flexWrap: 'wrap',
                    marginTop: 16,
                    fontSize: 14,
                    color: '#4b5563',
                  }}
                >
                  <span>
                    Área:{' '}
                    {request.area_min || request.area_max
                      ? `${request.area_min || 0} – ${request.area_max || '∞'} m²`
                      : 'No especificada'}
                  </span>

                  <span>
                    Presupuesto:{' '}
                    {request.budget_min || request.budget_max
                      ? `$${request.budget_min || 0} – $${request.budget_max || '∞'}`
                      : 'No especificado'}
                  </span>
                </div>

                <small
                  style={{
                    display: 'block',
                    marginTop: 14,
                    color: '#6b7280',
                  }}
                >
                  Publicado el{' '}
                  {new Date(
                    request.created_at
                  ).toLocaleDateString('es-MX')}
                </small>

                <div
                  style={{
                    marginTop: 24,
                    paddingTop: 20,
                    borderTop: '1px solid #eee',
                  }}
                >
                  <strong>Propiedades que podrían interesarte</strong>

                  {matches.length > 0 ? (
                    <div
                      style={{
                        marginTop: 12,
                        border: '1px solid #e5e7eb',
                        borderRadius: 12,
                        overflow: 'hidden',
                      }}
                    >
                      {matches.map(({ property, result }) => {
                        const isHighMatch = result.total >= 75

                        return (
                          <div
                            key={property.id}
                            style={{
                              padding: 16,
                              border: '1px solid #e5e7eb',
                              borderRadius: 12,
                              background: '#fff',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: 12,
                                alignItems: 'flex-start',
                              }}
                            >
                              <div>
                                <strong>{property.title}</strong>
                                <p
                                  style={{
                                    margin: '6px 0 0',
                                    fontSize: 14,
                                    color: '#4b5563',
                                  }}
                                >
                                  {property.operation} · {property.zone}
                                </p>
                              </div>

                              <span
                                style={{
                                  whiteSpace: 'nowrap',
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: isHighMatch
                                    ? '#18794e'
                                    : '#9a6700',
                                }}
                              >
                                {isHighMatch
                                  ? 'Alta coincidencia'
                                  : 'Coincidencia'}
                              </span>
                            </div>

                            <p
                              style={{
                                margin: '10px 0 0',
                                fontSize: 14,
                                color: '#4b5563',
                              }}
                            >
                              {property.total_area || 'N/D'} m² ·{' '}
                              {propertyPrice(property)}
                            </p>

                            {property.slug && (
                              <Link
                                href={`/bodegas/${property.slug}`}
                                style={{
                                  display: 'inline-block',
                                  marginTop: 12,
                                  padding: '9px 14px',
                                  borderRadius: 9,
                                  background: '#111',
                                  color: '#fff',
                                  textDecoration: 'none',
                                  fontSize: 13,
                                  fontWeight: 600,
                                }}
                              >
                                Ver propiedad
                              </Link>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p
                      style={{
                        margin: '10px 0 0',
                        color: '#6b7280',
                        fontSize: 14,
                      }}
                    >
                      Aún no encontramos propiedades compatibles.
                    </p>
                  )}

                <div
                  style={{
                    marginTop: 24,
                    paddingTop: 20,
                    borderTop: '1px solid #eee',
                  }}
                >
                  <strong>Propiedades registradas para este requerimiento</strong>

                  {safeOpportunityRegistrations.filter(
                    (registration) =>
                      registration.demand_request_id === request.id
                  ).length > 0 ? (
                    <div
                      style={{
                        marginTop: 12,
                        border: '1px solid #e5e7eb',
                        borderRadius: 12,
                        overflow: 'hidden',
                      }}
                    >
                      {safeOpportunityRegistrations
                        .filter(
                          (registration) =>
                            registration.demand_request_id === request.id
                        )
                        .map((registration) => {
                          const property = Array.isArray(
                            registration.property
                          )
                            ? registration.property[0]
                            : registration.property

                          if (!property) {
                            return null
                          }

                          return (
                            <div
                              key={registration.property_id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 16,
                                padding: '14px 16px',
                                borderBottom: '1px solid #e5e7eb',
                              }}
                            >
                              <div
                                style={{
                                  minWidth: 0,
                                  flex: 1,
                                }}
                              >
                                <strong
                                  style={{
                                    display: 'block',
                                    fontSize: 14,
                                  }}
                                >
                                  {property.title}
                                </strong>

                                <p
                                style={{
                                  margin: '6px 0 0',
                                  fontSize: 14,
                                  color: '#4b5563',
                                }}
                              >
                                {property.operation} · {property.zone}
                              </p>

                              <p
                                style={{
                                  margin: '8px 0 0',
                                  fontSize: 14,
                                  color: '#4b5563',
                                }}
                              >
                                {property.total_area || 'N/D'} m² ·{' '}
                                {propertyPrice(property)}
                              </p>

                                <div
                                  style={{
                                    marginTop: 5,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: '#374151',
                                  }}
                                >
                                  Registrada
                                </div>
                              </div>

                              {property.slug && (
                                <Link
                                  href={`/bodegas/${property.slug}`}
                                  style={{
                                    flexShrink: 0,
                                    padding: '8px 12px',
                                    borderRadius: 8,
                                    background: '#111',
                                    color: '#fff',
                                    textDecoration: 'none',
                                    fontSize: 12,
                                    fontWeight: 600,
                                  }}
                                >
                                  Ver propiedad
                                </Link>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  ) : (
                    <p
                      style={{
                        margin: '10px 0 0',
                        color: '#6b7280',
                        fontSize: 14,
                      }}
                    >
                      Aún no hay propiedades registradas para este requerimiento.
                    </p>
                  )}
                </div>

                </div>
              </article>
            ))}
          </div>
        ) : (
          <div>
            <p>
              Aún no tienes requerimientos publicados.
            </p>
            <Link href="/busco-bodega">
              Publicar un requerimiento
            </Link>
          </div>
        )}
      </section>
      )}
    </main>
  </>
  )
}
