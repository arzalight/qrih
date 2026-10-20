'use client'

import { PriceCurrencySelect } from '@/components/PriceCurrencySelect'
import { isPriceCurrency, parsePriceInput, propertyPrice } from '@/lib/property-price'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { ImageUploader, SelectedImage } from '@/components/ImageUploader'
import { createClient } from '@/lib/supabase'
import { AccountSuspensionNotice } from '@/components/AccountSuspensionNotice'
import Link from 'next/link'

import {
  ZONAS_GENERALES,
  ZONAS_INDUSTRIALES_POR_ZONA,
} from '@/lib/zonas'

function createSlug(title: string) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function optionalNumber(value: FormDataEntryValue | null) {
  if (!value || String(value).trim() === '') {
    return null
  }

  const number = Number(value)

  return Number.isFinite(number) ? number : null
}

export default function Publish() {
  const [zonaGeneral, setZonaGeneral] = useState('')
  const [zonaIndustrial, setZonaIndustrial] = useState('')
  const [operation, setOperation] = useState('Renta')

  const router = useRouter()

  const [ready, setReady] = useState(false)
  const [accessError, setAccessError] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successAction, setSuccessAction] = useState<'draft' | 'pending'>('pending')
  const [accountStatus, setAccountStatus] = useState<'active' | 'suspended'>('active')
  const [images, setImages] = useState<SelectedImage[]>([])

  useEffect(() => {
    const supabase = createClient()

    if (!supabase) {
      setAccessError('El servicio no está disponible. No puedes publicar todavía.')
      return
    }

    supabase.auth.getUser().then(async ({ data, error }) => {
      if (error || !data.user) {
        router.replace('/login')
      } else {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('account_status')
          .eq('id', data.user.id)
          .single()

        if (profileError || !profile || !['active', 'suspended'].includes(profile.account_status)) {
          setAccessError('No fue posible cargar tu perfil. Inicia sesión de nuevo para recuperarlo; no puedes publicar todavía.')
          return
        }

        if (profile?.account_status === 'suspended') {
          setAccountStatus('suspended')
        }

        setReady(true)
      }
    }).catch(() => setAccessError('No fue posible verificar tu cuenta. Inicia sesión de nuevo.'))
  }, [router])

  useEffect(() => {
    if (!showSuccess) {
      return
    }

    const timer = setTimeout(() => {
      router.push('/mis-propiedades')
    }, 3000)

    return () => clearTimeout(timer)
  }, [showSuccess, router])

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return
    const formElement = e.currentTarget
    setMsg('')
    setLoading(true)

    const form = new FormData(formElement)
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    const submissionAction =
      submitter?.name === 'submission_action' &&
      (submitter.value === 'draft' || submitter.value === 'pending')
        ? submitter.value
        : 'pending'
    try {
    const supabase = createClient()

    if (!supabase) {
      setMsg('Configura Supabase para publicar propiedades.')
      setLoading(false)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    if (accountStatus === 'suspended') {
      setMsg('Tu cuenta está suspendida y no puedes realizar nuevas publicaciones.')
      setLoading(false)
      return
    }

    const title = String(form.get('title') || '').trim()
    const currentOperation = String(form.get('operation') || '')
    const priceValue = parsePriceInput(form.get('price'))
    const currency = form.get('price_currency')

    const zoneGeneral = String(
      form.get('zone_general') || ''
    ).trim()

    const zone = String(form.get('zone') || '').trim()
    const visibility = String(form.get('visibility') || 'zone')
    const address = String(form.get('address') || '').trim()

    const totalArea = Number(form.get('area') || 0)
    const coveredArea = optionalNumber(form.get('covered'))
    const exteriorArea = optionalNumber(form.get('exterior_area'))
    const officesArea = optionalNumber(form.get('offices_area'))
    const parking = optionalNumber(form.get('parking'))
    const docks = optionalNumber(form.get('docks'))

    const maxHeight = String(form.get('max_height') || '').trim()
    const description = String(form.get('description') || '').trim()

    const pricePlusVat = form.get('price_plus_vat') === 'on'
    const pricePlusMaintenance =
      form.get('price_plus_maintenance') === 'on'
    const negotiable = form.get('negotiable') === 'on'
    const shareCommission = form.get('commission') === 'on'

    const publicationAuthorized =
      form.get('publication_authorized') === 'on'

    const termsAccepted =
      form.get('terms_accepted') === 'on'

    if (
      !title ||
      !currentOperation ||
      !priceValue ||
      !zoneGeneral ||
      !zone ||
      !totalArea ||
      !publicationAuthorized ||
      !termsAccepted
    ) {
      setMsg('Completa los campos obligatorios y acepta las condiciones.')
      setLoading(false)
      return
    }

    if (!priceValue || !isPriceCurrency(currency)) {
      setMsg('Ingresa un precio válido.')
      setLoading(false)
      return
    }

    const priceUnit =
      currentOperation === 'Renta'
        ? 'm2'
        : 'total'

    const priceDisplay = propertyPrice({ price_value: priceValue, price_currency: currency, price_unit: priceUnit, operation: currentOperation })

    const uploadedImages: { path: string }[] = []

    if (images.length) {
      setMsg('Subiendo fotografías…')

      for (const [index, image] of images.entries()) {
        const uploadForm = new FormData()
        uploadForm.set('image', image.file)
        uploadForm.set('kind', 'property')
        const response = await fetch('/api/imagenes', { method: 'POST', body: uploadForm })
        const result = await response.json()
        if (!response.ok || !result.path) {
          if (uploadedImages.length) await supabase.storage.from('property-images').remove(uploadedImages.map((entry) => entry.path))
          setMsg(`No fue posible subir la fotografía ${index + 1}. Revisa el tamaño y vuelve a intentar.`)
          setLoading(false)
          return
        }

        uploadedImages.push({
          path: result.path,
        })
      }
    }

    const slugBase = createSlug(title)

    const slug =
      slugBase +
      '-' +
      user.id.slice(0, 8) +
      '-' +
      String(Date.now())

    const { data: property, error } = await supabase
      .from('properties')
      .insert({
        owner_id: user.id,
        title,
        slug,
        operation: currentOperation,
        // No enviar a moderación hasta que la galería esté registrada.
        status: 'draft',

        zone_general: zoneGeneral,
        zone,
        address: address || null,
        location_visibility: visibility,

        price_display: priceDisplay,
        price_value: priceValue,
        price_currency: currency,
        price_unit: priceUnit,
        price_plus_vat: pricePlusVat,
        price_plus_maintenance: pricePlusMaintenance,
        negotiable,

        total_area: totalArea,
        covered_area: coveredArea,
        exterior_area: exteriorArea,
        max_height: maxHeight || null,
        offices_area: officesArea,
        parking,
        docks,

        description,

        share_commission: shareCommission,
        main_image_path: uploadedImages[0]?.path || null,

        publication_authorized_at:
          submissionAction === 'draft'
            ? null
            : new Date().toISOString(),

        terms_accepted_at:
          submissionAction === 'draft'
            ? null
            : new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      if (uploadedImages.length) await supabase.storage.from('property-images').remove(uploadedImages.map((entry) => entry.path))
      setMsg('No se pudo guardar la propiedad. Revisa los datos y vuelve a intentar.')
      setLoading(false)
      return
    }

    if (uploadedImages.length && property) {
      const { error: galleryError } = await supabase.rpc(
        'replace_property_images',
        {
          p_property_id: property.id,
          p_images: uploadedImages.map((image) => ({
            storage_path: image.path,
            title: images[uploadedImages.indexOf(image)]?.title || '',
          })),
        }
      )

      if (galleryError) {
        setMsg('Se guardó el borrador, pero no su galería. Revisa Mis propiedades antes de reintentar.')
        setLoading(false)
        return
      }
    }

    if (submissionAction !== 'draft' && property) {
      const { error: submitError } = await supabase.from('properties')
        .update({ status: 'pending' }).eq('id', property.id).eq('owner_id', user.id)
      if (submitError) {
        setMsg('Se guardó el borrador, pero no pudo enviarse a revisión. Puedes reintentarlo desde Mis propiedades.')
        setLoading(false)
        return
      }
    }
    setLoading(false)
    setSuccessAction(
      submissionAction === 'draft' ? 'draft' : 'pending'
    )
    setShowSuccess(true)

    formElement.reset()
    setZonaGeneral('')
    setZonaIndustrial('')
    setOperation('Renta')
    setImages([])
    } catch {
      setMsg('No se pudo completar el envío. Revisa Mis propiedades antes de reintentar para evitar duplicados.')
    } finally { setLoading(false) }
  }

  if (accessError) {
    return <><Header /><main className="form"><h1>No puedes publicar todavía</h1>
      <p className="notice" role="alert">{accessError}</p>
      <Link href="/login?error=profile">Iniciar sesión</Link></main></>
  }
  if (!ready) {
    return null
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

        <form
          onSubmit={submit}
          encType="multipart/form-data"
        >
          <fieldset>
            <legend>Información general</legend>

            <input
              required
              name="title"
              placeholder="Título de la propiedad"
            />

            <div className="two">
              <select
                name="operation"
                value={operation}
                onChange={(e) => setOperation(e.target.value)}
              >
                <option value="Renta">Renta</option>
                <option value="Venta">Venta</option>
              </select>

              <div className="price-input">
                <span>$</span>

                <input
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
              </div>
            </div>

            <p
              style={{
                marginTop: '-10px',
                marginBottom: '18px',
                fontSize: '13px',
                color: '#777',
              }}
            >
              {operation === 'Renta'
                ? 'El precio se registrará como precio por m².'
                : 'El precio se registrará como precio total de venta.'}
            </p>

            <PriceCurrencySelect />
            <label className="inline-check">
              <input
                name="commission"
                type="checkbox"
              />

              <span>Comparto comisión</span>
            </label>

            <div className="two">
              <div className="two">
                <select
                  required
                  name="zone_general"
                  value={zonaGeneral}
                  onChange={(e) => {
                    setZonaGeneral(e.target.value)
                    setZonaIndustrial('')
                  }}
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
                  value={zonaIndustrial}
                  onChange={(e) =>
                    setZonaIndustrial(e.target.value)
                  }
                  disabled={!zonaGeneral}
                >
                  <option value="" disabled>
                    {zonaGeneral
                      ? 'Selecciona una zona industrial'
                      : 'Selecciona primero una zona general'}
                  </option>

                  {zonasIndustriales.map((zona) => (
                    <option key={zona} value={zona}>
                      {zona}
                    </option>
                  ))}
                </select>
              </div>

              <select name="visibility">
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
              <input
                required
                name="area"
                type="number"
                min="0"
                step="0.01"
                placeholder="Superficie total m²"
              />

              <input
                name="covered"
                type="number"
                min="0"
                step="0.01"
                placeholder="Superficie techada m²"
              />
            </div>

            <div className="two">
              <input
                name="exterior_area"
                type="number"
                min="0"
                step="0.01"
                placeholder="Superficie exterior m²"
              />

              <input
                name="offices_area"
                type="number"
                min="0"
                step="0.01"
                placeholder="Área de oficinas m²"
              />
            </div>

            <div className="two">
              <input
                name="max_height"
                placeholder="Altura máxima"
              />

              <input
                name="parking"
                type="number"
                min="0"
                step="1"
                placeholder="Estacionamientos"
              />
            </div>

            <input
              name="docks"
              type="number"
              min="0"
              step="1"
              placeholder="Número de andenes"
            />

            <textarea
              name="description"
              placeholder="Descripción de la propiedad"
              rows={8}
            />
          </fieldset>

          <fieldset>
            <legend>Fotografías</legend>

            <ImageUploader onChange={setImages} />
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
              disabled={loading || accountStatus === 'suspended'}
              style={{
                flex: '1 1 220px',
                background: '#8f9499',
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
              disabled={loading || accountStatus === 'suspended'}
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
            <p className="notice">
              {msg}
            </p>
          )}
        </form>
      </main>

      {showSuccess && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '24px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              background: '#fff',
              borderRadius: '18px',
              padding: '40px 32px',
              textAlign: 'center',
              boxShadow:
                '0 20px 60px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                margin: '0 auto 20px',
                background: '#111',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '30px',
              }}
            >
              ✓
            </div>

            <h2
              style={{
                margin: '0 0 12px',
                fontSize: '28px',
              }}
            >
              {successAction === 'draft'
                ? '¡Propiedad guardada como borrador!'
                : '¡Propiedad enviada a revisión!'}
            </h2>

            <p
              style={{
                margin: 0,
                lineHeight: 1.6,
                color: '#555',
              }}
            >
              {successAction === 'draft'
                ? 'Tu propiedad se guardó como borrador y puedes editarla antes de enviarla a revisión.'
                : 'Tu propiedad fue enviada correctamente y ahora se encuentra pendiente de revisión.'}
            </p>

            <p
              style={{
                marginTop: '20px',
                marginBottom: 0,
                fontSize: '14px',
                color: '#777',
              }}
            >
              Serás redirigido a Mis propiedades en unos segundos...
            </p>
          </div>
        </div>
      )}
    </>
  )
}
