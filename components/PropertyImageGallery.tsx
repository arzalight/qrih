'use client'

import { useEffect, useRef, useState } from 'react'
import { gallerySwipeIndex } from '@/lib/gallery-swipe'

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
  const [mobileIndex, setMobileIndex] = useState(0)
  const touch = useRef<{ x: number; y: number } | null>(null)
  function startTouch(event: React.TouchEvent) {
    touch.current = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null
  }
  function endTouch(event: React.TouchEvent, lightbox = false) {
    const start = touch.current
    touch.current = null
    const end = event.changedTouches[0]
    if (!start || !end) return
    if (lightbox) setActiveIndex(current => current === null ? null : gallerySwipeIndex(current, total, end.clientX - start.x, end.clientY - start.y))
    else setMobileIndex(current => gallerySwipeIndex(current, total, end.clientX - start.x, end.clientY - start.y))
  }
  const dialog = useRef<HTMLDialogElement>(null)
  const total = images.length
  const isOpen = activeIndex !== null

  useEffect(() => {
    if (!isOpen || !dialog.current) return
    const activeDialog = dialog.current
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    activeDialog.showModal()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Tab') {
        const buttons = activeDialog.querySelectorAll<HTMLButtonElement>('button:not([disabled])')
        const first = buttons[0]
        const last = buttons[buttons.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        setActiveIndex((current) => current === null ? null : (current + 1) % total)
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setActiveIndex((current) => current === null ? null : (current - 1 + total) % total)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      if (activeDialog.open) activeDialog.close()
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [isOpen, total])

  if (!total) return null

  const activeImage = activeIndex === null ? null : images[activeIndex]
  const description = (image: GalleryImage, index: number) =>
    image.title || `${propertyTitle} — fotografía ${index + 1}`

  return (
    <>
      <div className={`property-gallery property-gallery--${variant}`}
        onTouchStart={startTouch} onTouchEnd={event => endTouch(event)} onTouchCancel={() => { touch.current = null }}>
        {images.map((image, index) => (
          <button
            type="button"
            className="property-gallery__image-button"
            key={image.url}
            data-mobile-active={index === Math.min(mobileIndex, total - 1)}
            onClick={() => setActiveIndex(index)}
            aria-label={`Ampliar ${description(image, index)}`}
          >
            <img src={image.url} alt={description(image, index)} loading={index === 0 ? 'eager' : 'lazy'} decoding="async" width={1200} height={800} />
            {index === 0 && <span className="property-gallery__main-label">Principal</span>}
            {variant === 'admin' && (
              <span className="property-gallery__caption">{image.title || `Foto ${index + 1}`}</span>
            )}
          </button>
        ))}
      </div>
      {total > 1 && <div className="property-gallery__mobile-controls">
        <button type="button" disabled={mobileIndex <= 0} onClick={() => setMobileIndex(index => Math.max(0, index - 1))} aria-label="Foto anterior en galería">‹</button>
        <span aria-live="polite">{Math.min(mobileIndex + 1, total)} de {total}</span>
        <button type="button" disabled={mobileIndex >= total - 1} onClick={() => setMobileIndex(index => Math.min(total - 1, index + 1))} aria-label="Foto siguiente en galería">›</button>
      </div>}

      {activeImage && activeIndex !== null && (
        <dialog
          ref={dialog}
          className="image-lightbox"
          aria-modal="true"
          aria-label={`Visor de fotografías de ${propertyTitle}`}
          onCancel={() => setActiveIndex(null)}
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

          <figure className="image-lightbox__content" onTouchStart={startTouch}
            onTouchEnd={event => endTouch(event, true)} onTouchCancel={() => { touch.current = null }}>
            <img src={activeImage.url} alt={description(activeImage, activeIndex)} />
            <figcaption aria-live="polite">
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
        </dialog>
      )}
    </>
  )
}
