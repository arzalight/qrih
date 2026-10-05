export function validUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}
export function canonicalRequestOrigin(request: Request) {
  let expectedOrigin = new URL(request.url).origin
  // Netlify puede representar el request con una URL interna del deployment.
  // SITE_ID/URL son variables del proveedor: no confiar en Host ni forwarded headers.
  // Sólo aceptar el origen canónico del sitio, no aliases/previews ni comodines.
  if (process.env.SITE_ID) {
    const site = new URL(process.env.URL || '')
    if (site.protocol !== 'https:' || site.username || site.password || site.pathname !== '/' || site.search || site.hash) {
      throw new Error('Origen del sitio inválido.')
    }
    expectedOrigin = site.origin
  }
  return expectedOrigin
}
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  const expectedOrigin = canonicalRequestOrigin(request)
  if (origin && origin !== expectedOrigin) throw new Error('Origen inválido.')
}
export async function limitedBody(request: Pick<Request, 'headers' | 'body'>, maxBytes: number) {
  if (Number(request.headers.get('content-length')) > maxBytes) throw new Error('Solicitud demasiado grande.')
  const reader = request.body?.getReader()
  if (!reader) return new Uint8Array()
  let size = 0
  const chunks: Uint8Array[] = []
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBytes) { await reader.cancel(); throw new Error('Solicitud demasiado grande.') }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  const result = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length }
  return result
}
export async function readForm(request: Request, maxBytes = 64 * 1024) {
  const bytes = await limitedBody(request, maxBytes)
  return new Request(request.url, { method: 'POST', headers: request.headers, body: bytes }).formData()
}
export async function readJson(request: Request) {
  const parsed: unknown = JSON.parse(new TextDecoder().decode(await limitedBody(request, 64 * 1024)))
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('JSON inválido.')
  return parsed as Record<string, unknown>
}
