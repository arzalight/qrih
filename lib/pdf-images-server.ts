import 'server-only'
import sharp from 'sharp'
import { limitedBody } from './request-security'

// react-pdf/image instalado admite PNG/JPEG, no WebP. Conversión efímera:
// el original en Storage permanece WebP y nada nuevo se persiste en BD.
export async function encodePdfImage(bytes: Uint8Array) {
  const image = sharp(bytes,{limitInputPixels:40_000_000,failOn:'warning',animated:false})
  const metadata = await image.metadata()
  if (metadata.format !== 'webp' || (metadata.pages || 1)>1) throw new Error('Fotografía inválida para PDF.')
  return image.rotate().resize({width:1920,height:1920,fit:'inside',withoutEnlargement:true}).jpeg({quality:85}).toBuffer()
}
export async function preparePdfImages(urls: string[]) {
  const origin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin
  const images: string[] = []
  // Secuencial para acotar memoria en el proceso serverless.
  for (const value of urls) {
    const url = new URL(value)
    if (url.origin !== origin || url.username || url.password
      || !url.pathname.startsWith('/storage/v1/object/sign/property-images/')) throw new Error('Origen de imagen no permitido.')
    const response = await fetch(url,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(8000)})
    if (!response.ok) throw new Error('No se pudo obtener una fotografía autorizada.')
    const bytes = await limitedBody(response,20*1024*1024)
    const jpeg = await encodePdfImage(bytes)
    images.push('data:image/jpeg;base64,'+jpeg.toString('base64'))
  }
  return images
}
