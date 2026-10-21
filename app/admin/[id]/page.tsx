import { Header } from '@/components/Header'
import { PriceCurrencySelect } from '@/components/PriceCurrencySelect'
import { isPriceCurrency, parsePriceInput, propertyPrice, propertyPriceForStorage, type PricedProperty } from '@/lib/property-price'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ZoneSelectors } from '@/components/ZoneSelectors'
import { PropertyImageGallery } from '@/components/PropertyImageGallery'
import { createSignedPropertyImageUrlMap, PROPERTY_IMAGE_TTL_SECONDS } from '@/lib/property-image-urls'

type AdminPropertyPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ from?: string }>
}

function showValue(value: string | number | boolean | null) {
  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No'
  }

  return value || 'N/D'
}

function showDate(value: string | null) {
  return value ? new Date(value).toLocaleString('es-MX') : 'N/D'
}

async function getAuthenticatedAdmin() {
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

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, account_status')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'admin' || profile?.account_status !== 'active') {
    throw new Error('No tienes permisos para moderar propiedades.')
  }

  return { supabase, user }
}

function formatComparisonValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return 'Sin información'
  }

  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No'
  }

  return String(value)
}

function getChangedFields(
  previousData: Record<string, unknown> | null,
  currentData: Record<string, unknown>
) {
  if (!previousData) return []

  const fields = [
  { key: 'title', label: 'Título' },
  { key: 'operation', label: 'Operación' },
  { key: 'price_display', label: 'Precio' },
  { key: 'price_plus_vat', label: 'Precio más IVA' },
  { key: 'price_plus_maintenance', label: 'Precio más mantenimiento' },
  { key: 'negotiable', label: 'Precio negociable' },
  { key: 'zone', label: 'Zona' },
  { key: 'location_visibility', label: 'Visibilidad de ubicación' },
  { key: 'address', label: 'Dirección' },
  { key: 'total_area', label: 'Superficie total' },
  { key: 'covered_area', label: 'Superficie techada' },
  { key: 'exterior_area', label: 'Superficie exterior' },
  { key: 'max_height', label: 'Altura máxima' },
  { key: 'offices_area', label: 'Área de oficinas' },
  { key: 'parking', label: 'Estacionamientos' },
  { key: 'docks', label: 'Andenes' },
  { key: 'description', label: 'Descripción' },
  { key: 'share_commission', label: 'Comparte comisión' },
  { key: 'main_image', label: 'Fotografía principal' },
  { key: 'main_image_path', label: 'Ruta de fotografía principal' },
]

  return fields
    .filter(({ key }) => {
      return (
        formatComparisonValue(previousData[key]) !==
        formatComparisonValue(currentData[key])
      )
    })
    .map(({ key, label }) => ({
      key,
      label,
      before: key === 'price_display' ? propertyPrice(previousData as PricedProperty) : formatComparisonValue(previousData[key]),
      after: key === 'price_display' ? propertyPrice(currentData as PricedProperty) : formatComparisonValue(currentData[key]),
    }))
}

export default async function AdminPropertyPage({
  params,
  searchParams,
}: AdminPropertyPageProps) {
  const { id } = await params
  const { from } = await searchParams
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

async function updateProperty(formData: FormData) {
  'use server'

  const {
    supabase: actionSupabase,
    user: actionUser,
  } = await getAuthenticatedAdmin()

  const fields = [
    'title',
    'operation',
    'zone_general',
    'zone',
    'address',
    'location_visibility',
    'price_display',
    'price_value',
    'price_unit',
    'price_currency',
    'price_plus_vat',
    'price_plus_maintenance',
    'negotiable',
    'total_area',
    'covered_area',
    'exterior_area',
    'max_height',
    'offices_area',
    'parking',
    'docks',
    'description',
    'share_commission',
    'main_image_path',
    'featured',
    'featured_priority',
  ]

  const booleanFields = new Set([
    'price_plus_vat',
    'price_plus_maintenance',
    'negotiable',
    'share_commission',
    'featured',
  ])

  const numericFields = new Set([
    'price_value',
    'total_area',
    'covered_area',
    'exterior_area',
    'offices_area',
    'parking',
    'docks',
    'featured_priority',
  ])

  const updates: Record<string, unknown> = {}

  for (const field of fields) {
    if (booleanFields.has(field)) {
      updates[field] = formData.get(field) === 'on'
      continue
    }

    const value = String(formData.get(field) ?? '').trim()

    if (field === 'price_value') {
      updates[field] = parsePriceInput(value)
      if (!updates[field]) throw new Error('Precio inválido. Usa un importe decimal válido.')
    } else if (numericFields.has(field)) {
      updates[field] = value === '' ? null : Number(value)
    } else {
      updates[field] = value === '' ? null : value
    }
  }

  if (!formData.has('price_unit')) throw new Error('Selecciona una unidad antes de guardar; no se eliminará la unidad heredada automáticamente.')
  if (!isPriceCurrency(updates.price_currency)) throw new Error('Selecciona MXN o USD.')
  updates.price_display = propertyPriceForStorage(updates)
  if (!updates.title || !updates.operation || !updates.zone_general || !updates.zone) {
    throw new Error('Faltan campos obligatorios para guardar la propiedad.')
  }

  const {
    data: propertyBeforeUpdate,
    error: propertyBeforeUpdateError,
  } = await actionSupabase
    .from('properties')
    .select('*,price_value_text:price_value::text')
    .eq('id', id)
    .single()

  if (propertyBeforeUpdateError || !propertyBeforeUpdate) {
    throw new Error('No se encontró la propiedad.')
  }

  const {
    data: propertyAfterUpdate,
    error: updateError,
  } = await actionSupabase
    .from('properties')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*,price_value_text:price_value::text')
    .single()

  if (updateError || !propertyAfterUpdate) {
    throw new Error(updateError?.message || 'No se pudo actualizar la propiedad.')
  }

  const changedFields = fields.filter(
    (field) =>
      String(propertyBeforeUpdate[field] ?? '') !==
      String(propertyAfterUpdate[field] ?? '')
  )

  if (changedFields.length > 0) {
    const { error: auditError } = await actionSupabase
      .from('audit_logs')
      .insert({
        actor_id: actionUser.id,
        entity_type: 'property',
        entity_id: id,
        action: 'property_updated',
        metadata: {
          changed_fields: changedFields,
          before: Object.fromEntries(
            changedFields.map((field) => [field, propertyBeforeUpdate[field]])
          ),
          after: Object.fromEntries(
            changedFields.map((field) => [field, propertyAfterUpdate[field]])
          ),
        },
      })

    if (auditError) {
      throw new Error(auditError.message)
    }
  }

  redirect(`/admin/${id}?success=updated`)
}

async function moderateProperty(formData: FormData) {
  'use server'

  const action = formData.get('action')
  const rejectionReason = String(
    formData.get('rejection_reason') || ''
  ).trim()

  if (
    action !== 'publish' &&
    action !== 'reject' &&
    action !== 'unpublish'
  ) {
    throw new Error('Acción de moderación no válida.')
  }

  if (
    (action === 'reject' || action === 'unpublish') &&
    !rejectionReason
  ) {
    throw new Error('Debes indicar el motivo de la baja.')
  }

  const {
    supabase: actionSupabase,
    user: actionUser,
  } = await getAuthenticatedAdmin()

  const { error } = await actionSupabase.rpc('qrih_moderate_property', {
    p_property_id: id, p_action: action, p_reason: rejectionReason || null,
  })
  if (error) {
    throw new Error('No se pudo moderar. Recarga y comprueba el estado actual; no se guardó una acción incompleta.')
  }

redirect(
  action === 'publish'
    ? '/admin?success=published'
    : action === 'reject'
      ? '/admin?success=rejected'
      : '/admin?success=unpublished'
)
}

  const { data: property, error } = await supabase
    .from('properties')
    .select('*,price_value_text:price_value::text')
    .eq('id', id)
 
    .single()

  if (error || !property) {
    notFound()
  }

  const { data: galleryImages, error: galleryError } = await supabase
    .from('property_images')
    .select('storage_path, title, position')
    .eq('property_id', property.id)
    .order('position', { ascending: true })

  if (galleryError) {
console.warn('QRIH_APP_ADMIN_ID_PAGE_344_FAILED')
  }
  const urls = await createSignedPropertyImageUrlMap(supabase,
    [property.main_image_path, ...(galleryImages || []).map((image) => image.storage_path)],
    PROPERTY_IMAGE_TTL_SECONDS.admin)
  const mainImageUrl = urls.get(property.main_image_path || '')
const changedFields = getChangedFields(
  property.previous_data as Record<string, unknown> | null,
  property as Record<string, unknown>
)

  const { data: propertyAuditLogs, error: auditLogsError } = await supabase
    .from('audit_logs')
    .select('action, metadata, created_at')
    .eq('entity_type', 'property')
    .eq('entity_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (auditLogsError) {
console.warn('QRIH_APP_ADMIN_ID_PAGE_364_FAILED')
  }

  return (
    <><Header administration /><main className="admin-page" style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <Link
        href={from === 'historial' ? '/admin/historial' : '/admin'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: "var(--muted)",
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: 600,
        }}
      >
        ← {from === 'historial' ? 'Volver al historial' : 'Volver al panel'}
      </Link>

      <header
        style={{
          marginTop: '24px',
          marginBottom: '32px',
          padding: '28px',
          border: "1px solid var(--line)",
          borderRadius: '18px',
          background: "var(--surface)",
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
            <p
              style={{
                margin: '0 0 8px',
                color: "var(--muted)",
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Ficha administrativa
            </p>

            <h1
              style={{
                margin: 0,
                fontSize: '32px',
                lineHeight: 1.15,
                letterSpacing: '-0.025em',
              }}
            >
              {property.title}
            </h1>

            <p
              style={{
                margin: '10px 0 0',
                color: "var(--muted)",
                fontSize: '14px',
              }}
            >
              Enviada el{' '}
              {new Date(property.created_at).toLocaleString('es-MX')}
            </p>
          </div>

          <div
            style={{
              padding: '8px 12px',
              borderRadius: '999px',
              background:
                property.status === 'published'
                  ? '#e8f5e9'
                  : property.status === 'rejected'
                    ? '#ffebee'
                    : '#fff3e0',
              color:
                property.status === 'published'
                  ? '#2e7d32'
                  : property.status === 'rejected'
                    ? '#c62828'
                    : '#8a4b08',
              fontSize: '13px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            {property.status === 'pending'
              ? 'Pendiente de revisión'
              : property.status === 'published'
                ? 'Publicada'
                : property.status === 'rejected'
                  ? 'Rechazada'
                  : property.status}
          </div>
        </div>
      </header>
{property.previous_data && (
  <section
    style={{
      marginBottom: '32px',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid #d8d8d8',
      background: "var(--surface-subtle)",
    }}
  >
    <h2 style={{ marginTop: 0 }}>
      Cambios realizados después del rechazo
    </h2>

    {changedFields.length === 0 ? (
      <p>
        No se detectaron cambios en los campos principales.
      </p>
    ) : (
      <div style={{ display: 'grid', gap: '16px' }}>
        {changedFields.map((field) => (
          <div
            key={field.key}
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: "var(--surface)",
              border: "1px solid var(--line)",
            }}
          >
            <strong>{field.label}</strong>

            <div style={{ marginTop: '8px' }}>
              <p style={{ margin: '4px 0' }}>
                <strong>Antes:</strong> {field.before}
              </p>

              <p style={{ margin: '4px 0' }}>
                <strong>Ahora:</strong> {field.after}
              </p>
            </div>
          </div>
        ))}
      </div>
    )}
  </section>
)}

      {mainImageUrl && (
        <img
          src={mainImageUrl}
          alt={property.title}
          style={{
            width: '100%',
            maxHeight: '480px',
            objectFit: 'cover',
            borderRadius: '12px',
            marginBottom: '32px',
          }}
        />
      )}

      {(galleryImages || []).length > 0 && (
        <section style={{ marginBottom: '32px' }}>
          <h2>Galería de fotografías</h2>
          <PropertyImageGallery
            images={(galleryImages || []).map((image) => ({
              url: urls.get(image.storage_path)!,
              title: image.title,
            }))}
            propertyTitle={property.title}
            variant="admin"
          />
        </section>
      )}

      <section
        style={{
          marginBottom: '32px',
          padding: '24px',
          border: "1px solid var(--line)",
          borderRadius: '16px',
          background: "var(--surface)",
          boxShadow: '0 2px 8px rgba(0,0,0,0.035)',
        }}
      >
        <h2 style={{ margin: '0 0 20px' }}>Información general</h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '18px 24px',
          }}
        >
          {[
            ['Estado', property.status],
            ['Operación', property.operation],
            ['Zona', property.zone],
            ['Dirección', showValue(property.address)],
            [
              'Visibilidad de ubicación',
              property.location_visibility === 'address'
                ? 'Dirección completa'
                : 'Solo zona',
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                paddingBottom: '14px',
                borderBottom: '1px solid #eeeeee',
              }}
            >
              <div
                style={{
                  color: "var(--muted)",
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {label}
              </div>

              <div
                style={{
                  marginTop: '6px',
                  fontSize: '15px',
                  fontWeight: 600,
                  lineHeight: 1.4,
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          marginBottom: '32px',
          padding: '24px',
          border: "1px solid var(--line)",
          borderRadius: '16px',
          background: "var(--surface)",
          boxShadow: '0 2px 8px rgba(0,0,0,0.035)',
        }}
      >
        <h2 style={{ margin: '0 0 20px' }}>Precio y condiciones</h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '18px 24px',
          }}
        >
          {[
            ['Precio', propertyPrice(property)],
            ['Precio más IVA', showValue(property.price_plus_vat)],
            [
              'Precio más mantenimiento',
              showValue(property.price_plus_maintenance),
            ],
            ['Precio negociable', showValue(property.negotiable)],
            ['Comparte comisión', showValue(property.share_commission)],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                paddingBottom: '14px',
                borderBottom: '1px solid #eeeeee',
              }}
            >
              <div
                style={{
                  color: "var(--muted)",
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {label}
              </div>

              <div
                style={{
                  marginTop: '6px',
                  fontSize: '15px',
                  fontWeight: 600,
                  lineHeight: 1.4,
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          marginBottom: '32px',
          padding: '24px',
          border: "1px solid var(--line)",
          borderRadius: '16px',
          background: "var(--surface)",
          boxShadow: '0 2px 8px rgba(0,0,0,0.035)',
        }}
      >
        <h2 style={{ margin: '0 0 20px' }}>
          Superficies y especificaciones
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '18px 24px',
          }}
        >
          {[
            ['Superficie total', `${showValue(property.total_area)} m²`],
            ['Superficie techada', `${showValue(property.covered_area)} m²`],
            ['Superficie exterior', `${showValue(property.exterior_area)} m²`],
            ['Altura máxima', showValue(property.max_height)],
            ['Área de oficinas', `${showValue(property.offices_area)} m²`],
            ['Estacionamientos', showValue(property.parking)],
            ['Andenes', showValue(property.docks)],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                paddingBottom: '14px',
                borderBottom: '1px solid #eeeeee',
              }}
            >
              <div
                style={{
                  color: "var(--muted)",
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {label}
              </div>

              <div
                style={{
                  marginTop: '6px',
                  fontSize: '15px',
                  fontWeight: 600,
                  lineHeight: 1.4,
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          marginBottom: '32px',
          padding: '24px',
          border: "1px solid var(--line)",
          borderRadius: '16px',
          background: "var(--surface)",
          boxShadow: '0 2px 8px rgba(0,0,0,0.035)',
        }}
      >
        <h2 style={{ margin: '0 0 16px' }}>Descripción</h2>
        <div
          style={{
            padding: '18px',
            borderRadius: '12px',
            background: "var(--surface-subtle)",
            color: '#444',
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
          }}
        >
          {showValue(property.description)}
        </div>
      </section>

   <section
        style={{
          marginBottom: '32px',
          padding: '24px',
          border: '1px solid #e1e1e1',
          borderRadius: '16px',
          background: "var(--surface)",
          boxShadow: '0 2px 8px rgba(0,0,0,0.035)',
        }}
      >
        <h2 style={{ margin: '0 0 8px' }}>Moderación</h2>

  {property.status === 'pending' && (
    <>
      <p>
        Elige una sola acción para esta propiedad pendiente.
      </p>

      <form
        action={moderateProperty}
        style={{ marginBottom: '24px' }}
      >
        <input
          type="hidden"
          name="action"
          value="publish"
        />

        <button
  type="submit"
  style={{
    padding: '12px 20px',
    borderRadius: '8px',
    border: 'none',
    background: "var(--primary)",
    color: "var(--surface)",
    fontWeight: 600,
    cursor: 'pointer',
  }}
>
  Publicar propiedad
</button>

      </form>

      <form action={moderateProperty}>
        <input
          type="hidden"
          name="action"
          value="reject"
        />

        <label htmlFor="rejection_reason">
          Motivo del rechazo
        </label>

        <textarea
          id="rejection_reason"
          name="rejection_reason"
          required
          rows={4}
          style={{
            display: 'block',
            width: '100%',
            marginTop: '8px',
            marginBottom: '12px',
          }}
        />

     <button
  type="submit"
  style={{
    padding: '12px 20px',
    borderRadius: '8px',
    border: '1px solid #c62828',
    background: "var(--surface)",
    color: '#c62828',
    fontWeight: 600,
    cursor: 'pointer',
  }}
>
  Rechazar propiedad
</button>

      </form>
    </>
  )}

  {property.status === 'published' && (
    <>
      <p>
        Esta propiedad está actualmente publicada en el
        inventario.
      </p>

      <form action={moderateProperty}>
        <input
          type="hidden"
          name="action"
          value="unpublish"
        />

        <label htmlFor="unpublish_reason">
          Motivo de la baja
        </label>

        <textarea
          id="unpublish_reason"
          name="rejection_reason"
          required
          rows={4}
          style={{
            display: 'block',
            width: '100%',
            marginTop: '8px',
            marginBottom: '12px',
          }}
        />

<button
  type="submit"
  style={{
    padding: '12px 20px',
    borderRadius: '8px',
    border: '1px solid #c62828',
    background: '#c62828',
    color: "var(--surface)",
    fontWeight: 600,
    cursor: 'pointer',
  }}
>
  Dar de baja propiedad
</button>

      </form>
    </>
  )}
</section>

      <section
        style={{
          marginBottom: '32px',
          padding: '24px',
          border: "1px solid var(--line)",
          borderRadius: '16px',
          background: "var(--surface)",
          boxShadow: '0 2px 8px rgba(0,0,0,0.035)',
        }}
      >
        <h2 style={{ margin: '0 0 20px' }}>Información de registro</h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '18px 24px',
          }}
        >
          {[
            ['Identificador', property.id],
            ['Propietario', property.owner_id],
            ['Slug', property.slug],
            ['Destacada', showValue(property.featured)],
            ['Prioridad de destacado', showValue(property.featured_priority)],
            ['Autorización de publicación', showDate(property.publication_authorized_at)],
            ['Términos aceptados', showDate(property.terms_accepted_at)],
            ['Última verificación', showDate(property.last_verified_at)],
            ['Próxima verificación', showDate(property.verification_due_at)],
            ['Motivo de rechazo registrado', showValue(property.rejection_reason)],
            ['Última actualización', showDate(property.updated_at)],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                paddingBottom: '14px',
                borderBottom: '1px solid #eeeeee',
              }}
            >
              <div
                style={{
                  color: "var(--muted)",
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {label}
              </div>

              <div
                style={{
                  marginTop: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  lineHeight: 1.45,
                  wordBreak: 'break-word',
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          marginBottom: '40px',
          padding: '24px',
          border: "1px solid var(--line)",
          borderRadius: '16px',
          background: "var(--surface)",
          boxShadow: '0 2px 8px rgba(0,0,0,0.035)',
        }}
      >
        <h2 style={{ margin: '0 0 20px' }}>Historial de actividad</h2>

        {propertyAuditLogs && propertyAuditLogs.length > 0 ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            {propertyAuditLogs.map((log, index) => {
              const metadata =
                (log.metadata as Record<string, unknown> | null) || {}

              const actionLabels: Record<string, string> = {
                property_updated: 'Propiedad modificada',
                property_published: 'Propiedad publicada',
                property_rejected: 'Propiedad rechazada',
                property_unpublished: 'Propiedad retirada',
              }

              const changedFields = Array.isArray(metadata.changed_fields)
                ? metadata.changed_fields.map(String)
                : []

              return (
                <div
                  key={`${log.created_at}-${index}`}
                  style={{
                    padding: '18px',
                    border: '1px solid #eeeeee',
                    borderRadius: '12px',
                    background: "var(--surface-subtle)",
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 600 }}>
                    {actionLabels[log.action] || log.action}
                  </p>

                  <p style={{ margin: '6px 0 0', color: "var(--muted)" }}>
                    {showDate(log.created_at)}
                  </p>

                  {changedFields.length > 0 && (
                    <p style={{ margin: '10px 0 0' }}>
                      <strong>Campos modificados:</strong>{' '}
                      {changedFields.join(', ')}
                    </p>
                  )}

                  {typeof metadata.rejection_reason === 'string' &&
                    metadata.rejection_reason && (
                      <p style={{ margin: '10px 0 0' }}>
                        <strong>Motivo:</strong>{' '}
                        {metadata.rejection_reason}
                      </p>
                    )}
                </div>
              )
            })}
          </div>
        ) : (
          <p style={{ color: "var(--muted)" }}>
            No hay actividad registrada para esta propiedad.
          </p>
        )}
      </section>

      <section
        style={{
          marginBottom: '40px',
          padding: '24px',
          borderRadius: '16px',
          border: "1px solid var(--line)",
          background: "var(--surface)",
          boxShadow: '0 2px 8px rgba(0,0,0,0.035)',
        }}
      >
        <h2 style={{ margin: '0 0 8px' }}>Editar propiedad</h2>
        <p style={{ margin: '0 0 28px', color: "var(--muted)", lineHeight: 1.5 }}>
          Puedes corregir la información sin modificar el estado actual de la propiedad.
        </p>

        <form
          action={updateProperty}
          style={{
            display: 'grid',
            gap: '20px',
          }}
        >
          <div>
            <label htmlFor="admin-field-0-0"><strong>Título</strong></label>
            <input id="admin-field-0-0"
              name="title"
              defaultValue={property.title}
              required
              style={{ width: '100%', padding: '10px', marginTop: '6px' }}
            />
          </div>

          <div>
            <label htmlFor="admin-field-0-1"><strong>Operación</strong></label>
            <select id="admin-field-0-1"
              name="operation"
              defaultValue={property.operation}
              required
              style={{ width: '100%', padding: '10px', marginTop: '6px' }}
            >
              <option value="Renta">Renta</option>
              <option value="Venta">Venta</option>
            </select>
          </div>

          <div>
            <p><strong>Zona</strong></p>
            <div style={{ marginTop: '6px' }}>
              <ZoneSelectors
                initialGeneral={property.zone_general || ''}
                initialIndustrial={property.zone || ''}
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-field-0-2"><strong>Dirección</strong></label>
            <input id="admin-field-0-2"
              name="address"
              defaultValue={property.address || ''}
              style={{ width: '100%', padding: '10px', marginTop: '6px' }}
            />
          </div>

          <div>
            <label htmlFor="admin-field-0-3"><strong>Visibilidad de ubicación</strong></label>
            <select id="admin-field-0-3"
              name="location_visibility"
              defaultValue={property.location_visibility}
              style={{ width: '100%', padding: '10px', marginTop: '6px' }}
            >
              <option value="zone">Solo zona</option>
              <option value="address">Dirección completa</option>
            </select>
          </div>

          <div>
            <label htmlFor="admin-field-0-4"><strong>Precio mostrado (calculado al guardar)</strong></label>
            <input id="admin-field-0-4"
              name="price_display"
              defaultValue={propertyPrice(property)}
              readOnly
              required
              style={{ width: '100%', padding: '10px', marginTop: '6px' }}
            />
          </div>

          <div>
            <label htmlFor="admin-field-0-5"><strong>Precio numérico</strong></label>
            <input id="admin-field-0-5"
              name="price_value"
              type="number"
              min="0.01"
              step="any"
              required
              defaultValue={property.price_value_text ?? property.price_value ?? ''}
              style={{ width: '100%', padding: '10px', marginTop: '6px' }}
            />
          </div>

          <PriceCurrencySelect value={property.price_currency} />
          <div>
            <label htmlFor="admin-field-0-6"><strong>Unidad del precio</strong></label>
            <select id="admin-field-0-6"
              name="price_unit"
              defaultValue={property.price_unit === 'm²' ? 'm2' : property.price_unit || ''}
              style={{ width: '100%', padding: '10px', marginTop: '6px' }}
            >
              <option value="">Sin unidad</option>
              {property.price_unit && !['m2', 'm²', 'total'].includes(property.price_unit) && <option value={property.price_unit} disabled>Unidad heredada: {property.price_unit}</option>}
              <option value="m2">m²</option>
              <option value="total">Total</option>
            </select>
          </div>

          <div style={{ display: 'grid', gap: '8px' }}>
            <label>
              <input
                type="checkbox"
                name="price_plus_vat"
                defaultChecked={property.price_plus_vat}
              />{' '}
              Precio más IVA
            </label>

            <label>
              <input
                type="checkbox"
                name="price_plus_maintenance"
                defaultChecked={property.price_plus_maintenance}
              />{' '}
              Precio más mantenimiento
            </label>

            <label>
              <input
                type="checkbox"
                name="negotiable"
                defaultChecked={property.negotiable}
              />{' '}
              Precio negociable
            </label>

            <label>
              <input
                type="checkbox"
                name="share_commission"
                defaultChecked={property.share_commission}
              />{' '}
              Comparte comisión
            </label>

            <label>
              <input
                type="checkbox"
                name="featured"
                defaultChecked={property.featured}
              />{' '}
              Propiedad destacada
            </label>
          </div>

          <div>
            <label htmlFor="admin-field-0-7"><strong>Superficie total (m²)</strong></label>
            <input id="admin-field-0-7"
              name="total_area"
              type="number"
              step="any"
              defaultValue={property.total_area ?? ''}
              style={{ width: '100%', padding: '10px', marginTop: '6px' }}
            />
          </div>

          <div>
            <label htmlFor="admin-field-0-8"><strong>Superficie techada (m²)</strong></label>
            <input id="admin-field-0-8"
              name="covered_area"
              type="number"
              step="any"
              defaultValue={property.covered_area ?? ''}
              style={{ width: '100%', padding: '10px', marginTop: '6px' }}
            />
          </div>

          <div>
            <label htmlFor="admin-field-0-9"><strong>Superficie exterior (m²)</strong></label>
            <input id="admin-field-0-9"
              name="exterior_area"
              type="number"
              step="any"
              defaultValue={property.exterior_area ?? ''}
              style={{ width: '100%', padding: '10px', marginTop: '6px' }}
            />
          </div>

          <div>
            <label htmlFor="admin-field-0-10"><strong>Altura máxima</strong></label>
            <input id="admin-field-0-10"
              name="max_height"
              defaultValue={property.max_height || ''}
              style={{ width: '100%', padding: '10px', marginTop: '6px' }}
            />
          </div>

          <div>
            <label htmlFor="admin-field-0-11"><strong>Área de oficinas (m²)</strong></label>
            <input id="admin-field-0-11"
              name="offices_area"
              type="number"
              step="any"
              defaultValue={property.offices_area ?? ''}
              style={{ width: '100%', padding: '10px', marginTop: '6px' }}
            />
          </div>

          <div>
            <label htmlFor="admin-field-0-12"><strong>Estacionamientos</strong></label>
            <input id="admin-field-0-12"
              name="parking"
              type="number"
              step="1"
              defaultValue={property.parking ?? ''}
              style={{ width: '100%', padding: '10px', marginTop: '6px' }}
            />
          </div>

          <div>
            <label htmlFor="admin-field-0-13"><strong>Andenes</strong></label>
            <input id="admin-field-0-13"
              name="docks"
              type="number"
              step="1"
              defaultValue={property.docks ?? ''}
              style={{ width: '100%', padding: '10px', marginTop: '6px' }}
            />
          </div>

          <div>
            <label htmlFor="admin-field-0-14"><strong>Descripción</strong></label>
            <textarea id="admin-field-0-14"
              name="description"
              defaultValue={property.description || ''}
              rows={8}
              style={{ width: '100%', padding: '10px', marginTop: '6px', resize: 'vertical' }}
            />
          </div>

          <div>
            <label htmlFor="admin-field-0-15"><strong>Fotografía principal</strong></label>
            <select id="admin-field-0-15"
              name="main_image_path"
              defaultValue={property.main_image_path || ''}
              style={{ width: '100%', padding: '10px', marginTop: '6px' }}
            >
              <option value="">Sin fotografía principal</option>
              {(galleryImages || []).map((image, index) => (
                <option key={image.storage_path} value={image.storage_path}>
                  {image.title || `Fotografía ${index + 1}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="admin-field-0-16"><strong>Prioridad destacada</strong></label>
            <input id="admin-field-0-16"
              name="featured_priority"
              type="number"
              step="1"
              defaultValue={property.featured_priority ?? ''}
              style={{ width: '100%', padding: '10px', marginTop: '6px' }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '14px 20px',
              borderRadius: '8px',
              border: 'none',
              background: "var(--primary)",
              color: "var(--surface)",
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Guardar cambios
          </button>
        </form>
      </section>

    </main></>
  )
}
