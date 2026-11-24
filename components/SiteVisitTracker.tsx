'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const SID_KEY = 'qrih_visit_sid'
const DAY_KEY = 'qrih_visit_day'

function isPublicVisitRoute(pathname: string): boolean {
  if (pathname === '/' || pathname === '/inventario' || pathname === '/busco-bodega') return true
  if (pathname === '/privacidad' || pathname === '/terminos') return true
  if (/^\/bodegas\/[^/]+$/.test(pathname)) return true
  if (/^\/asesor\/[^/]+$/.test(pathname)) return true
  return false
}

function getOrCreateSessionId(): string | null {
  try {
    const existing = window.sessionStorage.getItem(SID_KEY)
    if (existing) return existing
    const next = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : null
    if (!next) return null
    window.sessionStorage.setItem(SID_KEY, next)
    return next
  } catch {
    return null
  }
}

export function SiteVisitTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname || !isPublicVisitRoute(pathname)) return
    if (typeof navigator !== 'undefined' && navigator.webdriver) return

    const today = new Date().toISOString().slice(0, 10)
    try {
      if (window.sessionStorage.getItem(DAY_KEY) === today) return
    } catch {
      return
    }

    const sessionId = getOrCreateSessionId()
    if (!sessionId) return

    try {
      window.sessionStorage.setItem(DAY_KEY, today)
    } catch {
      // ignore storage quota errors
    }

    void fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, path: pathname }),
      keepalive: true,
    }).catch(() => {
      // fail silently: analytics never disturbs browsing
    })
  }, [pathname])

  return null
}
