'use client'

import { useEffect, useState } from 'react'

export type GalleryImage = {
  url: string
  title?: string | null
}

export function PropertyImageGallery({
  images,
  propertyTitle,
  variant = 'public',
}: {
  images: GalleryImage[]
  propertyTitle: string
  variant?: 'public' | 'admin'
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const total = images.length

  useEffect(() => {
    if (activeIndex === null) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setActiveIndex(null)
      if (event.key === 'ArrowRight') {
        setActiveIndex((current) => current === null ? null : (current + 1) % total)
      }
      if (event.key === 'ArrowLeft') {
        setActiveIndex((current) => current === null ? null : (current - 1 + total) % total)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeIndex, total])

  if (!total) return null

  const activeImage = activeIndex === null ? null : images[activeIndex]
  const description = (image: GalleryImage, index: number) =>
    image.title || `${propertyTitle} — fotografía ${index + 1}`

  return (
    <>
      <div className={`property-gallery property-gallery--${variant}`}>
        {images.map((image, index) => (
          <button
            type="button"
            className="property-gallery__image-button"
            key={image.url}
            onClick={() => setActiveIndex(index)}
            aria-label={`Ampliar ${description(image, index)}`}
          >
            <img src={image.url} alt={description(image, index)} />
            {index === 0 && <span className="property-gallery__main-label">Principal</span>}
            {variant === 'admin' && (
              <span className="property-gallery__caption">{image.title || `Foto ${index + 1}`}</span>
            )}
          </button>
        ))}
      </div>

      {activeImage && activeIndex !== null && (
        <div
          className="image-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Visor de fotografías de ${propertyTitle}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActiveIndex(null)
          }}
        >
          <button
            type="button"
            className="image-lightbox__close"
            onClick={() => setActiveIndex(null)}
            aria-label="Cerrar visualizador"
          >
            ×
          </button>

          {total > 1 && (
            <button
              type="button"
              className="image-lightbox__previous"
              onClick={() => setActiveIndex((activeIndex - 1 + total) % total)}
              aria-label="Fotografía anterior"
            >
              ‹
            </button>
          )}

          <figure className="image-lightbox__content">
            <img src={activeImage.url} alt={description(activeImage, activeIndex)} />
            <figcaption>
              <span>{activeImage.title || `Foto ${activeIndex + 1}`}</span>
              {total > 1 && <small>{activeIndex + 1} de {total}</small>}
            </figcaption>
          </figure>

          {total > 1 && (
            <button
              type="button"
              className="image-lightbox__next"
              onClick={() => setActiveIndex((activeIndex + 1) % total)}
              aria-label="Siguiente fotografía"
            >
              ›
            </button>
          )}
        </div>
      )}
    </>
  )
}
