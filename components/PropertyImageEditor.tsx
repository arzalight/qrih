'use client'

import { useEffect, useRef, useState } from 'react'
import {
  MAX_PROPERTY_IMAGES,
  optimizeImage,
  validateImage,
} from '@/lib/image-optimizer'

export type ExistingPropertyImage = {
  storagePath: string
  url: string
  title: string
  position: number
}

export type PropertyImageEditorItem =
  | {
      kind: 'existing'
      id: string
      storagePath: string
      url: string
      title: string
    }
  | {
      kind: 'new'
      id: string
      file: File
      url: string
      title: string
    }

type PropertyImageEditorProps = {
  initialImages: ExistingPropertyImage[]
  onChange: (images: PropertyImageEditorItem[]) => void
  maxImages?: number
}

export function PropertyImageEditor({
  initialImages,
  onChange,
  maxImages = MAX_PROPERTY_IMAGES,
}: PropertyImageEditorProps) {
  const initialItems: PropertyImageEditorItem[] = initialImages
    .sort((a, b) => a.position - b.position)
    .map((image) => ({
      kind: 'existing',
      id: `existing-${image.storagePath}`,
      storagePath: image.storagePath,
      url: image.url,
      title: image.title,
    }))

  const [images, setImages] = useState<PropertyImageEditorItem[]>(initialItems)
  const [status, setStatus] = useState('')
  const [processing, setProcessing] = useState(false)
  const imagesRef = useRef<PropertyImageEditorItem[]>(initialItems)
  const selectionInFlight = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    imagesRef.current = images
    onChange(images)
  }, [images, onChange])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      imagesRef.current.forEach((image) => {
        if (image.kind === 'new') {
          URL.revokeObjectURL(image.url)
        }
      })
    }
  }, [])

  function updateImages(nextImages: PropertyImageEditorItem[]) {
    imagesRef.current = nextImages
    setImages(nextImages)
  }

  async function handleSelection(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFiles = Array.from(event.target.files || [])
    event.target.value = ''

    if (!selectedFiles.length || selectionInFlight.current || !mountedRef.current) return

    const availableSlots = maxImages - imagesRef.current.length

    if (availableSlots <= 0) {
      setStatus(
        `Puedes tener un máximo de ${maxImages} fotografías por propiedad.`
      )
      return
    }

    const acceptedFiles = selectedFiles.slice(0, availableSlots)
    const errors: string[] = []

    for (const file of acceptedFiles) {
      const error = validateImage(file)

      if (error) {
        errors.push(`${file.name}: ${error}`)
      }
    }

    const validFiles = acceptedFiles.filter(
      (file) => !validateImage(file)
    )

    if (!validFiles.length) {
      setStatus(
        errors.join(' ') || 'No fue posible procesar las fotografías.'
      )
      return
    }

    selectionInFlight.current = true
    setProcessing(true)
    setStatus('Optimizando imágenes…')

    const optimizedItems: PropertyImageEditorItem[] = []

    for (const file of validFiles) {
      try {
        const optimized = await optimizeImage(file)
        if (!mountedRef.current) {
          URL.revokeObjectURL(optimized.previewUrl)
          break
        }

        optimizedItems.push({
          kind: 'new',
          id: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file: optimized.file,
          url: optimized.previewUrl,
          title: '',
        })
      } catch (error) {
        errors.push(
          `${file.name}: ${
            error instanceof Error
              ? error.message
              : 'No fue posible optimizarla.'
          }`
        )
      }
    }

    selectionInFlight.current = false
    if (!mountedRef.current) {
      optimizedItems.forEach(image => URL.revokeObjectURL(image.url))
      return
    }
    setProcessing(false)

    // Reconciliar contra el estado actual, no contra images previo al await.
    const currentImages = imagesRef.current
    const retained = optimizedItems.slice(0, Math.max(0, maxImages - currentImages.length))
    optimizedItems.slice(retained.length).forEach(image => URL.revokeObjectURL(image.url))

    if (retained.length) {
      updateImages([...currentImages, ...retained])

      const total = currentImages.length + retained.length

      setStatus(
        errors.length
          ? `${retained.length} fotografía(s) lista(s). ${errors.join(' ')}`
          : `${total} fotografía(s) listas.`
      )

      return
    }

    setStatus(
      errors.join(' ') || 'No fue posible optimizar las imágenes.'
    )
  }

  function removeImage(index: number) {
    const image = images[index]

    if (image?.kind === 'new') {
      URL.revokeObjectURL(image.url)
    }

    const nextImages = images.filter((_, imageIndex) => imageIndex !== index)

    updateImages(nextImages)
    setStatus(
      nextImages.length
        ? 'Fotografía eliminada de la galería.'
        : 'La propiedad no tiene fotografías.'
    )
  }

  function updateTitle(index: number, title: string) {
    updateImages(
      images.map((image, imageIndex) =>
        imageIndex === index
          ? {
              ...image,
              title,
            }
          : image
      )
    )
  }

  function moveImage(index: number, direction: -1 | 1) {
    const targetIndex = index + direction

    if (targetIndex < 0 || targetIndex >= images.length) {
      return
    }

    const nextImages = [...images]
    const [movedImage] = nextImages.splice(index, 1)

    nextImages.splice(targetIndex, 0, movedImage)
    updateImages(nextImages)
  }

  return (
    <div className="property-image-editor">
      <label className="image-uploader__input">
        <span>
          {processing
            ? 'Procesando fotografías…'
            : 'Agregar fotografías'}
        </span>

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={processing || images.length >= maxImages}
          onChange={handleSelection}
        />
      </label>

      <p
        style={{
          margin: '8px 0 14px',
          fontSize: 13,
          color: '#666',
        }}
      >
        Puedes conservar, quitar y agregar fotografías. La primera será la
        fotografía principal.
      </p>

      {status && (
        <p
          style={{
            margin: '0 0 16px',
            fontSize: 13,
            color: '#555',
          }}
        >
          {status}
        </p>
      )}

      {images.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 14,
          }}
        >
          {images.map((image, index) => (
            <div
              key={image.id}
              style={{
                minWidth: 0,
                border: '1px solid #ddd',
                borderRadius: 12,
                overflow: 'hidden',
                background: '#fff',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  aspectRatio: '4 / 3',
                  background: '#f3f4f6',
                }}
              >
                <img
                  src={image.url}
                  alt={image.title || `Fotografía ${index + 1}`}
                  style={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />

                {index === 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      padding: '5px 8px',
                      borderRadius: 6,
                      background: 'rgba(16, 34, 45, 0.88)',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Principal
                  </span>
                )}
              </div>

              <div style={{ padding: 10 }}>
                <label className="ui-field">Título de la fotografía {index + 1}<input
                  value={image.title}
                  onChange={(event) =>
                    updateTitle(index, event.target.value)
                  }
                  maxLength={120}
                  placeholder={`Título de la foto ${index + 1}`}
                  style={{
                    width: '100%',
                    margin: 0,
                  }}
                /></label>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6,
                    marginTop: 8,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => moveImage(index, -1)}
                    disabled={index === 0}
                    style={{
                      flex: 1,
                      minWidth: 70,
                    }}
                  >
                    ← Mover
                  </button>

                  <button
                    type="button"
                    onClick={() => moveImage(index, 1)}
                    disabled={index === images.length - 1}
                    style={{
                      flex: 1,
                      minWidth: 70,
                    }}
                  >
                    Mover →
                  </button>

                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    style={{
                      width: '100%',
                      color: '#b91c1c',
                    }}
                  >
                    Quitar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
