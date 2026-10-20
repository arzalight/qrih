'use client'

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

          <input
            required
            name="title"
            defaultValue={property.title}
            placeholder="Título de la propiedad"
          />

          <div className="two">
            <select
              name="operation"
              defaultValue={property.operation}
            >
              <option value="Renta">Renta</option>
              <option value="Venta">Venta</option>
            </select>

            <div className="price-input">
              <span>$</span>

              <input
                required
                name="price"
                type={duplicate ? 'number' : 'text'}
                min={duplicate ? '0.01' : undefined}
                step={duplicate ? 'any' : undefined}
                defaultValue={duplicate ? property.price_value ?? '' : property.price_display}
                placeholder="Precio"
              />
            </div>
          </div>

          <label className="inline-check">
            <input
              type="checkbox"
              name="commission"
              defaultChecked={property.share_commission}
            />
            <span>Comparto comisión</span>
          </label>

          <div className="two">
           <select
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
</select>

<select
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
</select>

            <select
              name="visibility"
              defaultValue={property.location_visibility}
            >
              <option value="zone">
                Mostrar únicamente zona
              </option>

              <option value="address">
                Mostrar dirección completa
              </option>
            </select>
          </div>

          <input
            name="address"
            defaultValue={property.address || ''}
            placeholder="Dirección"
          />
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
            <input
              required
              name="area"
              type="number"
              min="0"
              step="0.01"
              defaultValue={property.total_area ?? ''}
              placeholder="Superficie total m²"
            />

            <input
              name="covered"
              type="number"
              min="0"
              step="0.01"
              defaultValue={property.covered_area ?? ''}
              placeholder="Superficie techada m²"
            />
          </div>

          <div className="two">
            <input
              name="exterior_area"
              type="number"
              min="0"
              step="0.01"
              defaultValue={property.exterior_area ?? ''}
              placeholder="Superficie exterior m²"
            />

            <input
              name="offices_area"
              type="number"
              min="0"
              step="0.01"
              defaultValue={property.offices_area ?? ''}
              placeholder="Área de oficinas m²"
            />
          </div>

          <div className="two">
            <input
              name="max_height"
              defaultValue={property.max_height || ''}
              placeholder="Altura máxima"
            />

            <input
              name="parking"
              type="number"
              min="0"
              step="1"
              defaultValue={property.parking ?? ''}
              placeholder="Estacionamientos"
            />
          </div>

          <input
            name="docks"
            type="number"
            min="0"
            step="1"
            defaultValue={property.docks ?? ''}
            placeholder="Número de andenes"
          />

          <textarea
            name="description"
            defaultValue={property.description || ''}
            placeholder="Descripción de la propiedad"
            rows={8}
          />
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
              color: '#666',
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
            background: '#f7f7f7',
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
