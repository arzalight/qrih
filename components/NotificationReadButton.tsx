'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { markNotificationsRead, NOTIFICATIONS_CHANGED } from '@/lib/notification-read'

export function NotificationReadButton({ id }: { id?: string }) {
  const busy = useRef(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  return <div>
    <button type="button" disabled={loading} onClick={async () => {
      if (busy.current) return
      busy.current = true; setLoading(true); setError('')
      try {
        const client = createClient()
        if (!client) throw new Error('Servicio no disponible.')
        await markNotificationsRead(client, id)
        window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED))
        router.refresh()
      } catch { setError('No fue posible actualizar las notificaciones. Vuelve a intentar.') }
      finally { busy.current = false; setLoading(false) }
    }}>{loading ? 'Actualizando…' : id ? 'Marcar como leída' : 'Marcar todas como leídas'}</button>
    {error && <p role="alert">{error}</p>}
  </div>
}
