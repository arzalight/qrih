// Edge Function: ingest-verified-media (LOCAL — Etapa 6; NO desplegada sin autorización expresa).
// @ts-nocheck — Entorno Deno Edge Runtime de Supabase.
import { createClient } from 'npm:@supabase/supabase-js@2'
import decodeWebp, { init as initWebpDecoder } from 'npm:@jsquash/webp@1.5.0/decode.js'
import {
  createIngestVerifiedMediaHandler,
  type MediaBucket,
  type VerifiedUploadRecord,
} from './core.ts'

// Certificado en Etapa 5: Deno Edge Runtime no expone globalThis.ImageData.
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

let wasmInitPromise = null

async function ensureWebpDecoderReady() {
  if (!wasmInitPromise) {
    wasmInitPromise = (async () => {
      const wasmUrl = new URL(
        import.meta.resolve('npm:@jsquash/webp@1.5.0/codec/dec/webp_dec.wasm'),
      )
      const wasmBytes = await Deno.readFile(wasmUrl)
      const wasmModule = await WebAssembly.compile(wasmBytes)
      await initWebpDecoder(wasmModule)
    })().catch((error) => {
      wasmInitPromise = null
      throw error
    })
  }
  await wasmInitPromise
}

async function decodeWebpWithWasm(bytes: Uint8Array) {
  await ensureWebpDecoderReady()
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  const imageData = await decodeWebp(copy.buffer)
  return {
    width: imageData.width,
    height: imageData.height,
    data: imageData.data,
  }
}

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
const rollbackSecret = Deno.env.get('QRIH_ROLLBACK_SECRET') ?? ''
const allowedOrigins = (Deno.env.get('QRIH_ALLOWED_ORIGINS') ?? 'https://qrih-staging.netlify.app')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)

if (!supabaseUrl || !actorPublicKey || expectedPublicKeys.length === 0 || !serviceRoleKey) {
  throw new Error('QRIH_INGEST_MEDIA_MISCONFIGURED')
}

const handler = createIngestVerifiedMediaHandler({
  supabaseUrl,
  expectedPublicKey: actorPublicKey,
  expectedPublicKeys,
  serviceRoleKey,
  ...(rollbackSecret ? { rollbackSecret } : {}),
  allowedOrigins,
  decodeWebp: decodeWebpWithWasm,
  createActorClient: (bearerToken) => {
    const client = createClient(supabaseUrl, actorPublicKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${bearerToken}` } },
    })
    return {
      auth: {
        getUser: (jwt) => client.auth.getUser(jwt),
      },
      async getAccountStatus(userId: string) {
        const { data, error } = await client
          .from('profiles')
          .select('account_status')
          .eq('id', userId)
          .single()
        return { status: data?.account_status ?? null, error }
      },
    }
  },
  createServiceClient: () => {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
    return {
      async takeRateLimit(subject: string, action: 'media' | 'avatar') {
        const { data, error } = await admin.rpc('qrih_take_server_limit', {
          p_subject: subject,
          p_action: action,
        })
        return { allowed: Boolean(data), error }
      },
      async uploadObject(bucket: MediaBucket, path: string, bytes: Uint8Array, cacheControl: string) {
        const { error } = await admin.storage.from(bucket).upload(path, bytes, {
          contentType: 'image/webp',
          upsert: false,
          cacheControl,
        })
        return { error }
      },
      async removeObjects(bucket: MediaBucket, paths: string[]) {
        const { error } = await admin.storage.from(bucket).remove(paths)
        return { error }
      },
      getPublicUrl(bucket: MediaBucket, path: string) {
        return admin.storage.from(bucket).getPublicUrl(path).data.publicUrl
      },
      async insertVerifiedUpload(record: VerifiedUploadRecord) {
        const { error } = await admin.from('qrih_verified_uploads').insert(record)
        return { error }
      },
      async deleteVerifiedUpload(bucket: MediaBucket, path: string, ownerId: string) {
        const { data, error } = await admin
          .from('qrih_verified_uploads')
          .delete()
          .eq('bucket_id', bucket)
          .eq('storage_path', path)
          .eq('owner_id', ownerId)
          .select('storage_path')
        return { deleted: Array.isArray(data) && data.length > 0, error }
      },
      async isPathAttached(bucket: MediaBucket, path: string, ownerId: string) {
        if (bucket === 'property-images') {
          const [imgRes, propRes] = await Promise.all([
            admin.from('property_images').select('storage_path').eq('storage_path', path).limit(1),
            admin.from('properties').select('id').eq('main_image_path', path).limit(1),
          ])
          if (imgRes.error || propRes.error) {
            return { attached: true, error: imgRes.error ?? propRes.error }
          }
          return {
            attached: Boolean(imgRes.data?.length || propRes.data?.length),
            error: null,
          }
        }
        const { data, error } = await admin
          .from('profiles')
          .select('avatar_url')
          .eq('id', ownerId)
          .single()
        if (error) return { attached: true, error }
        const suffix = `/storage/v1/object/public/profile-images/${path}`
        const attached = typeof data?.avatar_url === 'string' && data.avatar_url.endsWith(suffix)
        return { attached, error: null }
      },
    }
  },
})

Deno.serve(handler)
