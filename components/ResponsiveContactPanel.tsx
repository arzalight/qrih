'use client'

import { useId, useRef, useState, type ReactNode } from 'react'

// A single mounted form: collapsing must not clear fields or restored contact state.
export function ResponsiveContactPanel({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false)
  const contentId = useId()
  const trigger = useRef<HTMLButtonElement>(null)
  return <section className="ui-panel property-contact" onKeyDown={event => {
    if (event.key === 'Escape' && expanded) {
      setExpanded(false)
      trigger.current?.focus()
    }
  }}>
    <h2 className="property-contact__heading">Solicitar información</h2>
    <button ref={trigger} type="button" className="property-contact__trigger"
      aria-expanded={expanded} aria-controls={contentId} onClick={() => setExpanded(value => !value)}>
      Solicitar información <span aria-hidden="true">{expanded ? '−' : '+'}</span>
    </button>
    <div id={contentId} className="property-contact__body" data-expanded={expanded}>
      {children}
    </div>
  </section>
}
