'use client'

import { useEffect, useState } from 'react'
import {
  ZONAS_GENERALES,
  ZONAS_INDUSTRIALES_POR_ZONA,
} from '@/lib/zonas'

type ZoneSelectorsProps = {
  initialGeneral?: string
  initialIndustrial?: string
}

export function ZoneSelectors({
  initialGeneral = '',
  initialIndustrial = '',
}: ZoneSelectorsProps) {
  const [zonaGeneral, setZonaGeneral] = useState(initialGeneral)
  const [zonaIndustrial, setZonaIndustrial] = useState(initialIndustrial)

  const zonasIndustriales =
    ZONAS_INDUSTRIALES_POR_ZONA[zonaGeneral] || []

  useEffect(() => {
    if (
      initialIndustrial &&
      zonasIndustriales.includes(initialIndustrial)
    ) {
      setZonaIndustrial(initialIndustrial)
    }
  }, [initialIndustrial, zonaGeneral, zonasIndustriales])

  return (
    <div className="zone-selectors" style={{ display: 'grid', gap: '12px' }}>
      <label className="ui-field">Zona general<select
        required
        name="zone_general"
        value={zonaGeneral}
        onChange={(e) => {
          setZonaGeneral(e.target.value)
          setZonaIndustrial('')
        }}
        style={{ width: '100%', padding: '10px' }}
      >
        <option value="" disabled>
          Selecciona una zona general
        </option>

        {ZONAS_GENERALES.map((zona) => (
          <option key={zona} value={zona}>
            {zona}
          </option>
        ))}
      </select></label>

      <label className="ui-field">Zona industrial<select
        required
        name="zone"
        value={zonaIndustrial}
        onChange={(e) => setZonaIndustrial(e.target.value)}
        disabled={!zonaGeneral}
        style={{ width: '100%', padding: '10px' }}
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
      </select></label>
    </div>
  )
}
