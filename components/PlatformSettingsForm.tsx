'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

type Props = {
  initialSupportEmail: string
}

export function PlatformSettingsForm({
  initialSupportEmail,
}: Props) {
  const [supportEmail, setSupportEmail] = useState(initialSupportEmail)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const email = supportEmail.trim()

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

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      setMessage('No tienes permisos para modificar esta configuración.')
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('platform_settings')
      .update({
        support_email: email || null,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', true)

    if (error) {
      setMessage('No fue posible guardar la configuración.')
      setSaving(false)
      return
    }

    setSupportEmail(email)
    setMessage('Correo de contacto actualizado correctamente.')
    setSaving(false)
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginTop: 24,
        padding: 24,
        border: "1px solid var(--line)",
        borderRadius: 14,
        background: "var(--surface)",
      }}
    >
      <div style={{ marginBottom: 18 }}>
        <label
          htmlFor="support-email"
          style={{
            display: 'block',
            marginBottom: 8,
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          Correo de contacto
        </label>

        <p
          style={{
            margin: '0 0 12px',
            color: "var(--muted)",
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          Este correo aparecerá en los avisos de cuentas suspendidas.
        </p>

        <input
          id="support-email"
          name="support_email"
          type="email"
          value={supportEmail}
          onChange={(event) => setSupportEmail(event.target.value)}
          placeholder="contacto@tudominio.com"
          autoComplete="email"
          disabled={saving}
          style={{
            width: '100%',
            maxWidth: 520,
            padding: '12px 14px',
            border: '1px solid #d1d5db',
            borderRadius: 10,
            fontSize: 15,
            boxSizing: 'border-box',
          }}
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        style={{
          padding: '11px 16px',
          border: 'none',
          borderRadius: 10,
          background: "var(--ink)",
          color: "var(--surface)",
          fontWeight: 700,
          cursor: saving ? 'wait' : 'pointer',
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? 'Guardando...' : 'Guardar configuración'}
      </button>

      {message && (
        <p
          role="status"
          style={{
            margin: '14px 0 0',
            fontSize: 13,
            color: "var(--muted)",
          }}
        >
          {message}
        </p>
      )}
    </form>
  )
}
