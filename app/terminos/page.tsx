import { publicMetadata } from '@/lib/seo'
export const metadata = publicMetadata('/terminos', 'Términos y condiciones | QRIH', 'Consulta los términos y condiciones de uso de QRO Industrial Hub.')
import { Header } from '@/components/Header'

export default function TermsPage() {
  return (
    <>
      <Header />

      <section className="title legal-banner">
        <div className="legal-banner__inner">
          <h1>Términos y condiciones</h1>
          <p>
            Condiciones generales para la publicación, consulta y contacto en QRO INDUSTRIAL HUB (QRIH).
          </p>
        </div>
      </section>

      <main className="legal-page">
        <article className="ui-panel legal-card">
          <section>
            <h2>Uso de la plataforma</h2>
            <p>
              Los usuarios deberán proporcionar información veraz, actualizada
              y suficiente para las funciones que utilicen dentro de la
              plataforma.
            </p>
          </section>

          <section>
            <h2>Publicación de propiedades</h2>
            <p>
              El usuario que publique una propiedad declara contar con las
              autorizaciones necesarias para proporcionar y publicar la
              información correspondiente.
            </p>
          </section>

          <section>
            <h2>Revisión y publicación</h2>
            <p>
              Las propiedades enviadas a la plataforma podrán quedar sujetas a
              un proceso de revisión antes de aparecer como publicadas en el
              inventario.
            </p>
          </section>

          <section>
            <h2>Información de las propiedades</h2>
            <p>
              La información proporcionada por los usuarios deberá mantenerse
              actualizada. QRIH podrá solicitar aclaraciones o modificaciones
              cuando resulte necesario para la administración de una
              publicación.
            </p>
          </section>

          <section>
            <h2>Contacto entre usuarios</h2>
            <p>
              Las solicitudes de contacto realizadas mediante la plataforma
              tienen como finalidad facilitar la comunicación relacionada con
              las propiedades publicadas.
            </p>
          </section>

          <section>
            <h2>Información legal</h2>
            <p>
              La versión definitiva de estos términos deberá incorporar la
              información jurídica, identificación del responsable, mecanismos
              de contacto y demás condiciones aplicables antes de su publicación
              definitiva.
            </p>
          </section>
        </article>
      </main>
    </>
  )
}
