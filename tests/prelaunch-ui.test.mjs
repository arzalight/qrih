import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { registerHooks, stripTypeScriptTypes } from 'node:module'
import astBabel from '@babel/core'
import babel from 'next/dist/compiled/babel/core.js'
import reactPreset from 'next/dist/compiled/babel/preset-react.js'
import typescriptPreset from 'next/dist/compiled/babel/preset-typescript.js'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'


function contractAst(value) {
  if (Array.isArray(value)) return value.map(contractAst)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !['loc', 'start', 'end', 'extra', 'leadingComments', 'trailingComments', 'innerComments'].includes(key))
    .map(([key, entry]) => [key, contractAst(entry)]))
  return value
}
const formContracts = {
  "app/publicar/PublicarForm.tsx": "05e3f3413a04c62ac5a132bacadbaea45b2f9e30bb85151c9ef04740df9e2930",
  "app/mis-propiedades/[id]/editar/EditarPropiedadForm.tsx": "ec8cc447078d9ac64a79f7a52bcfc631e92bfdff3f0b7c5f917c3d270d519582",
  "app/busco-bodega/page.tsx": "d864701dbf57355dd9cd8e39c0bd872206d5b7adf99611a8a5bfa5b912b6fba1",
  "components/PropertyContactForm.tsx": "83051941b5ff19a86a319349c6ae504d2c2692b014ff834242d9660893cd5e29",
  "components/ImageUploader.tsx": "15df5a8f52492b39d169f338ecab18b2f31d1b7c5ef2ce1e132d83ddb7b02be0",
  "components/PropertyImageEditor.tsx": "5b185ed0c6e6d74cea83f2d8ba65050b6ae371a500aaeecfd711f02c801e9e76",
  "components/ProfileInfoForm.tsx": "9892c551ddbc6157aac960aca124e7c31460f85f9c0b9bb540d70ad60eff1f2c",
  "components/ProfileSocialForm.tsx": "cf3a78bb626a91d4022fe2fbdacda8beea8a9f92c4f80e45f522635eb6421df2"
}
for (const [file, expected] of Object.entries(formContracts)) {
  test(`formularios: contrato previo intacto en ${file}`, () => {
    const source = readFileSync(new URL(file, root), 'utf8')
    const ast = astBabel.parseSync(source, { configFile: false, babelrc: false, parserOpts: { plugins: ['jsx', 'typescript'] } })
    const controls = []
    astBabel.traverse(ast, { JSXOpeningElement(path) {
      if (!['input', 'select', 'textarea', 'form', 'option'].includes(path.node.name.name)) return
      controls.push({ tag: path.node.name.name, attributes: contractAst(path.node.attributes.filter(attribute =>
        !['style', 'className', 'id', 'hidden', 'role'].includes(attribute.name?.name) && !attribute.name?.name?.startsWith('aria-'))) })
    } })
    assert.equal(createHash('sha256').update(JSON.stringify(controls)).digest('hex'), expected,
      'Mismos campos, validaciones, opciones, valores, disabled y handlers; sólo presentación autorizada')
  })
}
test('FormField real: etiqueta persistente asociada, obligatorio sólo informativo', async () => {
  const { FormField } = await import('../components/FormField.tsx')
  const html = renderToStaticMarkup(createElement(FormField, { id: 'synthetic-price', label: 'Precio', required: true },
    createElement('input', { id: 'synthetic-price', name: 'price', required: true })))
  assert.match(html, /<label for="synthetic-price">Precio/)
  assert.match(html, /obligatorio/)
  assert.match(html, /<input id="synthetic-price"[^>]*name="price"/)
  assert.match(html, /<input[^>]*required=""/)
})
test('formularios intervenidos: cada campo nombrado tiene etiqueta asociada sin anidar labels', () => {
  for (const file of Object.keys(formContracts).slice(0, 4)) {
    const source = readFileSync(new URL(file, root), 'utf8')
    const ast = astBabel.parseSync(source, { configFile: false, babelrc: false, parserOpts: { plugins: ['jsx', 'typescript'] } })
    astBabel.traverse(ast, { JSXElement(path) {
      const opening = path.node.openingElement
      if (!['input', 'select', 'textarea'].includes(opening.name.name)) return
      const attr = name => opening.attributes.find(attribute => attribute.name?.name === name)?.value?.value
      if (!attr('name') || ['hidden', 'checkbox', 'file'].includes(attr('type'))) return
      const ancestor = path.findParent(parent => parent.isJSXElement() && ['label', 'FormField'].includes(parent.node.openingElement.name.name))
      assert.ok(ancestor, `${file}: ${attr('name')} sin etiqueta`)
      if (ancestor.node.openingElement.name.name === 'FormField') {
        assert.equal(attr('id'), ancestor.node.openingElement.attributes.find(attribute => attribute.name?.name === 'id').value.value)
      }
    } })
  }
})
test('panel sin saludo personal fijo y éxito de publicación no modal ni formulario duplicable visible', () => {
  assert.doesNotMatch(readFileSync(new URL('app/mis-propiedades/page.tsx', root), 'utf8'), /HOLA, FABIÁN/)
  const publish = readFileSync(new URL('app/publicar/PublicarForm.tsx', root), 'utf8')
  assert.match(publish, /hidden=\{showSuccess\}/)
  assert.match(publish, /successNotice.current\?\.focus\(\)/)
  assert.match(publish, /role="status" aria-live="polite"/)
  assert.doesNotMatch(publish, /if \(!ready\)\s*\{\s*return null|position: 'fixed'/)
})


const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')
const variables = Object.fromEntries([...css.matchAll(/--([a-z0-9-]+):\s*(#[a-f0-9]{6});/gi)].map(([, key, value]) => [key, value]))
function luminance(hex) {
  const [r, g, b] = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  return r * 0.2126 + g * 0.7152 + b * 0.0722
}
function contrast(a, b) {
  const [low, high] = [luminance(a), luminance(b)].sort((x, y) => x - y)
  return (high + 0.05) / (low + 0.05)
}
for (const [foreground, background] of [['ink', 'surface'], ['muted', 'surface'], ['muted', 'paper'],
  ['primary', 'surface'], ['primary-hover', 'primary-soft'], ['success', 'success-soft'],
  ['warning', 'warning-soft'], ['danger', 'danger-soft']]) {
  test(`UI tokens: ${foreground}/${background} alcanza 4.5:1 para texto normal`, () => {
    assert.ok(variables[foreground] && variables[background], 'Tokens explícitos, no fixtures ajenos al CSS real')
    assert.ok(contrast(variables[foreground], variables[background]) >= 4.5)
  })
}
test('UI: foco opaco y movimiento reducido, sin eliminar outline de campos', () => {
  assert.match(css, /outline: 3px solid var\(--focus\)/)
  assert.doesNotMatch(css, /outline:\s*none/)
  assert.match(css, /prefers-reduced-motion: reduce/)
  assert.ok(contrast(variables.focus, variables.surface) >= 3)
  assert.ok(contrast(variables.focus, variables.paper) >= 3)
})
test('UI: tarjetas usan ancho disponible y precio puede ajustar líneas', () => {
  assert.match(css, /\.cards\s*\{[^}]*repeat\(auto-fit, minmax\(min\(100%, 260px\), 1fr\)\)/s)
  assert.match(css, /\.cardBody > b\s*\{[^}]*overflow-wrap: anywhere/s)
  assert.match(css, /\.inventory\s*\{[^}]*minmax\(0, 1fr\)/s)
})
test('UI: sin fuentes externas ni nuevas dependencias de presentación', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  assert.deepEqual(Object.keys(pkg.dependencies).sort(), ['@react-pdf/renderer', '@supabase/ssr', '@supabase/supabase-js', 'next', 'react', 'react-dom', 'sharp'].sort())
  assert.doesNotMatch(css, /@import\s+url|fonts\.googleapis/)
})

const root = new URL('../', import.meta.url)
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'react' && context.parentURL?.startsWith('data:')) return next(new URL('../node_modules/react/index.js', import.meta.url).href, context)
    if (specifier === 'next/navigation') return { url: 'data:text/javascript,export const usePathname=()=>globalThis.__uiPath', shortCircuit: true }
    if (specifier === 'next/link') return { url: 'data:text/javascript,import{createElement}from"react";export default function Link({href,children,...props}){return createElement("a",{...props,href},children)}', shortCircuit: true }
    if (specifier === '@/lib/supabase') return { url: 'data:text/javascript,export const createClient=()=>{throw Error("No network in UI fixture")}', shortCircuit: true }
    if (specifier === '@/lib/safe-navigation') return next(new URL('../lib/safe-navigation.ts', import.meta.url).href, context)
    if (specifier === '@/lib/property-price') return next(new URL('../lib/property-price.ts', import.meta.url).href, context)
    if (specifier === '@/components/PropertyStatusBadge') return next(new URL('../components/PropertyStatusBadge.tsx', import.meta.url).href, context)
    if (specifier === './PropertyImageGallery' && context.parentURL === new URL('../components/CommercialPropertySheet.tsx', import.meta.url).href)
      return next(new URL('../components/PropertyImageGallery.tsx', import.meta.url).href, context)
    return next(specifier, context)
  },
  load(url, context, next) {
    if (url.startsWith(root.href) && url.endsWith('.tsx')) return { format: 'module', shortCircuit: true,
      source: babel.transformSync(readFileSync(new URL(url), 'utf8'), { filename: new URL(url).pathname, configFile: false, babelrc: false,
        presets: [[typescriptPreset, { allExtensions: true, isTSX: true }], [reactPreset, { runtime: 'automatic' }]] }).code }
    return next(url, context)
  },
})
const { Header } = await import('../components/Header.tsx')

const authenticationHandlers = {
  "app/login/page.tsx": {
    "names": [
      "signIn"
    ],
    "hash": "3e55ef13ba2f163b0f8d440c0b4bdc6566ad6d42b0d633a8378e51bab12f6089"
  },
  "app/registro/page.tsx": {
    "names": [
      "handleContinue",
      "handleCreate"
    ],
    "hash": "7d3c0e62038bdb1ce4275f051fd727e5686a6c6ddd6f22847ad831abfb517d68"
  },
  "app/recuperar-contrasena/page.tsx": {
    "names": [
      "submit"
    ],
    "hash": "fcd6259fdeefd61db7050b9307ff1dbcb5253a1c07bd1aa791ba94f5db69e9e0"
  },
  "app/restablecer-contrasena/ResetPasswordForm.tsx": {
    "names": [
      "submit"
    ],
    "hash": "88ac6a5bf299250c9bff0229011207819bcf0e78d26194d00ab82984599f7449"
  }
}
for (const [file, { names, hash }] of Object.entries(authenticationHandlers)) {
  test(`Auth visual: handlers previos intactos en ${file}`, () => {
    const ast = astBabel.parseSync(readFileSync(new URL(file, root), 'utf8'), {
      configFile: false, babelrc: false, parserOpts: { plugins: ['jsx', 'typescript'] },
    })
    const handlers = []
    astBabel.traverse(ast, { FunctionDeclaration(path) {
      if (names.includes(path.node.id?.name)) handlers.push(contractAst(path.node))
    } })
    assert.equal(createHash('sha256').update(JSON.stringify(handlers)).digest('hex'), hash)
  })
}
test('ficha real independiente: sólo datos autorizados, precio exacto y galería/PDF existentes', async () => {
  const { CommercialPropertySheet } = await import('../components/CommercialPropertySheet.tsx')
  const property = { slug: 'synthetic-sheet', title: 'Ficha sintética', zone: 'Zona pública',
    address: 'Dirección privada sintética', location_visibility: 'zone', total_area: 100,
    price_currency: 'USD', price_value: '7.50', price_unit: 'm2', operation: 'Renta' }
  const html = renderToStaticMarkup(createElement(CommercialPropertySheet, { property,
    images: [{ url: 'https://synthetic.invalid/authorized-ephemeral-image', title: 'Portada sintética' }] }))
  assert.doesNotMatch(html, /<header|<footer|<nav|<form|Dirección privada sintética/)
  assert.match(html, /US\$7.50 USD\/m²\/mes/)
  assert.match(html, /US\$750 USD\/mes/)
  assert.match(html, /href="\/api\/bodegas\/synthetic-sheet\/pdf"/)
  assert.match(html, /width="1200" height="800" decoding="async"/)
  assert.match(html, /Ampliar Portada sintética/)
})

test('tabla administrativa real: región enfocable, cabeceras, moneda, estados legibles y paginación existente', async () => {
  const { AdminPropertiesTable } = await import('../components/AdminPropertiesTable.tsx')
  const states = ['draft', 'pending', 'published', 'paused', 'rejected', 'expired', 'pending_update']
  const properties = Array.from({ length: 36 }, (_, index) => ({ id: `test-${index}`, slug: `test-${index}`,
    title: `Propiedad sintética ${index}`, status: states[index % states.length], price_currency: 'USD',
    price_value: '7.50', price_unit: 'm2', operation: 'Renta', total_area: 100, zone: 'Zona sintética' }))
  const html = renderToStaticMarkup(createElement(AdminPropertiesTable, { properties }))
  assert.match(html, /role="region"[^>]*aria-label="Tabla de propiedades[^>]*tabindex="0"/)
  assert.equal((html.match(/scope="col"/g) || []).length, 8)
  assert.match(html, /<caption[^>]*>Propiedades y acciones administrativas<\/caption>/)
  for (const label of ['Borrador', 'En revisión', 'Publicada', 'Pausada', 'Rechazada', 'Expirada', 'Actualización en revisión']) assert.ok(html.includes(label))
  assert.match(html, /US\$7.50 USD\/m²\/mes/)
  assert.match(html, /Mostrando 1–35 de 36/)
  assert.match(html, /aria-label="Página 1" aria-current="page"/)
  assert.doesNotMatch(html, /Propiedad sintética 35<\/strong>/)
  const source = readFileSync(new URL('components/AdminPropertiesTable.tsx', root), 'utf8')
  assert.match(source, /PAGE_SIZE_OPTIONS = \[20, 35, 50, 60, 100\]/)
})
for (const path of ['/inventario', '/mis-propiedades', '/perfil', '/admin']) {
  test(`Header real: navegación ${path}, sin enlaces administrativos por URL o metadata`, () => {
    globalThis.__uiPath = path
    const html = renderToStaticMarkup(createElement(Header))
    assert.doesNotMatch(html, /href="\/admin/)
    assert.match(html, /aria-label="Principal"/)
    if (path !== '/admin') assert.match(html, new RegExp(`href="${path}"[^>]*aria-current="page"|aria-current="page"[^>]*href="${path}"`))
  })
}
test('Header administrativo sólo opt-in de las seis páginas tras sus guards existentes', () => {
  globalThis.__uiPath = '/admin/asesores'
  const html = renderToStaticMarkup(createElement(Header, { administration: true }))
  assert.match(html, /href="\/admin\/asesores"[^>]*aria-current="page"|aria-current="page"[^>]*href="\/admin\/asesores"/)
  assert.match(html, /aria-label="Administración"/)
  for (const file of ['app/admin/page.tsx', 'app/admin/[id]/page.tsx', 'app/admin/asesores/page.tsx',
    'app/admin/asesores/[id]/page.tsx', 'app/admin/historial/page.tsx', 'app/admin/configuracion/page.tsx']) {
    const s = readFileSync(new URL(file, root), 'utf8')
    assert.equal((s.match(/<Header administration/g) || []).length, 1)
    assert.ok(s.indexOf('<Header administration') > s.indexOf('Acceso restringido'))
    assert.match(s, /role !== 'admin'/)
    assert.match(s, /account_status !== 'active'/)
  }
})
test('/panel preserva marcadores mediante redirect y no presenta ceros ficticios', () => {
  const s = readFileSync(new URL('../app/panel/page.tsx', import.meta.url), 'utf8')
  assert.match(s, /redirect\('\/mis-propiedades'\)/)
  assert.doesNotMatch(s, /<b>0|Conecta tu cuenta/)
})
test('filtros administrativos usan ancho disponible sin cambiar sus contratos GET', () => {
  const s = readFileSync(new URL('../components/AdminPropertyFilters.tsx', import.meta.url), 'utf8')
  assert.match(s, /repeat\(auto-fit, minmax\(min\(100%, 160px\), 1fr\)\)/)
  assert.match(s, /method="get"/)
  for (const name of ['search', 'status', 'operation', 'zone_general', 'zone']) assert.ok(s.includes(`name="${name}"`))
})
test('tarjeta real: imagen semántica diferida, moneda/unidad y destino intactos', async () => {
  const { PropertyCard } = await import('../components/PropertyCard.tsx')
  const property = { id: 'synthetic', slug: 'synthetic-property', title: 'Bodega de prueba', zone: 'El Marqués', operation: 'Renta',
    price_value: '7.50', price_unit: 'm2', price_currency: 'USD', total_area: 5000, covered_area: 4000,
    main_image: 'https://synthetic.invalid/ephemeral-image', max_height: '9m', share_commission: true }
  const html = renderToStaticMarkup(createElement(PropertyCard, { property }))
  assert.match(html, /US\$7.50 USD\/m²\/mes/)
  assert.match(html, /href="\/bodegas\/synthetic-property"/)
  assert.match(html, /<img[^>]*alt="Bodega de prueba"[^>]*loading="lazy"/)
  assert.match(html, /width="640" height="400"/)
  const empty = renderToStaticMarkup(createElement(PropertyCard, { property: { ...property, main_image: null } }))
  assert.match(empty, /Fotografía no disponible/)
  assert.doesNotMatch(empty, /<img/)
})
test('galería real: primera foto eager, resto lazy y modal nativo con foco restaurado', async () => {
  const { PropertyImageGallery } = await import('../components/PropertyImageGallery.tsx')
  const html = renderToStaticMarkup(createElement(PropertyImageGallery, {
    propertyTitle: 'Galería sintética', images: Array.from({ length: 7 }, (_, i) => ({ url: `https://synthetic.invalid/${i}`, title: `Foto ${i + 1}` })),
  }))
  assert.equal((html.match(/<img /g) || []).length, 7)
  assert.equal((html.match(/loading="eager"/g) || []).length, 1)
  assert.equal((html.match(/loading="lazy"/g) || []).length, 6)
  const s = readFileSync(new URL('../components/PropertyImageGallery.tsx', import.meta.url), 'utf8')
  assert.match(s, /<dialog/)
  assert.match(s, /activeDialog.showModal\(\)/)
  assert.match(s, /previousFocus\.focus\(\)/)
  assert.match(s, /onCancel=\{\(\) => setActiveIndex\(null\)\}/)
  assert.doesNotMatch(s, /getPublicUrl|createSignedUrl|localStorage/)
})
test('handler real de galería: Tab/ShiftTab se mantienen dentro y flechas conservan orden', () => {
  const s = readFileSync(new URL('../components/PropertyImageGallery.tsx', import.meta.url), 'utf8')
  const ast = astBabel.parseSync(s, { filename: 'PropertyImageGallery.tsx', configFile: false, babelrc: false,
    plugins: [['@babel/plugin-syntax-typescript', { isTSX: true }]] })
  let handler
  astBabel.traverse(ast, { FunctionDeclaration(path) { if (path.node.id?.name === 'handleKeyDown') handler = path.node } })
  assert.ok(handler)
  const code = stripTypeScriptTypes(s.slice(handler.start, handler.end), { mode: 'strip' })
  const document = { activeElement: null }
  const first = { focus() { document.activeElement = first } }, last = { focus() { document.activeElement = last } }
  let index = 0, prevented = 0
  const key = new Function('activeDialog', 'document', 'setActiveIndex', 'total', `${code};return handleKeyDown`)(
    { querySelectorAll: () => [first, {}, last] }, document, updater => { index = updater(index) }, 7)
  document.activeElement = first
  key({ key: 'Tab', shiftKey: true, preventDefault() { prevented++ } })
  assert.equal(document.activeElement, last)
  key({ key: 'Tab', shiftKey: false, preventDefault() { prevented++ } })
  assert.equal(document.activeElement, first)
  key({ key: 'ArrowRight', preventDefault() { prevented++ } })
  assert.equal(index, 1)
  key({ key: 'ArrowLeft', preventDefault() { prevented++ } })
  assert.equal(index, 0)
  assert.equal(prevented, 4)
})
