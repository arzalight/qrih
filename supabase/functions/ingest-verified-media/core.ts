export const MAX_WEBP_DIMENSION = 2560
export const MAX_WEBP_PIXELS = 6_553_600

export type WebpContainerInfo = {
  width: number
  height: number
  format: 'VP8 ' | 'VP8L' | 'VP8X'
}

export type DecodedWebpResult = {
  width: number
  height: number
  data: Uint8ClampedArray | Uint8Array
}

export type WebpDecoder = (bytes: Uint8Array) => Promise<DecodedWebpResult>

export type WebpVerificationErrorCode =
  | 'EMPTY_IMAGE'
  | 'INVALID_RIFF_HEADER'
  | 'TRUNCATED_OR_TRAILING_RIFF'
  | 'INVALID_WEBP_CHUNK'
  | 'ANIMATED_WEBP_FORBIDDEN'
  | 'DIMENSIONS_EXCEED_LIMIT'
  | 'UNSUPPORTED_WEBP_VARIANT'
  | 'WASM_DECODE_FAILED'
  | 'DECODED_DIMENSIONS_MISMATCH'

export class WebpVerificationError extends Error {
  readonly code: WebpVerificationErrorCode
  readonly layer: 1 | 2

  constructor(code: WebpVerificationErrorCode, layer: 1 | 2) {
    super(code)
    this.name = 'WebpVerificationError'
    this.code = code
    this.layer = layer
  }
}

function readFourCC(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(
    bytes[offset],
    bytes[offset + 1],
    bytes[offset + 2],
    bytes[offset + 3],
  )
}

function readUint24LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16)
}

function assertBoundedDimensions(
  width: number,
  height: number,
  maxDim: number,
  maxPixels: number,
  layer: 1 | 2,
): void {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    width > maxDim ||
    height > maxDim ||
    width * height > maxPixels
  ) {
    throw new WebpVerificationError('DIMENSIONS_EXCEED_LIMIT', layer)
  }
}

/**
 * Capa 1: Parser estructural RIFF/WEBP sin asignación de framebuffer RGBA.
 * Rechaza archivos no WebP, truncados o con bytes sobrantes (polyglots),
 * WebP animados (flag VP8X 0x02 o chunks ANIM/ANMF) y bombas de dimensiones.
 */
export function inspectWebpContainer(
  bytes: Uint8Array,
  options: { maxDim?: number; maxPixels?: number } = {},
): WebpContainerInfo {
  const maxDim = options.maxDim ?? MAX_WEBP_DIMENSION
  const maxPixels = options.maxPixels ?? MAX_WEBP_PIXELS

  if (!bytes || bytes.byteLength === 0) {
    throw new WebpVerificationError('EMPTY_IMAGE', 1)
  }
  if (bytes.byteLength < 20) {
    throw new WebpVerificationError('INVALID_RIFF_HEADER', 1)
  }

  if (readFourCC(bytes, 0) !== 'RIFF' || readFourCC(bytes, 8) !== 'WEBP') {
    throw new WebpVerificationError('INVALID_RIFF_HEADER', 1)
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const riffSize = view.getUint32(4, true)
  if (riffSize + 8 !== bytes.byteLength) {
    throw new WebpVerificationError('TRUNCATED_OR_TRAILING_RIFF', 1)
  }

  let offset = 12
  let primary: WebpContainerInfo | null = null
  let chunkCount = 0

  while (offset < bytes.byteLength) {
    if (offset + 8 > bytes.byteLength) {
      throw new WebpVerificationError('TRUNCATED_OR_TRAILING_RIFF', 1)
    }
    chunkCount++
    if (chunkCount > 64) {
      throw new WebpVerificationError('INVALID_WEBP_CHUNK', 1)
    }

    const fourcc = readFourCC(bytes, offset)
    const chunkSize = view.getUint32(offset + 4, true)
    const payloadStart = offset + 8
    const paddedSize = chunkSize + (chunkSize & 1)
    const nextOffset = payloadStart + paddedSize

    if (payloadStart + chunkSize > bytes.byteLength || nextOffset > bytes.byteLength) {
      throw new WebpVerificationError('TRUNCATED_OR_TRAILING_RIFF', 1)
    }

    if (fourcc === 'ANIM' || fourcc === 'ANMF') {
      throw new WebpVerificationError('ANIMATED_WEBP_FORBIDDEN', 1)
    }

    if (!primary) {
      if (fourcc === 'VP8X') {
        if (chunkSize < 10) {
          throw new WebpVerificationError('INVALID_WEBP_CHUNK', 1)
        }
        const flags = bytes[payloadStart]
        if ((flags & 0x02) !== 0) {
          throw new WebpVerificationError('ANIMATED_WEBP_FORBIDDEN', 1)
        }
        const width = 1 + readUint24LE(bytes, payloadStart + 4)
        const height = 1 + readUint24LE(bytes, payloadStart + 7)
        assertBoundedDimensions(width, height, maxDim, maxPixels, 1)
        primary = { width, height, format: 'VP8X' }
      } else if (fourcc === 'VP8 ') {
        if (chunkSize < 10) {
          throw new WebpVerificationError('INVALID_WEBP_CHUNK', 1)
        }
        if (
          (bytes[payloadStart] & 0x01) !== 0 ||
          bytes[payloadStart + 3] !== 0x9d ||
          bytes[payloadStart + 4] !== 0x01 ||
          bytes[payloadStart + 5] !== 0x2a
        ) {
          throw new WebpVerificationError('INVALID_WEBP_CHUNK', 1)
        }
        const width = view.getUint16(payloadStart + 6, true) & 0x3fff
        const height = view.getUint16(payloadStart + 8, true) & 0x3fff
        assertBoundedDimensions(width, height, maxDim, maxPixels, 1)
        primary = { width, height, format: 'VP8 ' }
      } else if (fourcc === 'VP8L') {
        if (chunkSize < 5 || bytes[payloadStart] !== 0x2f) {
          throw new WebpVerificationError('INVALID_WEBP_CHUNK', 1)
        }
        const bits = view.getUint32(payloadStart + 1, true)
        const width = 1 + (bits & 0x3fff)
        const height = 1 + ((bits >>> 14) & 0x3fff)
        assertBoundedDimensions(width, height, maxDim, maxPixels, 1)
        primary = { width, height, format: 'VP8L' }
      } else {
        throw new WebpVerificationError('UNSUPPORTED_WEBP_VARIANT', 1)
      }
    }

    offset = nextOffset
  }

  if (!primary) {
    throw new WebpVerificationError('INVALID_WEBP_CHUNK', 1)
  }

  return primary
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  const digest = await crypto.subtle.digest('SHA-256', copy)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Capa 1 + Capa 2: Validación estructural + decodificación completa del bitstream
 * (libwebp WASM en Supabase Edge Runtime). Verifica concordancia de dimensiones
 * y calcula SHA-256 canónico del binario validado.
 */
export async function verifyWebpBytes(
  bytes: Uint8Array,
  decodeWebp: WebpDecoder,
  options: { maxDim?: number; maxPixels?: number } = {},
): Promise<{ width: number; height: number; format: WebpContainerInfo['format']; sha256: string }> {
  const maxDim = options.maxDim ?? MAX_WEBP_DIMENSION
  const maxPixels = options.maxPixels ?? MAX_WEBP_PIXELS
  const container = inspectWebpContainer(bytes, { maxDim, maxPixels })

  let decoded: DecodedWebpResult
  try {
    decoded = await decodeWebp(bytes)
  } catch {
    throw new WebpVerificationError('WASM_DECODE_FAILED', 2)
  }

  if (!decoded || !decoded.data) {
    throw new WebpVerificationError('WASM_DECODE_FAILED', 2)
  }

  assertBoundedDimensions(decoded.width, decoded.height, maxDim, maxPixels, 2)

  if (
    decoded.width !== container.width ||
    decoded.height !== container.height ||
    decoded.data.byteLength !== decoded.width * decoded.height * 4
  ) {
    throw new WebpVerificationError('DECODED_DIMENSIONS_MISMATCH', 2)
  }

  const sha256 = await sha256Hex(bytes)
  return {
    width: decoded.width,
    height: decoded.height,
    format: container.format,
    sha256,
  }
}

export const ALLOWED_MEDIA_BUCKETS = ['property-images', 'profile-images'] as const
export type MediaBucket = (typeof ALLOWED_MEDIA_BUCKETS)[number]

export const DEFAULT_BUCKET_MAX_BYTES: Record<MediaBucket, number> = {
  'property-images': 3 * 1024 * 1024,
  'profile-images': 3 * 1024 * 1024,
}

export const MAX_ROLLBACK_BODY_BYTES = 16 * 1024
export const MAX_ROLLBACK_ITEMS = 10
export const ROLLBACK_TTL_SECONDS = 900
const MULTIPART_OVERHEAD_BYTES = 64 * 1024

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const BEARER_PATTERN = /^Bearer ([A-Za-z0-9._-]+)$/
const SAFE_OBJECT_NAME_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/i
const ROLLBACK_BODY_KEYS = new Set(['action', 'operationId', 'bucket', 'items'])
const ROLLBACK_ITEM_KEYS = new Set(['path', 'rollbackToken'])

export type AuthUserResult = {
  data: { user: { id: string; is_anonymous?: boolean } | null }
  error: unknown
}

export type ActorMediaSupabaseLike = {
  auth: {
    getUser: (jwt?: string) => Promise<AuthUserResult>
  }
  getAccountStatus: (userId: string) => Promise<{ status: string | null; error: unknown }>
}

export type VerifiedUploadRecord = {
  bucket_id: MediaBucket
  storage_path: string
  owner_id: string
  mime_type: 'image/webp'
  byte_size: number
  sha256: string
  public_url: string | null
}

export type ServiceMediaSupabaseLike = {
  takeRateLimit: (
    subject: string,
    action: 'media' | 'avatar',
  ) => Promise<{ allowed: boolean; error: unknown }>
  uploadObject: (
    bucket: MediaBucket,
    path: string,
    bytes: Uint8Array,
    cacheControl: string,
  ) => Promise<{ error: unknown }>
  removeObjects: (bucket: MediaBucket, paths: string[]) => Promise<{ error: unknown }>
  getPublicUrl: (bucket: MediaBucket, path: string) => string
  insertVerifiedUpload: (record: VerifiedUploadRecord) => Promise<{ error: unknown }>
  deleteVerifiedUpload: (
    bucket: MediaBucket,
    path: string,
    ownerId: string,
  ) => Promise<{ deleted: boolean; error: unknown }>
  isPathAttached: (
    bucket: MediaBucket,
    path: string,
    ownerId: string,
  ) => Promise<{ attached: boolean; error: unknown }>
}

export type IngestHandlerDeps = {
  supabaseUrl: string
  expectedPublicKey: string
  expectedPublicKeys?: string[]
  serviceRoleKey: string
  rollbackSecret?: string
  allowedOrigins: string[]
  bucketMaxBytes?: Partial<Record<MediaBucket, number>>
  maxWebpDimension?: number
  maxWebpPixels?: number
  decodeWebp: WebpDecoder
  createActorClient: (bearerToken: string) => ActorMediaSupabaseLike
  createServiceClient: () => ServiceMediaSupabaseLike
  generateUuid?: () => string
  now?: () => Date
  logWarn?: (code: string) => void
}

function constantTimeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a)
  const bBytes = new TextEncoder().encode(b)
  const maxLen = Math.max(aBytes.length, bBytes.length)
  let diff = aBytes.length ^ bBytes.length
  for (let i = 0; i < maxLen; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0)
  }
  return diff === 0
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function computeHmacBase64Url(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return base64UrlEncode(new Uint8Array(sig))
}

async function issueRollbackToken(
  secret: string,
  userId: string,
  operationId: string,
  bucket: MediaBucket,
  path: string,
  expiresAtSec: number,
): Promise<string> {
  const payload = `v1|${userId}|${operationId}|${bucket}|${path}|${expiresAtSec}`
  const sig = await computeHmacBase64Url(secret, payload)
  return `${expiresAtSec}.${sig}`
}

async function verifyRollbackToken(
  secret: string,
  token: string,
  userId: string,
  operationId: string,
  bucket: MediaBucket,
  path: string,
  nowSec: number,
): Promise<boolean> {
  if (typeof token !== 'string' || token.length < 20 || token.length > 200) return false
  const dot = token.indexOf('.')
  if (dot <= 0 || dot !== token.lastIndexOf('.')) return false
  const expStr = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  if (!/^\d{10,13}$/.test(expStr) || !/^[A-Za-z0-9_-]{32,128}$/.test(sig)) return false
  const expiresAtSec = Number(expStr)
  if (!Number.isSafeInteger(expiresAtSec) || expiresAtSec < nowSec) return false
  const expected = await issueRollbackToken(secret, userId, operationId, bucket, path, expiresAtSec)
  return constantTimeEqual(token, expected)
}

function baseHeaders(corsOrigin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  }
  if (corsOrigin) {
    headers['Access-Control-Allow-Origin'] = corsOrigin
    headers['Vary'] = 'Origin'
  }
  return headers
}

function jsonResponse(body: Record<string, unknown>, status: number, corsOrigin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: baseHeaders(corsOrigin),
  })
}

async function readBoundedText(request: Request, maxBytes: number): Promise<string | null> {
  const contentLength = request.headers.get('content-length')
  if (contentLength !== null) {
    const declared = Number(contentLength)
    if (!Number.isFinite(declared) || declared < 0 || declared > maxBytes) {
      return null
    }
  }
  const reader = request.body?.getReader()
  if (!reader) return ''
  let total = 0
  const chunks: Uint8Array[] = []
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > maxBytes) {
        await reader.cancel()
        return null
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  const merged = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(merged)
}

function isMediaBucket(value: unknown): value is MediaBucket {
  return value === 'property-images' || value === 'profile-images'
}

function isOwnedStoragePath(userId: string, path: unknown): path is string {
  if (typeof path !== 'string') return false
  if (
    path.includes('..') ||
    path.includes('?') ||
    path.includes('#') ||
    path.includes('\\') ||
    path.includes('%') ||
    path.includes('://')
  ) {
    return false
  }
  const slash = path.indexOf('/')
  if (slash <= 0 || slash !== path.lastIndexOf('/')) return false
  const ownerPrefix = path.slice(0, slash)
  const fileName = path.slice(slash + 1)
  return ownerPrefix === userId && SAFE_OBJECT_NAME_PATTERN.test(fileName)
}

export function createIngestVerifiedMediaHandler(deps: IngestHandlerDeps) {
  const supabaseOrigin = new URL(deps.supabaseUrl).origin
  const allowedOriginSet = new Set(deps.allowedOrigins.map((origin) => origin.trim()).filter(Boolean))
  const expectedPublicKeys = Array.from(
    new Set(
      [deps.expectedPublicKey, ...(deps.expectedPublicKeys ?? [])]
        .map((key) => key.trim())
        .filter(Boolean),
    ),
  )
  const matchesPublicKey = (candidate: string) =>
    expectedPublicKeys.some((expected) => constantTimeEqual(candidate, expected))

  const bucketMaxBytes: Record<MediaBucket, number> = {
    'property-images': deps.bucketMaxBytes?.['property-images'] ?? DEFAULT_BUCKET_MAX_BYTES['property-images'],
    'profile-images': deps.bucketMaxBytes?.['profile-images'] ?? DEFAULT_BUCKET_MAX_BYTES['profile-images'],
  }
  const maxMultipartBytes =
    Math.max(bucketMaxBytes['property-images'], bucketMaxBytes['profile-images']) + MULTIPART_OVERHEAD_BYTES
  const maxDim = deps.maxWebpDimension ?? MAX_WEBP_DIMENSION
  const maxPixels = deps.maxWebpPixels ?? MAX_WEBP_PIXELS
  const rollbackKeyMaterial = deps.rollbackSecret
    ? `qrih:rollback:v1:${deps.rollbackSecret}`
    : `qrih:rollback:v1:${deps.serviceRoleKey}`
  const generateUuid = deps.generateUuid ?? (() => crypto.randomUUID())
  const now = deps.now ?? (() => new Date())
  const logWarn = deps.logWarn ?? ((code: string) => console.warn('QRIH_INGEST_MEDIA_ERROR', code))

  return async function handleIngestVerifiedMedia(request: Request): Promise<Response> {
    const origin = request.headers.get('origin')
    let corsOrigin: string | null = null
    if (origin !== null) {
      if (!allowedOriginSet.has(origin)) {
        logWarn('CORS_DENIED')
        return jsonResponse({ error: 'Origen no autorizado.' }, 403, null)
      }
      corsOrigin = origin
    }

    if (request.method === 'OPTIONS') {
      if (!corsOrigin) {
        return jsonResponse({ error: 'Origen requerido para preflight.' }, 403, null)
      }
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': corsOrigin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
          'Access-Control-Max-Age': '600',
          'Vary': 'Origin',
        },
      })
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Método no permitido.' }, 405, corsOrigin)
    }

    // 1. Validar apikey esperada (jamás aceptar la clave privilegiada como apikey cliente).
    const apikey = request.headers.get('apikey')?.trim() || ''
    if (
      !apikey ||
      expectedPublicKeys.length === 0 ||
      !matchesPublicKey(apikey) ||
      (deps.serviceRoleKey && constantTimeEqual(apikey, deps.serviceRoleKey))
    ) {
      logWarn('INVALID_APIKEY')
      return jsonResponse({ error: 'Credenciales inválidas.' }, 401, corsOrigin)
    }

    // 2. Autenticación obligatoria de usuario real (nunca anónimo, nunca clave pública ni service_role).
    const authHeader = request.headers.get('authorization')
    if (!authHeader || authHeader.length > 8192) {
      logWarn('AUTH_REQUIRED')
      return jsonResponse({ error: 'Necesitas iniciar sesión.' }, 401, corsOrigin)
    }
    const bearerMatch = authHeader.trim().match(BEARER_PATTERN)
    if (!bearerMatch) {
      logWarn('MALFORMED_AUTH_HEADER')
      return jsonResponse({ error: 'Sesión inválida.' }, 401, corsOrigin)
    }
    const token = bearerMatch[1]
    if (
      matchesPublicKey(token) ||
      (deps.serviceRoleKey && constantTimeEqual(token, deps.serviceRoleKey))
    ) {
      logWarn('FORBIDDEN_TOKEN_TYPE')
      return jsonResponse({ error: 'Sesión inválida.' }, 401, corsOrigin)
    }

    const actorClient = deps.createActorClient(token)
    let userId: string
    try {
      const authResult = await actorClient.auth.getUser(token)
      if (authResult.error || !authResult.data?.user || authResult.data.user.is_anonymous) {
        logWarn('INVALID_ACTOR_JWT')
        return jsonResponse({ error: 'Sesión inválida o expirada.' }, 401, corsOrigin)
      }
      userId = authResult.data.user.id
      if (!UUID_PATTERN.test(userId)) {
        logWarn('INVALID_ACTOR_UID')
        return jsonResponse({ error: 'Sesión inválida.' }, 401, corsOrigin)
      }
    } catch {
      logWarn('AUTH_VERIFY_FAILED')
      return jsonResponse({ error: 'No se pudo validar la sesión.' }, 401, corsOrigin)
    }

    // 3. Confirmar cuenta activa bajo el cliente del actor (RLS).
    try {
      const profile = await actorClient.getAccountStatus(userId)
      if (profile.error || profile.status !== 'active') {
        logWarn('ACCOUNT_INACTIVE')
        return jsonResponse({ error: 'Necesitas una cuenta activa.' }, 403, corsOrigin)
      }
    } catch {
      logWarn('PROFILE_CHECK_FAILED')
      return jsonResponse({ error: 'No se pudo validar tu cuenta.' }, 503, corsOrigin)
    }

    const contentType = (request.headers.get('content-type') || '').toLowerCase()

    // Fase 2: Rollback compensatorio por operationId (application/json).
    if (contentType.startsWith('application/json')) {
      return handleRollback(request, userId, corsOrigin)
    }

    // Fase 1: Ingesta verificada en 2 capas (multipart/form-data).
    if (contentType.startsWith('multipart/form-data')) {
      return handleUpload(request, userId, corsOrigin)
    }

    return jsonResponse({ error: 'Tipo de contenido no permitido.' }, 415, corsOrigin)
  }

  async function handleUpload(
    request: Request,
    userId: string,
    corsOrigin: string | null,
  ): Promise<Response> {
    const contentLength = request.headers.get('content-length')
    if (contentLength !== null) {
      const declared = Number(contentLength)
      if (!Number.isFinite(declared) || declared < 0 || declared > maxMultipartBytes) {
        logWarn('UPLOAD_PAYLOAD_TOO_LARGE')
        return jsonResponse({ error: 'La imagen excede el tamaño permitido.' }, 413, corsOrigin)
      }
    }

    let form: FormData
    try {
      form = await request.formData()
    } catch {
      logWarn('INVALID_MULTIPART')
      return jsonResponse({ error: 'Formulario multipart inválido.' }, 400, corsOrigin)
    }

    const bucketRaw = form.get('bucket')
    const operationIdRaw = form.get('operationId')
    const imageEntry = form.get('image')

    if (!isMediaBucket(bucketRaw)) {
      logWarn('INVALID_BUCKET')
      return jsonResponse({ error: 'Bucket no permitido.' }, 400, corsOrigin)
    }
    if (typeof operationIdRaw !== 'string' || !UUID_PATTERN.test(operationIdRaw.trim())) {
      logWarn('INVALID_OPERATION_ID')
      return jsonResponse({ error: 'Identificador de operación inválido.' }, 400, corsOrigin)
    }
    const operationId = operationIdRaw.trim().toLowerCase()

    if (!(imageEntry instanceof Blob) || imageEntry.size <= 0) {
      logWarn('MISSING_IMAGE')
      return jsonResponse({ error: 'Archivo de imagen requerido.' }, 400, corsOrigin)
    }
    const maxBytes = bucketMaxBytes[bucketRaw]
    if (imageEntry.size > maxBytes) {
      logWarn('IMAGE_TOO_LARGE')
      return jsonResponse({ error: 'La imagen excede el tamaño máximo permitido.' }, 413, corsOrigin)
    }

    const bytes = new Uint8Array(await imageEntry.arrayBuffer())
    if (bytes.byteLength === 0 || bytes.byteLength > maxBytes) {
      logWarn('IMAGE_BYTES_TOO_LARGE')
      return jsonResponse({ error: 'La imagen excede el tamaño máximo permitido.' }, 413, corsOrigin)
    }

    // Capa 1 ANTES de cuota y WASM: rechaza archivos falsos/truncados/animados/bombas en < 1.2 ms.
    try {
      inspectWebpContainer(bytes, { maxDim, maxPixels })
    } catch (error) {
      const code = error instanceof WebpVerificationError ? error.code : 'INVALID_RIFF_HEADER'
      logWarn(`LAYER1_${code}`)
      return jsonResponse({ error: 'Formato real o dimensiones de imagen no permitidos.' }, 400, corsOrigin)
    }

    // Cuota de servidor ANTES de Capa 2 WASM para proteger CPU contra ráfagas de bitstreams manipulados.
    const serviceClient = deps.createServiceClient()
    const rateAction = bucketRaw === 'profile-images' ? 'avatar' : 'media'
    try {
      const rate = await serviceClient.takeRateLimit(userId, rateAction)
      if (rate.error) {
        logWarn('RATE_LIMIT_RPC_ERROR')
        return jsonResponse({ error: 'Servicio temporalmente no disponible.' }, 503, corsOrigin)
      }
      if (!rate.allowed) {
        logWarn('RATE_LIMIT_EXCEEDED')
        return jsonResponse({ error: 'Límite de fotografías alcanzado. Intenta más tarde.' }, 429, corsOrigin)
      }
    } catch {
      logWarn('RATE_LIMIT_EXCEPTION')
      return jsonResponse({ error: 'Servicio temporalmente no disponible.' }, 503, corsOrigin)
    }

    // Capa 2: decodificación completa del bitstream vía libwebp WASM.
    let verified: { width: number; height: number; sha256: string }
    try {
      verified = await verifyWebpBytes(bytes, deps.decodeWebp, { maxDim, maxPixels })
    } catch (error) {
      const code = error instanceof WebpVerificationError ? error.code : 'WASM_DECODE_FAILED'
      logWarn(`LAYER2_${code}`)
      return jsonResponse({ error: 'La imagen WebP está dañada o no es válida.' }, 400, corsOrigin)
    }

    // Subida controlada por servidor (nunca confiar en el nombre de archivo del cliente).
    const objectId = generateUuid()
    if (!UUID_PATTERN.test(objectId)) {
      logWarn('INVALID_GENERATED_UUID')
      return jsonResponse({ error: 'No se pudo almacenar la imagen.' }, 500, corsOrigin)
    }
    const storagePath = `${userId}/${objectId}.webp`
    const cacheControl = bucketRaw === 'property-images' ? '0' : '3600'

    try {
      const uploadRes = await serviceClient.uploadObject(bucketRaw, storagePath, bytes, cacheControl)
      if (uploadRes.error) {
        logWarn('STORAGE_UPLOAD_FAILED')
        return jsonResponse({ error: 'No se pudo almacenar la imagen.' }, 502, corsOrigin)
      }
    } catch {
      logWarn('STORAGE_UPLOAD_EXCEPTION')
      return jsonResponse({ error: 'No se pudo almacenar la imagen.' }, 502, corsOrigin)
    }

    let publicUrl: string | null = null
    if (bucketRaw === 'profile-images') {
      const candidateUrl = serviceClient.getPublicUrl(bucketRaw, storagePath)
      let parsedUrl: URL
      try {
        parsedUrl = new URL(candidateUrl)
      } catch {
        await safeRemoveObject(serviceClient, bucketRaw, storagePath)
        logWarn('INVALID_PUBLIC_URL')
        return jsonResponse({ error: 'No se pudo publicar la imagen de perfil.' }, 502, corsOrigin)
      }
      if (
        parsedUrl.origin !== supabaseOrigin ||
        !parsedUrl.pathname.startsWith('/storage/v1/object/public/profile-images/')
      ) {
        await safeRemoveObject(serviceClient, bucketRaw, storagePath)
        logWarn('PUBLIC_URL_ORIGIN_MISMATCH')
        return jsonResponse({ error: 'No se pudo publicar la imagen de perfil.' }, 502, corsOrigin)
      }
      publicUrl = candidateUrl
    }

    // Registro de proveniencia en qrih_verified_uploads; compensa Storage si falla.
    try {
      const proofRes = await serviceClient.insertVerifiedUpload({
        bucket_id: bucketRaw,
        storage_path: storagePath,
        owner_id: userId,
        mime_type: 'image/webp',
        byte_size: bytes.byteLength,
        sha256: verified.sha256,
        public_url: publicUrl,
      })
      if (proofRes.error) {
        await safeRemoveObject(serviceClient, bucketRaw, storagePath)
        logWarn('PROVENANCE_INSERT_FAILED')
        return jsonResponse({ error: 'No se pudo verificar la pertenencia de la imagen.' }, 502, corsOrigin)
      }
    } catch {
      await safeRemoveObject(serviceClient, bucketRaw, storagePath)
      logWarn('PROVENANCE_INSERT_EXCEPTION')
      return jsonResponse({ error: 'No se pudo verificar la pertenencia de la imagen.' }, 502, corsOrigin)
    }

    const expiresAtSec = Math.floor(now().getTime() / 1000) + ROLLBACK_TTL_SECONDS
    const rollbackToken = await issueRollbackToken(
      rollbackKeyMaterial,
      userId,
      operationId,
      bucketRaw,
      storagePath,
      expiresAtSec,
    )

    return jsonResponse(
      {
        path: storagePath,
        publicUrl,
        bucket: bucketRaw,
        operationId,
        sha256: verified.sha256,
        byteSize: bytes.byteLength,
        width: verified.width,
        height: verified.height,
        rollbackToken,
        rollbackExpiresAt: new Date(expiresAtSec * 1000).toISOString(),
      },
      200,
      corsOrigin,
    )
  }

  async function handleRollback(
    request: Request,
    userId: string,
    corsOrigin: string | null,
  ): Promise<Response> {
    const rawBody = await readBoundedText(request, MAX_ROLLBACK_BODY_BYTES)
    if (rawBody === null) {
      return jsonResponse({ error: 'Solicitud de rollback demasiado grande.' }, 413, corsOrigin)
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(rawBody)
    } catch {
      return jsonResponse({ error: 'Cuerpo JSON inválido.' }, 400, corsOrigin)
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return jsonResponse({ error: 'Formato de solicitud inválido.' }, 400, corsOrigin)
    }
    const payload = parsed as Record<string, unknown>
    for (const key of Object.keys(payload)) {
      if (!ROLLBACK_BODY_KEYS.has(key)) {
        return jsonResponse({ error: 'Parámetros no permitidos.' }, 400, corsOrigin)
      }
    }

    if (payload.action !== 'rollback') {
      return jsonResponse({ error: 'Acción no permitida.' }, 400, corsOrigin)
    }
    if (!isMediaBucket(payload.bucket)) {
      return jsonResponse({ error: 'Bucket no permitido.' }, 400, corsOrigin)
    }
    if (typeof payload.operationId !== 'string' || !UUID_PATTERN.test(payload.operationId.trim())) {
      return jsonResponse({ error: 'Identificador de operación inválido.' }, 400, corsOrigin)
    }
    const bucket = payload.bucket
    const operationId = payload.operationId.trim().toLowerCase()

    if (!Array.isArray(payload.items) || payload.items.length === 0 || payload.items.length > MAX_ROLLBACK_ITEMS) {
      return jsonResponse({ error: 'Lista de objetos para rollback inválida.' }, 400, corsOrigin)
    }

    const uniqueItems: Array<{ path: string; rollbackToken: string }> = []
    const seenPaths = new Set<string>()
    const nowSec = Math.floor(now().getTime() / 1000)

    for (const entry of payload.items) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        return jsonResponse({ error: 'Elemento de rollback inválido.' }, 400, corsOrigin)
      }
      const record = entry as Record<string, unknown>
      for (const key of Object.keys(record)) {
        if (!ROLLBACK_ITEM_KEYS.has(key)) {
          return jsonResponse({ error: 'Parámetros de elemento no permitidos.' }, 400, corsOrigin)
        }
      }
      if (!isOwnedStoragePath(userId, record.path) || typeof record.rollbackToken !== 'string') {
        logWarn('ROLLBACK_INVALID_ITEM')
        return jsonResponse({ error: 'Referencia de objeto no autorizada.' }, 403, corsOrigin)
      }
      const validToken = await verifyRollbackToken(
        rollbackKeyMaterial,
        record.rollbackToken,
        userId,
        operationId,
        bucket,
        record.path,
        nowSec,
      )
      if (!validToken) {
        logWarn('ROLLBACK_INVALID_TOKEN')
        return jsonResponse({ error: 'Token de rollback inválido o expirado.' }, 403, corsOrigin)
      }
      if (!seenPaths.has(record.path)) {
        seenPaths.add(record.path)
        uniqueItems.push({ path: record.path, rollbackToken: record.rollbackToken })
      }
    }

    const serviceClient = deps.createServiceClient()
    const results: Array<{ path: string; status: 'deleted' | 'already_absent' | 'preserved_attached' }> = []

    for (const item of uniqueItems) {
      try {
        const attachedCheck = await serviceClient.isPathAttached(bucket, item.path, userId)
        if (attachedCheck.error) {
          logWarn('ROLLBACK_ATTACH_CHECK_FAILED')
          return jsonResponse({ error: 'No se pudo verificar si la imagen está adjunta.' }, 503, corsOrigin)
        }
        if (attachedCheck.attached) {
          // Invariante crítico: jamás borrar una imagen ya vinculada en DB (p. ej. tras respuesta RPC perdida).
          results.push({ path: item.path, status: 'preserved_attached' })
          continue
        }

        const storageRemoval = await serviceClient.removeObjects(bucket, [item.path])
        if (storageRemoval.error) {
          logWarn('ROLLBACK_STORAGE_DELETE_FAILED')
          return jsonResponse({ error: 'No se pudo completar el rollback en almacenamiento.' }, 502, corsOrigin)
        }

        const proofRemoval = await serviceClient.deleteVerifiedUpload(bucket, item.path, userId)
        if (proofRemoval.error) {
          logWarn('ROLLBACK_PROVENANCE_DELETE_FAILED')
          return jsonResponse({ error: 'No se pudo limpiar el registro de proveniencia.' }, 502, corsOrigin)
        }

        results.push({ path: item.path, status: proofRemoval.deleted ? 'deleted' : 'already_absent' })
      } catch {
        logWarn('ROLLBACK_EXCEPTION')
        return jsonResponse({ error: 'No se pudo completar el rollback.' }, 502, corsOrigin)
      }
    }

    return jsonResponse({ operationId, bucket, results }, 200, corsOrigin)
  }

  async function safeRemoveObject(
    serviceClient: ServiceMediaSupabaseLike,
    bucket: MediaBucket,
    path: string,
  ): Promise<void> {
    try {
      await serviceClient.removeObjects(bucket, [path])
    } catch {
      logWarn('INTERNAL_COMPENSATION_REMOVE_FAILED')
    }
  }
}
