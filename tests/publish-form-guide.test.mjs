import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PUBLISH_SECTIONS,
  SNAPSHOT_FIELDS,
  readFormSnapshot,
  readiness,
  sectionStates,
  summaryRows,
} from '../lib/publish-form-guide.ts'

const complete = {
  values: {
    title: 'Nave en Colón', operation: 'Renta', price: '135', price_currency: 'MXN', commission: true,
    zone_general: 'Colón', zone: 'Parque X', visibility: 'zone',
    price_plus_vat: true, price_plus_maintenance: false, negotiable: true,
    area: '1200', covered: '1050', publication_authorized: true, terms_accepted: true,
  },
  invalid: [],
}

test('guía: nunca lee dirección, datos del propietario ni campos privados', () => {
  for (const name of ['address', 'owner_name', 'owner_phone', 'owner_email', 'owner_notes', 'internal_name', 'pending_owner', 'owner_contact_id', 'description']) {
    assert.ok(!SNAPSHOT_FIELDS.includes(name), `${name} no debe leerse`)
  }
  const asked = []
  readFormSnapshot({ elements: { namedItem: (name) => { asked.push(name); return null } } })
  assert.deepEqual(asked, [...SNAPSHOT_FIELDS])
})

test('guía: lee texto, casillas y validez; ignora controles ausentes o inválidos por tipo', () => {
  const controls = {
    title: { type: 'text', value: 'Nave', validity: { valid: true } },
    price: { type: 'number', value: '-1', validity: { valid: false }, disabled: false },
    zone: { type: 'select-one', value: '', validity: { valid: true }, disabled: true },
    commission: { type: 'checkbox', value: 'on', checked: true, validity: { valid: true } },
    operation: undefined,
  }
  const snapshot = readFormSnapshot({ elements: { namedItem: (name) => controls[name] ?? null } })
  assert.equal(snapshot.values.title, 'Nave')
  assert.equal(snapshot.values.commission, true)
  assert.equal(snapshot.values.zone, '')
  assert.ok(!('operation' in snapshot.values))
  assert.deepEqual(snapshot.invalid, ['price'])
})

test('secciones: formulario vacío deja pendientes las obligatorias y opcional la de condiciones', () => {
  const states = sectionStates({ values: {}, invalid: [] }, 0)
  assert.deepEqual(states.map((s) => s.id), PUBLISH_SECTIONS.map((s) => s.id))
  const byId = Object.fromEntries(states.map((s) => [s.id, s]))
  assert.equal(byId['seccion-condiciones'].state, 'optional')
  for (const id of ['seccion-general', 'seccion-ubicacion', 'seccion-superficies', 'seccion-fotos', 'seccion-envio']) {
    assert.equal(byId[id].state, 'pending', id)
  }
  assert.deepEqual(byId['seccion-general'].missing, ['Título de la propiedad', 'Precio', 'Moneda'])
  assert.deepEqual(byId['seccion-fotos'].missing, ['Al menos una fotografía'])
})

test('secciones: todo capturado y una foto deja todo completo', () => {
  const states = sectionStates(complete, 1)
  assert.deepEqual(states.filter((s) => s.state === 'pending'), [])
  assert.equal(readiness(states), 'ready')
})

test('secciones: un valor inválido o solo espacios no cuenta como capturado', () => {
  const states = sectionStates({ values: { ...complete.values, title: '   ', price: '0' }, invalid: ['price'] }, 1)
  assert.deepEqual(states.find((s) => s.id === 'seccion-general').missing, ['Título de la propiedad', 'Precio'])
})

test('secciones: casillas obligatorias sin marcar bloquean la autorización', () => {
  const states = sectionStates({ values: { ...complete.values, terms_accepted: false }, invalid: [] }, 1)
  assert.deepEqual(states.find((s) => s.id === 'seccion-envio').missing, ['Aceptación de términos y aviso de privacidad'])
})

test('estado: sin fotos solo permite borrador; con datos faltantes está incompleto', () => {
  assert.equal(readiness(sectionStates(complete, 0)), 'draft-only')
  assert.equal(readiness(sectionStates({ values: {}, invalid: [] }, 0)), 'incomplete')
  assert.equal(readiness(sectionStates({ values: { ...complete.values, area: '' }, invalid: [] }, 3)), 'incomplete')
})

test('resumen: precio, ubicación y superficie legibles y sin la dirección', () => {
  const rows = Object.fromEntries(summaryRows({ ...complete, values: { ...complete.values, address: 'Calle secreta 1' } }, 3).map((r) => [r.label, r]))
  assert.equal(rows['Precio'].value, 'Renta · $135 MXN por m²/mes (+IVA, negociable)')
  assert.equal(rows['Comisión'].value, 'Comparto comisión')
  assert.equal(rows['Ubicación'].value, 'Colón · Parque X; se mostrará únicamente la zona')
  assert.equal(rows['Superficie'].value, '1,200 m² totales · 1,050 m² techados')
  assert.equal(rows['Fotografías'].value, '3 fotografías')
  assert.ok(Object.values(rows).every((r) => !r.missing))
  assert.ok(!JSON.stringify(rows).includes('secreta'))
})

test('resumen: venta, visibilidad de dirección y singular de fotografía', () => {
  const rows = Object.fromEntries(summaryRows({
    ...complete,
    values: { ...complete.values, operation: 'Venta', price: '12500000', price_currency: 'USD', visibility: 'address', commission: false, price_plus_vat: false, negotiable: false },
  }, 1).map((r) => [r.label, r]))
  assert.equal(rows['Precio'].value, 'Venta · $12,500,000 USD precio total')
  assert.equal(rows['Comisión'].value, 'No comparto comisión')
  assert.match(rows['Ubicación'].value, /se mostrará la dirección completa$/)
  assert.equal(rows['Fotografías'].value, '1 fotografía')
})

test('resumen: campos faltantes o inválidos se marcan sin inventar valores', () => {
  const rows = Object.fromEntries(summaryRows({ values: { operation: 'Renta', price: '-5', area: '0' }, invalid: ['price', 'area'] }, 0).map((r) => [r.label, r]))
  for (const label of ['Título', 'Precio', 'Ubicación', 'Superficie', 'Fotografías']) {
    assert.equal(rows[label].missing, true, label)
  }
  assert.equal(rows['Precio'].value, '')
  assert.equal(rows['Superficie'].value, '')
  assert.equal(rows['Fotografías'].value, 'Sin fotografías')
})
