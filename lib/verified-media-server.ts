import 'server-only'
import sharp from 'sharp'
import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export type ImageIngestStage = 'service' | 'quota' | 'size' | 'metadata' | 'format' | 'encode' | 'storage' | 'provenance'

export type MediaBucket = 'property-images' | 'profile-images'

export type VerifiedImageUploadResult = {
  path: string
  publicUrl: string | null
  operationId: string
  rollbackToken?: string
}

export type VerifiedMediaCallOptions = {
  supabase?: SupabaseClient
  accessToken?: string
  operationId?: string
  fetchImpl?: typeof fetch
}

const MAX_ENCODED_EDGE_BYTES = 3 * 1024 * 1024
const MAX_NORMALIZED_DIMENSION = 1920

export async function validateAndEncodeImage(file: File, avatar = false, onStage: (stage: ImageIngestStage) => void = () => {}) {
  onStage('size')
  const max = avatar ? 5 * 1024 * 1024 : 20 * 1024 * 1024
  if (!file.size || file.size > max) throw new Error('Tamaño de imagen inválido.')
  const bytes = Buffer.from(await file.arrayBuffer())
  onStage('metadata')
  const image = sharp(bytes, { limitInputPixels: 40_000_000, failOn: 'warning', animated: false })
  const metadata = await image.metadata()
  // El transporte puede ser JPEG/PNG si Canvas no codifica WebP (Safari).
  // No confiar en extensión/MIME declarado; Storage sólo recibe WebP re-encoded.
  const allowed = ['jpeg', 'png', 'webp']
  const expectedMime = metadata.format === 'jpeg' ? 'image/jpeg' : `image/${metadata.format}`
  onStage('format')
  if (!metadata.format || !allowed.includes(metadata.format)
    || (metadata.pages || 1) > 1 || (!avatar && file.type !== expectedMime)) {
    throw new Error('Formato real de imagen no permitido.')
  }
  // Decodificar completamente, retirar metadatos, acotar a 1920px (SD-04) y guardar WebP auténtico.
  onStage('encode')
  const encoded = await image
    .rotate()
    .resize({ width: MAX_NORMALIZED_DIMENSION, height: MAX_NORMALIZED_DIMENSION, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer()
  if (encoded.length > MAX_ENCODED_EDGE_BYTES) throw new Error('Imagen demasiado grande.')
  return encoded
}

async function resolveRequiredAccessToken(options?: VerifiedMediaCallOptions): Promise<string> {
  if (typeof options?.accessToken === 'string' && options.accessToken.trim()) {
    return options.accessToken.trim()
  }
  const auth = (options?.supabase as unknown as {
    auth?: { getSession?: () => Promise<{ data?: { session?: { access_token?: string } | null } }> }
  })?.auth
  if (typeof auth?.getSession === 'function') {
    const { data } = await auth.getSession()
    if (typeof data?.session?.access_token === 'string' && data.session.access_token.trim()) {
      return data.session.access_token.trim()
    }
  }
  throw new Error('Necesitas iniciar sesión.')
}

function getEdgeConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || ''
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || ''
  if (!supabaseUrl || !publicKey) throw new Error('Servicio de imágenes no configurado.')
  return { supabaseOrigin: new URL(supabaseUrl).origin, publicKey }
}

export async function uploadVerifiedImage(
  file: File,
  ownerId: string,
  bucket: MediaBucket,
  onStage: (stage: ImageIngestStage) => void = () => {},
  options?: VerifiedMediaCallOptions,
): Promise<VerifiedImageUploadResult> {
  onStage('service')
  const { supabaseOrigin, publicKey } = getEdgeConfig()
  const accessToken = await resolveRequiredAccessToken(options)
  const bytes = await validateAndEncodeImage(file, bucket === 'profile-images', onStage)
  const operationId = options?.operationId || randomUUID()
  const fetchImpl = options?.fetchImpl || fetch

  const form = new FormData()
  form.set('bucket', bucket)
  form.set('operationId', operationId)
  form.set('image', new Blob([new Uint8Array(bytes)], { type: 'image/webp' }), 'verified.webp')

  onStage('storage')
  let response: Response
  try {
    response = await fetchImpl(`${supabaseOrigin}/functions/v1/ingest-verified-media`, {
      method: 'POST',
      headers: {
        apikey: publicKey,
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
      cache: 'no-store',
    })
  } catch {
    throw new Error('No se pudo almacenar la imagen.')
  }

  if (response.status === 429) {
    onStage('quota')
    throw new Error('Límite de fotografías alcanzado. Intenta más tarde.')
  }
  if (!response.ok) {
    throw new Error('No se pudo almacenar la imagen.')
  }

  onStage('provenance')
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error('No se pudo verificar la pertenencia de la imagen.')
  }
  const record = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null
  const path = typeof record?.path === 'string' ? record.path : ''
  const publicUrl = typeof record?.publicUrl === 'string' ? record.publicUrl : null
  const rollbackToken = typeof record?.rollbackToken === 'string' ? record.rollbackToken : undefined

  if (!path.startsWith(`${ownerId}/`) || !/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/i.test(path)) {
    throw new Error('No se pudo verificar la pertenencia de la imagen.')
  }
  if (bucket === 'profile-images') {
    if (!publicUrl) throw new Error('No se pudo publicar la imagen de perfil.')
    const parsed = new URL(publicUrl)
    if (
      parsed.origin !== supabaseOrigin ||
      parsed.pathname !== `/storage/v1/object/public/profile-images/${path}`
    ) {
      throw new Error('No se pudo publicar la imagen de perfil.')
    }
  } else if (publicUrl !== null) {
    throw new Error('Respuesta de almacenamiento inválida.')
  }

  return { path, publicUrl, operationId, rollbackToken }
}

export async function rollbackVerifiedImages(params: {
  bucket: MediaBucket
  operationId: string
  items: Array<{ path: string; rollbackToken: string }>
  supabase?: SupabaseClient
  accessToken?: string
  fetchImpl?: typeof fetch
}): Promise<void> {
  if (!params.items.length) return
  const { supabaseOrigin, publicKey } = getEdgeConfig()
  const accessToken = await resolveRequiredAccessToken(params)
  const fetchImpl = params.fetchImpl || fetch
  await fetchImpl(`${supabaseOrigin}/functions/v1/ingest-verified-media`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: publicKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      action: 'rollback',
      operationId: params.operationId,
      bucket: params.bucket,
      items: params.items,
    }),
    cache: 'no-store',
  })
}
