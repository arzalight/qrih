import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createPrivilegedServerSupabaseClient } from './supabase-privileged-server'

export const PROPERTY_IMAGE_TTL_SECONDS = {
  public: 10 * 60,
  gallery: 15 * 60,
  admin: 15 * 60,
  pdf: 5 * 60,
} as const

export async function createSignedPropertyImageUrlMap(
  supabase: SupabaseClient,
  paths: Array<string | null | undefined>,
  expiresIn: number,
  signer?: SupabaseClient,
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

  const { data: authorized, error: authorizationError } = await supabase.rpc(
    'qrih_authorized_image_paths', { p_paths: uniquePaths },
  )
  if (authorizationError || !Array.isArray(authorized)
      || uniquePaths.some((path) => !authorized.includes(path))) {
    throw new Error('No tienes acceso a las imágenes solicitadas.')
  }
  // Nunca usar service_role para decidir acceso: sólo para emitir lo autorizado.
  const { data, error } = await (signer || createPrivilegedServerSupabaseClient()).storage
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

export function propertyImagePaths(
  mainPath: string | null,
  gallery: Array<{ storage_path: string }>,
) {
  return Array.from(new Set([mainPath, ...gallery.map((image) => image.storage_path)]
    .filter((path): path is string => Boolean(path))))
}
