'use client'

import { FormField } from '@/components/FormField'

import { PriceCurrencySelect } from '@/components/PriceCurrencySelect'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ZONAS_GENERALES, ZONAS_INDUSTRIALES_POR_ZONA } from '@/lib/zonas'
import { useRouter } from 'next/navigation'
import { PropertyImageEditor, PropertyImageEditorItem } from '@/components/PropertyImageEditor'

type Property = {
  id: string
  status: 'draft' | 'rejected'
  title: string
  operation: string
  price_display: string
  price_value?: number | null
  price_value_text?: string | null
  price_unit?: string | null
  price_currency?: string | null
  price_plus_vat: boolean
  price_plus_maintenance: boolean
  negotiable: boolean
zone_general: string | null
zone: string
  address: string | null
  location_visibility: string
  total_area: number | null
  covered_area: number | null
  exterior_area: number | null
  max_height: string | null
  offices_area: number | null
  parking: number | null
  docks: number | null
  description: string | null
  share_commission: boolean
  rejection_reason: string | null
}

export function EditarPropiedadForm({
  property,
  initialImages,
  duplicate = false,
}: {
  property: Property
  initialImages: {
    storagePath: string
    url: string
    title: string
    position: number
  }[]
  duplicate?: boolean
}) {
  const router = useRouter()
  const busy = useRef(false)
  const requestId = useRef<string | null>(null)
  const uploadedForAttempt = useRef(new Map<string, string>())
const [loading, setLoading] = useState(false)
const [error, setError] = useState('')
const [zonaGeneral, setZonaGeneral] = useState(
  property.zone_general || ''
)
const [images, setImages] = useState<PropertyImageEditorItem[]>([])

  return (
    <>
      <form
  method="post"
  encType="multipart/form-data"
  onSubmit={async (event) => {
    event.preventDefault()
    if (busy.current) return
    busy.current = true

    setLoading(true)
    setError('')

    const formData = new FormData(event.currentTarget)
    const submitter = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null

    const submissionAction =
      submitter?.name === 'submission_action' &&
      (submitter.value === 'draft' || submitter.value === 'pending')
        ? submitter.value
        : 'pending'

    formData.append('submission_action', submissionAction)
    if (duplicate) {
      requestId.current ||= crypto.randomUUID()
      formData.set('request_id', requestId.current)
      formData.set('submission_action', 'draft')
    }

    const uploadedPaths: string[] = []
    let saveAttempted = false
    try {
      const gallery = []
      for (const image of images) {
        if (image.kind === 'existing') {
          gallery.push({ kind: 'existing', storage_path: image.storagePath, title: image.title })
        } else {
          const previousUpload = duplicate ? uploadedForAttempt.current.get(image.id) : null
          if (previousUpload) {
            gallery.push({ kind: 'uploaded', storage_path: previousUpload, title: image.title })
            continue
          }
          // Cada foto viaja por separado; siete fotos no exceden el límite de Netlify en un único request.
          const uploadForm = new FormData()
          uploadForm.set('image', image.file)
          uploadForm.set('kind', 'property')
          const response = await fetch('/api/imagenes', { method: 'POST', body: uploadForm })
          const result = await response.json().catch(() => null)
          if (!response.ok || !result?.path) throw new Error('No se pudo subir una fotografía. Revisa tu conexión y vuelve a intentar.')
          uploadedPaths.push(result.path)
          if (duplicate) uploadedForAttempt.current.set(image.id, result.path)
          gallery.push({ kind: 'uploaded', storage_path: result.path, title: image.title })
        }
      }
      formData.append('gallery', JSON.stringify(gallery))
      saveAttempted = true
      const response = await fetch(duplicate ? '/api/duplicar-propiedad' : '/api/editar-propiedad', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)

        throw new Error(
          data?.error || 'No fue posible guardar los cambios.'
        )
      }

      router.push('/mis-propiedades')
      router.refresh()
    } catch (err) {
      // Sólo nombres generados en este intento, nunca datos del formulario.
      // Tras un corte de red, el servidor podría haber confirmado la edición.
      // No borrar entonces imágenes potencialmente referenciadas.
      if (!saveAttempted && uploadedPaths.length) await createClient()?.storage.from('property-images').remove(uploadedPaths)
      if (!saveAttempted && duplicate) {
        for (const [key, path] of uploadedForAttempt.current) if (uploadedPaths.includes(path)) uploadedForAttempt.current.delete(key)
      }
      setError(
        err instanceof Error
          ? err.message
          : 'No fue posible guardar los cambios.'
      )
      setLoading(false)
      busy.current = false
    }
  }}
>
        <input
          type="hidden"
          name="id"
          value={property.id}
        />

        <fieldset>
          <legend>Información general</legend>

          <FormField id="field-1-title" label="Título de la propiedad" required><input id="field-1-title"
            required
            name="title"
            defaultValue={property.title}
            placeholder="Título de la propiedad"
          /></FormField>

          <div className="two">
            <FormField id="field-1-operation" label="Operación"><select id="field-1-operation"
              name="operation"
              defaultValue={property.operation}
            >
              <option value="Renta">Renta</option>
              <option value="Venta">Venta</option>
            </select></FormField>

            <FormField id="field-1-price" label="Precio" required><div className="price-input">
              <span>$</span>

              <input id="field-1-price"
                required
                name="price"
                type="number"
                min="0.01"
                step="any"
                defaultValue={property.price_value_text ?? property.price_value ?? ''}
                placeholder="Precio"
              />
            </div></FormField>
          </div>

          <PriceCurrencySelect value={property.price_currency} />
          <label>Unidad de cobro<select name="price_unit" defaultValue={property.price_unit === 'm²' ? 'm2' : property.price_unit || ''}>
            {property.price_unit && !['m2', 'm²', 'total'].includes(property.price_unit) && <option value={property.price_unit} disabled>Unidad heredada: {property.price_unit} — selecciona una unidad</option>}
            <option value="">Sin unidad</option><option value="m2">Por m²</option><option value="total">Total</option>
          </select></label>
          <label className="inline-check">
            <input
              type="checkbox"
              name="commission"
              defaultChecked={property.share_commission}
            />
            <span>Comparto comisión</span>
          </label>

          <div className="two">
           <FormField id="field-1-zone_general" label="Zona general" required><select id="field-1-zone_general"
  required
  name="zone_general"
  value={zonaGeneral}
  onChange={(e) => setZonaGeneral(e.target.value)}
>
  <option value="" disabled>
    Selecciona una zona general
  </option>

  {ZONAS_GENERALES.map((zona) => (
    <option key={zona} value={zona}>
      {zona}
    </option>
  ))}
</select></FormField>

<FormField id="field-1-zone" label="Zona industrial" required><select id="field-1-zone"
  required
  name="zone"
  defaultValue={property.zone}
>
  <option value="" disabled>
    Selecciona una zona industrial
  </option>

  {(ZONAS_INDUSTRIALES_POR_ZONA[zonaGeneral] || []).map((zona) => (
    <option key={zona} value={zona}>
      {zona}
    </option>
  ))}
</select></FormField>

            <FormField id="field-1-visibility" label="Visibilidad de la ubicación"><select id="field-1-visibility"
              name="visibility"
              defaultValue={property.location_visibility}
            >
              <option value="zone">
                Mostrar únicamente zona
              </option>

              <option value="address">
                Mostrar dirección completa
              </option>
            </select></FormField>
          </div>

          <FormField id="field-1-address" label="Dirección"><input id="field-1-address"
            name="address"
            defaultValue={property.address || ''}
            placeholder="Dirección"
          /></FormField>
        </fieldset>

        <fieldset>
          <legend>Precio y condiciones</legend>

          <div className="price-options">
            <label className="inline-check">
              <input
                type="checkbox"
                name="price_plus_vat"
                defaultChecked={property.price_plus_vat}
              />
              <span>Precio más IVA</span>
            </label>

            <label className="inline-check">
              <input
                type="checkbox"
                name="price_plus_maintenance"
                defaultChecked={
                  property.price_plus_maintenance
                }
              />
              <span>Precio más mantenimiento</span>
            </label>

            <label className="inline-check">
              <input
                type="checkbox"
                name="negotiable"
                defaultChecked={property.negotiable}
              />
              <span>Precio negociable</span>
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Superficies y especificaciones</legend>

          <div className="two">
            <FormField id="field-1-area" label="Superficie total (m²)" required><input id="field-1-area"
              required
              name="area"
              type="number"
              min="0"
              step="0.01"
              defaultValue={property.total_area ?? ''}
              placeholder="Superficie total m²"
            /></FormField>

            <FormField id="field-1-covered" label="Superficie techada (m²)"><input id="field-1-covered"
              name="covered"
              type="number"
              min="0"
              step="0.01"
              defaultValue={property.covered_area ?? ''}
              placeholder="Superficie techada m²"
            /></FormField>
          </div>

          <div className="two">
            <FormField id="field-1-exterior_area" label="Superficie exterior (m²)"><input id="field-1-exterior_area"
              name="exterior_area"
              type="number"
              min="0"
              step="0.01"
              defaultValue={property.exterior_area ?? ''}
              placeholder="Superficie exterior m²"
            /></FormField>

            <FormField id="field-1-offices_area" label="Área de oficinas (m²)"><input id="field-1-offices_area"
              name="offices_area"
              type="number"
              min="0"
              step="0.01"
              defaultValue={property.offices_area ?? ''}
              placeholder="Área de oficinas m²"
            /></FormField>
          </div>

          <div className="two">
            <FormField id="field-1-max_height" label="Altura máxima"><input id="field-1-max_height"
              name="max_height"
              defaultValue={property.max_height || ''}
              placeholder="Altura máxima"
            /></FormField>

            <FormField id="field-1-parking" label="Estacionamientos"><input id="field-1-parking"
              name="parking"
              type="number"
              min="0"
              step="1"
              defaultValue={property.parking ?? ''}
              placeholder="Estacionamientos"
            /></FormField>
          </div>

          <FormField id="field-1-docks" label="Número de andenes"><input id="field-1-docks"
            name="docks"
            type="number"
            min="0"
            step="1"
            defaultValue={property.docks ?? ''}
            placeholder="Número de andenes"
          /></FormField>

          <FormField id="field-1-description" label="Descripción de la propiedad"><textarea id="field-1-description"
            name="description"
            defaultValue={property.description || ''}
            placeholder="Descripción de la propiedad"
            rows={8}
          /></FormField>
        </fieldset>

        <fieldset>
          <legend>Fotografías</legend>

          <PropertyImageEditor
            initialImages={initialImages}
            onChange={setImages}
          />

          <p
            style={{
              fontSize: 13,
              color: "var(--muted)",
              marginTop: 8,
            }}
          >
            Puedes conservar, quitar, reordenar y agregar fotografías. La
            primera será la fotografía principal.
          </p>
        </fieldset>

        <div
          style={{
            marginTop: 24,
            padding: 18,
            borderRadius: 10,
            background: "var(--surface-subtle)",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          {property.status === 'draft' ? (
            <>
              Puedes guardar los cambios como borrador o enviar la propiedad a{' '}
              <strong>revisión</strong>.
            </>
          ) : (
            <>
              Al reenviar esta propiedad, volverá a quedar{' '}
              <strong>pendiente de revisión</strong>.
            </>
          )}
        </div>

        {property.status === 'draft' && (
          <button
            type="submit"
            name="submission_action"
            value="draft"
            disabled={loading}
          >
            {loading ? 'GUARDANDO...' : 'GUARDAR COMO BORRADOR'}
          </button>
        )}

        {!duplicate && <button
          type="submit"
          name="submission_action"
          value="pending"
          disabled={loading}
        >
          {loading
            ? 'ENVIANDO...'
            : property.status === 'draft'
              ? 'GUARDAR CAMBIOS Y ENVIAR A REVISIÓN →'
              : 'GUARDAR CAMBIOS Y REENVIAR →'}
        </button>}

        {error && (
          <p
            style={{
              marginTop: 16,
              color: '#a33',
            }}
          >
            {error}
          </p>
        )}
      </form>

      <div style={{ marginTop: 24 }}>
        <button
          type="button"
          onClick={() => router.push('/mis-propiedades')}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            color: '#10222d',
            cursor: 'pointer',
          }}
        >
          ← Volver a mis propiedades
        </button>
      </div>
    </>
  )
}
