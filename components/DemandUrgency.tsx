'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { activeDemand, urgencyActive } from '@/lib/private-commercial'

type Demand = { id: string; status: string; created_at: string; urgency_expires_at?: string | null }
export function DemandUrgency({ demand, editable = false }: { demand: Demand; editable?: boolean }) {
  const [now, setNow] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const busy = useRef(false)
  const router = useRouter()
  useEffect(() => {
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 60000)
    const expires = Date.parse(demand.urgency_expires_at || '')
    const remaining = expires - Date.now()
    const expiration = remaining > 0 && remaining <= 2147483647 ? setTimeout(() => {
      setNow(Date.now()); router.refresh()
    }, remaining + 1) : null
    return () => { clearInterval(timer); if (expiration) clearTimeout(expiration) }
  }, [demand.urgency_expires_at, router])
  const urgent = now !== null && urgencyActive(demand, now)
  async function change(action: string) {
    if (busy.current) return
    busy.current = true; setLoading(true); setMessage('')
    try {
      const response = await fetch('/api/requerimientos/urgencia', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: demand.id, action }) })
      const result = await response.json()
      if (!response.ok) throw Error(result.error || 'No fue posible cambiar la urgencia.')
      setMessage(action === 'remove' ? 'Urgencia retirada.' : 'Urgencia guardada por siete días.'); router.refresh()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No fue posible cambiar la urgencia.') }
    finally { busy.current = false; setLoading(false) }
  }
  return <div className="demand-urgency">
    {urgent && <span className="demand-urgency__badge">Urgente · hasta {new Date(demand.urgency_expires_at!).toLocaleString('es-MX', { timeZone: 'America/Mexico_City', dateStyle: 'short', timeStyle: 'short' })}</span>}
    {editable && now !== null && activeDemand(demand, now) && <div className="ui-actions">
      <button type="button" disabled={loading} onClick={() => change(urgent ? 'renew' : 'activate')}>{urgent ? 'Renovar urgencia · 7 días' : 'Marcar como urgente'}</button>
      {urgent && <button type="button" disabled={loading} onClick={() => change('remove')}>Retirar urgencia</button>}
    </div>}
    {editable && !activeDemand(demand, now ?? Date.now()) && demand.urgency_expires_at && <button type="button" disabled={loading} onClick={() => change('remove')}>Retirar urgencia</button>}
    {message && <p role="status">{message}</p>}
  </div>
}
