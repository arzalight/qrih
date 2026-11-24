import Link from 'next/link'
import { propertyPrice } from '@/lib/property-price'

type Property = {
  id: string
  slug: string
  title: string
  operation: string
  zone: string
  price_display: string
  price_value?: number | string | null
  price_currency?: string | null
  price_unit?: string | null
  total_area: number | null
  covered_area: number | null
  max_height: string | null
  share_commission: boolean | null
  main_image: string | null
}

function formatMaxHeight(value: string | null) {
  const trimmed = (value || '').trim()
  if (!trimmed) return 'N/D'
  return /^\d+(?:[.,]\d+)?$/.test(trimmed) ? `${trimmed} m` : trimmed
}

export function PropertyCard({ property: p }: { property: Property }) {
  return (
    <Link href={`/bodegas/${p.slug}`} className="card">
      <div className="photo">
        {p.main_image ? <img src={p.main_image} alt={p.title} loading="lazy" decoding="async" width={640} height={400} />
          : <div className="photo__empty">Fotografía no disponible</div>}
        <span>
          {p.operation} · {p.zone}
        </span>

        {p.share_commission && (
          <em>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 17a4 4 0 0 1-5.6 0l-1.7-1.7a4 4 0 0 1 0-5.6l3-3a4 4 0 0 1 5.6 0" />
              <path d="M13 7a4 4 0 0 1 5.6 0l1.7 1.7a4 4 0 0 1 0 5.6l-3 3a4 4 0 0 1-5.6 0" />
            </svg>
            COLABORABLE
          </em>
        )}
      </div>

      <div className="cardBody">
        <small>{p.zone.toUpperCase()}, QUERÉTARO</small>

        <h3>{p.title}</h3>

        <b>{propertyPrice(p)}</b>

        <p>
          {(p.total_area || 0).toLocaleString('es-MX')} m² ·{' '}
          {(p.covered_area || 0).toLocaleString('es-MX')} m² techados · Altura{' '}
          {formatMaxHeight(p.max_height)}
        </p>
      </div>
    </Link>
  )
}
