'use client'

import { useEffect, useRef, useState } from 'react'
import {
  PUBLISH_SECTIONS,
  readFormSnapshot,
  readiness,
  sectionStates,
  summaryRows,
  type FormSnapshot,
  type PublishSection,
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

/** both: guardar borrador y enviar; draft: solo borrador; send: solo enviar a revisión. */
type SummaryActions = 'both' | 'draft' | 'send'

function statusText(status: ReturnType<typeof readiness>, actions: SummaryActions) {
  if (status === 'incomplete') return 'Faltan datos obligatorios. Complétalos para guardar o enviar.'
  if (status === 'ready') {
    if (actions === 'draft') return 'Todo listo: puedes guardar el borrador.'
    if (actions === 'send') return 'Todo listo: puedes reenviar a revisión.'
    return 'Todo listo: puedes enviar a revisión o guardar un borrador.'
  }
  if (actions === 'draft') return 'Puedes guardar el borrador sin fotografías.'
  if (actions === 'send') return 'Para reenviar a revisión agrega al menos una fotografía.'
  return 'Puedes guardar un borrador. Para enviar a revisión agrega al menos una fotografía.'
}

export function PublishSummary({
  imageCount,
  sections = PUBLISH_SECTIONS,
  actions = 'both',
}: {
  imageCount: number
  sections?: readonly PublishSection[]
  actions?: SummaryActions
}) {
  const anchor = useRef<HTMLElement>(null)
  const snapshot = useFormSnapshot(anchor)
  const states = sectionStates(snapshot, imageCount, sections)
  const rows = summaryRows(snapshot, imageCount)
  const status = readiness(states)
  const pending = states.filter((state) => state.state === 'pending')

  return (
    <section ref={anchor} className="publish-summary" aria-labelledby="publish-summary-title" data-ready={status}>
      <h3 id="publish-summary-title">{actions === 'draft' ? 'Revisa antes de guardar' : 'Revisa antes de enviar'}</h3>
      <p className="publish-summary__status">{statusText(status, actions)}</p>
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
