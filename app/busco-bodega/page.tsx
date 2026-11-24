'use client'

import { FormField } from '@/components/FormField'

import { propertyPrice } from '@/lib/property-price'

import { Header } from '@/components/Header'
import { createClient } from '@/lib/supabase'
import {
  ZONAS_GENERALES,
  ZONAS_INDUSTRIALES_POR_ZONA,
} from '@/lib/zonas'
import { rankPropertiesForDemand } from '@/lib/matching'
import { DeferredAuthNotice } from '@/components/DeferredAuthNotice'
import { useFormDraft } from '@/components/useFormDraft'
import { useRef, useState } from 'react'

export default function Demand() {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [zonaGeneral, setZonaGeneral] = useState('')
  const [zonaIndustrial, setZonaIndustrial] = useState('')
  const [matchedProperties, setMatchedProperties] = useState<any[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [submittedDemandId, setSubmittedDemandId] = useState('')
  const [interestedProperties, setInterestedProperties] = useState<string[]>([])
  const [highlightPrivacy, setHighlightPrivacy] = useState(false)
  const privacyCardRef = useRef<HTMLDivElement>(null)

  function scrollToPrivacy(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    const target = privacyCardRef.current
    if (!target) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' })
    setHighlightPrivacy(true)
    window.setTimeout(() => setHighlightPrivacy(false), 1600)
  }

  const submitBusy = useRef(false)
  const draft = useFormDraft('demand', restored => {
    setZonaGeneral(String(restored.fields.zone_general || ''))
    setZonaIndustrial(String(restored.fields.zone || ''))
  })

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (sending || submitBusy.current || !draft.ready || submitted) return
    const formElement = e.currentTarget

    const data = Object.fromEntries(new FormData(formElement))
    const s = createClient()

    if (!s) {
      return setMessage(
        'Requerimiento listo. Configura Supabase para enviarlo a administración.'
      )
    }

    const areaMin = Number(data.area_min)
    const areaMax = Number(data.area_max)
    const budgetMin = Number(data.budget_min)
    const budgetMax = Number(data.budget_max)

    if (areaMin > areaMax) {
      setMessage(
        'La superficie mínima no puede ser mayor que la superficie máxima.'
      )
      return
    }

    if (budgetMin > budgetMax) {
      setMessage(
        'El presupuesto mínimo no puede ser mayor que el presupuesto máximo.'
      )
      return
    }

    submitBusy.current = true
    setSending(true)
    try {
    const { data: { user } } = await s.auth.getUser()
    if (!user || user.is_anonymous) { await draft.requireAuth('pending'); return }
    if (!await draft.bindOwner(user.id)) return
    const response = await fetch('/api/requerimientos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, request_id: draft.draftRef.current!.id, area_min: areaMin, area_max: areaMax, budget_min: budgetMin, budget_max: budgetMax }),
    })
    if (response.status === 401) { await draft.requireAuth('pending'); return }
    const result = await response.json()
    const insertedDemand = response.ok ? result : null
    const error = response.ok ? null : { message: result.error || 'No se pudo enviar el requerimiento.' }

    setMessage(
      error
        ? error.message
        : 'Tu requerimiento fue recibido para revisión. Te contactaremos pronto.'
    )

    if (!error && insertedDemand) {
      await draft.clear()
      setSubmitted(true)
      setSubmittedDemandId(insertedDemand.id)
      setInterestedProperties([])

      try {
      const { data: publishedProperties, error: propertiesError } = await s
        .from('properties_public')
        .select('*,price_value_text:price_value::text')
        .eq('status', 'published')

      if (!propertiesError && publishedProperties) {
        const matches = rankPropertiesForDemand(
          {
            operation: data.operation as string,
            zone_general: data.zone_general as string,
            zone: data.zone as string,
            area_min: areaMin,
            area_max: areaMax,
            budget_min: budgetMin,
            budget_max: budgetMax,
          },
          publishedProperties.map((property) => ({
            ...property,
            surface_m2: property.total_area,
          }))
        )

        setMatchedProperties(matches.slice(0, 3))
      }

      } catch { /* Matching is optional after the confirmed submission. */ }

      formElement.reset()
      setZonaGeneral('')
      setZonaIndustrial('')
    }
    } catch { setMessage('No se pudo completar el envío. Revisa tu conexión antes de reintentar.') }
    finally { setSending(false); submitBusy.current = false }
  }

  const zonasIndustriales =
    ZONAS_INDUSTRIALES_POR_ZONA[zonaGeneral] || []

  return (
    <>
      <Header />

      <section className="title demand-banner">
        <div className="demand-banner__inner">
          <h1>¿Buscas una bodega?</h1>
          <p>Comparte tu requerimiento y activaremos nuestra búsqueda en Querétaro.</p>
        </div>
      </section>

      <main className="demand-page">
        <DeferredAuthNotice open={draft.authOpen} onClose={() => draft.setAuthOpen(false)} path="/busco-bodega" memoryOnly={draft.memoryOnly} preserveMemory />

        <div className="demand-layout">
          <div className="demand-main">
            <form ref={draft.formRef} onInput={draft.scheduleSave} onChange={draft.scheduleSave} onSubmit={send} hidden={submitted} className="demand-form">
              <fieldset disabled={!draft.ready || sending} className="demand-fieldset">
                <div className="demand-section">
                  <div className="demand-section__head">
                    <span className="demand-section__step">01</span>
                    <div>
                      <h2>Tu información de contacto</h2>
                      <p>Datos privados para notificarte cuando exista una opción compatible.</p>
                    </div>
                  </div>

                  <div className="two">
                    <FormField id="field-2-name" label="Nombre completo" required><input id="field-2-name"
                      required
                      name="name"
                      placeholder="Nombre completo"
                    /></FormField>

                    <FormField id="field-2-phone" label="Teléfono (10 dígitos)" required><input id="field-2-phone"
                      required
                      type="tel"
                      name="phone"
                      placeholder="Teléfono"
                      maxLength={10}
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      onInput={(event) => {
                        event.currentTarget.value = event.currentTarget.value.replace(/\D/g, '').slice(0, 10)
                      }}
                    /></FormField>
                  </div>

                  <FormField id="field-2-email" label="Correo electrónico" required><input id="field-2-email"
                    required
                    type="email"
                    name="email"
                    placeholder="Correo electrónico"
                  /></FormField>

                  <div className="demand-subsection">
                    <div className="demand-subsection__head">
                      <h3>Datos de la empresa que busca la propiedad</h3>
                      <a
                        href="#privacidad-requerimiento"
                        className="demand-privacy-jump"
                        aria-label="Aviso de privacidad: tu información no será pública"
                        title="Tu información no será pública"
                        onClick={scrollToPrivacy}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                          <path d="M12 9v4" />
                          <path d="M12 17h.01" />
                        </svg>
                      </a>
                    </div>

                    <div className="two">
                      <FormField id="field-2-company" label="Empresa"><input id="field-2-company"
                        name="company"
                        placeholder="Empresa"
                      /></FormField>

                      <FormField id="field-2-giro" label="Giro de la empresa"><input id="field-2-giro"
                        name="giro"
                        placeholder="Giro"
                      /></FormField>
                    </div>
                  </div>
                </div>

                <div className="demand-section demand-section--spaced">
                  <div className="demand-section__head">
                    <span className="demand-section__step">02</span>
                    <div>
                      <h2>Información de la bodega</h2>
                      <p>Define operación, ubicación, superficie y rango de presupuesto.</p>
                    </div>
                  </div>

                  <div className="two">
                    <FormField id="field-2-operation" label="Operación" required><select id="field-2-operation" name="operation" required>
                      <option value="Renta">Renta</option>
                      <option value="Venta">Venta</option>
                    </select></FormField>

                    <FormField id="field-2-zone_general" label="Zona general" required><select id="field-2-zone_general"
                      name="zone_general"
                      required
                      value={zonaGeneral}
                      onChange={(e) => {
                        setZonaGeneral(e.target.value)
                        setZonaIndustrial('')
                      }}
                    >
                      <option value="">
                        Selecciona una zona general
                      </option>

                      {ZONAS_GENERALES.map((zona) => (
                        <option key={zona} value={zona}>
                          {zona}
                        </option>
                      ))}
                    </select></FormField>
                  </div>

                  <FormField id="field-2-zone" label="Zona industrial" required><select id="field-2-zone"
                    name="zone"
                    required
                    value={zonaIndustrial}
                    onChange={(e) => setZonaIndustrial(e.target.value)}
                    disabled={!zonaGeneral}
                  >
                    <option value="">
                      {zonaGeneral
                        ? 'Selecciona una zona industrial'
                        : 'Selecciona primero una zona general'}
                    </option>

                    {zonasIndustriales.map((zona) => (
                      <option key={zona} value={zona}>
                        {zona}
                      </option>
                    ))}
                  </select></FormField>

                  <div className="two">
                    <FormField id="field-2-area_min" label="Superficie mínima (m²)" required><input id="field-2-area_min"
                      required
                      type="number"
                      min="1"
                      name="area_min"
                      placeholder="Superficie mínima m²"
                    /></FormField>

                    <FormField id="field-2-area_max" label="Superficie máxima (m²)" required><input id="field-2-area_max"
                      required
                      type="number"
                      min="1"
                      name="area_max"
                      placeholder="Superficie máxima m²"
                    /></FormField>
                  </div>

                  <div className="two">
                    <FormField id="field-2-budget_min" label="Presupuesto mínimo (MXN / USD)" required><input id="field-2-budget_min"
                      required
                      type="number"
                      min="0"
                      name="budget_min"
                      placeholder="Presupuesto mínimo"
                    /></FormField>

                    <FormField id="field-2-budget_max" label="Presupuesto máximo (MXN / USD)" required><input id="field-2-budget_max"
                      required
                      type="number"
                      min="0"
                      name="budget_max"
                      placeholder="Presupuesto máximo"
                    /></FormField>
                  </div>

                  <FormField id="field-2-notes" label="Características especiales y comentarios"><textarea id="field-2-notes"
                    name="notes"
                    placeholder="Características especiales y comentarios"
                  /></FormField>
                </div>

                <div className="demand-form__footer">
                  <button type="submit" disabled={sending} className="demand-form__submit">
                    {sending ? 'ENVIANDO REQUERIMIENTO…' : 'ENVIAR A REVISIÓN →'}
                  </button>
                </div>

                {message && (
                  <p className="notice" role="status" aria-live="polite">
                    {message}
                  </p>
                )}

              </fieldset>
            </form>

            {submitted && (
              <section role="status" className="demand-success">
                <h2>¡Requerimiento recibido para revisión!</h2>
                <p>{message}</p>
                <a className="button" href="/mis-propiedades?view=requirements">Ver mis requerimientos →</a>
              </section>
            )}

            {submitted && (
              <section className="demand-matches">
                {matchedProperties.length > 0 ? (
                  <>
                    <h2>
                      {matchedProperties.length === 1
                        ? 'Encontramos una propiedad que podría interesarte.'
                        : `Encontramos ${matchedProperties.length} propiedades que podrían interesarte.`}
                    </h2>

                    <div className="demand-matches__list">
                      {matchedProperties.map(({ property, result }) => {
                        const isHighMatch = result.total >= 75

                        return (
                          <article key={property.id} className="demand-match-card">
                            <div className={`demand-match-card__badge${isHighMatch ? ' demand-match-card__badge--high' : ''}`}>
                              {isHighMatch ? 'Alta coincidencia' : 'Coincidencia'}
                            </div>

                            <h3>{property.title}</h3>

                            <dl className="demand-match-card__facts">
                              <div><dt>Operación</dt><dd>{property.operation}</dd></div>
                              <div><dt>Zona</dt><dd>{property.zone}</dd></div>
                              <div><dt>Superficie</dt><dd>{property.total_area ? `${property.total_area} m²` : 'N/D'}</dd></div>
                              <div><dt>Precio</dt><dd>{propertyPrice(property)}</dd></div>
                            </dl>

                            <div className="demand-match-card__actions">
                              {property.slug && (
                                <a href={`/bodegas/${property.slug}`} className="button">
                                  Ver propiedad
                                </a>
                              )}

                              <button
                                type="button"
                                className="button button--secondary"
                                disabled={
                                  !submittedDemandId ||
                                  interestedProperties.includes(property.id)
                                }
                                onClick={async () => {
                                  if (!submittedDemandId) return

                                  const formData = new FormData()
                                  formData.append(
                                    'demand_request_id',
                                    submittedDemandId
                                  )
                                  formData.append('property_id', property.id)

                                  const response = await fetch(
                                    '/api/interes-propiedad',
                                    {
                                      method: 'POST',
                                      body: formData,
                                    }
                                  )

                                  const result = await response.json()

                                  if (response.ok && result.success) {
                                    setInterestedProperties((current) =>
                                      current.includes(property.id)
                                        ? current
                                        : [...current, property.id]
                                    )
                                  } else {
                                    setMessage(
                                      result.error ||
                                        'No pudimos registrar tu interés.'
                                    )
                                  }
                                }}
                              >
                                {interestedProperties.includes(property.id)
                                  ? 'Interés registrado ✓'
                                  : 'Me interesa esta propiedad'}
                              </button>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <p className="ui-panel">
                    Ya registramos tu requerimiento. Cuando aparezca una
                    propiedad compatible, te enviaremos una notificación.
                  </p>
                )}
              </section>
            )}
          </div>

          <aside className="demand-aside" aria-label="Privacidad y progreso del requerimiento">
            <div
              id="privacidad-requerimiento"
              ref={privacyCardRef}
              className={`demand-privacy-card${highlightPrivacy ? ' demand-privacy-card--highlight' : ''}`}
            >
              <div className="demand-privacy-card__head">
                <span className="demand-privacy-card__icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="11" width="16" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>
                </span>
                <h2>Tu información no será pública</h2>
              </div>
              <p>
                Tus datos de contacto permanecerán privados mientras tu requerimiento esté publicado. Solo podrán compartirse cuando exista una oportunidad compatible y ambas partes autoricen continuar con la colaboración.
              </p>
              <ul className="demand-privacy-card__steps">
                <li><strong>1. Envía tu requerimiento</strong> sin exponer tu teléfono ni correo.</li>
                <li><strong>2. Revisamos coincidencias</strong> reales en el inventario de Querétaro.</li>
                <li><strong>3. Autorizas el contacto</strong> únicamente con opciones relevantes.</li>
              </ul>
            </div>

            {!submitted && Boolean(draft.notice) && (
              <div className="demand-draft-bar">
                <p className="notice" role="status">{draft.notice}</p>
                <button type="button" className="button button--secondary demand-draft-discard" disabled={sending || !draft.ready} onClick={() => void draft.discard()}>Descartar borrador local</button>
              </div>
            )}
          </aside>
        </div>
      </main>
    </>
  )
}
