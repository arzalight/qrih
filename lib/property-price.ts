// Decimal strings cross the write boundary unchanged; never multiply money as float.
export type PriceCurrency = 'MXN' | 'USD'
export type PricedProperty = {
  price_value?: string | number | null
  price_value_text?: string | null
  price_currency?: string | null
  price_unit?: string | null
  price_display?: string | null
  operation?: string | null
  total_area?: string | number | null
}
export function isPriceCurrency(value: unknown): value is PriceCurrency {
  return value === 'MXN' || value === 'USD'
}
function decimal(value: unknown) {
  const match = /^(\d{1,16})(?:\.(\d{1,12}))?$/.exec(String(value ?? '').trim())
  if (!match) return null
  const fraction = match[2] || ''
  return { n: BigInt(match[1] + fraction), scale: fraction.length }
}
function power(n: number) { return BigInt(10) ** BigInt(n) }
function decimalText(n: bigint, scale: number) {
  const digits = n.toString().padStart(scale + 1, '0')
  return scale ? `${digits.slice(0, -scale)}.${digits.slice(-scale)}`.replace(/\.?0+$/, '') : digits
}
export function parsePriceInput(value: unknown): string | null {
  const d = decimal(value)
  if (!d || d.n <= BigInt(0) || d.n > BigInt('1000000000000') * power(d.scale)) return null
  return decimalText(d.n, d.scale)
}
function money(value: string, currency: PriceCurrency, storedFormat: boolean) {
  const [integer, fraction = ''] = value.split('.')
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const cents = fraction ? `.${storedFormat ? fraction.padEnd(2, '0') : fraction}` : ''
  return `${storedFormat && currency === 'USD' ? 'US$' : '$'}${grouped}${cents} ${currency}`
}
// Normalize recognizable legacy announcements for display only, preserving their
// explicit unit and existing Renta/month convention. Unknown units are never
// inferred from operation or area.
function legacyAnnouncement(property: PricedProperty, storedFormat: boolean): string {
  const text = property.price_display || ''
  if (storedFormat) return `${text} (${property.price_currency})`
  const match = /^(?:US\$|\$)?\s*((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)\s*(?:MXN|USD)?\s*(\/?m[²2])?(\/mes)?\s*(?:\(?\s*(?:MXN|USD)\s*\)?)?$/i.exec(text.trim())
  const d = match && decimal(match[1].replaceAll(',', ''))
  if (!match || !d || !isPriceCurrency(property.price_currency)) return `${text} (${property.price_currency})`
  return money(decimalText(d.n, d.scale), property.price_currency, false)
    + (match[2] ? ' m²' : '') + (match[3] || (property.operation?.toLowerCase() === 'renta' ? '/mes' : ''))
}
function formatPropertyPrice(property: PricedProperty, total: boolean, storedFormat: boolean): string {
  if (!isPriceCurrency(property.price_currency)) return 'Moneda no definida'
  const d = decimal(property.price_value_text ?? property.price_value)
  if (!d) return property.price_display ? legacyAnnouncement(property, storedFormat) : 'Consultar'
  const normalizedUnit = (property.price_unit || '').trim().toLowerCase()
  if (!['m2', 'm²', 'total'].includes(normalizedUnit)) {
    // Missing legacy units are unknown, not an implicit total/month amount.
    // Preserve the original announcement; never label it as a calculated total.
    if (total) return 'Consultar unidad de precio'
    return property.price_display ? legacyAnnouncement(property, storedFormat) : 'Consultar unidad de precio'
  }
  const perArea = ['m2', 'm²'].includes(normalizedUnit)
  const area = total && perArea ? decimal(property.total_area) : null
  if (total && perArea && !area) return 'Consultar'
  const amount = area ? decimalText(d.n * area.n, d.scale + area.scale) : decimalText(d.n, d.scale)
  const unit = perArea && !total ? (storedFormat ? '/m²' : ' m²') : ''
  // Preserve the portal's existing Renta/month convention; Venta has no period.
  const period = property.operation?.toLowerCase() === 'renta' ? '/mes' : ''
  return money(amount, property.price_currency, storedFormat) + unit + period
}

export function propertyPrice(property: PricedProperty, total = false): string {
  return formatPropertyPrice(property, total, false)
}

// Visual changes must not alter price_display produced by existing writes.
export function propertyPriceForStorage(property: PricedProperty): string {
  return formatPropertyPrice(property, false, true)
}

export function inventoryPriceFilters(query: { currency?: string; price_min?: string; price_max?: string; price_unit?: string; operation?: string }) {
  const hasRange = Boolean(query.price_min || query.price_max)
  const min = query.price_min ? parsePriceInput(query.price_min) : null
  const max = query.price_max ? parsePriceInput(query.price_max) : null
  const greater = (a: string, b: string) => {
    const x = decimal(a)!, y = decimal(b)!
    return x.n * power(y.scale) > y.n * power(x.scale)
  }
  const invalid = Boolean((query.currency && !isPriceCurrency(query.currency)) || (hasRange && (
    !isPriceCurrency(query.currency) || !['Renta', 'Venta'].includes(query.operation || '')
    || !['m2', 'total'].includes(query.price_unit || '') || (query.price_min && !min) || (query.price_max && !max)
    || (min && max && greater(min, max))
  )))
  return { invalid, min, max, currency: isPriceCurrency(query.currency) ? query.currency : null,
    unit: hasRange ? query.price_unit : null }
}
