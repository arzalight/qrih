export const MAX_PROPERTY_IMAGES = 7
export const MAX_ORIGINAL_IMAGE_SIZE = 20 * 1024 * 1024

const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

export type OptimizedImage = {
  file: File
  previewUrl: string
  title: string
  originalSize: number
  optimizedSize: number
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No fue posible leer esta imagen.'))
    }
    image.src = url
  })
}

export function validateImage(file: File) {
  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    return 'Selecciona imágenes JPG, PNG o WebP. HEIC todavía no es compatible en todos los navegadores.'
  }

  if (file.size > MAX_ORIGINAL_IMAGE_SIZE) {
    return 'Cada imagen debe pesar como máximo 20 MB antes de optimizarse.'
  }

  return null
}

export async function optimizeImage(file: File): Promise<OptimizedImage> {
  const validationError = validateImage(file)

  if (validationError) {
    throw new Error(validationError)
  }

  const image = await loadImage(file)
  const longestSide = Math.max(image.naturalWidth, image.naturalHeight)
  const scale = longestSide > 1920 ? 1920 / longestSide : 1
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement('canvas')

  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Tu navegador no pudo preparar la imagen.')
  }

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, 0, 0, width, height)

  let blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/webp', 0.8)
  })

  if (!blob) {
    throw new Error('No fue posible convertir la imagen a WebP.')
  }
  // Safari puede devolver PNG al solicitar WebP. Nunca falsear el MIME:
  // transportar JPEG optimizado y dejar la conversión final WebP al servidor.
  if (blob.type !== 'image/webp') {
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.8)
    })
    if (!blob || blob.type !== 'image/jpeg') {
      throw new Error('Tu navegador no pudo preparar un formato de imagen compatible.')
    }
  }
  // Originales de hasta 20 MB siguen permitidos; el transporte servidor/Netlify
  // requiere una imagen optimizada menor. No acumular las siete en un request.
  if (blob.size > 3 * 1024 * 1024) throw new Error('La imagen optimizada sigue siendo demasiado grande. Usa una fotografía de menor resolución.')

  const safeBaseName = file.name
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'propiedad'

  const extension = blob.type === 'image/webp' ? 'webp' : 'jpg'
  const optimizedFile = new File([blob], `${safeBaseName}.${extension}`, {
    type: blob.type,
    lastModified: Date.now(),
  })

  return {
    file: optimizedFile,
    previewUrl: URL.createObjectURL(optimizedFile),
    title: '',
    originalSize: file.size,
    optimizedSize: optimizedFile.size,
  }
}
