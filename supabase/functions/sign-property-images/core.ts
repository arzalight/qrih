export const ALLOWED_SIGN_TTLS = [300, 600, 900] as const
export const MAX_SIGN_PATHS = 200
export const MAX_SIGN_BODY_BYTES = 32 * 1024
export const ALLOWED_BUCKET = 'property-images' as const

const PATH_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[a-zA-Z0-9._-]+\.webp$/i
const BEARER_PATTERN = /^Bearer ([A-Za-z0-9._-]+)$/
const ALLOWED_BODY_KEYS = new Set(['paths', 'expiresIn', 'bucket'])

export type AuthUserResult = {
  data: { user: { id: string; is_anonymous?: boolean } | null }
  error: unknown
}

export type ActorSupabaseLike = {
  auth: {
    getUser: (jwt?: string) => Promise<AuthUserResult>
  }
  rpc: (
    fn: string,
    args: { p_paths: string[] },
  ) => Promise<{ data: unknown; error: unknown }>
}

export type ServiceSupabaseLike = {
  storage: {
    from: (bucket: string) => {
      createSignedUrls: (
        paths: string[],
        expiresIn: number,
      ) => Promise<{
        data: Array<{ path?: string | null; signedUrl?: string | null; error?: unknown }> | null
        error: unknown
      }>
    }
  }
}

export type SignHandlerDeps = {
  supabaseUrl: string
  expectedPublicKey: string
  expectedPublicKeys?: string[]
  serviceRoleKey: string
  allowedOrigins: string[]
  createActorClient: (bearerToken: string | null) => ActorSupabaseLike
  createServiceClient: () => ServiceSupabaseLike
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

function isSafePropertyPath(value: unknown): value is string {
  if (typeof value !== 'string') return false
  if (
    value.includes('..') ||
    value.includes('?') ||
    value.includes('#') ||
    value.includes('\\') ||
    value.includes('%') ||
    value.includes('://')
  ) {
    return false
  }
  return PATH_PATTERN.test(value)
}

export function createSignPropertyImagesHandler(deps: SignHandlerDeps) {
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
  const now = deps.now ?? (() => new Date())
  const logWarn = deps.logWarn ?? ((code: string) => console.warn('QRIH_SIGN_IMAGES_ERROR', code))

  return async function handleSignPropertyImages(request: Request): Promise<Response> {
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

    // 1. Validar apikey esperada (y jamás aceptar la clave privilegiada como apikey cliente).
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

    // 2. Validar Content-Type y tamaño acotado del cuerpo.
    const contentType = (request.headers.get('content-type') || '').toLowerCase()
    if (!contentType.startsWith('application/json')) {
      return jsonResponse({ error: 'Tipo de contenido no permitido.' }, 415, corsOrigin)
    }

    const rawBody = await readBoundedText(request, MAX_SIGN_BODY_BYTES)
    if (rawBody === null) {
      return jsonResponse({ error: 'Solicitud demasiado grande.' }, 413, corsOrigin)
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
      if (!ALLOWED_BODY_KEYS.has(key)) {
        return jsonResponse({ error: 'Parámetros no permitidos.' }, 400, corsOrigin)
      }
    }

    if (payload.bucket !== undefined && payload.bucket !== ALLOWED_BUCKET) {
      return jsonResponse({ error: 'Bucket no permitido.' }, 400, corsOrigin)
    }

    const expiresIn = payload.expiresIn
    if (
      typeof expiresIn !== 'number' ||
      !Number.isInteger(expiresIn) ||
      !(ALLOWED_SIGN_TTLS as readonly number[]).includes(expiresIn)
    ) {
      return jsonResponse({ error: 'Duración de firma no autorizada.' }, 400, corsOrigin)
    }

    if (!Array.isArray(payload.paths) || payload.paths.length === 0) {
      return jsonResponse({ error: 'Se requiere al menos una ruta de imagen.' }, 400, corsOrigin)
    }

    const uniquePaths: string[] = []
    const seen = new Set<string>()
    for (const item of payload.paths) {
      if (!isSafePropertyPath(item)) {
        return jsonResponse({ error: 'Referencia de imagen inválida.' }, 400, corsOrigin)
      }
      if (!seen.has(item)) {
        seen.add(item)
        uniquePaths.push(item)
      }
    }

    if (uniquePaths.length > MAX_SIGN_PATHS) {
      return jsonResponse({ error: 'Se excedió el límite de imágenes por solicitud.' }, 400, corsOrigin)
    }

    // 3. Validar Authorization: distinguir anónimo vs Bearer JWT real.
    //    Un Bearer JWT inválido/expirado/revocado/anónimo SIEMPRE devuelve 401 (nunca degrada a anon).
    const authHeader = request.headers.get('authorization')
    let verifiedActorToken: string | null = null
    if (authHeader !== null) {
      if (authHeader.length > 8192) {
        logWarn('AUTH_HEADER_TOO_LARGE')
        return jsonResponse({ error: 'Sesión inválida.' }, 401, corsOrigin)
      }
      const match = authHeader.trim().match(BEARER_PATTERN)
      if (!match) {
        logWarn('MALFORMED_AUTH_HEADER')
        return jsonResponse({ error: 'Sesión inválida.' }, 401, corsOrigin)
      }
      const token = match[1]
      if (deps.serviceRoleKey && constantTimeEqual(token, deps.serviceRoleKey)) {
        logWarn('FORBIDDEN_SERVICE_TOKEN')
        return jsonResponse({ error: 'Sesión inválida.' }, 401, corsOrigin)
      }
      if (!matchesPublicKey(token)) {
        const authCheckClient = deps.createActorClient(token)
        let authResult: AuthUserResult
        try {
          authResult = await authCheckClient.auth.getUser(token)
        } catch {
          logWarn('AUTH_VERIFY_FAILED')
          return jsonResponse({ error: 'No se pudo validar la sesión.' }, 401, corsOrigin)
        }
        if (authResult.error || !authResult.data?.user || authResult.data.user.is_anonymous) {
          logWarn('INVALID_ACTOR_JWT')
          return jsonResponse({ error: 'Sesión inválida o expirada.' }, 401, corsOrigin)
        }
        verifiedActorToken = token
      }
    }

    // 4. Autorizar rutas exclusivamente con el cliente del actor (anon o JWT verificado).
    const actorClient = deps.createActorClient(verifiedActorToken)
    let authorized: unknown
    try {
      const rpcResult = await actorClient.rpc('qrih_authorized_image_paths', { p_paths: uniquePaths })
      if (rpcResult.error || !Array.isArray(rpcResult.data)) {
        logWarn('AUTHZ_RPC_DENIED')
        return jsonResponse({ error: 'No tienes acceso a las imágenes solicitadas.' }, 403, corsOrigin)
      }
      authorized = rpcResult.data
    } catch {
      logWarn('AUTHZ_RPC_ERROR')
      return jsonResponse({ error: 'No fue posible validar el acceso a las imágenes.' }, 503, corsOrigin)
    }

    const authorizedSet = new Set(
      (authorized as unknown[]).filter((item): item is string => typeof item === 'string'),
    )
    if (uniquePaths.some((path) => !authorizedSet.has(path))) {
      // Cero oráculo: respuesta idéntica si la ruta no existe o pertenece a otro usuario.
      logWarn('PATHS_NOT_AUTHORIZED')
      return jsonResponse({ error: 'No tienes acceso a las imágenes solicitadas.' }, 403, corsOrigin)
    }

    // 5. Emitir firmas temporales con cliente privilegiado interno únicamente para rutas autorizadas.
    try {
      const serviceClient = deps.createServiceClient()
      const signed = await serviceClient.storage
        .from(ALLOWED_BUCKET)
        .createSignedUrls(uniquePaths, expiresIn)

      if (signed.error || !Array.isArray(signed.data)) {
        logWarn('STORAGE_SIGN_FAILED')
        return jsonResponse({ error: 'No fue posible obtener las imágenes autorizadas.' }, 502, corsOrigin)
      }

      const urls: Record<string, string> = {}
      for (const item of signed.data) {
        if (item.error || !item.path || !item.signedUrl || !seen.has(item.path)) {
          logWarn('STORAGE_SIGN_INCOMPLETE_ITEM')
          return jsonResponse({ error: 'No fue posible obtener todas las imágenes autorizadas.' }, 502, corsOrigin)
        }
        let parsedUrl: URL
        try {
          parsedUrl = new URL(item.signedUrl)
        } catch {
          logWarn('STORAGE_SIGN_INVALID_URL')
          return jsonResponse({ error: 'Respuesta de firmas inválida.' }, 502, corsOrigin)
        }
        if (
          parsedUrl.origin !== supabaseOrigin ||
          !parsedUrl.pathname.startsWith('/storage/v1/object/sign/property-images/')
        ) {
          logWarn('STORAGE_SIGN_ORIGIN_MISMATCH')
          return jsonResponse({ error: 'Origen de firma inválido.' }, 502, corsOrigin)
        }
        urls[item.path] = item.signedUrl
      }

      if (Object.keys(urls).length !== uniquePaths.length) {
        logWarn('STORAGE_SIGN_COUNT_MISMATCH')
        return jsonResponse({ error: 'Respuesta incompleta de imágenes autorizadas.' }, 502, corsOrigin)
      }

      const expiresAt = new Date(now().getTime() + expiresIn * 1000).toISOString()
      return jsonResponse({ expiresIn, expiresAt, urls }, 200, corsOrigin)
    } catch {
      logWarn('STORAGE_SIGN_EXCEPTION')
      return jsonResponse({ error: 'No fue posible obtener las imágenes autorizadas.' }, 502, corsOrigin)
    }
  }
}
