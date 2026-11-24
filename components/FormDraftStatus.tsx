'use client'

export function FormDraftStatus({ notice, disabled, onDiscard, kind }: {
  notice: string
  disabled: boolean
  onDiscard: () => Promise<void>
  kind: 'property' | 'demand'
}) {
  if (!notice) return null
  return <aside className="form-draft-status demand-draft-bar" aria-label="Borrador en este dispositivo">
    <p className="notice" role="status" aria-live="polite">{notice}</p>
    <details>
      <summary>Opciones del borrador</summary>
      <p>{kind === 'property' ? 'La dirección y los datos privados del propietario no se guardan en el borrador local.' : 'Tu nombre, teléfono, correo y datos privados de contacto no se guardan en el borrador local.'} Mantén esta pestaña abierta para conservarlos. En equipos compartidos, descarta el borrador al terminar.</p>
      <button className="button button--secondary demand-draft-discard" type="button" disabled={disabled} onClick={() => void onDiscard()}>Descartar borrador local</button>
    </details>
  </aside>
}
