import type { ReactNode } from 'react'

/** Presentation only: the existing control retains its name, value and validation. */
export function FormField({ id, label, required = false, children }: {
  id: string
  label: string
  required?: boolean
  children: ReactNode
}) {
  return <div className="ui-field">
    <label htmlFor={id}>{label}{required && <span className="ui-required"> · obligatorio</span>}</label>
    {children}
  </div>
}
