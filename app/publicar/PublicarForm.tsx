'use client'

import { FormField } from '@/components/FormField'

import { useFormDraft } from '@/components/useFormDraft'
import { DeferredAuthNotice } from '@/components/DeferredAuthNotice'
import { parsePropertySubmission } from '@/lib/property-submission'
import { PriceCurrencySelect } from '@/components/PriceCurrencySelect'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { ImageUploader, SelectedImage } from '@/components/ImageUploader'
import { ImageUploadProgress, type ImageUploadState } from '@/components/ImageUploadProgress'
import { createClient } from '@/lib/supabase'
import { AccountSuspensionNotice } from '@/components/AccountSuspensionNotice'
import Link from 'next/link'

import {
  ZONAS_GENERALES,
  ZONAS_INDUSTRIALES_POR_ZONA,
} from '@/lib/zonas'

export const INITIAL_PROPERTY_DESCRIPTION = `Tipo de operación
Renta $ x m2
Renta total $ +IVA
Mantenimiento $ x m2 + IVA
Disponibilidad Inmediata

Área de bodega
Total de construcción
Área de maniobra
Área de estacionamiento
Dimensiones totales
Altura mínima
Altura máxima
Rampa a nivel de piso
Andenes
Tipo de portón
Parque industrial con seguridad
Sistema contra incendios

Luz trifásica
Transformador propios
KVAS
Acceso a trailer
Servicio de agua
Fosa o drenaje
Resistencia de piso

Tipo de contrato
Condiciones de contrato`

export default function Publish() {
  const [zonaGeneral, setZonaGeneral] = useState('')
  const [zonaIndustrial, setZonaIndustrial] = useState('')
  const [operation, setOperation] = useState('Renta')

  const router = useRouter()

  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successAction, setSuccessAction] = useState<'draft' | 'pending'>('pending')
  const [accountStatus, setAccountStatus] = useState<'active' | 'suspended'>('active')
  const [images, setImages] = useState<SelectedImage[]>([])
  const [imagesProcessing, setImagesProcessing] = useState(false)
  const [uploadStates, setUploadStates] = useState<ImageUploadState[]>([])
  const submitBusy = useRef(false)
  const successNotice = useRef<HTMLElement>(null)

  const draft = useFormDraft('property', restored => {
    setZonaGeneral(String(restored.fields.zone_general || ''))
    setZonaIndustrial(String(restored.fields.zone || ''))
    setOperation(String(restored.fields.operation || 'Renta'))
    setImages(restored.images)
  })

  useEffect(() => {
    if (!showSuccess) {
      return
    }

    successNotice.current?.focus()

    const timer = setTimeout(() => {
      router.push('/mis-propiedades')
    }, 3000)

    return () => clearTimeout(timer)
  }, [showSuccess, router])

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitBusy.current || loading || imagesProcessing || !draft.ready || showSuccess) return
    submitBusy.current = true
    const form = new FormData(e.currentTarget)
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    const action = submitter?.value === 'draft' ? 'draft' : 'pending'
    setMsg('')
    setLoading(true)
    try {
      parsePropertySubmission(form)
      if (draft.imageCount > images.length) throw new Error('Selecciona de nuevo las fotografías que no se pudieron recuperar.')
      const supabase = createClient()
      if (!supabase) throw new Error('El servicio no está disponible. Tu formulario sigue abierto.')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.is_anonymous) { await draft.requireAuth(action); return }
      const { data: profile } = await supabase.from('profiles').select('account_status').eq('id', user.id).single()
      if (profile?.account_status !== 'active') {
        setAccountStatus(profile?.account_status === 'suspended' ? 'suspended' : 'active')
        throw new Error('Necesitas un perfil activo para publicar.')
      }
      if (!await draft.bindOwner(user.id)) return
      form.set('request_id', draft.draftRef.current!.id)
      form.set('submission_action', action)
      form.set('image_count', String(images.length))
      setUploadStates(images.map(() => 'pending'))
      const response = await fetch('/api/publicar-propiedad', { method: 'POST', body: form })
      if (response.status === 401) { await draft.requireAuth(action); return }
      let result = await response.json()
      if (!response.ok) throw new Error(result.error || 'No pudimos confirmar el envío. Conserva el borrador y reintenta.')
      if (result.recover) {
        setMsg('Existe un borrador de este envío. Continúa desde su editor; no creamos otra propiedad.')
        router.push(`/mis-propiedades/${result.id}/editar`)
        return
      }
      if (result.prepared) {
        for (const [index, image] of images.entries()) {
          setUploadStates(current => current.map((state, i) => i === index ? 'uploading' : state))
          const photo = new FormData()
          photo.set('image', image.file); photo.set('kind', 'property')
          photo.set('draft_id', result.id); photo.set('position', String(index)); photo.set('title', image.title)
          const uploaded = await fetch('/api/imagenes', { method: 'POST', body: photo })
          if (!uploaded.ok) {
            if (uploaded.status === 401) { await draft.requireAuth(action); return }
            throw new Error('El borrador ya existe. Reintenta para abrir su editor y revisar las fotografías guardadas.')
          }
          setUploadStates(current => current.map((state, i) => i === index ? 'completed' : state))
        }
        form.set('finalize', 'on')
        const finalized = await fetch('/api/publicar-propiedad', { method: 'POST', body: form })
        if (finalized.status === 401) { await draft.requireAuth(action); return }
        result = await finalized.json()
        if (!finalized.ok) throw new Error(result.error || 'Reintenta para recuperar el borrador creado.')
        if (result.recover) { router.push(`/mis-propiedades/${result.id}/editar`); return }
      }
      setUploadStates(images.map(() => 'completed'))
      await draft.clear()
      setSuccessAction(result.status === 'draft' ? 'draft' : 'pending')
      setShowSuccess(true)
    } catch (error) {
      setUploadStates(current => current.map(state => state === 'uploading' ? 'error' : state))
      setMsg(error instanceof Error ? error.message : 'No se pudo completar el envío. Conserva el borrador y reintenta.')
    } finally { setLoading(false); submitBusy.current = false }
  }

  const zonasIndustriales =
    ZONAS_INDUSTRIALES_POR_ZONA[zonaGeneral] || []

  return (
    <>
      <Header />

      <main className="form">
        <small>PUBLICA EN QRIH</small>

        <h1>Sube tu propiedad industrial.</h1>

        {accountStatus === 'suspended' && <AccountSuspensionNotice />}

        <DeferredAuthNotice open={draft.authOpen} onClose={() => draft.setAuthOpen(false)} path="/publicar" memoryOnly={draft.memoryOnly} />
        {!showSuccess && <p className="notice" role="status">{draft.notice || 'Tu progreso se guarda en este navegador durante 7 días. En equipos compartidos, descarta el borrador al terminar.'}</p>}
        {!showSuccess && <button type="button" disabled={loading || imagesProcessing || !draft.ready} onClick={() => void draft.discard()}>Descartar borrador local</button>}
        <form
          ref={draft.formRef} onInput={draft.scheduleSave} onChange={draft.scheduleSave}
          hidden={showSuccess}
          onSubmit={submit}
          encType="multipart/form-data"
        >
          <fieldset disabled={!draft.ready || loading}>
          <fieldset>
            <legend>Información general</legend>

            <FormField id="field-0-title" label="Título de la propiedad" required><input id="field-0-title"
              required
              name="title"
              placeholder="Título de la propiedad"
            /></FormField>

            <div className="two">
              <FormField id="field-0-operation" label="Operación"><select id="field-0-operation"
                name="operation"
                value={operation}
                onChange={(e) => setOperation(e.target.value)}
              >
                <option value="Renta">Renta</option>
                <option value="Venta">Venta</option>
              </select></FormField>

              <FormField id="field-0-price" label="Precio" required><div className="price-input">
                <span>$</span>

                <input id="field-0-price"
                  required
                  name="price"
                  type="number"
                  min="0.01"
                  step="any"
                  placeholder={
                    operation === 'Renta'
                      ? 'Precio por m²'
                      : 'Precio total'
                  }
                />
              </div></FormField>
            </div>

            <p
              style={{
                marginTop: '0',
                marginBottom: '18px',
                fontSize: '13px',
                color: "var(--muted)",
              }}
            >
              {operation === 'Renta'
                ? 'El precio se registrará como precio por m².'
                : 'El precio se registrará como precio total de venta.'}
            </p>

            <PriceCurrencySelect value="MXN" />
            <label className="inline-check">
              <input
                name="commission"
                type="checkbox"
              />

              <span>Comparto comisión</span>
            </label>

            <div className="form-location-grid">
              <div className="two">
                <FormField id="field-0-zone_general" label="Municipio" required><select id="field-0-zone_general"
                  required
                  name="zone_general"
                  value={zonaGeneral}
                  onChange={(e) => {
                    setZonaGeneral(e.target.value)
                    setZonaIndustrial('')
                  }}
                >
                  <option value="" disabled>
                    Selecciona un municipio
                  </option>

                  {ZONAS_GENERALES.map((zona) => (
                    <option key={zona} value={zona}>
                      {zona}
                    </option>
                  ))}
                </select></FormField>

                <FormField id="field-0-zone" label="Zona" required><select id="field-0-zone"
                  required
                  name="zone"
                  value={zonaIndustrial}
                  onChange={(e) =>
                    setZonaIndustrial(e.target.value)
                  }
                  disabled={!zonaGeneral}
                >
                  <option value="" disabled>
                    {zonaGeneral
                      ? 'Selecciona una zona'
                      : 'Selecciona primero un municipio'}
                  </option>

                  {zonasIndustriales.map((zona) => (
                    <option key={zona} value={zona}>
                      {zona}
                    </option>
                  ))}
                </select></FormField>
              </div>

              <FormField id="field-0-visibility" label="Visibilidad de la ubicación"><select id="field-0-visibility" name="visibility">
                <option value="zone">
                  Mostrar únicamente zona
                </option>

                <option value="address">
                  Mostrar dirección completa
                </option>
              </select></FormField>
            </div>

            <FormField id="field-0-address" label="Dirección"><input id="field-0-address"
              name="address"
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
                />

                <span>Precio +IVA</span>
              </label>

              <label className="inline-check">
                <input
                  type="checkbox"
                  name="price_plus_maintenance"
                />

                <span>Precio más mantenimiento</span>
              </label>

              <label className="inline-check">
                <input
                  type="checkbox"
                  name="negotiable"
                />

                <span>Precio negociable</span>
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend>Superficies y especificaciones</legend>

            <div className="two">
              <FormField id="field-0-area" label="Superficie total (m²)" required><input id="field-0-area"
                required
                name="area"
                type="number"
                min="0"
                step="0.01"
                placeholder="Superficie total m²"
              /></FormField>

              <FormField id="field-0-covered" label="Superficie techada (m²)"><input id="field-0-covered"
                name="covered"
                type="number"
                min="0"
                step="0.01"
                placeholder="Superficie techada m²"
              /></FormField>
            </div>

            <div className="two">
              <FormField id="field-0-exterior_area" label="Superficie exterior (m²)"><input id="field-0-exterior_area"
                name="exterior_area"
                type="number"
                min="0"
                step="0.01"
                placeholder="Superficie exterior m²"
              /></FormField>

              <FormField id="field-0-offices_area" label="Área de oficinas (m²)"><input id="field-0-offices_area"
                name="offices_area"
                type="number"
                min="0"
                step="0.01"
                placeholder="Área de oficinas m²"
              /></FormField>
            </div>

            <div className="two">
              <FormField id="field-0-max_height" label="Altura máxima"><input id="field-0-max_height"
                name="max_height"
                placeholder="Altura máxima"
              /></FormField>

              <FormField id="field-0-parking" label="Estacionamientos"><input id="field-0-parking"
                name="parking"
                type="number"
                min="0"
                step="1"
                placeholder="Estacionamientos"
              /></FormField>
            </div>

            <FormField id="field-0-docks" label="Número de andenes"><input id="field-0-docks"
              name="docks"
              type="number"
              min="0"
              step="1"
              placeholder="Número de andenes"
            /></FormField>

            <FormField id="field-0-description" label="Descripción de la propiedad"><textarea id="field-0-description"
              name="description"
              placeholder="Descripción de la propiedad"
              defaultValue={INITIAL_PROPERTY_DESCRIPTION}
              rows={8}
            /></FormField>
          </fieldset>

          <fieldset>
            <legend>Fotografías</legend>

            {draft.ready && <ImageUploader initialImages={images} onChange={next => { setImages(next); draft.updateImages(next) }} locked={loading} onProcessingChange={setImagesProcessing} />}
            <ImageUploadProgress states={uploadStates} />
          </fieldset>

          <label className="inline-check">
            <input
              required
              type="checkbox"
              name="publication_authorized"
            />

            <span>
              Declaro que cuento con autorización para promover esta propiedad.
            </span>
          </label>

          <label className="inline-check">
            <input
              required
              type="checkbox"
              name="terms_accepted"
            />

            <span>
              Acepto términos y aviso de privacidad.
            </span>
          </label>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="submit"
              name="submission_action"
              value="draft"
              disabled={!draft.ready || loading || imagesProcessing || accountStatus === 'suspended'}
              style={{
                flex: '1 1 220px',
                background: "var(--primary-hover)",
                opacity: accountStatus === 'suspended' ? 0.55 : 1,
                cursor: accountStatus === 'suspended' ? 'not-allowed' : 'pointer',
              }}
            >
              {loading
                ? 'GUARDANDO...'
                : 'GUARDAR COMO BORRADOR'}
            </button>

            <button
              type="submit"
              name="submission_action"
              value="pending"
              disabled={!draft.ready || loading || imagesProcessing || accountStatus === 'suspended'}
              style={{
                flex: '1 1 220px',
                opacity: accountStatus === 'suspended' ? 0.55 : 1,
                cursor: accountStatus === 'suspended' ? 'not-allowed' : 'pointer',
              }}
            >
              {loading
                ? 'ENVIANDO...'
                : 'ENVIAR A REVISIÓN →'}
            </button>
          </div>

          {msg && (
            <p className="notice" role="status" aria-live="polite">
              {msg}
            </p>
          )}
          </fieldset>
        </form>
      {showSuccess && (
        <section ref={successNotice} tabIndex={-1} className="publish-success ui-panel" role="status" aria-live="polite">
          <span className="publish-success__icon" aria-hidden="true">✓</span>
          <h2>{successAction === 'draft' ? '¡Propiedad guardada como borrador!' : '¡Propiedad enviada a revisión!'}</h2>
          <p>{successAction === 'draft'
            ? 'Tu propiedad se guardó como borrador y puedes editarla antes de enviarla a revisión.'
            : 'Tu propiedad fue enviada correctamente y ahora se encuentra pendiente de revisión.'}</p>
          <p>Serás redirigido a Mis propiedades en unos segundos…</p>
          <Link className="button" href="/mis-propiedades">Ir a Mis propiedades</Link>
        </section>
      )}
      </main>
    </>
  )
}
