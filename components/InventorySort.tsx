import Link from 'next/link'
import { carriedParams, INVENTORY_SORTS, type InventorySort as SortOption } from '@/lib/property-display'

function sortHref(query: Record<string, string | undefined>, sortValue: string) {
  const params = new URLSearchParams(carriedParams(query, ['sort']))
  if (sortValue !== 'destacadas') {
    params.set('sort', sortValue)
  }
  const qs = params.toString()
  return qs ? `/inventario?${qs}` : '/inventario'
}

function SortIcon({ value }: { value: SortOption['value'] }) {
  if (value === 'destacadas') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9Z" />
      </svg>
    )
  }
  if (value === 'recientes') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
      </svg>
    )
  }
  if (value === 'superficie_desc') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 6h11" />
        <path d="M4 12h8" />
        <path d="M4 18h5" />
        <path d="M18 7v11" />
        <path d="m15 15 3 3 3-3" />
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 18h11" />
      <path d="M4 12h8" />
      <path d="M4 6h5" />
      <path d="M18 17V6" />
      <path d="m15 9 3-3 3 3" />
    </svg>
  )
}

// Pure GET links (works without JavaScript) carrying active filters so sorting never resets them.
export function InventorySort({
  value,
  query,
}: {
  value: string
  query: Record<string, string | undefined>
}) {
  return (
    <nav className="inventory-sort" aria-label="Ordenar propiedades">
      {INVENTORY_SORTS.map((sort) => {
        const active = value === sort.value
        return (
          <Link
            key={sort.value}
            href={sortHref(query, sort.value)}
            className={`inventory-sort__btn${active ? ' inventory-sort__btn--active' : ''}`}
            aria-label={`Ordenar: ${sort.label}`}
            aria-current={active ? 'true' : undefined}
            title={sort.label}
            data-tooltip={sort.label}
          >
            <SortIcon value={sort.value} />
          </Link>
        )
      })}
    </nav>
  )
}
