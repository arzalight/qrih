'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeletePropertyButton({
  propertyId,
}: {
  propertyId: string
}) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    const confirmed = window.confirm(
      '¿Seguro que quieres eliminar esta propiedad? Esta acción no se puede deshacer.'
    )

    if (!confirmed) {
      return
    }

    setDeleting(true)
    setError('')

    try {
      const response = await fetch('/api/eliminar-propiedad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'No se pudo eliminar la propiedad.')
        setDeleting(false)
        return
      }

      router.refresh()
    } catch {
      setError('No se pudo conectar con el servidor.')
      setDeleting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button
        className="button--danger"
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        style={{
          width: '180px',
          minHeight: '44px',
          borderRadius: '10px',
          border: '1px solid #d1d5db',
          background: deleting ? '#f3f4f6' : "var(--surface)",
          color: "var(--danger)",
          fontWeight: 700,
          cursor: deleting ? 'not-allowed' : 'pointer',
          padding: '10px 16px',
        }}
      >
        {deleting ? 'Eliminando...' : 'Eliminar'}
      </button>

      {error && (
        <p
          role="alert"
          style={{
            margin: 0,
            maxWidth: '180px',
            fontSize: '12px',
            lineHeight: 1.4,
            color: "var(--danger)",
          }}
        >
          {error}
        </p>
      )}
    </div>
  )
}
