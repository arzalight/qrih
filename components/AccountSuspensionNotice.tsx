'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export function AccountSuspensionNotice() {
  const [supportEmail, setSupportEmail] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadSupportEmail() {
      const supabase = createClient()

      if (!supabase) {
        return
      }

      const { data, error } = await supabase
        .from('platform_settings')
        .select('support_email')
        .eq('id', true)
        .single()

      if (!error && mounted) {
        setSupportEmail(data?.support_email?.trim() ?? '')
      }
    }

    loadSupportEmail()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div
      role="alert"
      style={{
        margin: '24px 0',
        padding: '18px 20px',
        border: '1px solid #e5b4b4',
        borderRadius: '12px',
        background: '#fff5f5',
        color: '#7f1d1d',
      }}
    >
      <strong
        style={{
          display: 'block',
          marginBottom: '6px',
          fontSize: '16px',
        }}
      >
        Cuenta suspendida
      </strong>

      <span
        style={{
          display: 'block',
          lineHeight: 1.5,
        }}
      >
        Tu cuenta está suspendida y no puedes realizar nuevas publicaciones.
        Si consideras que esto es un error, contacta al administrador
        {supportEmail ? (
          <>
            {' '}en{' '}
            <a
              href={`mailto:${supportEmail}`}
              style={{
                color: '#7f1d1d',
                fontWeight: 700,
              }}
            >
              {supportEmail}
            </a>
            .
          </>
        ) : (
          '.'
        )}
      </span>
    </div>
  )
}
