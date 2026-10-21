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
  // Authorized change: initial editable description template, all other controls unchanged.
  "app/publicar/PublicarForm.tsx": "6ee610ca1819905ea43be53edbc4e81925fcabd85a5c194629a684ba78ff6e1a",
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
test('publicar: plantilla como valor inicial editable, no placeholder ni reinicio al enfocar', () => {
  const source = readFileSync(new URL('app/publicar/PublicarForm.tsx', root), 'utf8')
  const ast = astBabel.parseSync(source, { configFile: false, babelrc: false, parserOpts: { plugins: ['jsx', 'typescript'] } })
  let template
  let description
  astBabel.traverse(ast, {
    VariableDeclarator(path) {
      if (path.node.id.name === 'INITIAL_PROPERTY_DESCRIPTION') {
        assert.equal(path.node.init.type, 'TemplateLiteral')
        assert.equal(path.node.init.expressions.length, 0)
        template = path.node.init.quasis[0].value.cooked
      }
    },
    JSXOpeningElement(path) {
      if (path.node.name.name === 'textarea' && path.node.attributes.some(attr => attr.name?.name === 'name' && attr.value.value === 'description')) description = path.node
    },
  })
  assert.ok(template)
  assert.equal(template.split('\n').filter(Boolean).length, 26)
  assert.ok(template.startsWith('Tipo de operación\nRenta $ x m2'))
  assert.ok(template.endsWith('Tipo de contrato\nCondiciones de contrato'))
  assert.equal(description.attributes.find(attr => attr.name?.name === 'defaultValue').value.expression.name, 'INITIAL_PROPERTY_DESCRIPTION')
  assert.ok(!description.attributes.some(attr => ['value', 'onFocus', 'onClick', 'onBlur', 'onChange', 'readOnly'].includes(attr.name?.name)))
  const html = renderToStaticMarkup(createElement('textarea', { name: 'description', defaultValue: template }))
  assert.ok(html.includes('Tipo de operación\nRenta $ x m2'))
  const edit = readFileSync(new URL('app/mis-propiedades/[id]/editar/EditarPropiedadForm.tsx', root), 'utf8')
  assert.match(edit, /defaultValue=\{property.description \|\| ''\}/)
  assert.doesNotMatch(edit, /INITIAL_PROPERTY_DESCRIPTION/)
})
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
test('inicio: círculos decorativos detrás del contenido sin interceptar enlaces', () => {
  assert.match(css, /\.home-capability-card\s*\{[^}]*isolation: isolate;/)
  assert.match(css, /\.home-capability-card::after\s*\{[^}]*z-index: -1;[^}]*pointer-events: none;/)
})
test('inicio: seis propiedades conservando proyección pública, filtros, prioridad y firma autorizada', () => {
  const source = readFileSync(new URL('app/page.tsx', root), 'utf8')
  assert.match(source, /\.from\('properties_public'\)/)
  assert.match(source, /\.eq\('status', 'published'\)/)
  assert.match(source, /\.order\('featured', \{ ascending: false \}\)/)
  assert.match(source, /\.order\('featured_priority', \{ ascending: true, nullsFirst: false \}\)/)
  assert.match(source, /\.order\('created_at', \{ ascending: false \}\)\s*\.limit\(6\)/)
  assert.match(source, /properties.map\(\(property\) => property.main_image_path\),\s*PROPERTY_IMAGE_TTL_SECONDS.public/)
  assert.doesNotMatch(source, /getPublicUrl|SUPABASE_SERVICE_ROLE_KEY|createServerSupabaseClient|\.limit\(3\)/)
})
test('inicio: título y enlace comparten fila, CTA redundante retirada sin perder acceso a requerimientos', () => {
  const source = readFileSync(new URL('app/page.tsx', root), 'utf8')
  assert.match(source, /className="head home-selection__heading">\s*<h2>Espacios que mueven industria<\/h2>\s*<Link href="\/inventario">/)
  assert.doesNotMatch(source, /className="band"|NO TE CONFORMES CON LO DISPONIBLE|¿Buscas algo más específico\?/)
  assert.match(source, /<h3>Comparte tu requerimiento<\/h3>/)
  assert.match(source, /href="\/busco-bodega">Busco una bodega →/)
  assert.match(css, /\.home-selection__heading\s*\{ align-items: center;/)
  assert.match(css, /\.home-selection__heading\s*\{ flex-direction: column; align-items: flex-start;/)
  assert.match(source, /className="cards home-selection__cards"/)
  assert.match(css, /\.home-selection__cards\s*\{ grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/)
})
test('historial administrativo: filtros visibles y asociados sin cambiar sus nombres', () => {
  const source = readFileSync(new URL('app/admin/historial/page.tsx', root), 'utf8')
  for (const text of ['Desde', 'Hasta', 'Buscar propiedad o asesor', 'Acción']) assert.ok(source.includes(`<label className="ui-field">${text}`))
  for (const name of ['desde', 'hasta', 'busqueda', 'accion']) assert.ok(source.includes(`name="${name}"`))
  assert.match(source, /method="get"/)
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
    if (specifier === 'next/navigation') return { url: 'data:text/javascript,export const usePathname=()=>globalThis.__uiPath;export const useRouter=()=>({push(){throw Error("No navigation in SSR fixture")},refresh(){throw Error("No mutation in SSR fixture")}})', shortCircuit: true }
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
const { PriceCurrencySelect } = await import('../components/PriceCurrencySelect.tsx')
test('publicar: MXN inicial sólo en alta nueva; USD/NULL originales de edición y duplicación conservados', () => {
  const publish = readFileSync(new URL('app/publicar/PublicarForm.tsx', root), 'utf8')
  const edit = readFileSync(new URL('app/mis-propiedades/[id]/editar/EditarPropiedadForm.tsx', root), 'utf8')
  assert.match(publish, /<PriceCurrencySelect value="MXN" \/>/)
  assert.match(edit, /<PriceCurrencySelect value=\{property.price_currency\} \/>/)
  for (const [value, expected] of [['MXN', 'MXN'], ['USD', 'USD'], [null, ''], [undefined, ''], ['', '']]) {
    const html = renderToStaticMarkup(createElement(PriceCurrencySelect, { value }))
    const option = [...html.matchAll(/<option\b([^>]*)>/g)].find(match => /selected=""/.test(match[1]))
    assert.ok(option)
    assert.equal(option[1].match(/value="([^"]*)"/)[1], expected)
  }
})
test('formularios de propiedad: Municipio/Zona son etiquetas, nombres/opciones/variables siguen intactos', () => {
  for (const [file, prefix] of [['app/publicar/PublicarForm.tsx', 'field-0'], ['app/mis-propiedades/[id]/editar/EditarPropiedadForm.tsx', 'field-1']]) {
    const source = readFileSync(new URL(file, root), 'utf8')
    assert.ok(source.includes(`id="${prefix}-zone_general" label="Municipio"`))
    assert.ok(source.includes(`id="${prefix}-zone" label="Zona"`))
    assert.match(source, /name="zone_general"/)
    assert.match(source, /name="zone"/)
    assert.match(source, /ZONAS_GENERALES.map/)
    assert.match(source, /ZONAS_INDUSTRIALES_POR_ZONA\[zonaGeneral\]/)
    assert.doesNotMatch(source, /name="municipio"|name="zona"/)
  }
})
test('precio y condiciones: separación visible de56px a un tercio sin comprimir los checkboxes', () => {
  assert.match(css, /\.price-options\s*\{[^}]*gap: calc\(56px \/ 3\);/)
  assert.match(css, /\.price-options > \.inline-check\s*\{ margin: 0; \}/)
  assert.match(css, /\.inline-check input\s*\{[^}]*width: 18px;[^}]*height: 18px;/)
})
test('Header: carga de identidad/notificaciones, lectura y signOut conservan sus handlers', () => {
  const source = readFileSync(new URL('components/Header.tsx', root), 'utf8')
  const ast = astBabel.parseSync(source, { configFile: false, babelrc: false, parserOpts: { plugins: ['jsx', 'typescript'] } })
  const handlers = []
  astBabel.traverse(ast, { FunctionDeclaration(path) {
    if (['loadUserAndNotifications', 'handleNotificationClick', 'handleSignOut'].includes(path.node.id?.name))
      handlers.push(contractAst(path.node))
  } })
  assert.equal(createHash('sha256').update(JSON.stringify(handlers)).digest('hex'), 'f34466629f6c08ca714eacccab0d9241d532ae61e61270900c637ca2f03ce42b')
})
test('Header: cuenta fuera de navegación, junto al control de menú, icono accesible y sin marcadores', () => {
  const source = readFileSync(new URL('components/Header.tsx', root), 'utf8')
  const ast = astBabel.parseSync(source, { configFile: false, babelrc: false, parserOpts: { plugins: ['jsx', 'typescript'] } })
  let accounts = 0
  astBabel.traverse(ast, { JSXElement(path) {
    const className = path.node.openingElement.attributes.find(attr => attr.name?.name === 'className')?.value?.value
    if (className !== 'profile-menu') return
    accounts++
    assert.equal(path.findParent(p => p.isJSXElement() && p.node.openingElement.name.name === 'nav'), null)
    assert.ok(path.findParent(p => p.isJSXElement() && p.node.openingElement.attributes.some(attr => attr.name?.name === 'className' && attr.value?.value === 'header-controls')))
  } })
  assert.equal(accounts, 1)
  assert.match(source, /aria-label="Mi cuenta" title="Mi cuenta"/)
  assert.match(source, /<circle cx="12" cy="8" r="4"/)
  assert.doesNotMatch(source, /◇|profile-menu__avatar/)
  assert.doesNotMatch(source, /site-nav__marker/)
  assert.doesNotMatch(css, /\.site-nav__marker/)
  assert.match(css, /\.profile-menu__toggle\s*\{[^}]*width: 44px; height: 44px;/)
})
const { ManagePropertyActions } = await import('../components/ManagePropertyActions.tsx')
const { PropertyActionDisclosure } = await import('../components/PropertyActionDisclosure.tsx')
const { DeletePropertyButton } = await import('../components/DeletePropertyButton.tsx')

test('panel: consultas, identidad, cálculo de métricas y firma de portadas anteriores intactos', () => {
  const source = readFileSync(new URL('app/mis-propiedades/page.tsx', root), 'utf8')
  const logic = source.slice(source.indexOf('  const supabase ='), source.indexOf('return (\n  <>'))
  assert.equal(createHash('sha256').update(logic).digest('hex'), '50b26308fac424659474dd2bfb4eeb43c68ce5f381db691016914e4e5ea9f94d')
  assert.ok(source.indexOf('own-properties__grid') < source.indexOf('Rendimiento de tus propiedades'))
  assert.ok(source.indexOf('Preferencias de contacto') > source.indexOf("activeView === 'requirements' &&"))
  assert.doesNotMatch(source, /width: '180px'/)
})
for (const status of ['draft', 'pending', 'published', 'paused', 'rejected', 'expired', 'pending_update']) {
  test(`panel: edición compacta respeta estado ${status} y cuenta deshabilitada`, () => {
    const props = { propertyId: 'synthetic-property', status, disabled: false, compact: true }
    const html = renderToStaticMarkup(createElement(ManagePropertyActions, props))
    if (['draft', 'rejected'].includes(status)) {
      assert.match(html, /href="\/mis-propiedades\/synthetic-property\/editar"/)
    } else if (status === 'published') {
      assert.match(html, /<button type="button">Editar<\/button>/)
      assert.match(html, /dejará de estar visible/)
      assert.match(html, /Continuar editando/)
    } else assert.equal(html, '')
    assert.doesNotMatch(html, /Duplicar/)
    assert.equal(renderToStaticMarkup(createElement(ManagePropertyActions, { ...props, disabled: true })), '')
  })
}
test('panel: Más empieza cerrado, con controles asociados y acciones presentes pero ocultas', () => {
  const html = renderToStaticMarkup(createElement(PropertyActionDisclosure, {
    id: 'synthetic', title: 'Título de prueba',
    primary: createElement('a', { href: '/solicitudes' }, 'Solicitudes'),
  }, createElement('a', { href: '/duplicar' }, 'Duplicar')))
  assert.match(html, /aria-expanded="false" aria-controls="property-actions-synthetic"/)
  assert.match(html, /aria-label="Más acciones para Título de prueba"/)
  assert.match(html, /id="property-actions-synthetic"[^>]*hidden=""/)
  assert.match(html, /href="\/duplicar"/)
  assert.doesNotMatch(html, /<span>Más<\/span>/)
  assert.match(html, /title="Más acciones"/)
})
test('panel: siete ajustes de texto conservan acciones, datos y periodo sólo visible en rendimiento', () => {
  const source = readFileSync(new URL('app/mis-propiedades/page.tsx', root), 'utf8')
  assert.doesNotMatch(source, /Administra tus publicaciones|Revisa cómo autorizas|own-property-card__date|own-property-card__period|Registrada el|Ver solicitudes|· 28 días/)
  assert.match(source, /<dt>Visto<\/dt><dd>\{viewCounts\[property.id\] \|\| 0\}/)
  assert.ok(source.includes('href={`/mis-propiedades/${property.id}/solicitudes`}>Solicitudes</Link>'))
  assert.match(source, /Visualizaciones, solicitudes y conversión de los últimos 28 días/)
  assert.match(source, /<summary><span>Preferencias de contacto<\/span><\/summary>/)
  assert.match(source, /created_at, rejection_reason/)
  assert.match(css, /\.own-property-more-trigger\s*\{[^}]*width: 44px/)
})
test('panel: eliminar compacto no se ejecuta al renderizar ni cambia la confirmación existente', () => {
  const html = renderToStaticMarkup(createElement(DeletePropertyButton, { propertyId: 'synthetic', compact: true }))
  assert.match(html, /width:auto/)
  assert.match(html, /type="button"/)
  assert.match(html, />Eliminar<\/button>/)
  const source = readFileSync(new URL('components/DeletePropertyButton.tsx', root), 'utf8')
  assert.match(source, /window.confirm\(/)
  assert.match(source, /if \(!confirmed\)/)
  assert.match(source, /fetch\('\/api\/eliminar-propiedad'/)
})
test('requerimientos: sin título repetido ni marco exterior en ningún ancho, contenido y tag conservados', () => {
  const source = readFileSync(new URL('app/mis-propiedades/page.tsx', root), 'utf8')
  assert.doesNotMatch(source, /<small>REQUERIMIENTOS<\/small>/)
  assert.doesNotMatch(source, /requirements-panel__title/)
  assert.match(source, /className="requirements-panel" aria-label="Mis requerimientos"/)
  assert.match(source, /className="requirement-card"/)
  assert.match(source, /className="requirement-card__status"/)
  assert.match(source, /request.status === 'new' \? 'Nuevo'/)
  assert.match(css, /\.requirement-card\s*\{[^}]*background: var\(--primary-soft\)/)
  assert.match(css, /\.requirement-card__status\s*\{[^}]*align-self: flex-start/)
  assert.match(css, /\.requirements-panel\s*\{[^}]*padding: 0; border: 0;/)
  assert.doesNotMatch(css, /\.requirements-panel\s*\{[^}]*display: none/)
})

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
  assert.match(html, /\$7\.5 USD m²\/mes/)
  assert.match(html, /\$750 USD\/mes/)
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
  assert.match(html, /\$7\.5 USD m²\/mes/)
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
    if (!['/admin', '/perfil'].includes(path)) assert.match(html, new RegExp(`href="${path}"[^>]*aria-current="page"|aria-current="page"[^>]*href="${path}"`))
  })
}
test('Header: navegación de trabajo con cuatro destinos, perfil y notificaciones permanecen en cuenta', () => {
  globalThis.__uiPath = '/mis-propiedades'
  const html = renderToStaticMarkup(createElement(Header))
  const nav = html.match(/<nav\b[^>]*>[\s\S]*?<\/nav>/)?.[0]
  assert.ok(nav)
  for (const path of ['/mis-propiedades', '/publicar', '/inventario', '/busco-bodega']) assert.ok(nav.includes(`href="${path}"`))
  assert.doesNotMatch(nav, /href="\/perfil"|href="\/notificaciones"|site-nav__marker/)
  const source = readFileSync(new URL('components/Header.tsx', root), 'utf8')
  assert.match(source, /href="\/perfil" onClick=\{closeNavigation\}>Abrir mi perfil/)
  assert.match(source, /href="\/notificaciones" onClick=\{closeNavigation\}>Ver todas las notificaciones/)
})
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
  assert.match(html, /\$7\.5 USD m²\/mes/)
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
