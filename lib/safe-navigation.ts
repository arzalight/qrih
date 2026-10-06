export function safeInternalPath(value: string | null | undefined, fallback = '/mis-propiedades') {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\s\u0000-\u001f]/.test(value)) return fallback
  try {
    const decoded = decodeURIComponent(value)
    if (decoded.startsWith('//') || /[\\\u0000-\u001f]/.test(decoded)) return fallback
    const url = new URL(value, 'https://qrih.invalid')
    return url.origin === 'https://qrih.invalid' ? value : fallback
  } catch { return fallback }
}

// Bandera visual, nunca prueba de confirmación ni email/token en la URL.
export function pendingConfirmationLoginPath(next: string | null | undefined) {
  return `/login?registro=pendiente&next=${encodeURIComponent(safeInternalPath(next))}`
}

// La ficha pública no sirve para avisos de rechazo ni para propiedades retiradas.
export function moderationNotificationPath(type: string) {
  return type === 'property_published' || type === 'property_rejected'
    ? '/mis-propiedades'
    : null
}
