import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { registerHooks, stripTypeScriptTypes } from 'node:module'
import astBabel from '@babel/core'
import babel from 'next/dist/compiled/babel/core.js'
import reactPreset from 'next/dist/compiled/babel/preset-react.js'
import typescriptPreset from 'next/dist/compiled/babel/preset-typescript.js'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

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
