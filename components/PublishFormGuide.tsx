'use client'

import { useEffect, useRef, useState } from 'react'
import {
  readFormSnapshot,
  readiness,
  sectionStates,
  summaryRows,
  type FormSnapshot,
} from '@/lib/publish-form-guide'

const EMPTY: FormSnapshot = { values: {}, invalid: [] }

/**
 * Observes the surrounding <form> without touching it: no props on its controls, no handlers
 * on the form element. Draft restoration sets values programmatically (no events), so a light
 * poll complements the input/change listeners.
 */
function useFormSnapshot(anchor: { current: HTMLElement | null }) {
  const [snapshot, setSnapshot] = useState<FormSnapshot>(EMPTY)
  useEffect(() => {
    const form = anchor.current?.closest('form')
    if (!form) return
    let frame = 0
    let last = ''
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = readFormSnapshot(form)
        const key = JSON.stringify(next)
        if (key !== last) { last = key; setSnapshot(next) }
      })
    }
    update()
    form.addEventListener('input', update)
    form.addEventListener('change', update)
    const timer = window.setInterval(() => { if (!document.hidden) update() }, 1500)
    return () => {
      cancelAnimationFrame(frame)
      window.clearInterval(timer)
      form.removeEventListener('input', update)
      form.removeEventListener('change', update)
    }
  }, [anchor])
  return snapshot
}

export function PublishSummary({ imageCount }: { imageCount: number }) {
  const anchor = useRef<HTMLElement>(null)
  const snapshot = useFormSnapshot(anchor)
  const states = sectionStates(snapshot, imageCount)
  const rows = summaryRows(snapshot, imageCount)
  const status = readiness(states)
  const pending = states.filter((state) => state.state === 'pending')

  return (
    <section ref={anchor} className="publish-summary" aria-labelledby="publish-summary-title" data-ready={status}>
      <h3 id="publish-summary-title">Revisa antes de enviar</h3>
      <p className="publish-summary__status">
        {status === 'ready' && 'Todo listo: puedes enviar a revisión o guardar un borrador.'}
        {status === 'draft-only' && 'Puedes guardar un borrador. Para enviar a revisión agrega al menos una fotografía.'}
        {status === 'incomplete' && 'Faltan datos obligatorios. Complétalos para guardar o enviar.'}
      </p>
      <dl className="publish-summary__rows">
        {rows.map((row) => (
          <div key={row.label} data-missing={row.missing || undefined}>
            <dt>{row.label}</dt>
            <dd>{row.value || 'Falta por completar'}</dd>
          </div>
        ))}
      </dl>
      {pending.length > 0 && (
        <div className="publish-summary__missing">
          <strong>Pendiente</strong>
          <ul>
            {pending.map((state) => (
              <li key={state.id}>
                <a href={`#${state.id}`}>{state.label}</a>: {state.missing.join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="ui-help">La dirección y los datos privados del propietario no aparecen en este resumen.</p>
    </section>
  )
}
