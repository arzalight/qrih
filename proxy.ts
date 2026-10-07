import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Sólo persistencia de sesión antes de RSC: autorización permanece en páginas/RLS.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (url && key) {
    try {
      const client = createServerClient(url, key, {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll(cookiesToSet, headers) {
            for (const { name, value, options } of cookiesToSet) {
              if (options.maxAge === 0) request.cookies.delete(name)
              else request.cookies.set(name, value)
            }
            // RSC debe leer la sesión nueva; navegador debe recibirla también.
            const previous = response.cookies.getAll()
            response = NextResponse.next({ request: { headers: request.headers } })
            for (const cookie of previous) response.cookies.set(cookie)
            for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options)
            for (const name of ['Cache-Control', 'Expires', 'Pragma']) {
              if (headers[name]) response.headers.set(name, headers[name])
            }
          },
        },
      })
      // Valida con Auth; nunca concede acceso a partir de la cookie/getSession.
      await client.auth.getUser()
    } catch {
      // Sin cookies/JWT/URL/códigos ni objetos SDK en diagnósticos.
      console.warn('QRIH_SESSION_REFRESH_FAILURE')
      // La página aún debe validar actor/rol; no se fabrica sesión ni redirect.
    }
  }
  response.headers.set('Cache-Control', 'private, no-store, max-age=0')
  response.headers.set('Expires', '0')
  response.headers.set('Pragma', 'no-cache')
  return response
}

export const config = {
  matcher: ['/perfil', '/mis-propiedades/:path*', '/notificaciones', '/admin/:path*'],
}
