'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function RegisterOpportunityButton({ demandRequestId, propertyId }: {
  demandRequestId: string
  propertyId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [message, setMessage] = useState('')

  async function submit() {
    if (loading || registered) return
    setLoading(true)
    setMessage('')
    try {
      const body = new FormData()
      body.set('demand_request_id', demandRequestId)
      body.set('property_id', propertyId)
      const response = await fetch('/api/registrar-oportunidad', { method: 'POST', body })
      if (response.ok || response.status === 409) {
        setRegistered(true)
        setMessage(response.ok ? 'Tu propiedad fue postulada.' : 'Tu propiedad ya estaba postulada.')
        router.refresh()
      } else {
        setMessage('No fue posible postular la propiedad. Recarga para comprobar su disponibilidad.')
      }
    } catch {
      setMessage('No pudimos confirmar el envío. Recarga antes de volver a intentarlo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button type="button" onClick={submit} disabled={loading || registered}
        style={{ padding: '9px 14px', border: '1px solid #111827', borderRadius: 8,
          background: '#111827', color: '#ffffff', fontWeight: 600,
          cursor: loading || registered ? 'default' : 'pointer', fontSize: 13 }}>
        {registered ? 'Propiedad registrada ✓' : loading ? 'Postulando…' : 'Registrar mi propiedad'}
      </button>
      {message && <p role="status" style={{ margin: '8px 0 0', fontSize: 13 }}>{message}</p>}
    </div>
  )
}
