import './globals.css'
import type { Metadata } from 'next'
import { Footer } from '@/components/Footer'
import { PortalFooter } from '@/components/PortalFooter'

export const metadata: Metadata = {
  title: 'QRO INDUSTRIAL HUB | QRIH',
  description:
    'Bodegas, naves industriales y espacios industriales en Querétaro.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        {children}
        <PortalFooter><Footer /></PortalFooter>
      </body>
    </html>
  )
}
