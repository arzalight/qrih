import { notFound } from 'next/navigation'
import { loadCommercialProperty } from '@/lib/commercial-property-server'
import { CommercialPropertySheet } from '@/components/CommercialPropertySheet'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Ficha comercial | QRIH', robots: { index: false, follow: false }, referrer: 'no-referrer' }
export default async function CommercialSheetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const result = await loadCommercialProperty(slug, 'gallery')
  if (!result) notFound()
  return <CommercialPropertySheet property={result.property} images={result.images} />
}
