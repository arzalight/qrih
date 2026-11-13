'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

export function DeferredAuthNotice({ open, onClose, path, memoryOnly, preserveMemory = false }: {
  open: boolean; onClose: () => void; path: '/publicar' | '/busco-bodega'; memoryOnly: boolean; preserveMemory?: boolean
}) {
  const separateTab = memoryOnly || preserveMemory
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (open) dialog.current?.showModal()
    else dialog.current?.close()
  }, [open])
  return <dialog ref={dialog} onCancel={onClose} onClose={onClose} className="deferred-auth" aria-labelledby="deferred-auth-title">
    <h2 id="deferred-auth-title">¡Tu publicación está lista!</h2>
    <p>Solo necesitas iniciar sesión o crear una cuenta para enviarla a revisión. Conservaremos la información que capturaste.</p>
    {preserveMemory && <p>El acceso se abre en otra pestaña. Vuelve a ésta para conservar la dirección y los datos de contacto o propietarios. Esos datos no se guardan en el navegador; después de una recarga tendrás que completarlos de nuevo.</p>}
    <p>{memoryOnly ? 'El guardado local está limitado. El acceso se abrirá en otra pestaña: conserva esta abierta y vuelve aquí para enviar.'
      : 'El borrador y las fotografías se conservan hasta 7 días en este navegador y dispositivo. Al volver, revisa y confirma el envío.'}</p>
    <div className="deferred-auth__actions">
      <Link className="button" prefetch={false} href={`/login?next=${encodeURIComponent(path)}`} target={separateTab ? '_blank' : undefined} rel={separateTab ? 'noopener' : undefined}>Iniciar sesión</Link>
      <Link className="button" prefetch={false} href={`/registro?next=${encodeURIComponent(path)}`} target={separateTab ? '_blank' : undefined} rel={separateTab ? 'noopener' : undefined}>Crear cuenta</Link>
      <button type="button" onClick={onClose}>Seguir editando</button>
    </div>
  </dialog>
}
