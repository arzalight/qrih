'use client'

import { useEffect, useRef, useState } from 'react'
import { cacheFormDraftText, clearFormDraft, loadFormDraft, readDraftFields, restoreDraftFields, saveFormDraft, type DraftKind, type FormDraft } from '@/lib/form-draft'
import type { SelectedImage } from './ImageUploader'

export function useFormDraft(kind: DraftKind, restore: (draft: FormDraft) => void) {
  const formRef = useRef<HTMLFormElement>(null)
  const draftRef = useRef<FormDraft | null>(null)
  const restoreRef = useRef(restore)
  restoreRef.current = restore
  const imagesRef = useRef<SelectedImage[]>([])
  const queue = useRef(Promise.resolve())
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const discardBusy = useRef(false)
  const [discarding, setDiscarding] = useState(false)
  const [ready, setReady] = useState(false)
  const [notice, setNotice] = useState('')
  const [authOpen, setAuthOpen] = useState(false)
  const [memoryOnly, setMemoryOnly] = useState(false)
  const [imageCount, setImageCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    void loadFormDraft(kind).then(draft => {
      if (cancelled) return
      draftRef.current = draft || { version: 1, id: crypto.randomUUID(), updatedAt: Date.now(), fields: {}, images: [], imageCount: 0, intent: null }
      if (draft) {
        imagesRef.current = draft.images
        setImageCount(draft.imageCount)
        restoreRef.current(draft)
        setNotice(draft.imageCount > draft.images.length ? 'Recuperamos los datos, pero debes seleccionar de nuevo las fotografías. Revisa todo antes de enviar.' : draft.intent ? 'Recuperamos tu publicación. Revisa los datos y confirma el envío con tu cuenta.' : 'Borrador recuperado en este navegador.')
      }
      setReady(true)
    })
    return () => { cancelled = true; if (timer.current) clearTimeout(timer.current) }
  }, [kind])

  // Controlled zone/operation options must render before restoring DOM values.
  useEffect(() => {
    if (ready && draftRef.current && formRef.current) restoreDraftFields(formRef.current, draftRef.current.fields, kind)
  }, [ready])

  async function persist(intent = draftRef.current?.intent || null) {
    if (!formRef.current || !draftRef.current) return false
    if (timer.current) clearTimeout(timer.current)
    const snapshot = { ...draftRef.current, revision: (draftRef.current.revision || 0) + 1, updatedAt: Date.now(), fields: readDraftFields(formRef.current, kind),
      images: imagesRef.current, intent }
    draftRef.current = snapshot
    let safe = false
    queue.current = queue.current.then(async () => {
      const result = await saveFormDraft(kind, snapshot)
      safe = result.textSaved && result.photosSaved
      setMemoryOnly(!safe)
      if (!safe) setNotice('El navegador no pudo guardar todo el borrador. Mantén esta pestaña abierta; las fotos podrían requerir nueva selección.')
    })
    await queue.current
    return safe
  }
  function flushText() {
    if (formRef.current && draftRef.current) {
      draftRef.current = { ...draftRef.current, revision: (draftRef.current.revision || 0) + 1, updatedAt: Date.now(), fields: readDraftFields(formRef.current, kind), images: imagesRef.current }
      cacheFormDraftText(kind, draftRef.current)
    }
  }
  useEffect(() => {
    if (!ready) return
    window.addEventListener('pagehide', flushText)
    return () => window.removeEventListener('pagehide', flushText)
  }, [ready, kind])
  function scheduleSave() {
    if (!ready) return
    flushText()
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => { void persist() }, 250)
  }
  function updateImages(images: SelectedImage[]) {
    imagesRef.current = images
    if (draftRef.current) { draftRef.current.imageCount = images.length; draftRef.current.imageVersion = crypto.randomUUID() }
    setImageCount(images.length)
    scheduleSave()
  }
  async function requireAuth(action: 'draft' | 'pending') {
    await persist(action)
    setAuthOpen(true)
  }
  async function bindOwner(ownerId: string) {
    if (!draftRef.current) return false
    if (draftRef.current.ownerId && draftRef.current.ownerId !== ownerId) {
      setNotice('Este envío pertenece a otra cuenta. Inicia sesión con ella o descarta el borrador antes de continuar.')
      return false
    }
    draftRef.current.ownerId = ownerId
    await persist()
    return true
  }
  async function clear() {
    if (timer.current) clearTimeout(timer.current)
    await queue.current
    await clearFormDraft(kind)
    draftRef.current = null
  }
  async function discard() {
    if (discardBusy.current) return
    const subject = kind === 'property' ? 'esta propiedad' : 'este requerimiento'
    if (!window.confirm(`¿Descartar el borrador de ${subject}? Perderás los datos y fotografías sin enviar. La página se recargará y también perderás los datos privados que permanecen sólo en esta pestaña. Esta acción no se puede deshacer.`)) return
    discardBusy.current = true
    setDiscarding(true)
    try {
      await clear()
      window.location.reload()
    } catch {
      setNotice('No pudimos confirmar el descarte. Conserva esta pestaña abierta y revisa tu borrador antes de continuar.')
      discardBusy.current = false
      setDiscarding(false)
    }
  }
  return { formRef, draftRef, ready, notice, imageCount, scheduleSave, updateImages, persist,
    requireAuth, bindOwner, clear, discard, discarding, authOpen, setAuthOpen, memoryOnly }
}
