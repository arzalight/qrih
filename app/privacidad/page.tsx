import { publicMetadata } from '@/lib/seo'
export const metadata = publicMetadata('/privacidad', 'Aviso de privacidad | QRIH', 'Consulta el aviso de privacidad de QRO Industrial Hub.')
import { Header } from '@/components/Header'

export default function PrivacyPage() {
  return (
    <>
      <Header />

      <section className="title legal-banner">
        <div className="legal-banner__inner">
          <h1>Aviso de privacidad</h1>
          <p>
            Tratamiento de los datos personales proporcionados a través de QRO INDUSTRIAL HUB (QRIH).
          </p>
        </div>
      </section>

      <main className="legal-page">
        <article className="ui-panel legal-card">
          <section>
            <h2>Responsable del tratamiento</h2>
            <p>Información del responsable pendiente de completar.</p>
          </section>

          <section>
            <h2>Datos personales que podemos recopilar</h2>
            <p>
              Dependiendo de la función utilizada en la plataforma, podemos
              solicitar datos como nombre, teléfono, correo electrónico,
              empresa y datos relacionados con una propiedad inmobiliaria.
            </p>
          </section>

          <section>
            <h2>Finalidad</h2>
            <p>
              Los datos proporcionados podrán utilizarse para gestionar
              publicaciones, atender solicitudes de contacto, facilitar
              operaciones inmobiliarias y administrar las cuentas de usuarios.
            </p>
          </section>

          <section>
            <h2>Derechos del titular</h2>
            <p>
              La información sobre los mecanismos para ejercer los derechos
              correspondientes se incorporará en la versión definitiva de este
              aviso.
            </p>
          </section>

          <section>
            <h2>Contacto</h2>
            <p>
              Los datos de contacto del responsable serán incorporados antes
              de publicar esta página de forma definitiva.
            </p>
          </section>
        </article>
      </main>
    </>
  )
}
