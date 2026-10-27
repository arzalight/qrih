import Link from 'next/link'
import { Header } from '@/components/Header'
import { NotificationReadButton } from '@/components/NotificationReadButton'
import { createServerSupabaseClient } from '@/lib/supabase-server'

type Notification = {
  id: string
  type: string
  title: string
  message: string
  read_at: string | null
  property_id: string | null
  created_at: string
}

type Property = {
  id: string
  slug: string | null
  title: string
}

type OwnerContact = {
  name: string | null
  phone: string | null
  company: string | null
  email: string | null
}

export default async function NotificationsPage() {
  const supabase = await createServerSupabaseClient()

  if (!supabase) {
    return (
      <>
        <Header />
        <main style={{ padding: 40 }}>
          <h1>Error de configuración</h1>
          <p>Supabase no está configurado correctamente.</p>
        </main>
      </>
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <>
        <Header />
        <main style={{ padding: 40 }}>
          <h1>Notificaciones</h1>
          <p>Necesitas iniciar sesión para ver tus notificaciones.</p>
          <Link href="/login">Iniciar sesión</Link>
        </main>
      </>
    )
  }

  const { data: notificationData, error: notificationsError } =
    await supabase
      .from('notifications')
      .select('id, type, title, message, read_at, property_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

  if (notificationsError) {
    console.warn('QRIH_APP_NOTIFICACIONES_PAGE_68_FAILED')
  }

  const notifications: Notification[] = notificationData || []
  const authorizedPropertyIds = Array.from(
    new Set(
      notifications
        .filter(
          (notification) =>
            notification.type === 'property_contact_authorized' &&
            notification.property_id
        )
        .map((notification) => notification.property_id as string)
    )
  )

  let approvedPropertyIds = new Set<string>()

  if (authorizedPropertyIds.length > 0) {
    const { data: authorizations, error: authorizationsError } =
      await supabase
        .from('property_contact_authorizations')
        .select('property_id')
        .eq('advisor_id', user.id)
        .eq('status', 'authorized')
        .in('property_id', authorizedPropertyIds)

    if (authorizationsError) {
      console.warn('QRIH_APP_NOTIFICACIONES_PAGE_96_FAILED')
    } else {
      approvedPropertyIds = new Set(
        (authorizations || []).map((authorization) => authorization.property_id)
      )
    }
  }

  const propertyIds = Array.from(
    new Set(
      notifications
        .map((notification) => notification.property_id)
        .filter((propertyId): propertyId is string => Boolean(propertyId))
    )
  )

  let propertiesById = new Map<string, Property>()

  if (propertyIds.length > 0) {
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, slug, title')
      .in('id', propertyIds)

    if (propertiesError) {
      console.warn('QRIH_APP_NOTIFICACIONES_PAGE_124_FAILED')
    } else {
      propertiesById = new Map(
        (properties || []).map((property) => [property.id, property])
      )
    }
  }

  const contactsByPropertyId = new Map<string, OwnerContact>()
  // Para avisos de otras cuentas, usar sólo propiedades aún públicas.
  const missingPublicIds = propertyIds.filter((id) => !propertiesById.has(id))
  if (missingPublicIds.length) {
    const { data } = await supabase.from('properties_public').select('id,slug,title').in('id',missingPublicIds)
    for (const property of data || []) propertiesById.set(property.id,property)
  }

  await Promise.all(
    Array.from(approvedPropertyIds).map(async (propertyId) => {
      const { data: ownerData, error: ownerError } = await supabase.rpc(
        'get_property_publisher_contact',
        { p_property_id: propertyId }
      )

      if (ownerError) {
        console.warn('QRIH_APP_NOTIFICACIONES_PAGE_142_FAILED')
        return
      }

      if (ownerData && ownerData.length > 0) {
        contactsByPropertyId.set(propertyId, ownerData[0])
      }
    })
  )

  return (
    <>
      <Header />
      <main
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '40px 24px 80px',
        }}
      >
        <div style={{ marginBottom: 32 }}>
          <Link href="/mis-propiedades">← Volver al panel</Link>
          <h1 style={{ marginBottom: 8 }}>Notificaciones</h1>
          <p style={{ color: "var(--muted)" }}>
            Aquí puedes consultar tus avisos y los contactos autorizados.
          </p>
        </div>

        {notifications.some(notification => !notification.read_at) && <NotificationReadButton />}
        {notifications.length === 0 ? (
          <section
            style={{ padding: 24, border: "1px solid var(--line)", borderRadius: 12 }}
          >
            No tienes notificaciones todavía.
          </section>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {notifications.map((notification) => {
              const property = notification.property_id
                ? propertiesById.get(notification.property_id)
                : null
              const contact = notification.property_id
                ? contactsByPropertyId.get(notification.property_id)
                : null

              return (
                <article
                  key={notification.id}
                  style={{
                    padding: 24,
                    border: "1px solid var(--line)",
                    borderRadius: 12,
                    background: notification.read_at ? "var(--surface)" : '#f8fafc',
                  }}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {!notification.read_at && (
                      <span
                        aria-label="Sin leer"
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: "var(--ink)",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <h2 style={{ fontSize: 18, margin: 0 }}>
                      {notification.title}
                    </h2>
                  </div>

                  <p style={{ lineHeight: 1.5 }}>{notification.message}</p>
                  {!notification.read_at && <NotificationReadButton id={notification.id} />}
                  <small style={{ color: "var(--muted)" }}>
                    {new Date(notification.created_at).toLocaleString('es-MX')}
                  </small>

                  {property?.slug && (
                    <p style={{ marginBottom: 0 }}>
                      <Link href={`/bodegas/${property.slug}`}>
                        Ver propiedad
                      </Link>
                    </p>
                  )}

                  {notification.type === 'property_contact_authorized' &&
                    contact && (
                      <section
                        style={{
                          marginTop: 20,
                          padding: 18,
                          border: '1px solid #bbf7d0',
                          borderRadius: 10,
                          background: '#f0fdf4',
                        }}
                      >
                        <h3 style={{ marginTop: 0 }}>Contacto autorizado</h3>
                        {contact.name && <p><strong>Nombre:</strong> {contact.name}</p>}
                        {contact.company && <p><strong>Empresa:</strong> {contact.company}</p>}
                        {contact.phone && (
                          <p>
                            <strong>Teléfono:</strong>{' '}
                            <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                          </p>
                        )}
                        {contact.email && (
                          <p style={{ marginBottom: 0 }}>
                            <strong>Correo:</strong>{' '}
                            <a href={`mailto:${contact.email}`}>{contact.email}</a>
                          </p>
                        )}
                      </section>
                    )}
                </article>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
