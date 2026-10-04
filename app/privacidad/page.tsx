import { Header } from '@/components/Header'

export default function PrivacyPage() {
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
          Aviso de privacidad
        </h1>

        <p
          style={{
            maxWidth: 720,
            lineHeight: 1.7,
            color: '#5f6d73',
          }}
        >
          Esta página contiene la información relacionada con el tratamiento
          de los datos personales proporcionados a través de QRO INDUSTRIAL
          HUB (QRIH).
        </p>

        <section style={{ marginTop: 48 }}>
          <h2>Responsable del tratamiento</h2>

          <p style={{ lineHeight: 1.7 }}>
            Información del responsable pendiente de completar.
          </p>
        </section>

        <section style={{ marginTop: 36 }}>
          <h2>Datos personales que podemos recopilar</h2>

          <p style={{ lineHeight: 1.7 }}>
            Dependiendo de la función utilizada en la plataforma, podemos
            solicitar datos como nombre, teléfono, correo electrónico,
            empresa y datos relacionados con una propiedad inmobiliaria.
          </p>
        </section>

        <section style={{ marginTop: 36 }}>
          <h2>Finalidad</h2>

          <p style={{ lineHeight: 1.7 }}>
            Los datos proporcionados podrán utilizarse para gestionar
            publicaciones, atender solicitudes de contacto, facilitar
            operaciones inmobiliarias y administrar las cuentas de usuarios.
          </p>
        </section>

        <section style={{ marginTop: 36 }}>
          <h2>Derechos del titular</h2>

          <p style={{ lineHeight: 1.7 }}>
            La información sobre los mecanismos para ejercer los derechos
            correspondientes se incorporará en la versión definitiva de este
            aviso.
          </p>
        </section>

        <section style={{ marginTop: 36 }}>
          <h2>Contacto</h2>

          <p style={{ lineHeight: 1.7 }}>
            Los datos de contacto del responsable serán incorporados antes
            de publicar esta página de forma definitiva.
          </p>
        </section>
      </main>
    </>
  )
}
