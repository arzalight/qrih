import Link from 'next/link'
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
  operation?: string
  zone_general?: string
  zone?: string
  area?: string
}
import { InventoryFilters } from '@/components/InventoryFilters'

export const dynamic = 'force-dynamic'

export default async function Inventory({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const q = await searchParams
  const supabase = createPublicServerSupabaseClient()

  let properties: any[] = []

  if (supabase) {
    let query = supabase
      .from('properties_public')
      .select('*')
      .eq('status', 'published')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })

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
          <b>Filtros</b>

<InventoryFilters
  operation={q.operation}
  zone_general={q.zone_general}
  zone={q.zone}
  area={q.area}
/>
        </aside>

        <section>
          <div className="head">
            <h2>{properties.length} propiedades</h2>
            <small>Destacadas primero</small>
          </div>

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
            <p>
              No hay propiedades publicadas que coincidan con los filtros.
            </p>
          )}
        </section>
      </main>
    </>
  )
}
