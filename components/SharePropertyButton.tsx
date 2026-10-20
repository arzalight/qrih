'use client'

import { useState } from 'react'
import { canShareProperty, presentationLinks, presentationPath } from '@/lib/property-sharing'

export function SharePropertyButton({ slug, title, status, disabled }: {
  slug: string; title: string; status: string; disabled: boolean
}) {
  const [notice, setNotice] = useState('')
  if (!canShareProperty(status, disabled)) return <button type="button" disabled title="Sólo puedes compartir propiedades publicadas con una cuenta habilitada.">Compartir</button>
  async function copy() {
    try {
      await navigator.clipboard.writeText(presentationLinks(window.location.origin, slug, title).url)
      setNotice('Enlace copiado.')
    } catch { setNotice('No fue posible copiar. Abre la ficha y copia su dirección.') }
  }
  function whatsapp() {
    window.open(presentationLinks(window.location.origin, slug, title).whatsapp, '_blank', 'noopener,noreferrer')
  }
  return <details className="property-share-actions">
    <summary>Compartir</summary>
    <div>
      <a href={presentationPath(slug)} target="_blank" rel="noopener noreferrer">Abrir ficha digital</a>
      <button type="button" onClick={copy}>Copiar enlace</button>
      <button type="button" onClick={whatsapp}>Compartir por WhatsApp</button>
    </div>
    <p role="status">{notice}</p>
  </details>
}
