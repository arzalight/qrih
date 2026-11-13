import { publicMetadata } from '@/lib/seo'
import Link from 'next/link'
import { inventoryPriceFilters } from '@/lib/property-price'
import { Header } from '@/components/Header'
import { PropertyCard } from '@/components/PropertyCard'
import { createPublicServerSupabaseClient } from '@/lib/supabase-public-server'
import {
  createSignedPropertyImageUrlMap,
  PROPERTY_IMAGE_TTL_SECONDS,
} from '@/lib/property-image-urls'
import {
  ZONAS_GENERALES,
  ZONAS_INDUSTRIALES_POR_ZONA,
} from '@/lib/zonas'

type SearchParams = {
  currency?: string
  price_min?: string
  price_max?: string
  price_unit?: string
  operation?: string
  zone_general?: string
  zone?: string
  area?: string
  sort?: string
}
import { InventoryFilters } from '@/components/InventoryFilters'
import { InventorySort } from '@/components/InventorySort'
import { inventoryFilterChips, parseInventorySort } from '@/lib/property-display'

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const q = await searchParams
  const metadata = publicMetadata('/inventario', 'Inventario industrial en renta y venta | QRIH', 'Explora las propiedades industriales disponibles y filtra por operación, zona, superficie y precio.')
  if (Object.keys(q).length) metadata.robots = { index: false, follow: true }
  return metadata
}

export const dynamic = 'force-dynamic'

export default async function Inventory({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const q = await searchParams
  const supabase = createPublicServerSupabaseClient()
  const priceFilter = inventoryPriceFilters(q)
  // Closed list: an unknown ?sort= value falls back to the default order.
  const sort = parseInventorySort(q.sort)
  const chips = inventoryFilterChips(q)
  const hasFilters = Object.entries(q).some(([key, value]) => key !== 'sort' && Boolean(value))

  let properties: any[] = []

  if (supabase && !priceFilter.invalid) {
    let query = supabase
      .from('properties_public')
      .select('*,price_value_text:price_value::text')
      .eq('status', 'published')

    if (q.operation) {
      query = query.eq('operation', q.operation)
    }

    if (q.zone_general) {
      query = query.eq('zone_general', q.zone_general)
    }

    if (q.zone) {
      query = query.eq('zone', q.zone)
    }

    if (q.area) {
      if (q.area === '0-200') {
        query = query.lt('total_area', 200)
      }

      if (q.area === '200-500') {
        query = query.gte('total_area', 200).lte('total_area', 500)
      }

      if (q.area === '500-1000') {
        query = query.gte('total_area', 500).lte('total_area', 1000)
      }

      if (q.area === '1000-2000') {
        query = query.gte('total_area', 1000).lte('total_area', 2000)
      }

      if (q.area === '2000+') {
        query = query.gt('total_area', 2000)
      }
    }

    if (priceFilter.currency) query = query.eq('price_currency', priceFilter.currency)
    if (priceFilter.unit) query = query.eq('price_unit', priceFilter.unit)
    if (priceFilter.min) query = query.gte('price_value', priceFilter.min)
    if (priceFilter.max) query = query.lte('price_value', priceFilter.max)
    // Listings without a surface go last in either direction; created_at breaks ties.
    for (const [column, ascending] of sort.orders) {
      query = query.order(column, column === 'total_area' ? { ascending, nullsFirst: false } : { ascending })
    }
    const result = await query

    if (!result.error) {
      properties = result.data || []

      const imageUrls = await createSignedPropertyImageUrlMap(
        supabase,
        properties.map((property) => property.main_image_path),
        PROPERTY_IMAGE_TTL_SECONDS.public,
      )

      properties = properties.map((property) => ({
        ...property,
        main_image:
          imageUrls.get(property.main_image_path || '') || null,
      }))
    } else {
      console.warn('QRIH_APP_INVENTARIO_PAGE_93_FAILED')
    }
  }

  return (
    <>
      <Header />

      <section className="title">
        <small>INVENTARIO INDUSTRIAL</small>
        <h1>Encuentra el espacio correcto.</h1>
      </section>

      <main className="inventory">
        <aside>

<InventoryFilters
  operation={q.operation}
  zone_general={q.zone_general}
  zone={q.zone}
  area={q.area}
  currency={q.currency} price_min={q.price_min} price_max={q.price_max} price_unit={q.price_unit}
/>
        </aside>

        <section>
          {priceFilter.invalid && <p className="notice" role="alert">Para filtrar precios selecciona moneda, operación y unidad, y un rango válido. No se comparan monedas ni unidades distintas.</p>}
          <div className="head">
            <h2 aria-live="polite">
              {properties.length} {properties.length === 1 ? 'propiedad' : 'propiedades'}
            </h2>
            <InventorySort value={sort.value} query={q} />
          </div>

          {chips.length > 0 && (
            <nav className="inventory-chips" aria-label="Filtros aplicados">
              {chips.map((chip) => (
                <Link key={chip.key} href={chip.href} className="inventory-chip">
                  {chip.label}
                  <span className="sr-only"> (quitar filtro)</span>
                  <span aria-hidden="true"> ×</span>
                </Link>
              ))}
              <Link href="/inventario" className="inventory-chips__clear">Limpiar todo</Link>
            </nav>
          )}

          <div className="cards">
            {properties.map((p) => (
              <PropertyCard
                key={p.id}
                property={{
                  ...p,
                  total_area: Number(p.total_area || 0),
                  covered_area: Number(p.covered_area || 0),
                  exterior_area: Number(p.exterior_area || 0),
                }}
              />
            ))}
          </div>

          {properties.length === 0 && (
            <div className="ui-empty inventory-empty">
              <p>
                {hasFilters
                  ? 'No hay propiedades publicadas que coincidan con los filtros.'
                  : 'Por ahora no hay propiedades publicadas.'}
              </p>
              <p>¿No encuentras lo que buscas? Sube tu requerimiento y describe el espacio que necesitas.</p>
              <div className="inventory-empty__actions">
                <Link href="/busco-bodega" className="button">Subir requerimiento</Link>
                {hasFilters && <Link href="/inventario" className="button button--secondary">Limpiar filtros</Link>}
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  )
}
