// Presentation helpers for the public inventory. Display only: nothing here is
// written back to the database, and prices live exclusively in property-price.ts.

const SMALL_WORDS = new Set([
  'a', 'al', 'con', 'de', 'del', 'e', 'el', 'en', 'la', 'las', 'los', 'o', 'para', 'por', 'sin', 'u', 'un', 'una', 'y',
])
const ACRONYMS = new Set(['piq', 'bts', 'cedis'])
// Typos observed in published titles. A display fallback; the data itself should be corrected.
const TYPOS: Record<string, string> = { indsutrial: 'industrial', industial: 'industrial', bodgea: 'bodega' }

function stripAccents(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

const accentMaps = new WeakMap<readonly string[], Map<string, string>>()
// Words from known place names that carry an accent, keyed by their unaccented lowercase form,
// so "JAUREGUI" can be shown as "Jáuregui".
function accentMap(placeNames: readonly string[]) {
  let map = accentMaps.get(placeNames)
  if (map) return map
  map = new Map()
  for (const name of placeNames) {
    for (const word of name.split(/[\s/()]+/u)) {
      const plain = stripAccents(word)
      if (plain !== word && !map.has(plain.toLocaleLowerCase('es-MX'))) map.set(plain.toLocaleLowerCase('es-MX'), word)
    }
  }
  accentMaps.set(placeNames, map)
  return map
}

/**
 * Titles typed in ALL CAPS (or mostly caps) are shown in title case. Titles that already read
 * normally are returned untouched, apart from collapsing repeated whitespace.
 */
export function formatPropertyTitle(raw: string | null | undefined, placeNames: readonly string[] = []): string {
  const title = String(raw ?? '').replace(/\s+/g, ' ').trim()
  if (!title) return ''
  const letters = title.match(/\p{L}/gu) || []
  const upper = title.match(/\p{Lu}/gu) || []
  if (letters.length < 4 || upper.length / letters.length < 0.5) return title

  const accents = accentMap(placeNames)
  let atStart = true
  return title.split(/(\s+|\|)/u).map((part) => {
    if (part === '' || /^\s+$/u.test(part)) return part
    if (part === '|') { atStart = true; return part }
    const [, pre = '', core = '', post = ''] = /^([^\p{L}\p{N}]*)([\s\S]*?)([^\p{L}\p{N}]*)$/u.exec(part) || []
    const lower = core.toLocaleLowerCase('es-MX')
    let word: string
    if (/[\d²³]/u.test(core)) word = core
    else if (ACRONYMS.has(lower)) word = core.toLocaleUpperCase('es-MX')
    else {
      const fixed = TYPOS[lower] ?? lower
      const accented = accents.get(stripAccents(fixed))
      word = accented
        ? accented.charAt(0).toLocaleUpperCase('es-MX') + accented.slice(1).toLocaleLowerCase('es-MX')
        : !atStart && SMALL_WORDS.has(fixed)
          ? fixed
          : fixed.charAt(0).toLocaleUpperCase('es-MX') + fixed.slice(1)
    }
    atStart = false
    return pre + word + post
  }).join('')
}

/** "9.5", "9.5m" and "9.5 m" all become "9.5 m"; empty and "N/D" values become null. */
export function formatMaxHeight(value: string | number | null | undefined): string | null {
  const text = String(value ?? '').trim()
  if (!text || /^(n\/?d|n\/?a|nd|na|-+|0)$/i.test(text)) return null
  const match = /^(\d+(?:[.,]\d+)?)\s*(?:m|mts?|metros?)?\.?$/i.exec(text)
  if (match) return `${match[1].replace(',', '.')} m`
  return text
}

const nf = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 })
export function formatArea(value: number | string | null | undefined): string | null {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? `${nf.format(n)} m²` : null
}

/** Specs line for a card: only the parts that actually have data. */
export function propertySpecs(p: {
  total_area?: number | string | null
  covered_area?: number | string | null
  max_height?: string | null
}): string[] {
  const total = formatArea(p.total_area)
  const covered = formatArea(p.covered_area)
  const height = formatMaxHeight(p.max_height)
  return [total, covered && `${covered} techados`, height && `Altura ${height}`].filter(Boolean) as string[]
}

export const INVENTORY_SORTS = [
  { value: 'destacadas', label: 'Destacadas primero', orders: [['featured', false], ['created_at', false]] },
  { value: 'recientes', label: 'Más recientes', orders: [['created_at', false]] },
  { value: 'superficie_desc', label: 'Mayor superficie', orders: [['total_area', false], ['created_at', false]] },
  { value: 'superficie_asc', label: 'Menor superficie', orders: [['total_area', true], ['created_at', false]] },
] as const
export type InventorySort = (typeof INVENTORY_SORTS)[number]

export function parseInventorySort(value: string | undefined): InventorySort {
  return INVENTORY_SORTS.find((sort) => sort.value === value) ?? INVENTORY_SORTS[0]
}

export const AREA_LABELS: Record<string, string> = {
  '0-200': 'Menos de 200 m²',
  '200-500': '200 a 500 m²',
  '500-1000': '500 a 1,000 m²',
  '1000-2000': '1,000 a 2,000 m²',
  '2000+': 'Más de 2,000 m²',
}

type Query = Record<string, string | undefined>

/** Params to carry over to links and forms: every non-empty value except the excluded keys. */
export function carriedParams(query: Query, exclude: readonly string[] = []): [string, string][] {
  return Object.entries(query).filter((entry): entry is [string, string] =>
    typeof entry[1] === 'string' && entry[1] !== '' && !exclude.includes(entry[0]))
}

/** One removable chip per applied filter (price filters are intentionally not shown here). */
export function inventoryFilterChips(query: Query): { key: string; label: string; href: string }[] {
  const chips: { key: string; label: string; remove: string[] }[] = []
  if (query.operation) chips.push({ key: 'operation', label: query.operation, remove: ['operation'] })
  if (query.zone_general) chips.push({ key: 'zone_general', label: query.zone_general, remove: ['zone_general', 'zone'] })
  if (query.zone && query.zone_general) chips.push({ key: 'zone', label: query.zone, remove: ['zone'] })
  if (query.area && AREA_LABELS[query.area]) chips.push({ key: 'area', label: AREA_LABELS[query.area], remove: ['area'] })
  return chips.map(({ key, label, remove }) => {
    const search = new URLSearchParams(carriedParams(query, remove)).toString()
    return { key, label, href: search ? `/inventario?${search}` : '/inventario' }
  })
}
