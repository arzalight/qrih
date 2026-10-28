import type { SelectedImage } from '../components/ImageUploader'

export const DRAFT_TTL = 7 * 24 * 60 * 60 * 1000
export type DraftKind = 'property' | 'demand'
export type FormDraft = {
  version: 1; revision?: number; id: string; updatedAt: number; fields: Record<string, string | boolean>
  images: SelectedImage[]; imageCount: number; imageVersion?: string; intent: 'draft' | 'pending' | null; ownerId?: string
}
const key = (kind: DraftKind) => `qrih:draft:v1:${kind}`

// Only fields intended for the public commercial description may survive a
// redirect/reload. Addresses, contact PII and the entire owner picker stay in DOM/
// React memory; never put them in localStorage, sessionStorage or IndexedDB.
const permittedFields: Record<DraftKind, ReadonlySet<string>> = {
  property: new Set(['title', 'operation', 'price', 'price_currency', 'zone_general', 'zone', 'visibility',
    'area', 'covered', 'exterior_area', 'offices_area', 'parking', 'docks', 'max_height', 'description',
    'price_plus_vat', 'price_plus_maintenance', 'negotiable', 'commission', 'publication_authorized', 'terms_accepted']),
  demand: new Set(['operation', 'zone_general', 'zone', 'area_min', 'area_max', 'budget_min', 'budget_max']),
}
export function permittedDraftFields(kind: DraftKind, fields: FormDraft['fields']) {
  return Object.fromEntries(Object.entries(fields).filter(([name, value]) => permittedFields[kind].has(name)
    && (typeof value === 'string' || typeof value === 'boolean')))
}
function sanitizedDraft(kind: DraftKind, draft: FormDraft): FormDraft {
  return { version: draft.version, id: draft.id, updatedAt: draft.updatedAt,
    fields: permittedDraftFields(kind, draft.fields), images: draft.images.map(({ file, title }) => ({ file, title })),
    imageCount: draft.imageCount, intent: draft.intent,
    ...(draft.revision === undefined ? {} : { revision: draft.revision }),
    ...(draft.imageVersion === undefined ? {} : { imageVersion: draft.imageVersion }),
    ...(draft.ownerId === undefined ? {} : { ownerId: draft.ownerId }) }
}

export function readDraftFields(form: HTMLFormElement, kind: DraftKind = 'property') {
  const fields: FormDraft['fields'] = {}
  for (const element of Array.from(form.elements)) {
    if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement)
      || !element.name || element instanceof HTMLInputElement && ['file', 'password', 'submit'].includes(element.type)) continue
    fields[element.name] = element instanceof HTMLInputElement && element.type === 'checkbox' ? element.checked : element.value
  }
  return permittedDraftFields(kind, fields)
}
export function restoreDraftFields(form: HTMLFormElement, fields: FormDraft['fields'], kind: DraftKind = 'property') {
  fields = permittedDraftFields(kind, fields)
  for (const element of Array.from(form.elements)) {
    if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement)
      || !Object.hasOwn(fields, element.name) || element instanceof HTMLInputElement && ['file', 'password', 'submit'].includes(element.type)) continue
    const value = fields[element.name]
    if (element instanceof HTMLInputElement && element.type === 'checkbox') element.checked = value === true
    else element.value = typeof value === 'string' ? value : ''
  }
}

function photoStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('qrih-form-drafts', 1)
    let timedOut = false
    let transaction: IDBTransaction | undefined
    const timeout = setTimeout(() => { timedOut = true; transaction?.abort(); reject(new Error('draft-timeout')) }, 4000)
    open.onupgradeneeded = () => open.result.createObjectStore('drafts')
    open.onerror = () => { clearTimeout(timeout); reject(open.error) }
    open.onblocked = () => { timedOut = true; clearTimeout(timeout); reject(new Error('draft-blocked')) }
    open.onsuccess = () => {
      const db = open.result
      if (timedOut) { db.close(); return }
      let tx: IDBTransaction, result: IDBRequest<T>
      try { tx = db.transaction('drafts', mode); transaction = tx; result = run(tx.objectStore('drafts')) }
      catch (error) { clearTimeout(timeout); db.close(); reject(error); return }
      tx.oncomplete = () => { clearTimeout(timeout); db.close(); resolve(result.result) }
      tx.onabort = tx.onerror = () => { clearTimeout(timeout); db.close(); reject(tx.error) }
    }
  })
}
export function cacheFormDraftText(kind: DraftKind, draft: FormDraft) {
  try {
    draft = sanitizedDraft(kind, draft)
    const existing = JSON.parse(localStorage.getItem(key(kind)) || 'null') as FormDraft | null
    if (existing?.id === draft.id && (existing.updatedAt > draft.updatedAt || existing.updatedAt === draft.updatedAt && (existing.revision || 0) > (draft.revision || 0))) return true
    localStorage.setItem(key(kind), JSON.stringify({ ...draft, images: [] })); return true
  } catch { return false }
}

export async function saveFormDraft(kind: DraftKind, draft: FormDraft) {
  draft = sanitizedDraft(kind, draft)
  // Text survives even when IndexedDB is denied or its image quota is exhausted.
  let textSaved = false, photosSaved = false
  textSaved = cacheFormDraftText(kind, draft)
  try { await photoStore('readwrite', store => store.put(draft, key(kind))); photosSaved = true } catch {}
  return { textSaved: textSaved || photosSaved, photosSaved: !draft.images.length || photosSaved }
}
export async function loadFormDraft(kind: DraftKind): Promise<FormDraft | null> {
  let text: FormDraft | null = null, full: FormDraft | null = null
  try { text = JSON.parse(localStorage.getItem(key(kind)) || 'null') } catch {}
  try { full = await photoStore('readonly', store => store.get(key(kind))) } catch {}
  const valid = (draft: FormDraft | null) => draft?.version === 1 && typeof draft.id === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(draft.id) && Number.isFinite(draft.updatedAt)
    && draft.updatedAt <= Date.now() && Date.now() - draft.updatedAt < DRAFT_TTL
    && draft.fields && typeof draft.fields === 'object' && !Array.isArray(draft.fields) && Array.isArray(draft.images)
    && Number.isInteger(draft.imageCount) && draft.imageCount >= 0 && draft.imageCount <= 7 && draft.images.length <= 7
    && draft.images.every(image => image?.file instanceof File && typeof image.title === 'string' && image.title.length <= 120 && image.file.size <= 3 * 1024 * 1024)
  if (!valid(text)) text = null
  if (!valid(full)) full = null
  const latest = text && (!full || (text.updatedAt > full.updatedAt || text.updatedAt === full.updatedAt && (text.revision || 0) >= (full.revision || 0))) ? text : full || text
  const draft = latest && { ...latest, images: full && full.id === latest.id && full.imageVersion === latest.imageVersion ? full.images : latest.images }
  if (!draft) { await clearFormDraft(kind); return null }
  const clean = sanitizedDraft(kind, draft)
  // Scrub older snapshots too, including an obsolete IndexedDB copy.
  await saveFormDraft(kind, clean)
  return clean
}
export async function clearFormDraft(kind: DraftKind) {
  try { localStorage.removeItem(key(kind)) } catch {}
  try { await photoStore('readwrite', store => store.delete(key(kind))) } catch {}
}
