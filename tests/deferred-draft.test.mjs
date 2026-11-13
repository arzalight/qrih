import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DRAFT_TTL, clearFormDraft, loadFormDraft, saveFormDraft, readDraftFields, restoreDraftFields } from '../lib/form-draft.ts'

const memory = new Map()
globalThis.localStorage = { setItem(key, value) { memory.set(key, value) }, getItem(key) { return memory.get(key) || null }, removeItem(key) { memory.delete(key) } }
const draft = () => ({ version: 1, id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', updatedAt: Date.now(), fields: { title: 'Synthetic', terms_accepted: true }, images: [], imageCount: 0, intent: 'pending' })

test('IndexedDB denegada: texto/intención/id sobreviven; fotografías faltantes se declaran', async () => {
  const text = draft()
  assert.deepEqual(await saveFormDraft('property', text), { textSaved: true, photosSaved: true })
  assert.deepEqual(await loadFormDraft('property'), text)
  const imageDraft = { ...text, imageCount: 1, images: [{ file: new File(['synthetic'], 'p.webp', { type: 'image/webp' }), title: 'Foto' }] }
  assert.deepEqual(await saveFormDraft('property', imageDraft), { textSaved: true, photosSaved: false })
  const restored = await loadFormDraft('property')
  assert.equal(restored.imageCount, 1); assert.equal(restored.images.length, 0)
})
test('caducidad, formato corrupto, versión desconocida y descarte eliminan el borrador', async () => {
  for (const data of [{ ...draft(), updatedAt: Date.now() - DRAFT_TTL - 1 }, { ...draft(), version: 9 }]) {
    await saveFormDraft('demand', data)
    assert.equal(await loadFormDraft('demand'), null)
  }
  memory.set('qrih:draft:v1:demand', '{corrupt')
  assert.equal(await loadFormDraft('demand'), null)
  await saveFormDraft('demand', draft()); await clearFormDraft('demand')
  assert.equal(await loadFormDraft('demand'), null)
})
test('localStorage e IndexedDB no disponibles: informa fallo sin fingir persistencia', async () => {
  const original = globalThis.localStorage
  globalThis.localStorage = { setItem() { throw new Error('denied') }, getItem() { throw new Error('denied') }, removeItem() { throw new Error('denied') } }
  try {
    assert.deepEqual(await saveFormDraft('demand', draft()), { textSaved: false, photosSaved: true })
    assert.equal(await loadFormDraft('demand'), null)
    await clearFormDraft('demand')
  } finally { globalThis.localStorage = original }
})

test('un guardado en cola antiguo no reemplaza el texto más reciente', async () => {
  const current = { ...draft(), revision: 2, fields: { operation: 'Venta' } }
  const previous = { ...current, revision: 1, fields: { operation: 'Renta' } }
  await saveFormDraft('demand', current)
  await saveFormDraft('demand', previous)
  assert.equal((await loadFormDraft('demand')).fields.operation, 'Venta')
})

test('integración: captura y restauración sólo permiten datos comerciales; hidden privados nunca se recuperan', () => {
  class Input { constructor(name, value, type = 'text') { Object.assign(this, { name, value, type }) } }
  const saved = [globalThis.HTMLInputElement, globalThis.HTMLSelectElement, globalThis.HTMLTextAreaElement]
  Object.assign(globalThis, { HTMLInputElement: Input, HTMLSelectElement: class {}, HTMLTextAreaElement: class {} })
  try {
    const title = new Input('title', 'Nave'), privateOwner = new Input('pending_owner', 'PRIVATE_CANARY', 'hidden')
    const address = new Input('address', 'PRIVATE_ADDRESS'), unknown = new Input('future_private_field', 'PRIVATE_FUTURE')
    const form = { elements: [title, privateOwner, address, unknown] }
    assert.deepEqual(readDraftFields(form, 'property'), { title: 'Nave' })
    privateOwner.value = ''; address.value = ''
    restoreDraftFields(form, { title: 'Recuperada', pending_owner: 'PRIVATE_CANARY', address: 'PRIVATE_ADDRESS' }, 'property')
    assert.equal(title.value, 'Recuperada'); assert.equal(privateOwner.value, ''); assert.equal(address.value, '')
  } finally {
    [globalThis.HTMLInputElement, globalThis.HTMLSelectElement, globalThis.HTMLTextAreaElement] = saved
  }
})

test('integración: localStorage e IndexedDB excluyen propietarios/dirección/contactos y sanea borradores antiguos', async () => {
  const full = new Map(), prior = globalThis.indexedDB
  globalThis.indexedDB = { open() {
    const open = {}
    queueMicrotask(() => {
      open.result = { close() {}, transaction() {
        const tx = { objectStore() { return {
          put(value, key) { full.set(key, structuredClone(value)); return {} },
          get(key) { return { result: full.get(key) } }, delete(key) { full.delete(key); return {} },
        } } }
        queueMicrotask(() => tx.oncomplete?.()); return tx
      } }
      open.onsuccess?.()
    }); return open
  } }
  try {
    const dirty = { ...draft(), fields: { title: 'Pública', address: 'PRIVATE_CANARY', internal_name: 'PRIVATE_CANARY',
      owner_contact_id: 'PRIVATE_CANARY', pending_owner: 'PRIVATE_CANARY', owner_notes: 'PRIVATE_CANARY' }, p_private: 'PRIVATE_CANARY' }
    await saveFormDraft('property', dirty)
    assert.doesNotMatch(JSON.stringify([...memory.values(), ...full.values()]), /PRIVATE_CANARY/)
    // Legacy/corrupt snapshots do not reintroduce PII into the restored DOM or disk stores.
    memory.set('qrih:draft:v1:property', JSON.stringify(dirty)); full.set('qrih:draft:v1:property', dirty)
    const clean = await loadFormDraft('property')
    assert.deepEqual(clean.fields, { title: 'Pública' })
    assert.doesNotMatch(JSON.stringify([clean, ...memory.values(), ...full.values()]), /PRIVATE_CANARY/)
    await saveFormDraft('demand', { ...draft(), fields: { operation: 'Renta', name: 'CONTACT_CANARY', phone: 'CONTACT_CANARY', email: 'CONTACT_CANARY', notes: 'CONTACT_CANARY' } })
    assert.doesNotMatch(JSON.stringify([...memory.values(), ...full.values()]), /CONTACT_CANARY/)
    assert.equal((await loadFormDraft('demand')).fields.operation, 'Renta')
  } finally { globalThis.indexedDB = prior }
})
