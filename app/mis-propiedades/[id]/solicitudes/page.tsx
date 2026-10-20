import Link from 'next/link'
import { propertyPrice } from '@/lib/property-price'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { AuthorizationActions } from '@/components/AuthorizationActions'
import { Header } from '@/components/Header'

export default async function SolicitudesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createServerSupabaseClient()

  if (!supabase) {
    return (
      <>
        <Header />
        <main style={{ padding: 40 }}>
          <h1>Solicitudes de información</h1>
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
      <main style={{ padding: 40 }}>
        <h1>Solicitudes de información</h1>
        <p>Necesitas iniciar sesión para ver esta información.</p>
        <Link href="/login">Iniciar sesión</Link>
      </main>
    )
  }

  const { data: property, error: propertyError } =
    await supabase
      .from('properties')
      .select('id, title, zone, operation, price_display, price_value, price_value_text:price_value::text, price_currency, price_unit')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single()

  if (propertyError || !property) {
    notFound()
  }

  const { data: contacts, error: contactsError } =
    await supabase
      .from('property_contacts')
      .select(
        'id, name, phone, email, company, message, source, created_at'
      )
      .eq('property_id', id)
      .order('created_at', { ascending: false })

  if (contactsError) {
    console.warn('QRIH_APP_MIS_PROPIEDADES_ID_SOLICITUDES_PAGE_64_FAILED')

    return (
      <main style={{ padding: 40 }}>
        <h1>Solicitudes de información</h1>
        <p>No fue posible cargar las solicitudes.</p>
      </main>
    )
  }

  const contactIds = contacts.map((contact) => contact.id)

  let authorizations: {
    id: string
    contact_id: string
    status: string
  }[] = []

  if (contactIds.length > 0) {
    const { data: authorizationData, error: authorizationError } =
      await supabase
        .from('property_contact_authorizations')
        .select('id, contact_id, status')
        .in('contact_id', contactIds)

    if (authorizationError) {
      console.warn('QRIH_APP_MIS_PROPIEDADES_ID_SOLICITUDES_PAGE_93_FAILED')
    } else {
      authorizations = authorizationData || []
    }
  }

  const authorizationByContact = authorizations.reduce(
    (result, authorization) => {
      result[authorization.contact_id] = authorization.status
      return result
    },
    {} as Record<string, string>
  )

  return (
    <>
      <Header />
      <main
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '40px 24px',
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <Link href="/mis-propiedades">
          ← Volver a mis propiedades
        </Link>

        <small
          style={{
            display: 'block',
            marginTop: 24,
          }}
        >
          SOLICITUDES DE INFORMACIÓN
        </small>

        <h1 style={{ margin: '8px 0' }}>
          {property.title}
        </h1>

        <p>
          {property.operation} · {propertyPrice(property)}
        </p>

        <p>{property.zone}</p>
      </div>

      <section>
        <h2>
          {contacts.length}{' '}
          {contacts.length === 1
            ? 'persona interesada'
            : 'personas interesadas'}
        </h2>

        {contacts.length === 0 ? (
          <div
            style={{
              marginTop: 20,
              padding: 24,
              border: '1px solid #ddd',
              borderRadius: 12,
            }}
          >
            <p>
              Todavía no has recibido solicitudes de
              información para esta propiedad.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: 16,
              marginTop: 20,
            }}
          >
            {contacts.map((contact) => {
              const authorizationStatus =
                authorizationByContact[contact.id] || 'none'

              return (
                <article
                  key={contact.id}
                  style={{
                    padding: 24,
                    border: '1px solid #ddd',
                    borderRadius: 12,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 16,
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <h3 style={{ marginTop: 0 }}>
                        {contact.name}
                      </h3>

                      <p>
                        <strong>Teléfono:</strong>{' '}
                        <a href={`tel:${contact.phone}`}>
                          {contact.phone}
                        </a>
                      </p>

                      <p>
                        <strong>Correo:</strong>{' '}
                        <a href={`mailto:${contact.email}`}>
                          {contact.email}
                        </a>
                      </p>

                      {contact.company && (
                        <p>
                          <strong>Empresa:</strong>{' '}
                          {contact.company}
                        </p>
                      )}

                      {contact.message && (
                        <div
                          style={{
                            marginTop: 16,
                            padding: 16,
                            background: '#f7f7f7',
                            borderRadius: 8,
                          }}
                        >
                          <strong>Mensaje</strong>

                          <p style={{ marginBottom: 0 }}>
                            {contact.message}
                          </p>
                        </div>
                      )}

                      <small
                        style={{
                          display: 'block',
                          marginTop: 16,
                          color: '#666',
                        }}
                      >
                        Solicitud recibida el{' '}
                        {new Date(
                          contact.created_at
                        ).toLocaleString('es-MX')}
                      </small>
                    </div>

                    <div
                      style={{
                        minWidth: 220,
                      }}
                    >
                      {authorizationStatus === 'pending' && (
                        <>
                          <div
                            style={{
                              marginBottom: 12,
                              padding: 12,
                              borderRadius: 8,
                              background: '#fff8e1',
                              border: '1px solid #e7d38a',
                            }}
                          >
                            <strong>
                              Nueva solicitud de contacto
                            </strong>
                            <p
                              style={{
                                margin: '6px 0 0',
                                fontSize: 14,
                              }}
                            >
                              Un asesor está solicitando
                              autorización para contactarlo.
                            </p>
                          </div>

                          <AuthorizationActions
                            authorizationId={
                              authorizations.find(
                                (authorization) =>
                                  authorization.contact_id ===
                                  contact.id
                              )?.id || ''
                            }
                          />
                        </>
                      )}

                      {authorizationStatus === 'authorized' && (
                        <div
                          style={{
                            padding: 12,
                            borderRadius: 8,
                            background: '#eef7ee',
                            border: '1px solid #b8d8b8',
                          }}
                        >
                          <strong>
                            Contacto autorizado
                          </strong>
                        </div>
                      )}

                      {authorizationStatus === 'declined' && (
                        <div
                          style={{
                            padding: 12,
                            borderRadius: 8,
                            background: '#f8f1f1',
                            border: '1px solid #dfc1c1',
                          }}
                        >
                          <strong>
                            Contacto rechazado
                          </strong>
                        </div>
                      )}

                      {authorizationStatus === 'none' && (
                        <div
                          style={{
                            padding: 12,
                            borderRadius: 8,
                            background: '#f7f7f7',
                            border: '1px solid #ddd',
                          }}
                        >
                          Solicitud anterior a la autorización.
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
      </main>
    </>
  )
}
