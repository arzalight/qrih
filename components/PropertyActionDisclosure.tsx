'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

// Presentation only: existing actions keep their own authorization and handlers.
export function PropertyActionDisclosure({ id, title, primary, children }: {
  id: string; title: string; primary: ReactNode; children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const region = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !region.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])
  return <div ref={region} className="own-property-actions" onKeyDown={event => {
    if (event.key === 'Escape' && open) {
      event.stopPropagation()
      setOpen(false)
      trigger.current?.focus()
    }
  }}>
    <div className="own-property-actions__bar">
      {primary}
      <button ref={trigger} type="button" className="own-property-more-trigger"
        aria-expanded={open} aria-controls={`property-actions-${id}`} aria-label={`Más acciones para ${title}`} title="Más acciones"
        onClick={() => setOpen(value => !value)}>
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
        </svg>
      </button>
    </div>
    <div id={`property-actions-${id}`} className="own-property-actions__extra" hidden={!open}>
      {children}
    </div>
  </div>
}
