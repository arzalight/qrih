import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { test } from 'node:test'
import babel from 'next/dist/compiled/babel/core.js'
import reactPreset from 'next/dist/compiled/babel/preset-react.js'
import typescriptPreset from 'next/dist/compiled/babel/preset-typescript.js'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const root = new URL('../', import.meta.url)
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'server-only') return { url: 'data:text/javascript,export{}', shortCircuit: true }
    if (specifier === './supabase-public-server') return { url: 'data:text/javascript,export function createPublicServerSupabaseClient(){return globalThis.__commercialClient}', shortCircuit: true }
    if (specifier === './property-image-urls') return { url: 'data:text/javascript,export const PROPERTY_IMAGE_TTL_SECONDS={gallery:900,pdf:300};export function propertyImagePaths(main,images){return [...new Set([main,...images.map(i=>i.storage_path)].filter(Boolean))]};export async function createSignedPropertyImageUrlMap(c,paths,ttl){return globalThis.__commercialSign(c,paths,ttl)}', shortCircuit: true }
    if (specifier.startsWith('@/')) {
      for (const suffix of ['.ts', '.tsx']) {
        const url = new URL(specifier.slice(2) + suffix, root)
        if (existsSync(url)) return next(url.href, context)
      }
    }
    if (specifier.startsWith('.') && context.parentURL?.startsWith(root.href)) {
      for (const suffix of ['.ts', '.tsx']) {
        const url = new URL(specifier + suffix, context.parentURL)
        if (existsSync(url)) return next(url.href, context)
      }
    }
    return next(specifier, context)
  },
  load(url, context, next) {
    if (url.endsWith('.tsx') && url.startsWith(root.href)) return { format: 'module', shortCircuit: true,
      source: babel.transformSync(readFileSync(new URL(url), 'utf8'), { filename: new URL(url).pathname,
        configFile: false, babelrc: false, presets: [[typescriptPreset, { allExtensions: true, isTSX: true }],
          [reactPreset, { runtime: 'automatic' }]] }).code }
    return next(url, context)
  },
})
const { propertyPrice, parsePriceInput, inventoryPriceFilters } = await import('../lib/property-price.ts')
const { canShareProperty, presentationLinks } = await import('../lib/property-sharing.ts')
const { loadCommercialProperty, COMMERCIAL_PROPERTY_COLUMNS } = await import('../lib/commercial-property-server.ts')
const { CommercialPropertySheet } = await import('../components/CommercialPropertySheet.tsx')
const { SharePropertyButton } = await import('../components/SharePropertyButton.tsx')
const { calculateMatch } = await import('../lib/matching.ts')
const base = { slug: 'synthetic-property', title: 'Propiedad sintética', zone: 'Zona autorizada', address: 'PRIVATE ADDRESS',
  location_visibility: 'zone', operation: 'Renta', price_value: '7.50', price_currency: 'USD', price_unit: 'm2', total_area: '5000' }

for (const [value, currency, unit, expected] of [
  ['135', 'MXN', 'm2', '$135 MXN/m²/mes'], ['7.50', 'USD', 'm2', 'US$7.50 USD/m²/mes'],
  ['675000', 'MXN', 'total', '$675,000 MXN/mes'], ['37500', 'USD', 'total', 'US$37,500 USD/mes'],
]) test(`moneda/formato exacto ${expected}`, () => {
  assert.equal(propertyPrice({ ...base, price_value: value, price_currency: currency, price_unit: unit }), expected)
})
test('decimal: multiplicación exacta, venta sin mensualidad y moneda desconocida sin inferir', () => {
  assert.equal(propertyPrice({ ...base, price_value: '0.10', total_area: '0.2' }, true), 'US$0.02 USD/mes')
  assert.equal(propertyPrice({ ...base, operation: 'Venta', price_unit: 'total' }), 'US$7.50 USD')
  assert.equal(propertyPrice({ ...base, price_currency: null }), 'Moneda no definida')
  assert.equal(propertyPrice({ ...base, price_value: null, price_display: 'Consultar precio' }), 'Consultar precio (USD)')
  assert.equal(propertyPrice(base, true), 'US$37,500 USD/mes')
  assert.equal(propertyPrice({ ...base, price_value: 999999999999.1, price_value_text: '999999999999.1234567', price_unit: 'total' }),
    'US$999,999,999,999.1234567 USD/mes', 'Priorizar decimal textual de PostgreSQL sobre JSON number')
})
test('precio de escritura: string decimal, límite y rechazo de floats implícitos', () => {
  assert.equal(parsePriceInput('007.50'), '7.5')
  assert.equal(parsePriceInput('123.4567'), '123.4567', 'No redondear precios históricos al editarlos')
  assert.equal(parsePriceInput('1000000000000'), '1000000000000')
  for (const invalid of ['', null, '-1', '0', 'NaN', 'Infinity', '1e3', '1,000', '7.5000000000001', '1000000000000.01']) assert.equal(parsePriceInput(invalid), null)
})
test('filtro de rango exige moneda, operación y unidad; valida límites sin convertir', () => {
  const q = { currency: 'USD', operation: 'Renta', price_unit: 'm2', price_min: '7.50', price_max: '10' }
  assert.equal(inventoryPriceFilters(q).invalid, false)
  assert.equal(inventoryPriceFilters({}).invalid, false)
  for (const change of [{ currency: '' }, { currency: 'EUR' }, { operation: '' }, { price_unit: '' }, { price_min: '11' }, { price_max: '7.49' }]) assert.equal(inventoryPriceFilters({ ...q, ...change }).invalid, true)
})
test('compartir: siete estados y cuenta deshabilitada, sólo published habilitado', () => {
  for (const status of ['draft', 'pending', 'paused', 'rejected', 'expired', 'pending_update']) assert.equal(canShareProperty(status, false), false)
  assert.equal(canShareProperty('published', false), true)
  assert.equal(canShareProperty('published', true), false)
  const html = renderToStaticMarkup(createElement(SharePropertyButton, { ...base, status: 'draft', disabled: false }))
  assert.match(html, /disabled/); assert.doesNotMatch(html, /href=|Copiar enlace|WhatsApp/)
})
test('enlace estable local y WhatsApp codificado, sin Storage ni tokens', () => {
  const links = presentationLinks('https://qrih-synthetic.invalid', 'property/name?x=1', 'Título & prueba')
  assert.equal(new URL(links.url).origin, 'https://qrih-synthetic.invalid')
  assert.equal(new URL(links.whatsapp).searchParams.get('text'), `Título & prueba\n${links.url}`)
  assert.doesNotMatch(links.url, /storage|token|supabase/)
})
function setup({ available = true, denied = false, error = false } = {}) {
  const state = { reads: [], signed: [] }
  globalThis.__commercialSign = async (_client, paths, ttl) => {
    if (denied) throw new Error('No tienes acceso a las imágenes solicitadas.')
    state.signed.push({ paths, ttl }); return new Map(paths.map(path => [path, 'https://synthetic.invalid/image']))
  }
  globalThis.__commercialClient = { from(table) {
    const result = { data: table === 'properties_public' ? (available ? { ...base, id: 'synthetic-id', status: 'published', main_image_path: 'owner/image.webp' } : null)
      : [{ storage_path: 'owner/image.webp', title: 'Portada', position: 0 }], error: error ? {} : null }
    const q = { select(columns) { state.reads.push([table, 'select', columns]); return q },
      eq(key, value) { state.reads.push([table, key, value]); return q }, order() { return q },
      maybeSingle: async () => result, then: (yes, no) => Promise.resolve(result).then(yes, no) }
    return q
  } }
  return state
}
test('cargador real: proyección pública explícita, estado published, dirección redactada y TTL acotado', async () => {
  for (const [purpose, ttl] of [['gallery', 900], ['pdf', 300]]) {
    const state = setup(), data = await loadCommercialProperty(base.slug, purpose)
    assert.equal(data.property.address, null)
    assert.deepEqual(state.signed[0], { paths: ['owner/image.webp'], ttl })
    assert.ok(state.reads.some(([table, key, value]) => table === 'properties_public' && key === 'status' && value === 'published'))
    assert.doesNotMatch(COMMERCIAL_PROPERTY_COLUMNS, /owner_id|previous_data|rejection_reason|phone|email/)
  }
})
test('no publicada/suspendida por frontera BD: ninguna firma; errores sin fallback privilegiado', async () => {
  const state = setup({ available: false })
  assert.equal(await loadCommercialProperty(base.slug, 'gallery'), null)
  assert.deepEqual(state.signed, [])
  setup({ denied: true }); await assert.rejects(loadCommercialProperty(base.slug, 'gallery'))
  setup({ error: true }); await assert.rejects(loadCommercialProperty(base.slug, 'gallery'))
})
test('HTML real: precio compartido, dirección sólo autorizada y sin contacto/captación/admin', () => {
  const html = renderToStaticMarkup(createElement(CommercialPropertySheet, { property: base, images: [] }))
  assert.match(html, /US\$7.50 USD\/m²\/mes/)
  assert.match(html, /US\$37,500 USD\/mes/)
  assert.doesNotMatch(html, /PRIVATE ADDRESS|<footer|<nav|<form|mailto:|tel:|\/admin|solicitar contacto/i)
  const visible = renderToStaticMarkup(createElement(CommercialPropertySheet, { property: { ...base, location_visibility: 'address', title: '<script>bad</script>' }, images: [] }))
  assert.match(visible, /PRIVATE ADDRESS/); assert.doesNotMatch(visible, /<script>bad/)
  const pdf = readFileSync(new URL('../app/api/bodegas/[slug]/pdf/route.tsx', import.meta.url), 'utf8')
  assert.match(pdf, /loadCommercialProperty\(slug, 'pdf'\)/)
  assert.match(pdf, /propertyPrice\(property, true\)/)
})
test('matching: presupuesto sin moneda o de otra moneda no compara importes', () => {
  const p = { ...base, surface_m2: 5000 }
  assert.equal(calculateMatch(p, { budget_min: 1, budget_max: 100000 }).budget, 0)
  assert.equal(calculateMatch(p, { budget_currency: 'MXN', budget_max: 100000 }).budget, 0)
  assert.equal(calculateMatch(p, { budget_currency: 'USD', budget_max: 100000 }).budget, 1)
})
test('migración propuesta: numeric conservado, default histórico confirmado, ACL/locks y sin conversión/borrados', () => {
  const sql = readFileSync(new URL('../supabase/migrations/20261020212846_052_commercial_currency.sql', import.meta.url), 'utf8')
  assert.match(sql, /data_type='numeric'/)
  assert.match(sql, /price_currency text not null default 'MXN'/)
  assert.doesNotMatch(sql, /price_currency drop default/)
  assert.match(sql, /if not \(p_changes \? 'price_currency'\) then v_new.price_currency:=v_source.price_currency/)
  assert.match(sql, /v_old.owner_id<>auth.uid\(\)/)
  assert.match(sql, /v_old.updated_at is distinct from p_expected_updated_at/)
  assert.match(sql, /15\*qrih_private.opportunity_range_score\(p.total_area,d.area_min,d.area_max\)/)
  assert.match(sql, /p.price_currency=\(to_jsonb\(d\)->>'budget_currency'\)/)
  assert.doesNotMatch(sql, /create policy|disable row level security|delete from|drop table|update storage\.|alter column price_value type/i)
})
