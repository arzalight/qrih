import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DRAFT_TTL, clearFormDraft, loadFormDraft, saveFormDraft } from '../lib/form-draft.ts'

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
  const current = { ...draft(), revision: 2, fields: { title: 'Nuevo' } }
  const previous = { ...current, revision: 1, fields: { title: 'Antiguo' } }
  await saveFormDraft('demand', current)
  await saveFormDraft('demand', previous)
  assert.equal((await loadFormDraft('demand')).fields.title, 'Nuevo')
})
