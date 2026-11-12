// Presentation helpers for the public inventory (sorting and applied-filter chips).
// Display only: nothing here is written to the database, and prices live in property-price.ts.

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
