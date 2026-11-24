import './globals.css'
import type { Metadata } from 'next'
import { Footer } from '@/components/Footer'
import { PortalFooter } from '@/components/PortalFooter'
import { SiteVisitTracker } from '@/components/SiteVisitTracker'
import { googleSiteVerification, publicOrigin } from '@/lib/seo'

export function generateMetadata(): Metadata {
  const origin = publicOrigin()
  const google = googleSiteVerification()
  return {
    ...(origin ? { metadataBase: new URL(origin) } : {}),
    title: 'QRO INDUSTRIAL HUB | QRIH',
    robots: { index: false, follow: false },
    description:
      'Bodegas, naves industriales y espacios industriales en Querétaro.',
    ...(google ? { verification: { google } } : {}),
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <SiteVisitTracker />
        {children}
        <PortalFooter><Footer /></PortalFooter>
      </body>
    </html>
  )
}
