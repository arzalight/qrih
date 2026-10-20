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

export function PropertyCard({ property: p }: { property: Property }) {
  return (
    <Link href={`/bodegas/${p.slug}`} className="card">
      <div
        className="photo"
        style={{
          backgroundImage: p.main_image
            ? `url(${p.main_image})`
            : 'none',
        }}
      >
        <span>
          {p.operation} · {p.zone}
        </span>

        {p.share_commission && (
          <em>🤝 COLABORABLE</em>
        )}
      </div>

      <div className="cardBody">
        <small>{p.zone.toUpperCase()}, QUERÉTARO</small>

        <h3>{p.title}</h3>

        <b>{propertyPrice(p)}</b>

        <p>
          {(p.total_area || 0).toLocaleString()} m² ·{' '}
          {(p.covered_area || 0).toLocaleString()} m² techados · Altura{' '}
          {p.max_height || 'N/D'}
        </p>
      </div>
    </Link>
  )
}
