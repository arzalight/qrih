import { PropertyImageGallery, type GalleryImage } from './PropertyImageGallery'
import { propertyPrice, type PricedProperty } from '@/lib/property-price'

export type CommercialProperty = PricedProperty & {
  slug: string; title: string; zone: string; address: string | null; location_visibility: string
  covered_area?: number | null; exterior_area?: number | null; max_height?: string | null
  offices_area?: number | null; parking?: number | null; docks?: number | null; description?: string | null
  price_plus_vat?: boolean | null; price_plus_maintenance?: boolean | null; negotiable?: boolean | null
}
export function CommercialPropertySheet({ property: p, images }: { property: CommercialProperty; images: GalleryImage[] }) {
  const values = [['Superficie total', p.total_area, 'm²'], ['Superficie techada', p.covered_area, 'm²'],
    ['Superficie exterior', p.exterior_area, 'm²'], ['Oficinas', p.offices_area, 'm²'],
    ['Altura máxima', p.max_height, ''], ['Estacionamientos', p.parking, ''], ['Andenes', p.docks, '']]
  return <main className="commercial-sheet">
    <section className="commercial-sheet__heading"><small>QRIH · FICHA COMERCIAL</small>
      <h1>{p.title}</h1><p>{p.zone}</p>
      {p.location_visibility === 'address' && p.address && <p>{p.address}</p>}
    </section>
    <section className="commercial-sheet__hero">
      <div>{images[0] ? <img className="commercial-sheet__cover" src={images[0].url} alt={p.title} width={1200} height={800} decoding="async" /> : <p>Fotografías no disponibles</p>}</div>
      <div className="commercial-sheet__price"><small>{p.operation}</small><h2>{propertyPrice(p)}</h2>
        {['m2', 'm²'].includes(p.price_unit || '') && <p>Total: {propertyPrice(p, true)}</p>}
        {p.price_plus_vat && <p>Más IVA</p>}{p.price_plus_maintenance && <p>Más mantenimiento</p>}
        {p.negotiable && <p>Precio negociable</p>}
        <a href={`/api/bodegas/${encodeURIComponent(p.slug)}/pdf`} target="_blank" rel="noopener noreferrer">Descargar PDF</a>
      </div>
    </section>
    <section><h2>Características</h2><dl className="commercial-sheet__specs">{values.map(([label, value, unit]) =>
      <div key={String(label)}><dt>{label}</dt><dd>{value == null || value === '' ? 'N/D' : `${value} ${unit}`.trim()}</dd></div>)}</dl></section>
    <section><h2>Descripción</h2><p className="commercial-sheet__description">{p.description || 'Consultar características.'}</p></section>
    {!!images.length && <section><h2>Galería</h2><PropertyImageGallery images={images} propertyTitle={p.title} /></section>}
    <p className="commercial-sheet__legal">Información y medidas aproximadas, sujetas a confirmación. Fotografías no contractuales. La disponibilidad y condiciones deberán ratificarse.</p>
  </main>
}
