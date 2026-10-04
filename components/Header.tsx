'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type Notification = {
  id: string
  type: string
  title: string
  message: string
  read_at: string | null
  demand_request_id: string | null
  property_id: string | null
  created_at: string
}

export function Header() {
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const profileMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const supabase = createClient()

    if (!supabase) {
      return
    }

    const client = supabase

    async function loadUserAndNotifications() {
      const {
        data: { user },
      } = await client.auth.getUser()

      if (!user) {
        return
      }

      setUserName(
        user.user_metadata?.full_name ||
          user.email?.split('@')[0] ||
          'Usuario'
      )

      setUserEmail(user.email || '')

      const { data: notificationData, error } = await client
        .from('notifications')
        .select(
          'id, type, title, message, read_at, demand_request_id, property_id, created_at'
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) {
        console.warn('QRIH_COMPONENTS_HEADER_62_FAILED')
        return
      }

      setNotifications(notificationData || [])
    }

    loadUserAndNotifications()

    const interval = setInterval(loadUserAndNotifications, 15000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    function handleOutsideClick(event: MouseEvent) {
      const target = event.target

      if (
        target instanceof Node &&
        profileMenuRef.current &&
        !profileMenuRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [open])

  async function handleNotificationClick(notification: Notification) {
    const supabase = createClient()

    if (!supabase) {
      return
    }

    if (!notification.read_at) {
      const { error } = await supabase
        .from('notifications')
        .update({
          read_at: new Date().toISOString(),
        })
        .eq('id', notification.id)

      if (!error) {
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  read_at: new Date().toISOString(),
                }
              : item
          )
        )
      }
    }

    if (notification.type === 'opportunity_property_registered') {
      window.location.href = '/mis-propiedades?view=requirements'
      return
    }

    if (
      notification.type === 'property_contact_request' &&
      notification.property_id
    ) {
      window.location.href = `/mis-propiedades/${notification.property_id}/solicitudes`
      return
    }

    if (notification.type === 'property_contact_authorized') {
      window.location.href = '/notificaciones'
    }
  }

  async function handleSignOut() {
    const supabase = createClient()

    if (!supabase) {
      return
    }

    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.read_at
  ).length

  return (
    <header className={`header ${menuOpen ? 'header--menu-open' : ''}`}>
      <Link className="brand" href="/">
        QRO INDUSTRIAL HUB <small>Q R I H</small>
      </Link>

      <button
        type="button"
        className="mobile-menu-toggle"
        aria-expanded={menuOpen}
        aria-controls="site-navigation"
        onClick={() => setMenuOpen((current) => !current)}
      >
        {menuOpen ? 'Cerrar menú' : 'Menú'}
      </button>

      <nav id="site-navigation" className="site-nav">
        <Link href="/inventario" onClick={() => setMenuOpen(false)}>
          Inventario
        </Link>

        <Link
          className="demand"
          href="/busco-bodega"
          onClick={() => setMenuOpen(false)}
        >
          BUSCO UNA BODEGA
        </Link>

        <Link href="/publicar" onClick={() => setMenuOpen(false)}>
          Subir propiedad
        </Link>

        <Link href="/mis-propiedades" onClick={() => setMenuOpen(false)}>
          Panel
        </Link>

        {userEmail && (
          <div
            ref={profileMenuRef}
            style={{
              position: 'relative',
              display: 'inline-block',
            }}
          >
            <button
              type="button"
              onClick={() => setOpen(!open)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                border: 'none',
                background: 'transparent',
                padding: 0,
                font: 'inherit',
                color: 'inherit',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: '1px solid #d1d5db',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M5.5 20c.8-3.6 3-5.5 6.5-5.5s5.7 1.9 6.5 5.5" />
                </svg>
              </span>

              <span>Mi perfil</span>

              {unreadCount > 0 && (
                <span
                  style={{
                    minWidth: 18,
                    height: 18,
                    padding: '0 5px',
                    borderRadius: 999,
                    background: '#dc2626',
                    color: '#ffffff',
                    fontSize: 11,
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {unreadCount}
                </span>
              )}

              <span
                style={{
                  fontSize: 11,
                  transform: open ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.15s ease',
                }}
              >
                ▾
              </span>
            </button>

            {open && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 12px)',
                  right: 0,
                  width: 320,
                  maxWidth: 'calc(100vw - 32px)',
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.10)',
                  padding: 16,
                  zIndex: 100,
                }}
              >
                <div
                  style={{
                    paddingBottom: 14,
                    borderBottom: '1px solid #eee',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      color: '#111827',
                    }}
                  >
                    {userName || 'Usuario'}
                  </div>

                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 13,
                      color: '#6b7280',
                      wordBreak: 'break-word',
                    }}
                  >
                    {userEmail}
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px 0',
                    borderBottom: '1px solid #eee',
                  }}
                >
                  <Link
                    href="/perfil"
                    onClick={() => setOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: 9,
                      background: '#f9fafb',
                      color: '#111827',
                      textDecoration: 'none',
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    Abrir mi perfil
                  </Link>
                </div>

                <div
                  style={{
                    padding: '14px 0',
                    borderBottom: '1px solid #eee',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        color: '#111827',
                      }}
                    >
                      Notificaciones
                    </div>

                    {unreadCount > 0 && (
                      <span
                        style={{
                          fontSize: 12,
                          color: '#6b7280',
                        }}
                      >
                        {unreadCount} sin leer
                      </span>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div
                      style={{
                        fontSize: 13,
                        color: '#6b7280',
                        padding: '8px 0',
                      }}
                    >
                      No tienes notificaciones.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'grid',
                        gap: 8,
                      }}
                    >
                      {notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() =>
                            handleNotificationClick(notification)
                          }
                          style={{
                            width: '100%',
                            border: 'none',
                            borderRadius: 8,
                            background: notification.read_at
                              ? '#ffffff'
                              : '#f3f4f6',
                            padding: '10px 10px',
                            textAlign: 'left',
                            font: 'inherit',
                            color: '#111827',
                            cursor: 'pointer',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 8,
                            }}
                          >
                            {!notification.read_at && (
                              <span
                                style={{
                                  width: 7,
                                  height: 7,
                                  borderRadius: '50%',
                                  background: '#111827',
                                  marginTop: 5,
                                  flexShrink: 0,
                                }}
                              />
                            )}

                            <div>
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                }}
                              >
                                {notification.title}
                              </div>

                              <div
                                style={{
                                  marginTop: 3,
                                  fontSize: 12,
                                  lineHeight: 1.4,
                                  color: '#6b7280',
                                }}
                              >
                                {notification.message}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <Link
                    href="/notificaciones"
                    onClick={() => setOpen(false)}
                    style={{
                      display: 'inline-block',
                      marginTop: 14,
                      fontSize: 13,
                      color: '#374151',
                    }}
                  >
                    Ver todas las notificaciones
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  style={{
                    width: '100%',
                    marginTop: 12,
                    padding: '9px 0',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                    font: 'inherit',
                    color: '#374151',
                    cursor: 'pointer',
                  }}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  )
}
