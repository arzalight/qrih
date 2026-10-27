import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import babel from '@babel/core'

// Handlers reales de ambos componentes; estado/Canvas ficticios, sin red/Storage.
const modules = ['ImageUploader', 'PropertyImageEditor'].map(name => {
  const source = readFileSync(new URL(`../components/${name}.tsx`, import.meta.url), 'utf8')
  const ast = babel.parseSync(source, { filename: `${name}.tsx`, configFile: false, babelrc: false,
    plugins: [['@babel/plugin-syntax-typescript', { isTSX: true }]] })
  const functions = []
  let lifecycle
  babel.traverse(ast, {
    FunctionDeclaration(path) {
      if (['updateImages', 'handleSelection', 'removeImage', 'updateTitle', 'moveImage'].includes(path.node.id.name)) {
        functions.push(stripTypeScriptTypes(source.slice(path.node.start, path.node.end), { mode: 'strip' }))
      }
    },
    CallExpression(path) {
      if (path.node.callee.name === 'useEffect' && source.slice(path.node.start, path.node.end).includes('revokeObjectURL')) {
        lifecycle = stripTypeScriptTypes(source.slice(path.node.arguments[0].start, path.node.arguments[0].end), { mode: 'strip' })
      }
    },
  })
  assert.ok(functions.length >= 4 && lifecycle)
  return { name, functions: functions.join('\n'), lifecycle }
})
const item = (name, editor) => editor
  ? { kind: 'new', id: name, file: new File(['synthetic'], name + '.webp'), url: 'blob:' + name, title: name }
  : { file: new File(['synthetic'], name + '.webp'), previewUrl: 'blob:' + name, title: name }
const event = (...names) => ({ target: { value: 'synthetic selection', files: names.map(name => new File(['synthetic'], name + '.webp')) } })

function fixture(module, options = {}) {
  const editor = module.name === 'PropertyImageEditor'
  const state = { images: (options.names || ['a', 'b']).map(name => item(name, editor)), status: '', processing: false }
  const pending = [], revoked = [], notifications = [], writes = []
  const refs = { imagesRef: { current: state.images }, selectionInFlight: { current: false }, mountedRef: { current: true } }
  const bindings = () => ({ ...refs, images: state.images, maxImages: 7, processing: state.processing,
    locked: options.locked || false, onProcessingChange() {},
    setImages(value) { writes.push('images'); state.images = value },
    setProcessing(value) { writes.push('processing'); state.processing = value },
    setStatus(value) { writes.push('status'); state.status = value },
    onChange(images) { notifications.push(images) },
    URL: { revokeObjectURL(url) { revoked.push(url) } },
    validateImage(file) { return file.name.startsWith('invalid') ? 'Synthetic invalid format' : null },
    optimizeImage(file) { const operation = Promise.withResolvers(); pending.push({ file, ...operation }); return operation.promise },
  })
  const handlers = () => {
    const values = bindings()
    return new Function(...Object.keys(values), `${module.functions}; return { handleSelection, removeImage, updateTitle${editor ? ', moveImage' : ''} }`)(...Object.values(values))
  }
  const values = bindings()
  const cleanup = new Function(...Object.keys(values), `return (${module.lifecycle})()`)(...Object.values(values))
  const finish = index => pending[index].resolve({ file: pending[index].file, previewUrl: 'blob:optimized-' + index, title: '' })
  return { state, refs, pending, revoked, notifications, writes, handlers, cleanup, finish }
}

for (const module of modules) {
  test(`AUD-037 ${module.name}: optimización tardía no revive una foto quitada ni pierde títulos`, async () => {
    const f = fixture(module)
    const selection = f.handlers().handleSelection(event('c'))
    assert.equal(f.pending.length, 1)
    f.handlers().removeImage(0)
    f.handlers().updateTitle(0, 'Nuevo título conservado')
    f.finish(0)
    await selection
    assert.deepEqual(f.state.images.map(image => image.file.name), ['b.webp', 'c.webp'])
    assert.equal(f.state.images[0].title, 'Nuevo título conservado')
    assert.equal(f.state.processing, false)
    assert.equal(f.revoked.filter(url => url === 'blob:a').length, 1)
  })

  test(`AUD-037 ${module.name}: selección simultánea no duplica tareas; desbloqueo tras terminar`, async () => {
    const f = fixture(module)
    const first = f.handlers().handleSelection(event('c'))
    await f.handlers().handleSelection(event('d'))
    assert.equal(f.pending.length, 1)
    assert.equal(f.refs.selectionInFlight.current, true)
    f.finish(0); await first
    assert.equal(f.refs.selectionInFlight.current, false)
    const next = f.handlers().handleSelection(event('e'))
    assert.equal(f.pending.length, 2)
    f.finish(1); await next
    assert.deepEqual(f.state.images.map(image => image.file.name), ['a.webp', 'b.webp', 'c.webp', 'e.webp'])
  })

  test(`AUD-037 ${module.name}: conserva máximo7 y no optimiza un octavo archivo`, async () => {
    const f = fixture(module, { names: ['a', 'b', 'c', 'd', 'e', 'f'] })
    const selection = f.handlers().handleSelection(event('g', 'h'))
    assert.equal(f.pending.length, 1)
    f.finish(0); await selection
    assert.equal(f.state.images.length, 7)
    await f.handlers().handleSelection(event('i'))
    assert.equal(f.pending.length, 1)
    assert.equal(f.state.images.length, 7)
  })

  test(`AUD-037 ${module.name}: fallo de optimización conserva fotos y permite otro intento`, async () => {
    const f = fixture(module)
    const selection = f.handlers().handleSelection(event('c'))
    f.pending[0].reject(new Error('Synthetic conversion failure'))
    await selection
    assert.deepEqual(f.state.images.map(image => image.file.name), ['a.webp', 'b.webp'])
    assert.equal(f.state.processing, false)
    assert.equal(f.refs.selectionInFlight.current, false)
    const retry = f.handlers().handleSelection(event('d'))
    f.finish(1); await retry
    assert.equal(f.state.images.length, 3)
  })

  test(`AUD-037 ${module.name}: desmontar durante await revoca previews tardíos sin actualizar UI`, async () => {
    const f = fixture(module)
    const selection = f.handlers().handleSelection(event('c', 'd'))
    f.finish(0)
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(f.pending.length, 2)
    f.cleanup()
    const writes = f.writes.length
    f.finish(1); await selection
    assert.equal(f.writes.length, writes)
    for (const url of ['blob:a', 'blob:b', 'blob:optimized-0', 'blob:optimized-1']) {
      assert.equal(f.revoked.filter(value => value === url).length, 1)
    }
    assert.equal(f.refs.selectionInFlight.current, false)
  })

  test(`AUD-037 ${module.name}: selección vacía/inválida no bloquea ni modifica fotos`, async () => {
    const f = fixture(module)
    await f.handlers().handleSelection(event())
    await f.handlers().handleSelection(event('invalid-format'))
    assert.equal(f.pending.length, 0)
    assert.equal(f.state.images.length, 2)
    assert.equal(f.state.processing, false)
    assert.equal(f.refs.selectionInFlight.current, false)
  })
}

test('AUD-037 PropertyImageEditor: conserva nuevo orden/portada después del await', async () => {
  const f = fixture(modules[1])
  const selection = f.handlers().handleSelection(event('c'))
  f.handlers().moveImage(1, -1)
  f.finish(0); await selection
  assert.deepEqual(f.state.images.map(image => image.file.name), ['b.webp', 'a.webp', 'c.webp'])
})

test('AUD-037 PropertyImageEditor: referencias existentes permanecen intactas y no revoca URL firmada', async () => {
  const f = fixture(modules[1])
  f.refs.imagesRef.current = f.state.images = [{ kind: 'existing', id: 'existing-synthetic',
    storagePath: 'synthetic-owner/existing.webp', url: 'https://synthetic.invalid/signed-image', title: 'Existente' }]
  const selection = f.handlers().handleSelection(event('new'))
  f.handlers().updateTitle(0, 'Título actualizado')
  f.finish(0); await selection
  assert.equal(f.state.images[0].kind, 'existing')
  assert.equal(f.state.images[0].storagePath, 'synthetic-owner/existing.webp')
  assert.equal(f.state.images[0].title, 'Título actualizado')
  assert.equal(f.revoked.length, 0)
})
