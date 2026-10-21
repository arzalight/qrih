'use client'

import { useState } from 'react'

type AuthorizationActionsProps = {
  authorizationId: string
}

export function AuthorizationActions({
  authorizationId,
}: AuthorizationActionsProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleAction(
    status: 'authorized' | 'declined'
  ) {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch(
        '/api/contactar-propiedad/autorizacion',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            authorization_id: authorizationId,
            status,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'No fue posible actualizar la solicitud.'
        )
      }

      setMessage(
        status === 'authorized'
          ? 'Contacto autorizado correctamente.'
          : 'Solicitud rechazada correctamente.'
      )

      window.location.reload()
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          disabled={loading}
          onClick={() => handleAction('authorized')}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: 'none',
            background: "var(--ink)",
            color: "var(--surface)",
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          Autorizar contacto
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => handleAction('declined')}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: "1px solid var(--line)",
            background: "var(--surface)",
            color: '#333',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          Rechazar
        </button>
      </div>

      {message && (
        <p
          style={{
            marginTop: 10,
            fontSize: 14,
          }}
        >
          {message}
        </p>
      )}
    </div>
  )
}
