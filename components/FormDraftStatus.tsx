'use client'

export function FormDraftStatus({ notice, disabled, onDiscard, kind }: {
  notice: string
  disabled: boolean
  onDiscard: () => Promise<void>
  kind: 'property' | 'demand'
}) {
  return <aside className="form-draft-status" aria-label="Borrador en este dispositivo">
    <p role="status" aria-live="polite">{notice || 'Tu avance comercial se guarda en este dispositivo hasta 7 días.'}</p>
    <details>
      <summary>Opciones del borrador</summary>
      <p>{kind === 'property' ? 'La dirección y los datos privados del propietario no se guardan en el borrador local.' : 'Tu nombre, teléfono, correo y datos privados de contacto no se guardan en el borrador local.'} Mantén esta pestaña abierta para conservarlos. En equipos compartidos, descarta el borrador al terminar.</p>
      <button className="button--danger" type="button" disabled={disabled} onClick={() => void onDiscard()}>Descartar borrador local</button>
    </details>
  </aside>
}
