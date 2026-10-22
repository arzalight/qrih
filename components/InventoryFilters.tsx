'use client'

import { useId, useRef, useState } from 'react'
import {
  ZONAS_GENERALES,
  ZONAS_INDUSTRIALES_POR_ZONA,
} from '@/lib/zonas'

type InventoryFiltersProps = {
  currency?: string
  price_min?: string
  price_max?: string
  price_unit?: string
  operation?: string
  zone_general?: string
  zone?: string
  area?: string
}

export function InventoryFilters({
  operation = '',
  zone_general = '',
  zone = '',
  area = '',
  currency = '', price_min = '', price_max = '', price_unit = '',
}: InventoryFiltersProps) {
  const [zonaGeneral, setZonaGeneral] = useState(zone_general)
  const [expanded, setExpanded] = useState(false)
  const contentId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const appliedCount = [operation, zone_general, zone, area, currency, price_min, price_max, price_unit]
    .filter(Boolean).length

  const zonasIndustriales =
    ZONAS_INDUSTRIALES_POR_ZONA[zonaGeneral] || []

  return (
    <div className="inventory-filter-panel" data-expanded={expanded}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && expanded) {
          setExpanded(false)
          triggerRef.current?.focus()
        }
      }}>
      <b className="inventory-filter-panel__heading">Filtros</b>
      <button ref={triggerRef} type="button" className="inventory-filter-panel__toggle"
        aria-expanded={expanded} aria-controls={contentId}
        onClick={() => setExpanded((value) => !value)}>
        <span>Filtros{appliedCount > 0 ? ` · ${appliedCount} activos` : ''}</span>
        <span aria-hidden="true">{expanded ? '−' : '+'}</span>
      </button>
      <div id={contentId} className="inventory-filter-panel__content">
    <form method="get" className="inventory-filters">

      {/* OPERACIÓN */}
      <div >
        <label
          htmlFor="operation"

        >
          Operación
        </label>

        <select
          id="operation"
          name="operation"
          defaultValue={operation}

        >
          <option value="">Todas</option>
          <option value="Renta">Renta</option>
          <option value="Venta">Venta</option>
        </select>
      </div>

      {/* ZONA GENERAL */}
      <div >
        <label
          htmlFor="zone_general"

        >
          Zona general
        </label>

        <select
          id="zone_general"
          name="zone_general"
          value={zonaGeneral}
          onChange={(e) => setZonaGeneral(e.target.value)}

        >
          <option value="">Todas</option>

          {ZONAS_GENERALES.map((zona) => (
            <option key={zona} value={zona}>
              {zona}
            </option>
          ))}
        </select>
      </div>

      {/* ZONA INDUSTRIAL */}
      <div >
        <label
          htmlFor="zone"

        >
          Zona industrial
        </label>

        <select
          id="zone"
          name="zone"
          defaultValue={zonaGeneral ? zone : ''}
          disabled={!zonaGeneral}

        >
          <option value="">
            {zonaGeneral
              ? 'Todas'
              : 'Selecciona primero una zona general'}
          </option>

          {zonasIndustriales.map((zona) => (
            <option key={zona} value={zona}>
              {zona}
            </option>
          ))}
        </select>
      </div>

      {/* SUPERFICIE */}
      <div >
        <label
          htmlFor="area"

        >
          Superficie mínima
        </label>

        <select
          id="area"
          name="area"
          defaultValue={area}

        >
          <option value="">Cualquier superficie</option>
          <option value="0-200">Menos de 200 m²</option>
          <option value="200-500">200 a 500 m²</option>
          <option value="500-1000">500 a 1,000 m²</option>
          <option value="1000-2000">1,000 a 2,000 m²</option>
          <option value="2000+">Más de 2,000 m²</option>
        </select>
      </div>

      <label>Moneda<select name="currency" defaultValue={currency}>
        <option value="">Todas las monedas</option><option value="MXN">MXN</option><option value="USD">USD</option>
      </select></label>
      <label>Unidad del rango<select name="price_unit" defaultValue={price_unit}>
        <option value="">Selecciona unidad</option><option value="m2">Por m²</option><option value="total">Total</option>
      </select></label>
      <label>Precio mínimo<input name="price_min" type="number" min="0.01" step="0.01" defaultValue={price_min} /></label>
      <label>Precio máximo<input name="price_max" type="number" min="0.01" step="0.01" defaultValue={price_max} /></label>
      <small>El rango requiere moneda, operación y unidad. Sin conversión de divisas.</small>
      {/* BOTÓN */}
      <button
        type="submit"

      >
        Aplicar filtros
      </button>

      {/* LIMPIAR */}
      <a
        href="/inventario"

      >
        Limpiar filtros
      </a>

    </form>
      </div>
    </div>
  )
}
