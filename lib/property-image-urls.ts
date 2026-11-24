import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

export const PROPERTY_IMAGE_TTL_SECONDS = {
  public: 10 * 60,
  gallery: 15 * 60,
  admin: 15 * 60,
  pdf: 5 * 60,
} as const

const MAX_SIGN_BATCH = 200

export type SignEdgeFetch = typeof fetch

async function resolveOptionalBearerToken(supabase: SupabaseClient): Promise<string | null> {
  try {
    const auth = (supabase as unknown as { auth?: { getSession?: () => Promise<{ data?: { session?: { access_token?: string } | null } }> } }).auth
    if (typeof auth?.getSession !== 'function') return null
    const { data } = await auth.getSession()
    const token = data?.session?.access_token
    return typeof token === 'string' && token.length > 0 ? token : null
  } catch {
    return null
  }
}

export async function createSignedPropertyImageUrlMap(
  supabase: SupabaseClient,
  paths: Array<string | null | undefined>,
  expiresIn: number,
  signer?: SupabaseClient | { fetchImpl?: SignEdgeFetch },
) {
  if (!Object.values(PROPERTY_IMAGE_TTL_SECONDS).some((ttl) => ttl === expiresIn)) {
    throw new Error('Duración de firma no autorizada.')
  }
  const uniquePaths = Array.from(
    new Set(paths.filter((path): path is string => Boolean(path))),
  )
  if (uniquePaths.some((path) => !/^[0-9a-f-]{36}\/[a-zA-Z0-9._-]+\.webp$/.test(path))) {
    throw new Error('Referencia de imagen inválida.')
  }

  if (!uniquePaths.length) {
    return new Map<string, string>()
  }

  // Modo inyectado exclusivamente para pruebas unitarias heredadas con cliente mock.
  if (signer && 'storage' in signer && signer.storage) {
    const { data: authorized, error: authorizationError } = await supabase.rpc(
      'qrih_authorized_image_paths', { p_paths: uniquePaths },
    )
    if (authorizationError || !Array.isArray(authorized)
        || uniquePaths.some((path) => !authorized.includes(path))) {
      throw new Error('No tienes acceso a las imágenes solicitadas.')
    }
    const { data, error } = await signer.storage
      .from('property-images')
      .createSignedUrls(uniquePaths, expiresIn)
    if (error) {
      throw new Error('No fue posible obtener las imágenes autorizadas.')
    }
    const urls = new Map<string, string>()
    for (const image of data || []) {
      if (image.error || !image.path || !image.signedUrl || !uniquePaths.includes(image.path)) {
        throw new Error('No fue posible obtener todas las imágenes autorizadas.')
      }
      urls.set(image.path, image.signedUrl)
    }
    if (urls.size !== uniquePaths.length) {
      throw new Error('Respuesta incompleta de imágenes autorizadas.')
    }
    return urls
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || ''
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || ''
  if (!supabaseUrl || !publicKey) {
    throw new Error('No fue posible obtener las imágenes autorizadas.')
  }
  const supabaseOrigin = new URL(supabaseUrl).origin
  const fetchImpl = (signer && 'fetchImpl' in signer && signer.fetchImpl) || fetch
  const accessToken = await resolveOptionalBearerToken(supabase)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: publicKey,
  }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  const urls = new Map<string, string>()
  for (let offset = 0; offset < uniquePaths.length; offset += MAX_SIGN_BATCH) {
    const batch = uniquePaths.slice(offset, offset + MAX_SIGN_BATCH)
    let response: Response
    try {
      response = await fetchImpl(`${supabaseOrigin}/functions/v1/sign-property-images`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ bucket: 'property-images', paths: batch, expiresIn }),
        cache: 'no-store',
      })
    } catch {
      throw new Error('No fue posible obtener las imágenes autorizadas.')
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error('No tienes acceso a las imágenes solicitadas.')
    }
    if (!response.ok) {
      throw new Error('No fue posible obtener las imágenes autorizadas.')
    }

    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      throw new Error('No fue posible obtener las imágenes autorizadas.')
    }
    const signedMap =
      payload && typeof payload === 'object' && 'urls' in payload
        ? (payload as { urls?: unknown }).urls
        : null
    if (!signedMap || typeof signedMap !== 'object' || Array.isArray(signedMap)) {
      throw new Error('No fue posible obtener todas las imágenes autorizadas.')
    }

    for (const path of batch) {
      const signedUrl = (signedMap as Record<string, unknown>)[path]
      if (typeof signedUrl !== 'string') {
        throw new Error('No fue posible obtener todas las imágenes autorizadas.')
      }
      let parsedUrl: URL
      try {
        parsedUrl = new URL(signedUrl)
      } catch {
        throw new Error('No fue posible obtener todas las imágenes autorizadas.')
      }
      if (
        parsedUrl.origin !== supabaseOrigin ||
        !parsedUrl.pathname.startsWith('/storage/v1/object/sign/property-images/')
      ) {
        throw new Error('No fue posible obtener todas las imágenes autorizadas.')
      }
      urls.set(path, signedUrl)
    }
  }

  if (urls.size !== uniquePaths.length) {
    throw new Error('Respuesta incompleta de imágenes autorizadas.')
  }
  return urls
}

export function propertyImagePaths(
  mainPath: string | null,
  gallery: Array<{ storage_path: string }>,
) {
  return Array.from(new Set([mainPath, ...gallery.map((image) => image.storage_path)]
    .filter((path): path is string => Boolean(path))))
}
