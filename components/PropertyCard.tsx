import Link from 'next/link'

type Property = {
  id: string
  slug: string
  title: string
  operation: string
  zone: string
  price_display: string
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

        <b>{p.price_display}</b>

        <p>
          {(p.total_area || 0).toLocaleString()} m² ·{' '}
          {(p.covered_area || 0).toLocaleString()} m² techados · Altura{' '}
          {p.max_height || 'N/D'}
        </p>
      </div>
    </Link>
  )
}
