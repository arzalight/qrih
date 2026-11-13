'use client'

import { useEffect, useState } from 'react'
import { exactCount, type PublicIndicatorCounts } from '@/lib/public-indicators'
import { startVisiblePolling } from '@/lib/visible-polling'

export function PublicIndicators() {
  const [counts, setCounts] = useState<PublicIndicatorCounts | null>(null)
  useEffect(() => {
    let active = true
    let controller: AbortController | null = null
    const poll = startVisiblePolling({ delay: 60000, visible: () => document.visibilityState === 'visible',
      schedule: (task, delay) => setTimeout(task, delay), cancel: clearTimeout,
      run: async () => {
        controller = new AbortController()
        const timeout = setTimeout(() => controller?.abort(), 10000)
        try {
          const response = await fetch('/api/indicadores-publicos', { signal: controller.signal, credentials: 'omit' })
          if (!response.ok) throw Error('Unavailable')
          const data = await response.json()
          const next: PublicIndicatorCounts = { properties: exactCount(data.properties), connections: exactCount(data.connections),
            connectionsStatus: ['confirmed', 'not_enabled'].includes(data.connectionsStatus) ? data.connectionsStatus : 'unavailable' }
          if (active) setCounts(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next)
        } catch {
          if (active) setCounts({ properties: null, connections: null, connectionsStatus: 'unavailable' })
        } finally { clearTimeout(timeout); controller = null }
      },
    })
    void poll.refresh()
    const resume = () => { if (document.visibilityState === 'visible') void poll.refresh() }
    document.addEventListener('visibilitychange', resume)
    return () => { active = false; poll.stop(); controller?.abort(); document.removeEventListener('visibilitychange', resume) }
  }, [])
  const number = (value: number | null | undefined) => value == null ? '—' : value.toLocaleString('en-US')
  return <section className="public-indicators" aria-label="QRIH en cifras" aria-live="polite" aria-busy={!counts}>
    <div><strong>{number(counts?.properties)}</strong><span>Propiedades disponibles</span>
      <small>{!counts ? 'Consultando inventario…' : counts.properties === null ? 'No disponible en este momento' : 'Publicadas en el inventario'}</small></div>
    <div><strong>{number(counts?.connections)}</strong><span>Vinculaciones confirmadas</span>
      <small>{!counts ? 'Consultando vinculaciones…' : counts.connectionsStatus === 'not_enabled' ? 'Registro por habilitar'
        : counts.connections === null ? 'No disponible en este momento' : 'Solicitudes aceptadas por el responsable'}</small></div>
  </section>
}
