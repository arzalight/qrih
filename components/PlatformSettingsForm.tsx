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
    <form onSubmit={handleSubmit} className="admin-config-form">
      <div className="admin-config-form__field">
        <label htmlFor="support-email">Correo de contacto</label>
        <p>Este correo aparecerá en los avisos de cuentas suspendidas.</p>
        <input
          id="support-email"
          name="support_email"
          type="email"
          value={supportEmail}
          onChange={(event) => setSupportEmail(event.target.value)}
          placeholder="contacto@tudominio.com"
          autoComplete="email"
          disabled={saving}
        />
      </div>

      <button type="submit" disabled={saving}>
        {saving ? 'Guardando…' : 'Guardar configuración'}
      </button>

      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
    </form>
  )
}
