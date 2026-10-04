import 'server-only'
import { createClient } from '@supabase/supabase-js'

// Omite RLS: autorizar SIEMPRE con el cliente original antes de usarlo.
export function createPrivilegedServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Falta configuración privada del servidor.')
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  })
}
