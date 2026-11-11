import test from 'node:test'
import assert from 'node:assert/strict'
import {
  AREA_LABELS,
  carriedParams,
  formatMaxHeight,
  formatPropertyTitle,
  INVENTORY_SORTS,
  inventoryFilterChips,
  parseInventorySort,
  propertySpecs,
} from '../lib/property-display.ts'

const places = ['Santa Rosa Jáuregui', 'Querétaro Norte', 'El Marqués', 'Colón', 'San Juan del Río', 'Conín']

test('títulos en mayúsculas se muestran en formato título, con tildes de zonas conocidas', () => {
  assert.equal(formatPropertyTitle('BODEGA EN RENTA | El Marqués', places), 'Bodega en Renta | El Marqués')
  assert.equal(formatPropertyTitle('BODEGA EN RENTA | SANTA ROSA JAUREGUI', places), 'Bodega en Renta | Santa Rosa Jáuregui')
  assert.equal(formatPropertyTitle('NAVE INDSUTRIAL EN RENTA EN COLON', places), 'Nave Industrial en Renta en Colón')
  assert.equal(formatPropertyTitle('BODEGA EN RENTA | CONÍN', places), 'Bodega en Renta | Conín')
})

test('siglas y medidas se conservan', () => {
  assert.equal(
    formatPropertyTitle('NAVE INDUSTRIAL EN RENTA EN PARQUE INDUSTRIAL QUERÉTARO (PIQ)'),
    'Nave Industrial en Renta en Parque Industrial Querétaro (PIQ)',
  )
  assert.equal(formatPropertyTitle('NAVE 5,000 M2 EN RENTA'), 'Nave 5,000 M2 en Renta')
})

test('títulos que ya se leen bien no se alteran', () => {
  assert.equal(formatPropertyTitle('Bodega de prueba'), 'Bodega de prueba')
  assert.equal(formatPropertyTitle('Nave Industrial en Renta | Colón'), 'Nave Industrial en Renta | Colón')
  assert.equal(formatPropertyTitle('  Bodega   de   prueba '), 'Bodega de prueba')
  assert.equal(formatPropertyTitle(null), '')
  assert.equal(formatPropertyTitle('PIQ'), 'PIQ')
})

test('altura: unidad uniforme y sin N/D', () => {
  assert.equal(formatMaxHeight('9.5'), '9.5 m')
  assert.equal(formatMaxHeight('9.5 m'), '9.5 m')
  assert.equal(formatMaxHeight('9m'), '9 m')
  assert.equal(formatMaxHeight('8,14'), '8.14 m')
  assert.equal(formatMaxHeight('N/D'), null)
  assert.equal(formatMaxHeight('n/d'), null)
  assert.equal(formatMaxHeight(''), null)
  assert.equal(formatMaxHeight(null), null)
  assert.equal(formatMaxHeight('10 m libres'), '10 m libres')
})

test('especificaciones de tarjeta: solo datos existentes', () => {
  assert.deepEqual(
    propertySpecs({ total_area: 1200, covered_area: 1050, max_height: '9.5' }),
    ['1,200 m²', '1,050 m² techados', 'Altura 9.5 m'],
  )
  assert.deepEqual(propertySpecs({ total_area: 208, covered_area: 0, max_height: 'N/D' }), ['208 m²'])
  assert.deepEqual(propertySpecs({ total_area: 508.61, covered_area: 480, max_height: null }), ['508.61 m²', '480 m² techados'])
  assert.deepEqual(propertySpecs({}), [])
})

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
