# Staging Free — evidencia de deployment y flujos, 2026-10-04

Supabase: `mcyxunymhuxyiwklyfpy`. Netlify: `qrih-staging`, ID `bc0d8fd9-e9a0-4cb1-bd28-5ad053e93859`. Proyecto actual `dmtvnwsuhehxfftddsap` intacto.

## Comprobado

Deployment normal final READY: `6ac2b00f96ae02e0c1a8b626`, build `6ac2b00f96ae02e0c1a8b624`. No contiene la orden temporal de prueba autenticada ni se guardó su bandera en Netlify.

- Baseline + 044–049 aplicados sólo en staging. Bucket property-images privado/WebP/20 MiB; avatar público conforme al diseño existente/WebP/5 MiB.
- Clave privada transferida por autorización expresa a Netlify como secreto; sin copia local de la clave de Supabase. Variables públicas exclusivamente del mismo staging. Contexto con valor: production del sitio de staging; el API también enumera contextos vacíos. No hay bandera persistente de pruebas mutantes.
- Site URL `https://qrih-staging.netlify.app`; único callback `https://qrih-staging.netlify.app/auth/callback`, sin wildcard.
- Build Linux: lint/tipos, 14 tests, compilación, preflight y escaneo de secretos pasan. Wrapper excluye credencial sólo del compilador; el servidor en runtime la mantiene. OpenNext oficial, sin pinning de versión ni exportación estática.
- HTTP redirige 301 a HTTPS. Login/inventario disponibles; 15 pruebas HTTP sin sesión pasan. Nueve chunks públicos inspeccionados sin patrón de clave privada ni referencia al proyecto actual. Rutas `.env`, servidor Next y caché probadas devuelven 404.

## Matriz autenticada — 24 comprobaciones PASS

Build de validación: `6ac2ae8d4d8cbc5643339b4c`; deployment `6ac2ae8d4d8cbc5643339b4e` READY. Ejecutado una vez en Netlify contra la versión compatible ya publicada; no hubo cambio funcional de rutas entre esas versiones. `tests/staging-live.test.mjs` usa Auth real/JWT/cookies SSR, cuentas sintéticas auto-confirmadas y fotografías WebP sintéticas, no datos personales.

| Cobertura | Resultado |
|---|---|
| Auth real y cookies SSR | PASS; no demuestra entrega de correo ni callback PKCE |
| Siete uploads HTTP por Netlify | PASS; rutas propias, WebP y procedencia |
| Público/B contra borrador A | No autoriza rutas |
| Propietario A / admin activo | Autoriza las siete rutas de borrador |
| Firma nativa arbitraria del propietario | Denegada |
| Octava entrada de galería | Rechazada atómicamente |
| WebP corrupto HTTP | Rechazado |
| Pending | Ficha pública 404 |
| Published | Ficha y galería con firmas; dirección privada ausente |
| Descarga de firma real | 200 |
| Endpoint público legado de objeto existente | Denegado; objeto subido ya con bucket privado, no prueba de CDN histórico previo al corte |
| PDF real de siete WebP distintos | 200, PDF con siete objetos Image incrustados |
| draft/pending/rejected/paused/expired/pending_update | Ficha 404 y sin autorización pública de rutas |
| Cuenta suspendida con JWT previo | Ficha oculta y upload 403 |
| Firma emitida antes de ocultar/suspender | Sigue válida hasta TTL: limitación prevista, no revocación instantánea |

Limpieza PASS. Consulta posterior independiente: **0 Auth users, 0 properties, 0 verified_uploads, 0 objetos property-images**. Permanecen dos marcas privadas de ejecución única en qrih_rate_windows y bitácora sintética sin actor; no son datos personales ni nuevas reglas de negocio. No borrarlas para permitir reejecutar el mismo paquete.

## Incidentes del proceso y límites

- Primer build bloqueado por secreto en caché Turbopack; no se publicó. Corrección AUD-020 mantuvo activo el detector, sin excepciones de claves/rutas.
- Paquete incompleto cancelado antes de publicar; no equivale a prueba válida.
- Primer ensayo autenticado incompleto tras emitir sesiones y crear borrador, sin diagnóstico suficiente para confirmar la causa del fallo. Limpieza inicial retenida por FK de audit_logs.actor_id; se conservó bitácora sintética desvinculando sólo su actor y retirando la cuenta identificada de esa prueba. Fixture de limpieza corregido; siguiente ejecución pasó las 24 comprobaciones sin modificación funcional de la API. Repetir estrés/cold-start y fallos de red antes del piloto; no afirmar causa resuelta sin evidencia.
- La configuración normal del proyecto no ejecuta esta prueba. El ZIP temporal incluía orden opt-in e ID único, con marca privada que impide repetir mutaciones. No se guardó flag de ejecución en Netlify. Deployment normal posterior elimina esa orden del paquete vigente.
- Netlify API sigue reportando Free, 300 créditos incluidos, sin tarjeta, recarga automática ni overages. Consumo reportado 0 al consultar puede tener retraso; no prometer saldo. Sin plan/dominio/add-on contratado.

Pendientes: email/confirmación/callback completo, expiración real de firmas, avatar/sustitución, contactos/notificaciones/demanda mediante HTTP autenticado, edición/borrado desde UI y rutas completas, concurrencia/cold-start, Chrome/Safari/móvil real, textos legales y restauración de BD+archivos. **NO-GO de Soft Launch**: staging validado parcialmente no autoriza cortar el proyecto actual.
