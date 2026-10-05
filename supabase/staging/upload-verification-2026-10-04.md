# AUD-022 / AUD-025 — diagnóstico y correcciones de ingesta, 2026-10-04

## Último incidente AUD-025 — formato Safari

**ALTO / CORREGIDO LOCAL — PENDIENTE GIT/DEPLOY/UI REAL.** Usuario informa fallo de fotografía 1 al guardar borrador y confirma Safari. Staging publicado sigue `5fad2925a39034a12aa15b779be5f23d408337b0` / `6ac31d76c0cc5c000829ea5b`, READY, develop. Tres logs privados `QRIH_IMAGE_INGEST_FAILURE` muestran exclusivamente `stage: format`, `kind: property` en ventana posterior a 2026-10-05 04:20 UTC (2026-10-04 local); sin bytes/MIME/identidad de usuario. Edge agregados no muestran peticiones Storage en 04:20–04:36:20 UTC. Consulta independiente: 0 propiedades/galería/procedencias/objetos property-images. No datos eliminados ni cargas por el agente; no confundir este fallo con origen AUD-022.

Repro sintética ejecuta el optimizer anterior con Canvas que devuelve PNG al pedir WebP: File MIME `image/webp`, formato Sharp `png`, validación real rechaza. [MDN confirma el fallback PNG de Canvas](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob). Defecto de código confirmado; Safari reportado es compatible, pero no se capturó la petición privada para acreditar su contenido exacto.

Corrección local: `lib/image-optimizer.ts` mantiene WebP nativo o solicita JPEG si el primer blob no es WebP; comprueba blob/MIME, asigna extensión real, conserva resize 1920 px/original 20 MiB/payload 3 MiB/máximo 7. `lib/verified-media-server.ts` comprueba formato real JPEG/PNG/WebP y MIME correspondiente, sólo una página, decodifica completamente y re-encode WebP sin metadatos. La salida de Storage permanece exclusivamente WebP, bucket privado/UUID/ruta propia/procedencia/hash/cuota/server-only sin cambios. Avatar no amplía permisos. Ninguna migración/RLS/env/Supabase config/dependencia/producción cambiada.

Verificación **local**: 29 unit + 30 SQL aisladas, lint/tipos/build PASS con variables públicas de staging y compilador sin clave privilegiada. Tests reales optimizer/Sharp con Canvas simulado: camino WebP y fallback PNG→JPEG→WebP, JPG/PNG entrada, resize/límites; MIME falsificado/GIF/corrupción/SVG siguen rechazados. No es Safari UI ni HTTP autenticado remoto; 4/24/42 previos permanecen históricos, no reejecutados. Guard de suites remotas previas no admite las 3 Auth actuales: no expandido ni ejecutado.

Después del despliegue: usuario conserva formulario, recarga sólo cuando READY esté confirmado, selecciona nuevamente dos fotos y guarda un único borrador; comprobar portada/galería/Editar/recarga y WebP/paths/procedencia/privacidad en modo lectura. Reprobar Chrome nativo y séptima/octava/formatos adversarios con ensayo acotado. **NO-GO**: AUD-025 externo pendiente, AUD-002 sigue no cerrado en actual y correo/TTL/backup/UI/corte restantes pendientes. Los apartados AUD-022 siguientes conservan evidencia anterior y no prueban Safari Canvas.

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
| Git automático / `6ac307ade99ce9000825a574` | **READY/publicado**, commit exacto `478fda1260cd04de1569171da10cd628d8d4b5ed` de develop, publicado 2026-10-05 02:13:37 UTC (2026-10-04 local). **15 HTTP sin sesión PASS sobre este deployment**. Free, recargas/overages off, develop-only/previews off/logs privados comprobados de nuevo. No reejecuta suites mutantes. Sustituye el ZIP normal anterior. |

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

La corrección funcional sigue siendo la del commit `648da29`; el corte `478fda1` añade tests/guard/documentación, no código funcional. Usuario subió los tres commits pendientes: develop local/remoto sincronizados. Netlify confirma commit completo `478fda1260cd04de1569171da10cd628d8d4b5ed` READY/publicado en `6ac307ade99ce9000825a574`; humo 15/15 PASS. Las suites autenticadas 4/24/42 corresponden al ensayo ZIP anterior, no se reejecutaron sobre Git. Sólo este registro posterior de evidencia queda local, no afecta el código publicado.

## Pendiente de cierre

1. Entrega Git exacta y humo verificados. Conservar la trazabilidad de evidencia y no restaurar la versión antigua sobre la corrección. Producción/main no conectados hasta GO explícito.
2. Probar publicación/edición desde UI autenticada completa con cuenta de prueba preparada por flujo normal, no creada con auto-confirmación administrativa; incluye registro/correo/callback/perfil/sesión.
3. Mantener abiertos SMTP/remitente gratuito, TTL 600/900 s+renovación, recuperación integral, red/cold-start, dispositivos reales y corte seguro del proyecto actual. No volver a diagnosticar RLS/bucket para el 400 de origen ya resuelto.
