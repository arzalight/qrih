import Link from 'next/link'

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__content">
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '0.04em' }}>
            QRO INDUSTRIAL HUB
          </div>
          <div className="site-footer__eyebrow">Q R I H</div>
          <p className="site-footer__description">
            Bodegas, naves industriales y espacios industriales en Querétaro.
          </p>
        </div>

        <div>
          <strong style={{ fontSize: 13 }}>Explorar</strong>
          <div className="site-footer__links">
            <Link href="/inventario">Inventario</Link>
            <Link href="/busco-bodega">Busco una bodega</Link>
            <Link href="/publicar">Publicar propiedad</Link>
          </div>
        </div>

        <div>
          <strong style={{ fontSize: 13 }}>QRIH</strong>
          <div className="site-footer__links">
            <Link href="/mis-propiedades">Panel</Link>
            <Link href="/privacidad">Aviso de privacidad</Link>
            <Link href="/terminos">Términos y condiciones</Link>
          </div>
        </div>
      </div>

      <div className="site-footer__copyright">
        © {new Date().getFullYear()} QRO INDUSTRIAL HUB · QRIH
      </div>
    </footer>
  )
}
