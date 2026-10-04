import 'server-only'
import sharp from 'sharp'
import { createHash, randomUUID } from 'node:crypto'
import { createPrivilegedServerSupabaseClient } from './supabase-privileged-server'

export async function validateAndEncodeImage(file: File, avatar = false) {
  const max = avatar ? 5 * 1024 * 1024 : 20 * 1024 * 1024
  if (!file.size || file.size > max) throw new Error('Tamaño de imagen inválido.')
  const bytes = Buffer.from(await file.arrayBuffer())
  const image = sharp(bytes, { limitInputPixels: 40_000_000, failOn: 'warning', animated: false })
  const metadata = await image.metadata()
  const allowed = avatar ? ['jpeg', 'png', 'webp'] : ['webp']
  if (!metadata.format || !allowed.includes(metadata.format)
    || (metadata.pages || 1) > 1 || (!avatar && file.type !== 'image/webp')) {
    throw new Error('Formato real de imagen no permitido.')
  }
  // Decodificar completamente, retirar metadatos y guardar siempre WebP auténtico.
  const encoded = await image.rotate().webp({ quality: 85 }).toBuffer()
  if (encoded.length > max) throw new Error('Imagen demasiado grande.')
  return encoded
}

export async function uploadVerifiedImage(file: File, ownerId: string, bucket: 'property-images' | 'profile-images') {
  const admin = createPrivilegedServerSupabaseClient()
  const { data: allowed, error: limitError } = await admin.rpc('qrih_take_server_limit',
    { p_subject: ownerId, p_action: bucket === 'profile-images' ? 'avatar' : 'media' })
  if (limitError || !allowed) throw new Error('Límite de fotografías alcanzado. Intenta más tarde.')
  const bytes = await validateAndEncodeImage(file, bucket === 'profile-images')
  const path = `${ownerId}/${randomUUID()}.webp`
  const { error } = await admin.storage.from(bucket).upload(path, bytes,
    { contentType: 'image/webp', upsert: false, cacheControl: bucket === 'property-images' ? '0' : '3600' })
  if (error) throw new Error('No se pudo almacenar la imagen.')
  const publicUrl = bucket === 'profile-images' ? admin.storage.from(bucket).getPublicUrl(path).data.publicUrl : null
  const { error: proofError } = await admin.from('qrih_verified_uploads').insert({
    bucket_id: bucket, storage_path: path, owner_id: ownerId, mime_type: 'image/webp',
    byte_size: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), public_url: publicUrl,
  })
  if (proofError) {
    await admin.storage.from(bucket).remove([path])
    throw new Error('No se pudo verificar la pertenencia de la imagen.')
  }
  return { path, publicUrl }
}
