import Link from 'next/link'
import { propertyPrice } from '@/lib/property-price'
import { formatPropertyTitle, propertySpecs } from '@/lib/property-display'
import { ZONAS_GENERALES, ZONAS_INDUSTRIALES_POR_ZONA } from '@/lib/zonas'

type Property = {
  id: string
  slug: string
  title: string
  operation: string
  zone: string
  zone_general?: string | null
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

const PLACE_NAMES = [...ZONAS_GENERALES, ...Object.values(ZONAS_INDUSTRIALES_POR_ZONA).flat()]

export function PropertyCard({ property: p }: { property: Property }) {
  const title = formatPropertyTitle(p.title, PLACE_NAMES)
  const specs = propertySpecs(p)

  return (
    <Link href={`/bodegas/${p.slug}`} className="card">
      <div className="photo">
        {p.main_image ? <img src={p.main_image} alt={title} loading="lazy" decoding="async" width={640} height={400} />
          : <div className="photo__empty">Fotografía no disponible</div>}
        <span>
          {p.operation} · {p.zone}
        </span>

        {p.share_commission && (
          <em title="Esta propiedad comparte comisión con asesores colaboradores">
            <span aria-hidden="true">🤝</span> COLABORABLE
          </em>
        )}
      </div>

      <div className="cardBody">
        {p.zone_general && <small>{p.zone_general.toUpperCase()}</small>}

        <h3>{title}</h3>

        <b>{propertyPrice(p)}</b>

        <p>{specs.length > 0 ? specs.join(' · ') : 'Características por confirmar'}</p>
      </div>
    </Link>
  )
}
