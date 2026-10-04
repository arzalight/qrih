'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

type Props = {
  initialValue: boolean
}

export function AutoApproveContactsToggle({
  initialValue,
}: Props) {
  const [enabled, setEnabled] = useState(initialValue)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function handleChange() {
    const nextValue = !enabled

    setSaving(true)
    setMessage('')

    const supabase = createClient()

    if (!supabase) {
      setMessage('Supabase no está configurado correctamente.')
      setSaving(false)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setMessage('Necesitas iniciar sesión.')
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        auto_approve_contact_requests: nextValue,
      })
      .eq('id', user.id)

    if (error) {
      setMessage('No fue posible guardar el cambio.')
      setSaving(false)
      return
    }

    setEnabled(nextValue)
    setMessage(
      nextValue
        ? 'Las solicitudes se aprobarán automáticamente.'
        : 'Las solicitudes requerirán aprobación.'
    )
    setSaving(false)
  }

  return (
    <div
      style={{
        marginTop: 24,
        padding: 20,
        border: '1px solid #e5e7eb',
        borderRadius: 14,
        background: '#fafafa',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <div>
          <strong
            style={{
              display: 'block',
              marginBottom: 5,
              fontSize: 16,
            }}
          >
            Aprobar todas las solicitudes automáticamente
          </strong>

          <span
            style={{
              color: '#6b7280',
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            Permite que los asesores vean tus datos de contacto
            automáticamente cuando soliciten información.
          </span>
        </div>

        <button
          type="button"
          onClick={handleChange}
          disabled={saving}
          aria-pressed={enabled}
          aria-label="Aprobar todas las solicitudes automáticamente"
          style={{
            position: 'relative',
            flexShrink: 0,
            width: 52,
            height: 30,
            padding: 0,
            border: 'none',
            borderRadius: 999,
            background: enabled ? '#111827' : '#d1d5db',
            cursor: saving ? 'wait' : 'pointer',
            transition: 'background 0.2s ease',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 3,
              left: enabled ? 25 : 3,
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: '#fff',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
              transition: 'left 0.2s ease',
            }}
          />
        </button>
      </div>

      {message && (
        <p
          style={{
            margin: '12px 0 0',
            fontSize: 13,
            color: '#6b7280',
          }}
        >
          {message}
        </p>
      )}
    </div>
  )
}
