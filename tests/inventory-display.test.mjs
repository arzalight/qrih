import test from 'node:test'
import assert from 'node:assert/strict'
import {
  AREA_LABELS,
  carriedParams,
  INVENTORY_SORTS,
  inventoryFilterChips,
  parseInventorySort,
} from '../lib/property-display.ts'

test('orden: valor desconocido cae en destacadas y las opciones son una lista cerrada', () => {
  assert.equal(parseInventorySort(undefined).value, 'destacadas')
  assert.equal(parseInventorySort('price; drop table').value, 'destacadas')
  assert.equal(parseInventorySort('superficie_desc').value, 'superficie_desc')
  assert.deepEqual(INVENTORY_SORTS.map((s) => s.value), ['destacadas', 'recientes', 'superficie_desc', 'superficie_asc'])
  for (const sort of INVENTORY_SORTS) assert.ok(sort.orders.every(([column]) => ['featured', 'created_at', 'total_area'].includes(column)))
})

test('chips: un enlace por filtro que conserva el resto de parámetros', () => {
  const chips = inventoryFilterChips({
    operation: 'Renta', zone_general: 'Colón', zone: 'Zona X', area: '500-1000', sort: 'recientes', currency: 'MXN',
  })
  assert.deepEqual(chips.map((c) => c.key), ['operation', 'zone_general', 'zone', 'area'])
  assert.equal(chips[3].label, AREA_LABELS['500-1000'])
  const quitarZonaGeneral = new URL(chips[1].href, 'https://x.test').searchParams
  assert.equal(quitarZonaGeneral.get('zone_general'), null)
  assert.equal(quitarZonaGeneral.get('zone'), null, 'quitar la zona general quita también la industrial dependiente')
  assert.equal(quitarZonaGeneral.get('operation'), 'Renta')
  assert.equal(quitarZonaGeneral.get('sort'), 'recientes')
  assert.equal(quitarZonaGeneral.get('currency'), 'MXN')
  assert.equal(inventoryFilterChips({ operation: 'Venta' })[0].href, '/inventario')
  assert.deepEqual(inventoryFilterChips({}), [])
  assert.deepEqual(inventoryFilterChips({ area: 'valor-inventado' }), [])
})

test('carriedParams omite vacíos y claves excluidas', () => {
  assert.deepEqual(carriedParams({ a: '1', b: '', c: undefined, sort: 'x' }, ['sort']), [['a', '1']])
})
