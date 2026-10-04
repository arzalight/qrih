import './globals.css'
import type { Metadata } from 'next'
import { Footer } from '@/components/Footer'

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
        <Footer />
      </body>
    </html>
  )
}