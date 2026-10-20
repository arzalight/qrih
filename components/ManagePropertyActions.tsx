'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export function ManagePropertyActions({ propertyId, status, disabled }: { propertyId: string; status: string; disabled: boolean }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const busy = useRef(false)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (confirming && !dialog.current?.open) dialog.current?.showModal()
    if (!confirming && dialog.current?.open) dialog.current.close()
  }, [confirming])
  const editable = ['draft', 'rejected'].includes(status)
  async function withdraw() {
    if (busy.current) return
    busy.current = true
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/retirar-propiedad', { method: 'POST',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ propertyId, confirmed: true }) })
      if (!response.ok) throw new Error('No pudimos confirmar el retiro. Recarga Mis propiedades antes de reintentar.')
      router.push(`/mis-propiedades/${propertyId}/editar`)
      router.refresh()
    } catch { setError('No pudimos confirmar el retiro. Recarga Mis propiedades antes de reintentar.') }
    finally { busy.current = false; setLoading(false) }
  }
  return <div className="property-management-actions">
    {editable && !disabled ? <Link className="property-action" href={`/mis-propiedades/${propertyId}/editar`}>Editar</Link>
      : <button type="button" disabled={disabled || status !== 'published' || loading} onClick={() => setConfirming(true)}>Editar</button>}
    {!disabled && <Link className="property-action" href={`/publicar?duplicar=${propertyId}`}>Duplicar</Link>}
    {!editable && status !== 'published' && <small>La edición no está disponible en este estado.</small>}
    <dialog ref={dialog} onCancel={event => { if (loading) event.preventDefault(); else setConfirming(false) }}
      onClose={() => setConfirming(false)} aria-labelledby={`edit-title-${propertyId}`} className="property-edit-confirmation">
      <h3 id={`edit-title-${propertyId}`}>Editar propiedad publicada</h3>
      <p>Esta propiedad está publicada actualmente. Si continúas, dejará de estar visible en el catálogo público y regresará a borrador. Cuando termines tus modificaciones, tendrás que enviarla nuevamente a revisión para que pueda publicarse.</p>
      <div><button type="button" disabled={loading} onClick={() => { setConfirming(false); setError('') }}>Cancelar</button>
        <button type="button" disabled={loading} onClick={withdraw}>{loading ? 'Retirando…' : 'Continuar editando'}</button></div>
    </dialog>
    {error && <p role="alert">{error}</p>}
  </div>
}
