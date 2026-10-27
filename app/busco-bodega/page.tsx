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

      <main className="form">
        <small>DEMANDA INDUSTRIAL</small>

        <h1>¿Buscas una bodega?</h1>

        <p>
          Comparte tu requerimiento y activaremos nuestra búsqueda.
        </p>

        <DeferredAuthNotice open={draft.authOpen} onClose={() => draft.setAuthOpen(false)} path="/busco-bodega" memoryOnly={draft.memoryOnly} />
        {!submitted && <p className="notice" role="status">{draft.notice || 'Tu progreso se guarda en este navegador durante 7 días. En equipos compartidos, descarta el borrador al terminar.'}</p>}
        {!submitted && <button type="button" disabled={sending || !draft.ready} onClick={() => void draft.discard()}>Descartar borrador local</button>}
        <form ref={draft.formRef} onInput={draft.scheduleSave} onChange={draft.scheduleSave} onSubmit={send} hidden={submitted}>
          <fieldset disabled={!draft.ready || sending}>
          <div
            style={{
              marginBottom: 24,
            }}
          >
            <h2
              style={{
                margin: '0 0 14px',
                fontSize: 16,
                fontWeight: 600,
                color: "var(--ink)",
              }}
            >
              Tu información de contacto
            </h2>

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

            <div
              style={{
                marginTop: 18,
                paddingTop: 18,
                borderTop: "1px solid var(--line)",
              }}
            >
              <h3
                style={{
                  margin: '0 0 12px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--ink)",
                }}
              >
                Datos de la empresa que busca la propiedad
              </h3>

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

            <p
              style={{
                margin: '18px 0 0',
                color: "var(--muted)",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              <strong style={{ color: "var(--ink)" }}>Tu información no será pública.</strong>{' '}
              Tus datos de contacto permanecerán privados mientras tu requerimiento
              esté publicado. Solo podrán compartirse cuando exista una oportunidad
              compatible y ambas partes autoricen continuar con la colaboración.
            </p>
          </div>

          <div
            style={{
              borderTop: "1px solid var(--line)",
              paddingTop: 24,
            }}
          >
            <h2
              style={{
                margin: '0 0 14px',
                fontSize: 16,
                fontWeight: 600,
                color: "var(--ink)",
              }}
            >
              Información de la bodega
            </h2>

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

            <div className="two">
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

              <div>
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
            </div>

            <div className="two">
              <FormField id="field-2-budget_min" label="Presupuesto mínimo" required><input id="field-2-budget_min"
                required
                type="number"
                min="0"
                name="budget_min"
                placeholder="Presupuesto mínimo"
              /></FormField>

              <FormField id="field-2-budget_max" label="Presupuesto máximo" required><input id="field-2-budget_max"
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

          <button type="submit" disabled={sending}>
            ENVIAR A REVISIÓN →
          </button>

          {message && (
            <p className="notice">
              {message}
            </p>
          )}

          </fieldset>
          </form>

          {submitted && <section role="status" className="notice"><h2>¡Requerimiento recibido para revisión!</h2><p>{message}</p><a href="/mis-propiedades?view=requirements">Ver mis requerimientos</a></section>}

          {submitted && (
            <section
              style={{
                marginTop: '32px',
                width: '100%',
                maxWidth: '760px',
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              {matchedProperties.length > 0 ? (
                <>
                  <h2 style={{ marginTop: '8px' }}>
                    {matchedProperties.length === 1
                      ? 'Encontramos una propiedad que podría interesarte.'
                      : `Encontramos ${matchedProperties.length} propiedades que podrían interesarte.`}
                  </h2>

                  <div
                    style={{
                      display: 'grid',
                      gap: '16px',
                      marginTop: '24px',
                    }}
                  >
                    {matchedProperties.map(({ property, result }) => {
                      const isHighMatch = result.total >= 75

                      return (
                        <article
                          key={property.id}
                          style={{
                            width: '100%',
                            maxWidth: '680px',
                            margin: '0 auto',
                            border: "1px solid var(--line)",
                            borderRadius: '16px',
                            padding: '20px',
                            background: "var(--surface)",
                            boxSizing: 'border-box',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
                          }}
                        >
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '6px 10px',
                              borderRadius: '999px',
                              background: isHighMatch
                                ? '#ecfdf3'
                                : '#fff8e1',
                              color: isHighMatch
                                ? '#18794e'
                                : '#9a6700',
                              fontSize: '13px',
                              fontWeight: 700,
                              marginBottom: '12px',
                            }}
                          >
                            {isHighMatch
                              ? 'Alta coincidencia'
                              : 'Coincidencia'}
                          </div>

                          <h3 style={{ margin: '0 0 12px' }}>
                            {property.title}
                          </h3>

                          <p>
                            <strong>Operación:</strong>{' '}
                            {property.operation}
                          </p>

                          <p>
                            <strong>Zona:</strong> {property.zone}
                          </p>

                          <p>
                            <strong>Superficie:</strong>{' '}
                            {property.total_area || 'N/D'} m²
                          </p>

                          <p>
                            <strong>Precio:</strong>{' '}
                            {propertyPrice(property)}
                          </p>

                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '10px',
                              marginTop: '14px',
                            }}
                          >
                            {property.slug && (
                              <a
                                href={`/bodegas/${property.slug}`}
                                style={{
                                  display: 'inline-block',
                                  padding: '11px 18px',
                                  borderRadius: '10px',
                                  background: "var(--primary)",
                                  color: "var(--surface)",
                                  textDecoration: 'none',
                                  fontWeight: 600,
                                }}
                              >
                                Ver propiedad
                              </a>
                            )}

                            <button
                              type="button"
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
                              style={{
                                display: 'inline-block',
                                padding: '11px 18px',
                                borderRadius: '10px',
                                border: '1px solid #111',
                                background: interestedProperties.includes(
                                  property.id
                                )
                                  ? '#f3f4f6'
                                  : "var(--surface)",
                                color: "var(--primary)",
                                fontWeight: 600,
                                cursor: interestedProperties.includes(
                                  property.id
                                )
                                  ? 'default'
                                  : 'pointer',
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
                <p
                  style={{
                    padding: '20px',
                    border: "1px solid var(--line)",
                    borderRadius: '16px',
                    background: "var(--surface)",
                  }}
                >
                  Ya registramos tu requerimiento. Cuando aparezca una
                  propiedad compatible, te enviaremos una notificación.
                </p>
              )}
            </section>
          )}

        <style jsx global>{`
          .form select {
            appearance: none;
            -webkit-appearance: none;
            background: #fff !important;
            background-image: none !important;
            border: 1px solid #d9d9d9;
            border-radius: 10px;
            min-height: 48px;
            padding: 0 14px;
            color: #111;
            box-shadow: none;
          }

          .form select:focus {
            outline: none;
            border-color: #999;
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
          }

          .form select option {
            background: #fff;
            color: #111;
          }

          @media (max-width: 640px) {
            .form {
              padding-left: 16px;
              padding-right: 16px;
            }

            .form select {
              width: 100%;
              font-size: 16px;
            }
          }
        `}</style>
      </main>
    </>
  )
}
