'use client'

import { ChangeEvent, useEffect, useRef, useState } from 'react'
import {
  MAX_PROPERTY_IMAGES,
  OptimizedImage,
  optimizeImage,
  validateImage,
} from '@/lib/image-optimizer'

type ImageUploaderProps = {
  onChange: (images: SelectedImage[]) => void
  maxImages?: number
}

export type SelectedImage = {
  file: File
  title: string
}

export function ImageUploader({
  onChange,
  maxImages = MAX_PROPERTY_IMAGES,
}: ImageUploaderProps) {
  const [images, setImages] = useState<OptimizedImage[]>([])
  const imagesRef = useRef<OptimizedImage[]>([])
  const [status, setStatus] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl))
    }
  }, [])

  function updateImages(nextImages: OptimizedImage[]) {
    imagesRef.current = nextImages
    setImages(nextImages)
    onChange(
      nextImages.map((image, index) => ({
        file: image.file,
        title: image.title || `Foto ${index + 1}`,
      }))
    )
  }

  async function handleSelection(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files || [])
    event.target.value = ''

    if (!selectedFiles.length) return

    const availableSlots = maxImages - images.length

    if (availableSlots <= 0) {
      setStatus(`Puedes seleccionar un máximo de ${maxImages} fotografías.`)
      return
    }

    const acceptedFiles = selectedFiles.slice(0, availableSlots)
    const errors = selectedFiles
      .slice(availableSlots)
      .map(() => `Solo se permiten ${maxImages} fotografías por propiedad.`)

    for (const file of acceptedFiles) {
      const error = validateImage(file)
      if (error) errors.push(`${file.name}: ${error}`)
    }

    const validFiles = acceptedFiles.filter((file) => !validateImage(file))

    if (!validFiles.length) {
      setStatus(errors.join(' '))
      return
    }

    setProcessing(true)
    setStatus('Optimizando imágenes…')
    const optimizedImages: OptimizedImage[] = []

    for (const file of validFiles) {
      try {
        optimizedImages.push(await optimizeImage(file))
      } catch (error) {
        errors.push(
          `${file.name}: ${error instanceof Error ? error.message : 'No fue posible optimizarla.'}`
        )
      }
    }

    setProcessing(false)

    if (optimizedImages.length) {
      updateImages([...images, ...optimizedImages])
      setStatus(
        errors.length
          ? `${optimizedImages.length} fotografía(s) lista(s). ${errors.join(' ')}`
          : `${images.length + optimizedImages.length} fotografía(s) lista(s) para subir.`
      )
      return
    }

    setStatus(errors.join(' ') || 'No fue posible optimizar las imágenes.')
  }

  function removeImage(index: number) {
    const image = images[index]
    URL.revokeObjectURL(image.previewUrl)
    const nextImages = images.filter((_, currentIndex) => currentIndex !== index)
    updateImages(nextImages)
    setStatus(
      nextImages.length
        ? `${nextImages.length} fotografía(s) lista(s) para subir.`
        : ''
    )
  }

  function updateTitle(index: number, title: string) {
    updateImages(
      images.map((image, currentIndex) =>
        currentIndex === index ? { ...image, title } : image
      )
    )
  }

  return (
    <div className="image-uploader">
      <label className="image-uploader__input">
        <span>Seleccionar fotografías</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={processing || images.length >= maxImages}
          onChange={handleSelection}
        />
      </label>

      <p className="image-uploader__help">Sube hasta {maxImages} fotografías</p>

      {status && <p className="image-uploader__status" aria-live="polite">{status}</p>}

      {images.length > 0 && (
        <div className="image-uploader__grid">
          {images.map((image, index) => {
            return (
              <article className="image-uploader__preview" key={image.previewUrl}>
                <img src={image.previewUrl} alt={`Fotografía seleccionada ${index + 1}`} />
                <div>
                  <strong>Foto {index + 1}</strong>
                  <input
                    type="text"
                    value={image.title || ''}
                    maxLength={120}
                    placeholder={`Título de la foto ${index + 1}`}
                    aria-label={`Título de la foto ${index + 1}`}
                    onChange={(event) => updateTitle(index, event.target.value)}
                  />
                </div>
                <button type="button" onClick={() => removeImage(index)}>
                  Quitar
                </button>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
