'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { moderationNotificationPath } from '@/lib/safe-navigation'

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

// Administration links are opted into by already-authorized server pages only.
export function Header({ administration = false }: { administration?: boolean }) {
  const pathname = usePathname()
  const menuToggleRef = useRef<HTMLButtonElement | null>(null)
  const profileToggleRef = useRef<HTMLButtonElement | null>(null)
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

    const moderationPath = moderationNotificationPath(notification.type)
    if (moderationPath) {
      window.location.href = moderationPath
      return
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

  const workspace = administration || ['/mis-propiedades', '/perfil', '/notificaciones', '/publicar']
    .some(path => pathname === path || pathname.startsWith(path + '/'))
  const links = administration ? [
    ['/admin', 'Propiedades'], ['/admin/asesores', 'Asesores'],
    ['/admin/historial', 'Historial'], ['/admin/configuracion', 'Configuración'],
    ['/mis-propiedades', 'Mi panel'], ['/inventario', 'Inventario público'],
  ] : workspace ? [
    ['/mis-propiedades', 'Mi panel'], ['/publicar', 'Subir propiedad'],
    ['/notificaciones', 'Notificaciones'], ['/perfil', 'Mi perfil'],
    ['/inventario', 'Inventario'], ['/busco-bodega', 'Busco una bodega'],
  ] : [
    ['/inventario', 'Inventario'], ['/busco-bodega', 'Busco una bodega'],
    ['/publicar', 'Subir propiedad'], ['/mis-propiedades', 'Mi panel'],
  ]
  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin' || /^\/admin\/[0-9a-f-]{36}$/i.test(pathname)
    return pathname === href || pathname.startsWith(href + '/')
  }
  function closeNavigation() { setMenuOpen(false); setOpen(false) }

  return (
    <header className={`header ${workspace ? 'header--workspace' : ''} ${menuOpen ? 'header--menu-open' : ''}`}
      onKeyDown={event => {
        if (event.key !== 'Escape') return
        if (open) { setOpen(false); profileToggleRef.current?.focus() }
        else if (menuOpen) { setMenuOpen(false); menuToggleRef.current?.focus() }
      }}>
      <Link className="brand" href="/" aria-label="QRO Industrial Hub · Inicio">
        QRO INDUSTRIAL HUB <small>Q R I H</small>
      </Link>
      <button ref={menuToggleRef} type="button" className="mobile-menu-toggle"
        aria-expanded={menuOpen} aria-controls="site-navigation"
        onClick={() => { setMenuOpen(current => !current); setOpen(false) }}>
        <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span> {menuOpen ? 'Cerrar menú' : 'Menú'}
      </button>
      <nav id="site-navigation" className="site-nav" aria-label={administration ? 'Administración' : 'Principal'}>
        {workspace && <span className="site-nav__label">{administration ? 'Administración' : 'Tu espacio de trabajo'}</span>}
        {links.map(([href, label]) => (
          <Link key={href} href={href} onClick={closeNavigation}
            aria-current={isActive(href) ? 'page' : undefined}
            className={!workspace && href === '/busco-bodega' ? 'demand' : undefined}>
            {workspace && <span className="site-nav__marker" aria-hidden="true">◇</span>}
            {label}
          </Link>
        ))}
        {!userEmail && !workspace && <Link className="header-signin" href="/login" onClick={closeNavigation}>Iniciar sesión</Link>}
        {userEmail && (
          <div ref={profileMenuRef} className="profile-menu">
            <button ref={profileToggleRef} type="button" className="profile-menu__toggle"
              aria-expanded={open} aria-controls="profile-options" onClick={() => setOpen(current => !current)}>
              <span className="profile-menu__avatar" aria-hidden="true">{userName.slice(0, 1).toUpperCase() || 'Q'}</span>
              <span>Mi cuenta</span>
              {unreadCount > 0 && <span className="notification-count"><span className="sr-only">Notificaciones sin leer: </span>{unreadCount}</span>}
              <span aria-hidden="true">{open ? '▴' : '▾'}</span>
            </button>
            {open && (
              <div id="profile-options" className="profile-menu__popover">
                <div className="profile-menu__identity"><strong>{userName || 'Usuario'}</strong><small>{userEmail}</small></div>
                <Link className="button button--secondary" href="/perfil" onClick={closeNavigation}>Abrir mi perfil</Link>
                <section aria-label="Notificaciones recientes" className="profile-menu__notifications">
                  <div className="profile-menu__section-title"><strong>Notificaciones</strong>{unreadCount > 0 && <small>{unreadCount} sin leer</small>}</div>
                  {notifications.length === 0 ? <p className="ui-help">No tienes notificaciones.</p> :
                    notifications.map(notification => (
                      <button key={notification.id} type="button"
                        className={`profile-notification ${notification.read_at ? '' : 'profile-notification--unread'}`}
                        onClick={() => handleNotificationClick(notification)}>
                        {!notification.read_at && <span className="sr-only">Sin leer. </span>}
                        <strong>{notification.title}</strong><span>{notification.message}</span>
                      </button>
                    ))}
                  <Link href="/notificaciones" onClick={closeNavigation}>Ver todas las notificaciones →</Link>
                </section>
                <button type="button" className="profile-menu__signout" onClick={handleSignOut}>Cerrar sesión</button>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  )
}
