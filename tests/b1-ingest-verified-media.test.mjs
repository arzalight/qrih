import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { test } from 'node:test'
import sharp from 'sharp'
import {
  MAX_WEBP_DIMENSION,
  MAX_WEBP_PIXELS,
  ROLLBACK_TTL_SECONDS,
  WebpVerificationError,
  createIngestVerifiedMediaHandler,
  inspectWebpContainer,
  verifyWebpBytes,
} from '../supabase/functions/ingest-verified-media/core.ts'

const SUPABASE_URL = 'https://mcyxunymhuxyiwklyfpy.supabase.co'
const PUBLIC_KEY = 'sb_publishable_syntheticStagingKey01'
const SERVICE_KEY = ['sb', 'secret', 'syntheticEdgeOnlyKey99'].join('_')
const STAGING_ORIGIN = 'https://qrih-staging.netlify.app'
const USER_A = '11111111-1111-4111-8111-111111111111'
const USER_B = '22222222-2222-4222-8222-222222222222'
const SUSPENDED_USER = '33333333-3333-4333-8333-333333333333'
const OP_1 = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa'
const OP_2 = 'bbbbbbbb-2222-4bbb-8bbb-bbbbbbbbbbbb'

const TOKENS = {
  userA: 'jwt.userA.valid',
  userB: 'jwt.userB.valid',
  suspended: 'jwt.suspended.valid',
  anonAuth: 'jwt.anonymous.auth',
  expired: 'jwt.expired.invalid',
}

async function createDecoder() {
  const wasmModulePath = process.env.QRIH_WEBP_DECODE_MODULE
  if (wasmModulePath) {
    if (typeof globalThis.ImageData === 'undefined') {
      globalThis.ImageData = class ImageData {
        constructor(dataOrWidth, widthOrHeight, maybeHeight) {
          if (dataOrWidth instanceof Uint8ClampedArray) {
            this.data = dataOrWidth
            this.width = widthOrHeight
            this.height = maybeHeight ?? Math.floor(dataOrWidth.length / (4 * widthOrHeight))
          } else {
            this.width = dataOrWidth
            this.height = widthOrHeight
            this.data = new Uint8ClampedArray(this.width * this.height * 4)
          }
        }
      }
    }
    const mod = await import(pathToFileURL(wasmModulePath).href)
    const wasmFile = process.env.QRIH_WEBP_WASM_FILE
    if (wasmFile) {
      const wasmBytes = await readFile(wasmFile)
      const compiled = await WebAssembly.compile(wasmBytes)
      await mod.init(compiled)
    }
    return async (bytes) => {
      const copy = new Uint8Array(bytes.byteLength)
      copy.set(bytes)
      const img = await mod.default(copy.buffer)
      return { width: img.width, height: img.height, data: img.data }
    }
  }

  return async (bytes) => {
    const { data, info } = await sharp(Buffer.from(bytes), {
      limitInputPixels: MAX_WEBP_PIXELS,
      failOn: 'error',
      animated: false,
    })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    return {
      width: info.width,
      height: info.height,
      data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength),
    }
  }
}

async function makeWebp(width, height, { lossless = false, alpha = false } = {}) {
  const buf = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 24, g: 82, b: 136, alpha: alpha ? 0.5 : 1 },
    },
  })
    .webp({ quality: 80, lossless })
    .toBuffer()
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
}

function makeAnimatedVp8x() {
  const buf = Buffer.alloc(30)
  buf.write('RIFF', 0, 'ascii')
  buf.writeUInt32LE(22, 4)
  buf.write('WEBP', 8, 'ascii')
  buf.write('VP8X', 12, 'ascii')
  buf.writeUInt32LE(10, 16)
  buf[20] = 0x02 // ANIM bit
  buf[24] = 99 // width = 100
  buf[27] = 99 // height = 100
  return new Uint8Array(buf)
}

function corruptValidWebpBitstream(validWebp) {
  const corrupted = new Uint8Array(validWebp)
  for (let i = Math.min(48, corrupted.length - 1); i < corrupted.length; i++) {
    corrupted[i] ^= 0xff
  }
  return corrupted
}

async function makeFixture(options = {}) {
  const baseDecoder = await createDecoder()
  let decodeCalls = 0
  let rateCalls = 0
  let uuidSeq = 0
  let currentNow = new Date('2026-11-24T15:00:00.000Z')
  const logs = []
  const storageObjects = new Map() // `${bucket}:${path}` -> { bytes, cacheControl }
  const verifiedRows = new Map() // `${bucket}:${path}` -> record
  const attachedPaths = new Set(options.attachedPaths ?? [])

  const handler = createIngestVerifiedMediaHandler({
    supabaseUrl: SUPABASE_URL,
    expectedPublicKey: PUBLIC_KEY,
    serviceRoleKey: SERVICE_KEY,
    allowedOrigins: [STAGING_ORIGIN],
    now: () => currentNow,
    logWarn: (code) => logs.push(code),
    generateUuid: () => {
      uuidSeq++
      return `00000000-0000-4000-8000-${String(uuidSeq).padStart(12, '0')}`
    },
    decodeWebp: async (bytes) => {
      decodeCalls++
      if (options.decodeOverride) return options.decodeOverride(bytes)
      return baseDecoder(bytes)
    },
    createActorClient: (bearerToken) => ({
      auth: {
        async getUser(jwt) {
          const token = jwt ?? bearerToken
          if (token === TOKENS.userA) return { data: { user: { id: USER_A, is_anonymous: false } }, error: null }
          if (token === TOKENS.userB) return { data: { user: { id: USER_B, is_anonymous: false } }, error: null }
          if (token === TOKENS.suspended) return { data: { user: { id: SUSPENDED_USER, is_anonymous: false } }, error: null }
          if (token === TOKENS.anonAuth) return { data: { user: { id: '99999999-9999-4999-8999-999999999999', is_anonymous: true } }, error: null }
          return { data: { user: null }, error: { message: 'invalid jwt' } }
        },
      },
      async getAccountStatus(userId) {
        if (userId === SUSPENDED_USER) return { status: 'suspended', error: null }
        return { status: 'active', error: null }
      },
    }),
    createServiceClient: () => ({
      async takeRateLimit(subject, action) {
        rateCalls++
        assert.ok(subject === USER_A || subject === USER_B)
        assert.ok(action === 'media' || action === 'avatar')
        if (options.rateLimitError) return { allowed: false, error: { message: `db err ${SERVICE_KEY}` } }
        if (options.rateLimited) return { allowed: false, error: null }
        return { allowed: true, error: null }
      },
      async uploadObject(bucket, path, bytes, cacheControl) {
        if (options.uploadError) return { error: { message: `storage err ${SERVICE_KEY}` } }
        storageObjects.set(`${bucket}:${path}`, { bytes: new Uint8Array(bytes), cacheControl })
        return { error: null }
      },
      async removeObjects(bucket, paths) {
        if (options.removeError) return { error: { message: 'remove failed' } }
        for (const p of paths) storageObjects.delete(`${bucket}:${p}`)
        return { error: null }
      },
      getPublicUrl(bucket, path) {
        if (options.evilPublicUrl) return `https://evil.invalid/storage/v1/object/public/${bucket}/${path}`
        return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
      },
      async insertVerifiedUpload(record) {
        if (options.provenanceError) return { error: { message: `proof err ${SERVICE_KEY}` } }
        verifiedRows.set(`${record.bucket_id}:${record.storage_path}`, record)
        return { error: null }
      },
      async deleteVerifiedUpload(bucket, path, ownerId) {
        const key = `${bucket}:${path}`
        const existing = verifiedRows.get(key)
        if (existing && existing.owner_id === ownerId) {
          verifiedRows.delete(key)
          return { deleted: true, error: null }
        }
        return { deleted: false, error: null }
      },
      async isPathAttached(bucket, path) {
        return { attached: attachedPaths.has(`${bucket}:${path}`), error: null }
      },
    }),
  })

  return {
    handler,
    logs,
    storageObjects,
    verifiedRows,
    attachedPaths,
    setNow: (date) => {
      currentNow = date
    },
    getDecodeCalls: () => decodeCalls,
    getRateCalls: () => rateCalls,
  }
}

function makeUploadRequest({
  bytes,
  bucket = 'property-images',
  operationId = OP_1,
  token = TOKENS.userA,
  apikey = PUBLIC_KEY,
  origin,
} = {}) {
  const form = new FormData()
  if (bucket !== null) form.set('bucket', bucket)
  if (operationId !== null) form.set('operationId', operationId)
  if (bytes !== null) form.set('image', new File([bytes], 'upload.webp', { type: 'image/webp' }))
  const headers = {}
  if (apikey !== null) headers.apikey = apikey
  if (token !== null) headers.authorization = `Bearer ${token}`
  if (origin) headers.origin = origin
  return new Request(`${SUPABASE_URL}/functions/v1/ingest-verified-media`, {
    method: 'POST',
    headers,
    body: form,
  })
}

function makeRollbackRequest(body, { token = TOKENS.userA, apikey = PUBLIC_KEY, origin } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (apikey !== null) headers.apikey = apikey
  if (token !== null) headers.authorization = `Bearer ${token}`
  if (origin) headers.origin = origin
  return new Request(`${SUPABASE_URL}/functions/v1/ingest-verified-media`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

test('ingest-verified-media (Capa 1 + Capa 2): valida WebP VP8/VP8L/VP8X hasta 2560x2560 y rechaza bombas, falsos, animados y bitstream corrupto', async () => {
  const decoder = await createDecoder()

  const lossy = await makeWebp(320, 240)
  const lossless = await makeWebp(120, 90, { lossless: true })
  const alpha = await makeWebp(640, 480, { alpha: true })
  const maxCap = await makeWebp(MAX_WEBP_DIMENSION, MAX_WEBP_DIMENSION)

  const v1 = await verifyWebpBytes(lossy, decoder)
  assert.equal(v1.width, 320)
  assert.equal(v1.height, 240)
  assert.equal(v1.sha256, createHash('sha256').update(lossy).digest('hex'))

  const v2 = await verifyWebpBytes(lossless, decoder)
  assert.equal(v2.width, 120)
  assert.equal(v2.height, 90)

  const v3 = await verifyWebpBytes(alpha, decoder)
  assert.equal(v3.width, 640)
  assert.equal(v3.height, 480)

  const v4 = await verifyWebpBytes(maxCap, decoder)
  assert.equal(v4.width, MAX_WEBP_DIMENSION)
  assert.equal(v4.height, MAX_WEBP_DIMENSION)

  // Capa 1 rechaza 4096x4096 y bomba 6400x6400 sin invocar decodificador
  let decoderCalled = 0
  const spyDecoder = async (b) => {
    decoderCalled++
    return decoder(b)
  }
  const stress4k = await makeWebp(4096, 4096)
  const bomb40mp = await makeWebp(6400, 6400)
  const fakePng = new Uint8Array(
    await sharp({ create: { width: 16, height: 16, channels: 3, background: { r: 1, g: 2, b: 3 } } })
      .png()
      .toBuffer(),
  )
  const fakeHtml = new TextEncoder().encode('<html><body><script>alert(1)</script></body></html>')
  const truncated = lossy.subarray(0, lossy.byteLength - 10)
  const trailingPolyglot = new Uint8Array(lossy.byteLength + 16)
  trailingPolyglot.set(lossy, 0)
  trailingPolyglot.set(new TextEncoder().encode('<script>1</script>').subarray(0, 16), lossy.byteLength)
  const animated = makeAnimatedVp8x()

  const layer1Expectations = [
    [stress4k, 'DIMENSIONS_EXCEED_LIMIT'],
    [bomb40mp, 'DIMENSIONS_EXCEED_LIMIT'],
    [fakePng, 'INVALID_RIFF_HEADER'],
    [fakeHtml, 'INVALID_RIFF_HEADER'],
    [truncated, 'TRUNCATED_OR_TRAILING_RIFF'],
    [trailingPolyglot, 'TRUNCATED_OR_TRAILING_RIFF'],
    [animated, 'ANIMATED_WEBP_FORBIDDEN'],
  ]
  for (const [payload, expectedCode] of layer1Expectations) {
    await assert.rejects(
      verifyWebpBytes(payload, spyDecoder),
      (err) => err instanceof WebpVerificationError && err.layer === 1 && err.code === expectedCode,
    )
  }
  assert.equal(decoderCalled, 0, 'Ningún caso rechazable en Capa 1 debe invocar el decodificador WASM')

  // Bitstream corrupto con cabecera RIFF+VP8 válida: evade Capa 1 pero Capa 2 lo bloquea
  const hd = await makeWebp(1280, 720)
  const corrupt = corruptValidWebpBitstream(hd)
  const headerInfo = inspectWebpContainer(corrupt)
  assert.equal(headerInfo.width, 1280)
  assert.equal(headerInfo.height, 720)
  await assert.rejects(
    verifyWebpBytes(corrupt, spyDecoder),
    (err) => err instanceof WebpVerificationError && err.layer === 2 && err.code === 'WASM_DECODE_FAILED',
  )
  assert.equal(decoderCalled, 1)
})

test('ingest-verified-media: autenticación estricta, rechazo de anon/service_role/suspendido y CORS por lista blanca', async () => {
  const fx = await makeFixture()
  const validWebp = await makeWebp(80, 60)

  // CORS denegado para origen ajeno, 204 en preflight autorizado
  assert.equal((await fx.handler(makeUploadRequest({ bytes: validWebp, origin: 'https://evil.example' }))).status, 403)
  const preflight = await fx.handler(
    new Request(`${SUPABASE_URL}/functions/v1/ingest-verified-media`, {
      method: 'OPTIONS',
      headers: { origin: STAGING_ORIGIN },
    }),
  )
  assert.equal(preflight.status, 204)
  assert.equal(preflight.headers.get('access-control-allow-origin'), STAGING_ORIGIN)

  // Método no permitido y Content-Type inválido
  assert.equal(
    (await fx.handler(new Request(`${SUPABASE_URL}/functions/v1/ingest-verified-media`, { method: 'GET' }))).status,
    405,
  )
  assert.equal(
    (
      await fx.handler(
        new Request(`${SUPABASE_URL}/functions/v1/ingest-verified-media`, {
          method: 'POST',
          headers: { apikey: PUBLIC_KEY, authorization: `Bearer ${TOKENS.userA}`, 'content-type': 'text/plain' },
          body: 'hello',
        }),
      )
    ).status,
    415,
  )

  // apikey ausente, incorrecta o service_role
  assert.equal((await fx.handler(makeUploadRequest({ bytes: validWebp, apikey: null }))).status, 401)
  assert.equal((await fx.handler(makeUploadRequest({ bytes: validWebp, apikey: 'bad-key' }))).status, 401)
  assert.equal((await fx.handler(makeUploadRequest({ bytes: validWebp, apikey: SERVICE_KEY }))).status, 401)

  // Sin Bearer, clave pública como Bearer, service_role como Bearer, JWT expirado o anónimo -> 401
  for (const badToken of [null, PUBLIC_KEY, SERVICE_KEY, TOKENS.expired, TOKENS.anonAuth]) {
    assert.equal((await fx.handler(makeUploadRequest({ bytes: validWebp, token: badToken }))).status, 401)
  }

  // Usuario suspendido -> 403
  assert.equal((await fx.handler(makeUploadRequest({ bytes: validWebp, token: TOKENS.suspended }))).status, 403)
  assert.equal(fx.getRateCalls(), 0)
  assert.equal(fx.getDecodeCalls(), 0)
})

test('ingest-verified-media (Fase 1): subida property/avatar, cuota previa a WASM, límite 3 MiB y compensación interna si falla proveniencia', async () => {
  const validWebp = await makeWebp(160, 120)
  const expectedSha = createHash('sha256').update(validWebp).digest('hex')

  // 1. Subida válida a property-images y profile-images
  const fx = await makeFixture()
  const propRes = await fx.handler(makeUploadRequest({ bytes: validWebp, bucket: 'property-images', operationId: OP_1 }))
  assert.equal(propRes.status, 200)
  assert.equal(propRes.headers.get('cache-control'), 'no-store')
  const propJson = await propRes.json()
  assert.equal(propJson.path, `${USER_A}/00000000-0000-4000-8000-000000000001.webp`)
  assert.equal(propJson.publicUrl, null)
  assert.equal(propJson.sha256, expectedSha)
  assert.equal(propJson.width, 160)
  assert.equal(propJson.height, 120)
  assert.equal(propJson.operationId, OP_1)
  assert.ok(typeof propJson.rollbackToken === 'string' && propJson.rollbackToken.includes('.'))
  assert.equal(fx.storageObjects.get(`property-images:${propJson.path}`).cacheControl, '0')
  assert.equal(fx.verifiedRows.get(`property-images:${propJson.path}`).sha256, expectedSha)

  const avatarRes = await fx.handler(makeUploadRequest({ bytes: validWebp, bucket: 'profile-images', operationId: OP_1 }))
  assert.equal(avatarRes.status, 200)
  const avatarJson = await avatarRes.json()
  assert.equal(
    avatarJson.publicUrl,
    `${SUPABASE_URL}/storage/v1/object/public/profile-images/${avatarJson.path}`,
  )
  assert.equal(fx.storageObjects.get(`profile-images:${avatarJson.path}`).cacheControl, '3600')

  // 2. Tamaño > 3 MiB y Capa 1 inválida no consumen cuota ni WASM
  const fxLimits = await makeFixture()
  const oversized = new Uint8Array(3 * 1024 * 1024 + 1)
  assert.equal((await fxLimits.handler(makeUploadRequest({ bytes: oversized }))).status, 413)
  assert.equal((await fxLimits.handler(makeUploadRequest({ bytes: new TextEncoder().encode('<html></html>') }))).status, 400)
  assert.equal(fxLimits.getRateCalls(), 0)
  assert.equal(fxLimits.getDecodeCalls(), 0)

  // 3. Cuota agotada -> 429 ANTES de ejecutar Capa 2 WASM (protección CPU DoS)
  const fxQuota = await makeFixture({ rateLimited: true })
  assert.equal((await fxQuota.handler(makeUploadRequest({ bytes: validWebp }))).status, 429)
  assert.equal(fxQuota.getRateCalls(), 1)
  assert.equal(fxQuota.getDecodeCalls(), 0)

  // 4. Fallo de inserción en qrih_verified_uploads -> compensa borrando objeto en Storage y jamás filtra secretos
  const fxProofFail = await makeFixture({ provenanceError: true })
  const failRes = await fxProofFail.handler(makeUploadRequest({ bytes: validWebp }))
  assert.equal(failRes.status, 502)
  const failText = await failRes.text()
  assert.ok(!failText.includes(SERVICE_KEY), 'La respuesta jamás debe imprimir secretos')
  assert.equal(fxProofFail.storageObjects.size, 0, 'El objeto subido debe revertirse si falla qrih_verified_uploads')
  assert.equal(fxProofFail.verifiedRows.size, 0)
})

test('ingest-verified-media (Fase 2): rollback por operationId idempotente, preserva imágenes adjuntas y bloquea suplantación/expiración', async () => {
  const fx = await makeFixture()
  const validWebp = await makeWebp(100, 100)

  // Subir dos imágenes bajo OP_1 para USER_A
  const up1 = await (await fx.handler(makeUploadRequest({ bytes: validWebp, operationId: OP_1 }))).json()
  const up2 = await (await fx.handler(makeUploadRequest({ bytes: validWebp, operationId: OP_1 }))).json()
  assert.equal(fx.storageObjects.size, 2)
  assert.equal(fx.verifiedRows.size, 2)

  // Marcar up2 como ya adjunta en DB (simula respuesta RPC perdida que sí confirmó en Postgres)
  fx.attachedPaths.add(`property-images:${up2.path}`)

  // Suplantación / manipulación rechazada con 403 sin borrar nada
  assert.equal(
    (
      await fx.handler(
        makeRollbackRequest(
          { action: 'rollback', operationId: OP_1, bucket: 'property-images', items: [{ path: up1.path, rollbackToken: up1.rollbackToken }] },
          { token: TOKENS.userB },
        ),
      )
    ).status,
    403,
  )
  assert.equal(
    (
      await fx.handler(
        makeRollbackRequest({
          action: 'rollback',
          operationId: OP_2, // operationId distinto
          bucket: 'property-images',
          items: [{ path: up1.path, rollbackToken: up1.rollbackToken }],
        }),
      )
    ).status,
    403,
  )
  assert.equal(
    (
      await fx.handler(
        makeRollbackRequest({
          action: 'rollback',
          operationId: OP_1,
          bucket: 'profile-images', // bucket distinto
          items: [{ path: up1.path, rollbackToken: up1.rollbackToken }],
        }),
      )
    ).status,
    403,
  )
  assert.equal(
    (
      await fx.handler(
        makeRollbackRequest({
          action: 'rollback',
          operationId: OP_1,
          bucket: 'property-images',
          items: [{ path: up1.path, rollbackToken: `${up1.rollbackToken.slice(0, -4)}AAAA` }],
        }),
      )
    ).status,
    403,
  )
  assert.equal(fx.storageObjects.size, 2)

  // Rollback autorizado sobre up1 (huérfana) y up2 (adjunta)
  const rb1 = await fx.handler(
    makeRollbackRequest({
      action: 'rollback',
      operationId: OP_1,
      bucket: 'property-images',
      items: [
        { path: up1.path, rollbackToken: up1.rollbackToken },
        { path: up2.path, rollbackToken: up2.rollbackToken },
      ],
    }),
  )
  assert.equal(rb1.status, 200)
  const rb1Json = await rb1.json()
  assert.deepEqual(rb1Json.results, [
    { path: up1.path, status: 'deleted' },
    { path: up2.path, status: 'preserved_attached' },
  ])
  assert.equal(fx.storageObjects.has(`property-images:${up1.path}`), false)
  assert.equal(fx.verifiedRows.has(`property-images:${up1.path}`), false)
  assert.equal(fx.storageObjects.has(`property-images:${up2.path}`), true, 'Nunca borrar imagen ya adjunta')
  assert.equal(fx.verifiedRows.has(`property-images:${up2.path}`), true)

  // Reintento idempotente del mismo rollback
  const rbRetry = await fx.handler(
    makeRollbackRequest({
      action: 'rollback',
      operationId: OP_1,
      bucket: 'property-images',
      items: [{ path: up1.path, rollbackToken: up1.rollbackToken }],
    }),
  )
  assert.equal(rbRetry.status, 200)
  assert.deepEqual((await rbRetry.json()).results, [{ path: up1.path, status: 'already_absent' }])

  // Token expirado tras ventana de 15 min -> 403
  fx.setNow(new Date(Date.parse('2026-11-24T15:00:00.000Z') + (ROLLBACK_TTL_SECONDS + 5) * 1000))
  assert.equal(
    (
      await fx.handler(
        makeRollbackRequest({
          action: 'rollback',
          operationId: OP_1,
          bucket: 'property-images',
          items: [{ path: up2.path, rollbackToken: up2.rollbackToken }],
        }),
      )
    ).status,
    403,
  )
})
