# AUD-022 — diagnóstico y corrección de origen, 2026-10-04

## Alcance y dictamen

Sólo QRIH staging Free (`mcyxunymhuxyiwklyfpy`, `qrih-staging`). Usuario autorizó diagnóstico mínimo y corrección puntual. Producción, datos existentes, buckets, RLS y migraciones no se modificaron. Sin features ni reintentos que oculten el error. **NO-GO; AUD-022 sigue ALTO / CORRECCIÓN APLICADA EN STAGING — VALIDACIÓN AUTENTICADA PENDIENTE.** AUD-002 no cerrado en el proyecto actual; SMTP/correo real (AUD-023) sigue pendiente.

## Evidencia y secuencia

| Build / deployment | Resultado real |
|---|---|
| `6ac2cbe29ba8e68ba58b4ff0` / `6ac2cbe29ba8e68ba58b4ff2` | Diagnóstico publicado, sin corrección de origen. Logs privados sólo con etapa/tipo constantes. |
| `6ac2cc77eb7139ce63079845` / `6ac2cc77eb7139ce63079847` | 0/4 uploads: propiedad y avatar antes/después de borrador, todos 400. Cuatro logs `stage: origin`, `kind: unknown`. Cleanup PASS; consulta independiente confirmó cero Auth/perfiles/propiedades/procedencias/objetos. |
| `6ac2fba2a2368f42c477b702` / `6ac2fba2a2368f42c477b704` | Build detenido por fixture unitario local que heredaba SITE_ID del proveedor. Fixture aislado; no se eliminó la prueba ni se debilitó la validación. |
| `6ac2fc5087c44f800d933f52` / `6ac2fc5087c44f800d933f54` | Corrección publicada READY con comando normal, sin flags mutantes. ZIP del workspace; **no es un commit ya subido a GitHub**. |
| `6ac2fcc25d734b1b9b6ddf4d` / `6ac2fcc25d734b1b9b6ddf4f` | Ensayo detenido por guard de staging vacío: había una cuenta previa. No ejecutó altas/upload ni las suites siguientes. Cleanup de esta ejecución PASS (sin fixtures creados); **no significa cero cuentas en staging**. No se publicó sobre el deployment normal. |

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
| Unitarias | 16 PASS, también con SITE_ID/URL Netlify simulados. |
| Origen del servidor | Canónico admitido; externo/null/alias/http/sufijo engañoso rechazados; headers falsificados no cambian autorización. |
| Diagnóstico | Sólo etapas constantes en validación; no incluye nombre del archivo ni bytes. |
| SQL aislado | 29 PASS; ninguna migración nueva ni mutación remota de RLS. |
| HTTP sin sesión | 15 PASS en deployment de corrección. |
| HTTP con Origin explícito, sin sesión | Canónico devuelve 401 (pasa origen y exige sesión); externo devuelve 400. Sin altas ni datos modificados. |
| Dependencias | Audit completo y sin dev: cero vulnerabilidades reportadas. |
| Upload autenticado corregido / siete fotos / edición / PDF | **PENDIENTE:** ensayo detenido antes de estos casos por cuenta previa. 24 y 42 PASS anteriores son históricos, no cierre de esta corrección. |

## Cuenta previa y continuación segura

Una consulta sólo lectura detectó una cuenta Auth creada después del diagnóstico inicial, no perteneciente a fixtures de auditoría; sin perfil. Cero propiedades, demandas, contactos, notificaciones, procedencias y objetos examinados. No se expuso correo, identidad, JWT o metadatos personales ni se borró/modificó esa cuenta. No inferir su finalidad ni un bug de perfil sin conocer cómo se creó.

Se solicitó autorización para repetir con cuentas sintéticas nuevas **preservando y comprobando la cuenta previa**. No se desactivó el guard silenciosamente ni se volvió a ejecutar el mismo ensayo vacío. La corrección permanece publicada con configuración normal; GitHub develop sigue en `4efa7cb` hasta que el usuario suba el commit local.

## Pendiente de cierre

1. Autorizar ensayo aislado que preserve cuenta previa; comprobar baseline antes/después y limpiar sólo IDs sintéticos nuevos.
2. Repetir cuatro uploads antes/después, siete fotos/portada/galería, octava rechazada, estados privados, publicación/moderación, edición/PDF y controles de origen/autorización. Pruebas reales de UI autenticada siguen separadas.
3. Subir corrección/documentos a develop y verificar deployment Git exacto; no restaurar la versión antigua sobre la corrección. Producción/main no conectados hasta GO explícito.
4. Mantener abiertos SMTP/remitente gratuito, TTL 600/900 s+renovación, recuperación integral, red/cold-start, dispositivos reales y corte seguro del proyecto actual.
