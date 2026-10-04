'use client'

import { useState } from 'react'
import {
  ZONAS_GENERALES,
  ZONAS_INDUSTRIALES_POR_ZONA,
} from '@/lib/zonas'

type InventoryFiltersProps = {
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
}: InventoryFiltersProps) {
  const [zonaGeneral, setZonaGeneral] = useState(zone_general)

  const zonasIndustriales =
    ZONAS_INDUSTRIALES_POR_ZONA[zonaGeneral] || []

  return (
    <form method="get" className="inventory-filters">

      {/* OPERACIÓN */}
      <div style={{ marginTop: '20px' }}>
        <label
          htmlFor="operation"
          style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 600,
          }}
        >
          Operación
        </label>

        <select
          id="operation"
          name="operation"
          defaultValue={operation}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #ccc',
          }}
        >
          <option value="">Todas</option>
          <option value="Renta">Renta</option>
          <option value="Venta">Venta</option>
        </select>
      </div>

      {/* ZONA GENERAL */}
      <div style={{ marginTop: '20px' }}>
        <label
          htmlFor="zone_general"
          style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 600,
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
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #ccc',
          }}
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
      <div style={{ marginTop: '20px' }}>
        <label
          htmlFor="zone"
          style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 600,
          }}
        >
          Zona industrial
        </label>

        <select
          id="zone"
          name="zone"
          defaultValue={zonaGeneral ? zone : ''}
          disabled={!zonaGeneral}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            opacity: zonaGeneral ? 1 : 0.6,
          }}
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
      <div style={{ marginTop: '20px' }}>
        <label
          htmlFor="area"
          style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 600,
          }}
        >
          Superficie mínima
        </label>

        <select
          id="area"
          name="area"
          defaultValue={area}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #ccc',
          }}
        >
          <option value="">Cualquier superficie</option>
          <option value="0-200">Menos de 200 m²</option>
          <option value="200-500">200 a 500 m²</option>
          <option value="500-1000">500 a 1,000 m²</option>
          <option value="1000-2000">1,000 a 2,000 m²</option>
          <option value="2000+">Más de 2,000 m²</option>
        </select>
      </div>

      {/* BOTÓN */}
      <button
        type="submit"
        style={{
          width: '100%',
          marginTop: '24px',
          padding: '12px 16px',
          borderRadius: '8px',
          border: 'none',
          background: '#111',
          color: '#fff',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Aplicar filtros
      </button>

      {/* LIMPIAR */}
      <a
        href="/inventario"
        style={{
          display: 'block',
          marginTop: '12px',
          textAlign: 'center',
          fontSize: '14px',
        }}
      >
        Limpiar filtros
      </a>

    </form>
  )
}
