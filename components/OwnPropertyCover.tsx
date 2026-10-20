'use client'

import { useEffect, useRef, useState } from 'react'

export function OwnPropertyCover({ propertyId, initialUrl, title }: { propertyId: string; initialUrl: string | null; title: string }) {
  const [url, setUrl] = useState(initialUrl)
  const [failed, setFailed] = useState(false)
  const busy = useRef(false)
  const retry = useRef<() => void>(() => {})
  const lastErrorRenewal = useRef(0)
  useEffect(() => {
    const controller = new AbortController()
    async function renew() {
      if (busy.current) return
      busy.current = true
      try {
        const response = await fetch(`/api/mis-propiedades/${propertyId}/portada`, { cache: 'no-store', signal: controller.signal })
        const result = response.ok ? await response.json() : null
        if (!controller.signal.aborted) { setUrl(result?.url || null); setFailed(false) }
      } catch { /* Display the neutral fallback; never log signed URLs. */ }
      finally { busy.current = false }
    }
    const timer = setInterval(renew, 14 * 60 * 1000)
    retry.current = () => { void renew() }
    return () => { controller.abort(); clearInterval(timer) }
  }, [propertyId])
  return <div className="own-property-cover">
    {url && !failed ? <img src={url} alt={`Portada de ${title}`} loading="lazy" decoding="async" onError={() => {
      setFailed(true)
      if (Date.now() - lastErrorRenewal.current > 60_000) {
        lastErrorRenewal.current = Date.now()
        retry.current()
      }
    }} />
      : <span role="img" aria-label="Fotografía no disponible">Sin fotografía disponible</span>}
  </div>
}
