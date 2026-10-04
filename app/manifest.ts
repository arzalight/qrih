import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'QRO INDUSTRIAL HUB',
    short_name: 'QRIH',
    description: 'Portal industrial inmobiliario de Querétaro',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#111827',
    icons: [
      {
        src: '/icons/qrih.png',
        sizes: '1254x1254',
        type: 'image/png',
      },
    ],
  }
}
