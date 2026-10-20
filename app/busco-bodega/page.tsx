'use client'

import { propertyPrice } from '@/lib/property-price'

import { Header } from '@/components/Header'
import { createClient } from '@/lib/supabase'
import {
  ZONAS_GENERALES,
  ZONAS_INDUSTRIALES_POR_ZONA,
} from '@/lib/zonas'
import { rankPropertiesForDemand } from '@/lib/matching'
import { useState } from 'react'

export default function Demand() {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [zonaGeneral, setZonaGeneral] = useState('')
  const [zonaIndustrial, setZonaIndustrial] = useState('')
  const [matchedProperties, setMatchedProperties] = useState<any[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [submittedDemandId, setSubmittedDemandId] = useState('')
  const [interestedProperties, setInterestedProperties] = useState<string[]>([])

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (sending) return
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

    setSending(true)
    try {
    const response = await fetch('/api/requerimientos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, area_min: areaMin, area_max: areaMax, budget_min: budgetMin, budget_max: budgetMax }),
    })
    const result = await response.json()
    const insertedDemand = response.ok ? result : null
    const error = response.ok ? null : { message: result.error || 'No se pudo enviar el requerimiento.' }

    setMessage(
      error
        ? error.message
        : 'Tu requerimiento fue registrado. Te contactaremos pronto.'
    )

    if (!error && insertedDemand) {
      setSubmitted(true)
      setSubmittedDemandId(insertedDemand.id)
      setInterestedProperties([])

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

      formElement.reset()
      setZonaGeneral('')
      setZonaIndustrial('')
    }
    } catch { setMessage('No se pudo completar el envío. Revisa tu conexión antes de reintentar.') }
    finally { setSending(false) }
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

        <form onSubmit={send}>
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
                color: '#111827',
              }}
            >
              Tu información de contacto
            </h2>

            <div className="two">
              <input
                required
                name="name"
                placeholder="Nombre completo"
              />

              <input
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
              />
            </div>

            <input
              required
              type="email"
              name="email"
              placeholder="Correo electrónico"
            />

            <div
              style={{
                marginTop: 18,
                paddingTop: 18,
                borderTop: '1px solid #e5e7eb',
              }}
            >
              <h3
                style={{
                  margin: '0 0 12px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#374151',
                }}
              >
                Datos de la empresa que busca la propiedad
              </h3>

              <div className="two">
                <input
                  name="company"
                  placeholder="Empresa"
                />

                <input
                  name="giro"
                  placeholder="Giro"
                />
              </div>
            </div>

            <p
              style={{
                margin: '18px 0 0',
                color: '#6b7280',
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              <strong style={{ color: '#374151' }}>Tu información no será pública.</strong>{' '}
              Tus datos de contacto permanecerán privados mientras tu requerimiento
              esté publicado. Solo podrán compartirse cuando exista una oportunidad
              compatible y ambas partes autoricen continuar con la colaboración.
            </p>
          </div>

          <div
            style={{
              borderTop: '1px solid #e5e7eb',
              paddingTop: 24,
            }}
          >
            <h2
              style={{
                margin: '0 0 14px',
                fontSize: 16,
                fontWeight: 600,
                color: '#111827',
              }}
            >
              Información de la bodega
            </h2>

            <div className="two">
              <select name="operation" required>
                <option value="Renta">Renta</option>
                <option value="Venta">Venta</option>
              </select>

              <select
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
              </select>
            </div>

            <div className="two">
              <select
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
              </select>

              <div>
                <input
                  required
                  type="number"
                  min="1"
                  name="area_min"
                  placeholder="Superficie mínima m²"
                />

                <input
                  required
                  type="number"
                  min="1"
                  name="area_max"
                  placeholder="Superficie máxima m²"
                />
              </div>
            </div>

            <div className="two">
              <input
                required
                type="number"
                min="0"
                name="budget_min"
                placeholder="Presupuesto mínimo"
              />

              <input
                required
                type="number"
                min="0"
                name="budget_max"
                placeholder="Presupuesto máximo"
              />
            </div>

            <textarea
              name="notes"
              placeholder="Características especiales y comentarios"
            />
          </div>

          <button type="submit" disabled={sending}>
            ENVIAR MI REQUERIMIENTO →
          </button>

          {message && (
            <p className="notice">
              {message}
            </p>
          )}

          </form>

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
                            border: '1px solid #e5e5e5',
                            borderRadius: '16px',
                            padding: '20px',
                            background: '#fff',
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
                                  background: '#111',
                                  color: '#fff',
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
                                  : '#fff',
                                color: '#111',
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
                    border: '1px solid #e5e5e5',
                    borderRadius: '16px',
                    background: '#fff',
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
