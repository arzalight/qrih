// Read-only helpers for the "Subir propiedad" guide (progress navigation and pre-submit summary).
// Nothing here writes to the form. Only the public commercial fields listed in SNAPSHOT_FIELDS are
// read: the address, owner data and every other private field are never read or displayed.

export type FormSnapshot = {
  values: Record<string, string | boolean>
  invalid: string[]
}

export const SNAPSHOT_FIELDS = [
  'title', 'operation', 'price', 'price_currency', 'commission',
  'zone_general', 'zone', 'visibility',
  'price_plus_vat', 'price_plus_maintenance', 'negotiable',
  'area', 'covered',
  'publication_authorized', 'terms_accepted',
] as const

const FIELD_LABELS: Record<string, string> = {
  title: 'Título de la propiedad',
  price: 'Precio',
  price_currency: 'Moneda',
  zone_general: 'Municipio',
  zone: 'Zona',
  area: 'Superficie total',
  publication_authorized: 'Declaración de autorización',
  terms_accepted: 'Aceptación de términos y aviso de privacidad',
}

export type PublishSection = {
  id: string
  label: string
  /** Controls that must be filled and valid for the section to be complete. */
  required: readonly string[]
  /** Optional sections never block anything. */
  optional?: boolean
  /** Photos are counted from the uploader state, not from the DOM. */
  photos?: boolean
}

export const PUBLISH_SECTIONS: readonly PublishSection[] = [
  { id: 'seccion-general', label: 'Propiedad y precio', required: ['title', 'price', 'price_currency'] },
  { id: 'seccion-ubicacion', label: 'Ubicación', required: ['zone_general', 'zone'] },
  { id: 'seccion-condiciones', label: 'Condiciones', required: [], optional: true },
  { id: 'seccion-superficies', label: 'Superficies', required: ['area'] },
  { id: 'seccion-fotos', label: 'Fotografías', required: [], photos: true },
  { id: 'seccion-envio', label: 'Autorización', required: ['publication_authorized', 'terms_accepted'] },
]

type ControlLike = {
  type?: string
  value?: string
  checked?: boolean
  disabled?: boolean
  validity?: { valid: boolean }
}

/** Reads the whitelisted public fields. Accepts anything shaped like HTMLFormElement.elements. */
export function readFormSnapshot(form: { elements: { namedItem(name: string): unknown } }): FormSnapshot {
  const values: FormSnapshot['values'] = {}
  const invalid: string[] = []
  for (const name of SNAPSHOT_FIELDS) {
    const found = form.elements.namedItem(name)
    if (!found || typeof found !== 'object' || !('value' in found)) continue
    const control = found as ControlLike
    values[name] = control.type === 'checkbox' ? Boolean(control.checked) : String(control.value ?? '')
    if (control.validity && !control.validity.valid && !control.disabled) invalid.push(name)
  }
  return { values, invalid }
}

function filled(snapshot: FormSnapshot, name: string) {
  const value = snapshot.values[name]
  const present = typeof value === 'boolean' ? value : String(value ?? '').trim() !== ''
  return present && !snapshot.invalid.includes(name)
}

export type SectionState = {
  id: string
  label: string
  state: 'complete' | 'pending' | 'optional'
  missing: string[]
}

export function sectionStates(snapshot: FormSnapshot, photoCount: number): SectionState[] {
  return PUBLISH_SECTIONS.map((section) => {
    if (section.optional) return { id: section.id, label: section.label, state: 'optional', missing: [] }
    const missing = section.required.filter((name) => !filled(snapshot, name)).map((name) => FIELD_LABELS[name] ?? name)
    if (section.photos && photoCount < 1) missing.push('Al menos una fotografía')
    return { id: section.id, label: section.label, state: missing.length ? 'pending' : 'complete', missing }
  })
}

const nf = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 })
function number(value: string | boolean | undefined) {
  const text = String(value ?? '').trim()
  const n = Number(text)
  return text !== '' && Number.isFinite(n) ? nf.format(n) : text
}

export type SummaryRow = { label: string; value: string; missing: boolean }

/** Human-readable recap of the public commercial data (never the address or private data). */
export function summaryRows(snapshot: FormSnapshot, photoCount: number): SummaryRow[] {
  const v = snapshot.values
  const text = (name: string) => String(v[name] ?? '').trim()
  const rent = text('operation') === 'Renta'

  const price = text('price') && !snapshot.invalid.includes('price')
    ? [`${text('operation') || 'Operación'} · $${number(v.price)}`, text('price_currency'), rent ? 'por m²/mes' : 'precio total']
      .filter(Boolean).join(' ')
    : ''
  const extras = [
    v.price_plus_vat && '+IVA',
    v.price_plus_maintenance && 'más mantenimiento',
    v.negotiable && 'negociable',
  ].filter(Boolean).join(', ')

  const place = [text('zone_general'), text('zone')].filter(Boolean).join(' · ')
  const visibility = text('visibility') === 'address'
    ? 'se mostrará la dirección completa'
    : 'se mostrará únicamente la zona'

  const area = text('area') && !snapshot.invalid.includes('area') ? `${number(v.area)} m² totales` : ''
  const covered = text('covered') && !snapshot.invalid.includes('covered') ? `${number(v.covered)} m² techados` : ''

  return [
    { label: 'Título', value: text('title'), missing: !text('title') },
    { label: 'Precio', value: price ? (extras ? `${price} (${extras})` : price) : '', missing: !price },
    { label: 'Comisión', value: v.commission ? 'Comparto comisión' : 'No comparto comisión', missing: false },
    { label: 'Ubicación', value: place ? `${place}; ${visibility}` : '', missing: !text('zone_general') || !text('zone') },
    { label: 'Superficie', value: [area, covered].filter(Boolean).join(' · '), missing: !area },
    {
      label: 'Fotografías',
      value: photoCount > 0
        ? `${photoCount} ${photoCount === 1 ? 'fotografía' : 'fotografías'}`
        : 'Sin fotografías',
      missing: photoCount < 1,
    },
  ]
}

export type ReadyState = 'ready' | 'draft-only' | 'incomplete'

/** ready: can be sent to review; draft-only: only photos missing; incomplete: required data missing. */
export function readiness(states: SectionState[]): ReadyState {
  const blocking = states.filter((s) => s.state === 'pending' && s.id !== 'seccion-fotos')
  if (blocking.length) return 'incomplete'
  return states.find((s) => s.id === 'seccion-fotos')?.state === 'pending' ? 'draft-only' : 'ready'
}
