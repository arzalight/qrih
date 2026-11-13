'use client'

import { useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { startVisiblePolling } from '@/lib/visible-polling'

// Mount only on authorized read/list pages, never moderation/profile/edit forms.
export function AdminAutoRefresh({ scopeKey }: { scopeKey: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const inFlight = useRef(false)
  useEffect(() => { if (!pending) inFlight.current = false }, [pending])
  useEffect(() => {
    let dirty = false
    let submitting = false
    const edited = (event: Event) => {
      if (event.target instanceof Element && event.target.closest('main form')) dirty = true
    }
    const submit = (event: Event) => {
      if (event.target instanceof Element && event.target.closest('main')) submitting = true
    }
    const safeToRefresh = () => document.visibilityState === 'visible' && !dirty && !submitting
      && !inFlight.current && !document.querySelector('main [aria-busy="true"], main button:disabled[type="submit"]')
      && !document.activeElement?.closest('main input, main select, main textarea, main [contenteditable="true"], main button')
      && !window.getSelection()?.toString()
    const poll = startVisiblePolling({ delay: 30000, visible: safeToRefresh,
      schedule: (task, delay) => setTimeout(task, delay), cancel: clearTimeout,
      run: async () => {
        inFlight.current = true
        startTransition(() => router.refresh())
      },
    })
    document.addEventListener('input', edited, true)
    document.addEventListener('change', edited, true)
    document.addEventListener('submit', submit, true)
    return () => {
      poll.stop()
      document.removeEventListener('input', edited, true)
      document.removeEventListener('change', edited, true)
      document.removeEventListener('submit', submit, true)
    }
  }, [router, scopeKey])
  return <small className="admin-refresh-status" role="status">{pending ? 'Actualizando información…' : 'Actualización cada 30 s · en pausa mientras editas'}</small>
}
