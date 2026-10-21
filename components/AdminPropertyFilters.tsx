'use client'

import { useState } from 'react'
import {
  ZONAS_GENERALES,
  ZONAS_INDUSTRIALES_POR_ZONA,
} from '@/lib/zonas'

type Props = {
  status?: string
  operation?: string
  zone_general?: string
  zone?: string
  search?: string
}

export function AdminPropertyFilters({
  status = 'all',
  operation = 'all',
  zone_general = 'all',
  zone = 'all',
  search = '',
}: Props) {
  const [zonaGeneral, setZonaGeneral] = useState(zone_general)

  const zonasIndustriales =
    zonaGeneral === 'all'
      ? Object.values(ZONAS_INDUSTRIALES_POR_ZONA).flat()
      : ZONAS_INDUSTRIALES_POR_ZONA[zonaGeneral] || []

  const zonaIndustrialValida =
    zone === 'all' || zonasIndustriales.includes(zone)
      ? zone
      : 'all'

  return (
    <form
      method="get"
      style={{
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: '100%',
        marginTop: '24px',
        marginBottom: '36px',
        padding: '22px',
        border: "1px solid var(--line)",
        borderRadius: '16px',
        background: "var(--surface-subtle)",
        boxShadow: '0 4px 14px rgba(0,0,0,0.035)',
      }}
    >
      <div
        className="admin-property-filters-grid"
        style={{
          display: 'grid',
          width: '100%',
          minWidth: 0,
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
          gap: '14px',
          alignItems: 'end',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <label
            htmlFor="search"
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '11px',
              fontWeight: 700,
              color: "var(--muted)",
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Buscar propiedad
          </label>

          <input
            id="search"
            name="search"
            type="text"
            defaultValue={search}
            placeholder="Título, dirección o slug"
            style={{
              boxSizing: 'border-box',
              width: '100%',
              padding: '11px 13px',
              borderRadius: '10px',
              border: '1px solid #d5d5d5',
              background: "var(--surface)",
              fontSize: '14px',
              minHeight: '43px',
            }}
          />
        </div>

        <div style={{ minWidth: 0 }}>
          <label
            htmlFor="status"
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '11px',
              fontWeight: 700,
              color: "var(--muted)",
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Estado
          </label>

          <select
            id="status"
            name="status"
            defaultValue={status}
            style={{
              boxSizing: 'border-box',
              width: '100%',
              padding: '11px 13px',
              borderRadius: '10px',
              border: '1px solid #d5d5d5',
              background: "var(--surface)",
              fontSize: '14px',
              minHeight: '43px',
            }}
          >
            <option value="all">Todas</option>
            <option value="pending">Pendientes</option>
            <option value="published">Publicadas</option>
            <option value="rejected">Rechazadas</option>
            <option value="paused">Pausadas</option>
            <option value="expired">Expiradas</option>
            <option value="pending_update">Actualización pendiente</option>
          </select>
        </div>

        <div style={{ minWidth: 0 }}>
          <label
            htmlFor="operation"
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '11px',
              fontWeight: 700,
              color: "var(--muted)",
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Operación
          </label>

          <select
            id="operation"
            name="operation"
            defaultValue={operation}
            style={{
              boxSizing: 'border-box',
              width: '100%',
              padding: '11px 13px',
              borderRadius: '10px',
              border: '1px solid #d5d5d5',
              background: "var(--surface)",
              fontSize: '14px',
              minHeight: '43px',
            }}
          >
            <option value="all">Todas</option>
            <option value="Renta">Renta</option>
            <option value="Venta">Venta</option>
          </select>
        </div>

        <div style={{ minWidth: 0 }}>
          <label
            htmlFor="zone_general"
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '11px',
              fontWeight: 700,
              color: "var(--muted)",
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Zona general
          </label>

          <select
            id="zone_general"
            name="zone_general"
            value={zonaGeneral}
            onChange={(e) => setZonaGeneral(e.target.value)}
            style={{
              boxSizing: 'border-box',
              width: '100%',
              padding: '11px 13px',
              borderRadius: '10px',
              border: '1px solid #d5d5d5',
              background: "var(--surface)",
              fontSize: '14px',
              minHeight: '43px',
            }}
          >
            <option value="all">Todas</option>

            {ZONAS_GENERALES.map((zona) => (
              <option key={zona} value={zona}>
                {zona}
              </option>
            ))}
          </select>
        </div>

        <div style={{ minWidth: 0 }}>
          <label
            htmlFor="zone"
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '11px',
              fontWeight: 700,
              color: "var(--muted)",
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Zona industrial
          </label>

          <select
            id="zone"
            name="zone"
            defaultValue={zonaIndustrialValida}
            onChange={(e) => {
              const form = e.currentTarget.form

              if (form) {
                form.requestSubmit()
              }
            }}
            style={{
              boxSizing: 'border-box',
              width: '100%',
              padding: '11px 13px',
              borderRadius: '10px',
              border: '1px solid #d5d5d5',
              background: "var(--surface)",
              fontSize: '14px',
              minHeight: '43px',
            }}
          >
            <option value="all">Todas</option>

            {zonasIndustriales.map((zona) => (
              <option key={zona} value={zona}>
                {zona}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          style={{
            padding: '11px 20px',
            minHeight: '43px',
            borderRadius: '10px',
            border: '1px solid #111',
            background: "var(--primary)",
            color: "var(--surface)",
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          Filtrar
        </button>
      </div>
    </form>
  )
}
