// Edge Function: sign-property-images
// @ts-nocheck — Entorno Deno Edge Runtime de Supabase.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { createSignPropertyImagesHandler } from './core.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const actorPublicKey =
  Deno.env.get('QRIH_EXPECTED_PUBLIC_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const expectedPublicKeys = Array.from(
  new Set(
    [
      actorPublicKey,
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? '',
      ...(Deno.env.get('QRIH_EXPECTED_PUBLIC_KEYS') ?? '').split(','),
    ]
      .map((value) => value.trim())
      .filter(Boolean),
  ),
)
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const allowedOrigins = (Deno.env.get('QRIH_ALLOWED_ORIGINS') ?? 'https://qrih-staging.netlify.app')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)

if (!supabaseUrl || !actorPublicKey || expectedPublicKeys.length === 0 || !serviceRoleKey) {
  throw new Error('QRIH_SIGN_IMAGES_MISCONFIGURED')
}

const handler = createSignPropertyImagesHandler({
  supabaseUrl,
  expectedPublicKey: actorPublicKey,
  expectedPublicKeys,
  serviceRoleKey,
  allowedOrigins,
  createActorClient: (bearerToken) =>
    createClient(supabaseUrl, actorPublicKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      ...(bearerToken
        ? { global: { headers: { Authorization: `Bearer ${bearerToken}` } } }
        : {}),
    }),
  createServiceClient: () =>
    createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    }),
})

Deno.serve(handler)
