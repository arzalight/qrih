import { publicMetadata } from '@/lib/seo'
export const metadata = publicMetadata('/terminos', 'Términos y condiciones | QRIH', 'Consulta los términos y condiciones de uso de QRO Industrial Hub.')
import { Header } from '@/components/Header'

export default function TermsPage() {
  return (
    <>
      <Header />

      <main
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '60px 24px 80px',
        }}
      >
        <small>QRIH · INFORMACIÓN LEGAL</small>

        <h1 style={{ marginTop: 12 }}>
          Términos y condiciones
        </h1>

        <p
          style={{
            maxWidth: 720,
            lineHeight: 1.7,
            color: '#5f6d73',
          }}
        >
          Estos términos establecen las condiciones generales para el uso de
          QRO INDUSTRIAL HUB (QRIH), incluyendo la publicación, consulta y
          contacto relacionado con propiedades inmobiliarias.
        </p>

        <section style={{ marginTop: 48 }}>
          <h2>Uso de la plataforma</h2>

          <p style={{ lineHeight: 1.7 }}>
            Los usuarios deberán proporcionar información veraz, actualizada
            y suficiente para las funciones que utilicen dentro de la
            plataforma.
          </p>
        </section>

        <section style={{ marginTop: 36 }}>
          <h2>Publicación de propiedades</h2>

          <p style={{ lineHeight: 1.7 }}>
            El usuario que publique una propiedad declara contar con las
            autorizaciones necesarias para proporcionar y publicar la
            información correspondiente.
          </p>
        </section>

        <section style={{ marginTop: 36 }}>
          <h2>Revisión y publicación</h2>

          <p style={{ lineHeight: 1.7 }}>
            Las propiedades enviadas a la plataforma podrán quedar sujetas a
            un proceso de revisión antes de aparecer como publicadas en el
            inventario.
          </p>
        </section>

        <section style={{ marginTop: 36 }}>
          <h2>Información de las propiedades</h2>

          <p style={{ lineHeight: 1.7 }}>
            La información proporcionada por los usuarios deberá mantenerse
            actualizada. QRIH podrá solicitar aclaraciones o modificaciones
            cuando resulte necesario para la administración de una
            publicación.
          </p>
        </section>

        <section style={{ marginTop: 36 }}>
          <h2>Contacto entre usuarios</h2>

          <p style={{ lineHeight: 1.7 }}>
            Las solicitudes de contacto realizadas mediante la plataforma
            tienen como finalidad facilitar la comunicación relacionada con
            las propiedades publicadas.
          </p>
        </section>

        <section style={{ marginTop: 36 }}>
          <h2>Información legal</h2>

          <p style={{ lineHeight: 1.7 }}>
            La versión definitiva de estos términos deberá incorporar la
            información jurídica, identificación del responsable, mecanismos
            de contacto y demás condiciones aplicables antes de su publicación
            definitiva.
          </p>
        </section>
      </main>
    </>
  )
}
