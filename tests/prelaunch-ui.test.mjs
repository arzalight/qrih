import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

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
