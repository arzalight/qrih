# AUD-022 — diagnóstico y corrección de origen, 2026-10-04

## Alcance y dictamen

Sólo QRIH staging Free (`mcyxunymhuxyiwklyfpy`, `qrih-staging`). Usuario autorizó diagnóstico, corrección puntual y revalidación preservando cuenta previa. Producción, cuenta existente, buckets, RLS y migraciones no se modificaron. Sin features ni reintentos que oculten el error. **AUD-022: ALTO / CORREGIDO Y VALIDADO HTTP EN STAGING; UI AUTENTICADA Y CORTE REAL PENDIENTES.** Pasan cuatro uploads antes/después de borrador, 24 controles de imágenes y 42 de flujos, sin fixture directo de propiedad. **NO-GO externo:** AUD-002 no cerrado en el proyecto actual, SMTP/correo real (AUD-023) y validaciones restantes pendientes.

## Evidencia y secuencia

| Build / deployment | Resultado real |
|---|---|
| `6ac2cbe29ba8e68ba58b4ff0` / `6ac2cbe29ba8e68ba58b4ff2` | Diagnóstico publicado, sin corrección de origen. Logs privados sólo con etapa/tipo constantes. |
| `6ac2cc77eb7139ce63079845` / `6ac2cc77eb7139ce63079847` | 0/4 uploads: propiedad y avatar antes/después de borrador, todos 400. Cuatro logs `stage: origin`, `kind: unknown`. Cleanup PASS; consulta independiente confirmó cero Auth/perfiles/propiedades/procedencias/objetos. |
| `6ac2fba2a2368f42c477b702` / `6ac2fba2a2368f42c477b704` | Build detenido por fixture unitario local que heredaba SITE_ID del proveedor. Fixture aislado; no se eliminó la prueba ni se debilitó la validación. |
| `6ac2fc5087c44f800d933f52` / `6ac2fc5087c44f800d933f54` | Corrección publicada READY con comando normal, sin flags mutantes. ZIP del workspace; **no es un commit ya subido a GitHub**. |
| `6ac2fcc25d734b1b9b6ddf4d` / `6ac2fcc25d734b1b9b6ddf4f` | Ensayo detenido por guard de staging vacío: había una cuenta previa. No ejecutó altas/upload ni las suites siguientes. Cleanup de esta ejecución PASS (sin fixtures creados); **no significa cero cuentas en staging**. No se publicó sobre el deployment normal. |
| `6ac302592726cfff62a322e4` / `6ac302592726cfff62a322e6` | READY: **4/4 uploads + 24 controles de imágenes + 42 de flujos PASS**. Tres comprobaciones de baseline Auth/perfil intacto y tres cleanups PASS. Sin `QRIH_LIVE_FIXTURE_MEDIA`; todas las fotos iniciales de propiedad subidas por HTTP. |
| `6ac3045028604f2725058d06` / `6ac3045028604f2725058d08` | **READY y publicado**, restauración normal ZIP con misma corrección, sin comando opt-in; **15 HTTP sin sesión PASS** después. Free, recargas/overages off, develop-only/previews off/logs privados verificados por API. GitHub pendiente de subida del usuario. |

## Causa confirmada y límite de inferencia

El rechazo se produce en `assertSameOrigin`, antes de multipart, cuota, formato, codificación, Storage y procedencia. La petición de prueba envía Origin canónico; ese valor no coincidía con el origen representado por Request.url. Crear el borrador no cambia el resultado. No atribuir el fallo a RLS, privacidad del bucket, MIME, cuota o cold-start.

Una URL interna/alias del adapter Netlify es compatible con esta diferencia, pero no se registró el hostname interno exacto. [Netlify documenta URL como dirección principal y SITE_ID como variables de runtime de Functions](https://docs.netlify.com/build/functions/environment-variables/).

## Corrección mínima

- `lib/request-security.ts`: en Netlify compara Origin con URL canónica del proveedor, identificando ese entorno por SITE_ID. Configuración no HTTPS, credenciales/rutas/query/hash inválidos falla cerrada. Fuera de Netlify mantiene comparación con Request.url.
- No usa Host/X-Forwarded-Host/Proto, aliases/previews ni wildcard para autorizar.
- `app/api/imagenes/route.ts` y `lib/verified-media-server.ts`: etapas constantes en logs privados; sin mensajes arbitrarios, rutas, firmas, JWT, email, bytes ni secretos. Respuesta pública genérica preservada.
- WebP real, re-encoding, procedencia, carpetas propias, límites de payload y siete fotos se conservan sin cambiar reglas de negocio.
- `.env.example`: documenta variables del proveedor de sólo lectura; sin nuevas claves ni configuración Supabase.

## Pruebas comprobadas

| Caso | Resultado |
|---|---|
| Lint / tipos | PASS local y build Netlify. |
| Unitarias | 17 PASS, también con SITE_ID/URL Netlify simulados; guard de preservación exige vacío por defecto y detecta cambio Auth/perfil o cuenta extra. |
| Origen del servidor | Canónico admitido; externo/null/alias/http/sufijo engañoso rechazados; headers falsificados no cambian autorización. |
| Diagnóstico | Sólo etapas constantes en validación; no incluye nombre del archivo ni bytes. |
| SQL aislado | 29 PASS; ninguna migración nueva ni mutación remota de RLS. |
| HTTP sin sesión | 15 PASS de nuevo después de restauración normal `6ac3045028604f2725058d08`. |
| HTTP con Origin explícito, sin sesión | Canónico devuelve 401 (pasa origen y exige sesión); externo devuelve 400. Sin altas ni datos modificados. |
| Dependencias | Audit completo y sin dev: cero vulnerabilidades reportadas. |
| Upload antes/después de borrador | Propiedad y avatar: **200 en los cuatro casos**, ruta propia WebP y procedencia verificadas. |
| Siete fotos / estados / PDF | 24 controles PASS: siete uploads HTTP, galería, octava rechazada, WebP corrupto denegado, público/A/B/admin, firma nativa denegada, seis estados privados, suspensión, URL pública antigua denegada y PDF con siete imágenes realmente incrustadas. |
| Edición / contactos / avatar / demanda | 42 controles PASS de `staging-flows`, con upload HTTP real; edición propia/ajena/pending, carrera de versión, autorización y avisos, deduplicación concurrente, demanda aislada, interés/oportunidad, avatar PNG→WebP/reemplazo/ajeno/corrupto y borrado propio. |
| TTL 300 s | Firma descarga inicialmente; tras 310 s no sirve con objeto existente. Nueva firma vuelve a descargar. No acortado; 600/900 s+renovación siguen pendientes. |
| UI pública con upload real | Navegador integrado: foto cargada (80 px naturales), sin overflow ni dirección privada; galería abre/cierra. No demuestra UI autenticada ni dispositivos reales. |

## Cuenta previa y continuación segura

Una consulta sólo lectura detectó una cuenta Auth creada después del diagnóstico inicial, no perteneciente a fixtures de auditoría; sin perfil. Cero propiedades, demandas, contactos, notificaciones, procedencias y objetos examinados. No se expuso correo, identidad, JWT o metadatos personales ni se borró/modificó esa cuenta. No inferir su finalidad ni un bug de perfil sin conocer cómo se creó.

Usuario autorizó repetir con cuentas sintéticas nuevas **preservando y comprobando la cuenta previa**. `tests/staging-fixture-guard.mjs` conserva el requisito Auth vacío por defecto; sólo el opt-in temporal `QRIH_LIVE_PRESERVE_AUTH=1` admite como máximo una cuenta anterior. Captura huellas del registro Auth completo y perfil asociado únicamente en memoria del servidor y compara después de limpiar cada suite. No exporta ni registra valores/huellas. Si aparecen más cuentas o hay cualquier cambio, falla. Los guards de staging exacto/Netlify/ID único y cero propiedades siguen activos.

Las tres suites informan **Auth/perfil previo sin cambios**. Consulta independiente final: **1 cuenta Auth previa, 0 perfiles, propiedades, galerías, demandas, contactos, autorizaciones, notificaciones, intereses, oportunidades, procedencias y objetos de ambos buckets**. Se retiraron sólo cuentas/filas/fotos sintéticas identificadas de estas suites; no son cuentas operativas recuperables. Bitácoras sintéticas y marcas privadas preservadas. La consulta de conteos inicial usó un nombre de tabla inexistente y no mutó nada; nombres verificados en catálogo y consulta final correcta. No se infiere fallo de perfil/callback de la cuenta anterior sin conocer su origen. No se probó aquí restauración integral ni contenido de sesiones preexistentes.

La corrección funcional sigue siendo la del commit local `648da29`; este nuevo corte añade tests/guard/documentación, no código funcional. Último GitHub develop verificado: `4efa7cb`; pendiente subir los commits locales y verificar deployment Git exacto.

## Pendiente de cierre

1. Subir corrección/pruebas/documentos a develop y verificar deployment Git exacto; no restaurar la versión antigua sobre la corrección. Producción/main no conectados hasta GO explícito.
2. Probar publicación/edición desde UI autenticada completa con cuenta de prueba preparada por flujo normal, no creada con auto-confirmación administrativa; incluye registro/correo/callback/perfil/sesión.
3. Mantener abiertos SMTP/remitente gratuito, TTL 600/900 s+renovación, recuperación integral, red/cold-start, dispositivos reales y corte seguro del proyecto actual. No volver a diagnosticar RLS/bucket para el 400 de origen ya resuelto.
