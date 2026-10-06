'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { loadOwnPropertyContact, type OwnerContact } from '@/lib/property-contact-state'

type PropertyContactFormProps = {
  propertyId: string
}

export function PropertyContactForm({
  propertyId,
}: PropertyContactFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [owner, setOwner] = useState<OwnerContact | null>(null)
  const [authorizationId, setAuthorizationId] = useState<string | null>(null)
  const [authorizationStatus, setAuthorizationStatus] = useState<string | null>(null)
  const [restoring, setRestoring] = useState(true)
  const [authVersion, setAuthVersion] = useState(0)
  const contactEpoch = useRef(0)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')

  useEffect(() => {
    if (!supabase) return
    let actorId: string | null | undefined
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextActor = session?.user.id ?? null
      if (actorId === nextActor) return
      actorId = nextActor
      contactEpoch.current += 1
      setOwner(null)
      setAuthorizationId(null)
      setAuthorizationStatus(null)
      setMessage('')
      setLoading(false)
      setName('')
      setPhone('')
      setEmail('')
      setCompany('')
      setRestoring(true)
      // Callback síncrono: las lecturas se realizan en el efecto posterior.
      setAuthVersion((version) => version + 1)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    let active = true
    const epoch = contactEpoch.current
    const isCurrent = () => active && epoch === contactEpoch.current

    async function restoreContact() {
      setRestoring(true)
      setOwner(null)
      setAuthorizationId(null)
      setAuthorizationStatus(null)
      setMessage('')
      const state = supabase ? await loadOwnPropertyContact(supabase, propertyId) : null
      if (!isCurrent()) return
      if (state) {
        setAuthorizationId(state.authorizationId)
        setAuthorizationStatus(state.status)
        setOwner(state.owner)
        if (state.status === 'pending') setMessage('La solicitud está pendiente de autorización.')
      }
      setRestoring(false)
    }

    void restoreContact()
    return () => { active = false }
  }, [supabase, propertyId, authVersion])

  useEffect(() => {
    if (!authorizationId || authorizationStatus !== 'pending') {
      return
    }

    let active = true
    const epoch = contactEpoch.current
    const isCurrent = () => active && epoch === contactEpoch.current
    const interval = window.setInterval(async () => {
      if (!supabase || !isCurrent()) return

      try {
        const { data: authorization, error } = await supabase
          .from('property_contact_authorizations')
          .select('status')
          .eq('id', authorizationId)
          .single()

        if (error || !authorization || !isCurrent()) return

        if (authorization.status !== 'pending') {
          if (authorization.status === 'authorized') {
            const { data: ownerData, error: ownerError } = await supabase.rpc(
              'get_property_publisher_contact', { p_property_id: propertyId },
            )
            if (!isCurrent()) return
            if (!ownerError && ownerData && ownerData.length > 0) {
              setOwner(ownerData[0])
              setMessage('El propietario autorizó el contacto.')
            }
          }
          // Después del RPC: cambiar status desmonta este efecto de polling.
          setAuthorizationStatus(authorization.status)
          window.clearInterval(interval)
        }
      } catch {
        // Mantener contacto oculto ante fallo de red, sin errores privados.
      }
    }, 10000)

    return () => { active = false; window.clearInterval(interval) }
  }, [authorizationId, authorizationStatus, propertyId, supabase, authVersion])

  useEffect(() => {
    let active = true
    const epoch = contactEpoch.current
    async function loadProfile() {
      if (!supabase) return

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || !active || epoch !== contactEpoch.current) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone, company_name')
        .eq('id', user.id)
        .single()

      if (!active || epoch !== contactEpoch.current) return
      setName(profile?.full_name || user.user_metadata?.full_name || '')
      setPhone(profile?.phone || user.user_metadata?.phone || '')
      setCompany(
        profile?.company_name ||
          user.user_metadata?.company_name ||
          ''
      )
      setEmail(user.email || '')
    }

    void loadProfile().catch(() => {})
    return () => { active = false }
  }, [supabase, authVersion])

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    if (loading || restoring || authorizationStatus === 'pending') return

    const epoch = contactEpoch.current

    setLoading(true)
    setMessage('')
    setOwner(null)

    const form = event.currentTarget
    const formData = new FormData(form)

    formData.set('property_id', propertyId)
    formData.set('source', 'property')

    try {
      const response = await fetch(
        '/api/contactar-propiedad',
        {
          method: 'POST',
          body: formData,
        }
      )

      const data = await response.json()
      if (epoch !== contactEpoch.current) return

      if (response.status === 401) {
        const next = `${window.location.pathname}${window.location.search}`
        router.push(`/login?next=${encodeURIComponent(next)}`)
        return
      }

      if (!response.ok) {
        throw new Error(
          data.error || 'No fue posible solicitar el contacto.'
        )
      }

      setOwner(data.owner || null)
      setAuthorizationId(data.authorization_id || null)
      setAuthorizationStatus(data.authorization_status || null)
      setMessage(
        data.owner
          ? 'Aquí tienes los datos de contacto.'
          : 'La solicitud fue enviada correctamente.'
      )

      form.reset()
    } catch (error) {
      if (epoch !== contactEpoch.current) return
      setMessage(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error.'
      )
    } finally {
      if (epoch === contactEpoch.current) setLoading(false)
    }
  }

  if (restoring) return <p role="status">Comprobando tu solicitud de contacto…</p>

  if (authorizationStatus === 'authorized' && !owner) {
    return <p role="status">El contacto autorizado no está disponible. Revisa Notificaciones o vuelve a cargar la página.</p>
  }

  if (authorizationStatus === 'declined') {
    return (
      <div
        style={{
          marginTop: 20,
          padding: 20,
          border: '1px solid #dfc1c1',
          borderRadius: 12,
          background: '#f8f1f1',
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          Solicitud no autorizada
        </h3>

        <p style={{ marginBottom: 0 }}>
          El propietario decidió no autorizar el contacto en esta ocasión.
        </p>
      </div>
    )
  }

  if (owner) {
    return (
      <div
        style={{
          marginTop: 20,
          padding: 20,
          border: '1px solid #ddd',
          borderRadius: 12,
          background: '#fafafa',
        }}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: 12,
          }}
        >
          Contacto de la propiedad
        </h3>

        {owner.name && (
          <p>
            <strong>Nombre:</strong> {owner.name}
          </p>
        )}

        {owner.company && (
          <p>
            <strong>Empresa:</strong> {owner.company}
          </p>
        )}

        {owner.phone && (
          <p>
            <strong>Teléfono:</strong>{' '}
            <a href={`tel:${owner.phone}`}>
              {owner.phone}
            </a>
          </p>
        )}

        {owner.email && (
          <p>
            <strong>Correo:</strong>{' '}
            <a href={`mailto:${owner.email}`}>
              {owner.email}
            </a>
          </p>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div
        style={{
          display: 'grid',
          gap: 12,
        }}
      >
        <input
          name="name"
          type="text"
          placeholder="Nombre"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            padding: 12,
            borderRadius: 8,
            border: '1px solid #ccc',
          }}
        />

        <input
          name="phone"
          type="tel"
          placeholder="Teléfono a 10 dígitos"
          required
          maxLength={10}
          value={phone}
          onChange={(e) =>
            setPhone(
              e.target.value.replace(/\D/g, '').slice(0, 10)
            )
          }
          style={{
            padding: 12,
            borderRadius: 8,
            border: '1px solid #ccc',
          }}
        />

        <input
          name="email"
          type="email"
          placeholder="Correo electrónico"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: 12,
            borderRadius: 8,
            border: '1px solid #ccc',
          }}
        />

        <input
          name="company"
          type="text"
          placeholder="Empresa (opcional)"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          style={{
            padding: 12,
            borderRadius: 8,
            border: '1px solid #ccc',
          }}
        />

        <textarea
          name="message"
          placeholder="Mensaje (opcional)"
          rows={4}
          style={{
            padding: 12,
            borderRadius: 8,
            border: '1px solid #ccc',
            resize: 'vertical',
          }}
        />

        <button
          type="submit"
          disabled={loading || authorizationStatus === 'pending'}
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            border: 'none',
            background: '#111827',
            color: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading
            ? 'Enviando...'
            : authorizationStatus === 'pending' ? 'Solicitud pendiente' : 'Solicitar contacto'}
        </button>

        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: '#6b7280',
            lineHeight: 1.5,
          }}
        >
          Tu solicitud será procesada según la configuración de contacto del propietario.
        </p>

        {message && (
          <p
            style={{
              margin: 0,
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #bbf7d0',
              background: '#f0fdf4',
              color: '#166534',
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            {message}
          </p>
        )}
      </div>
    </form>
  )
}
