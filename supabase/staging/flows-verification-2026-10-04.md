# Validación ampliada de staging — 2026-10-04

## Entorno y alcance

Supabase aislado `mcyxunymhuxyiwklyfpy`; Netlify `qrih-staging`, Free, recargas/overages desactivados. El proyecto actual `dmtvnwsuhehxfftddsap` no recibió cambios. GitHub privado conserva `main` y `develop`. Commit documental `4efa7cb` subido por el usuario y publicado automáticamente.

Las pruebas usan sólo cuentas, teléfonos, correos `.invalid`, propiedades e imágenes sintéticas. Credencial de Supabase exclusivamente en Netlify; no se exportó localmente. No se cambiaron buckets, RLS, migraciones ni reglas de negocio. `tests/staging-flows.test.mjs` exige opt-in, staging vacío e ID de ejecución único; **no forma parte del comando Git normal**.

## Ejecuciones: no confundir build con aprobación del producto

| Build / deployment | Resultado | Alcance real |
|---|---|---|
| `6ac2c314d39d8ee800d6c220` / `6ac2c314d39d8ee800d6c222` | Falló; cleanup PASS | Auth/cookies pasan; se detuvo en primer upload de propiedad, antes de crear borrador. No hay diagnóstico suficiente de causa. |
| `6ac2c43c08ef36a76b3c0a10` / `6ac2c43c08ef36a76b3c0a12` | Falló; cleanup PASS | Upload de WebP sintético por HTTP devuelve **400**. Desde el build, cuota y upload Storage con el servicio pasan. No atribuir a Storage, permisos, formato o cold-start sin más evidencia. |
| `6ac2c55349bf234ef101b46c` / `6ac2c55349bf234ef101b46e` | READY; **42 checks PASS**, cleanup PASS | Se preparó la imagen de propiedad directamente con el cliente servidor y procedencia sintética para comprobar los flujos independientes. Esto **NO valida ni corrige** `/api/imagenes` para propiedades. Avatar sí se subió mediante esa API. |
| `6ac2c7192fc6c22b218daded` / `6ac2c7192fc6c22b218dadef` | READY, `develop@4efa7cb` | Restauración del despliegue Git normal después del ensayo: sin comandos temporales ni flags mutantes persistentes. |

## Matriz ampliada comprobada

| Caso | Resultado / límite |
|---|---|
| Auth/JWT/cookies SSR | PASS con cuentas auto-confirmadas; **no prueba SMTP ni callback de confirmación**. |
| Edición concurrente RPC | Dos escrituras con misma versión: una confirma y otra se rechaza. |
| Edición HTTP A / B | A conserva galería/portada; B recibe 403; pending no editable. |
| Origen cruzado | Edición autenticada rechazada 400. |
| Borrado ajeno / moderación | B no puede borrar A ni moderar por RPC; repetir publicación admin se rechaza. |
| Contacto concurrente | Misma autorización pending para ambas peticiones; un contacto y una notificación; sin PII del dueño. |
| Autorización | Solicitante no autoautoriza; dueño responde por HTTP; después el solicitante recibe el contacto sintético y aviso. No se reabre una respuesta ya emitida. |
| Notificaciones | A no lee aviso B; B no falsifica mensaje y sí marca read_at propio. |
| Demanda HTTP | Deriva identidad de sesión; B no lee demanda A ni registra interés con ella. |
| Interés concurrente | Dos respuestas 200, un registro persistente. |
| Oportunidad concurrente | Sólo dueño; una respuesta 200 y otra 409; una notificación. |
| Catálogo público de asesor | RPC sin teléfono/WhatsApp. |
| Avatar real HTTP | PNG → WebP auténtico; sustitución genera ruta propia nueva y elimina objeto anterior; no se puede reclamar avatar ajeno; corrupto 400. |
| Recuperación de fixture | Copia en memoria de título/galería/bytes; nuevo registro y objeto, hash idéntico y portada consistente. **No es backup íntegro, recuperación de Auth ni restauración del grafo completo de datos**. |
| Firma 300 s | Descarga 200 inicial; tras más de 300 s deja de descargar con objeto aún existente. Nueva firma vuelve a descargar. No se acortó el TTL. |
| Suspensión con JWT anterior | Contacto previamente autorizado deja de entregarse; demanda devuelve 403. |
| PDF | HTTP 200 y encabezado `%PDF`; prueba anterior separada contiene siete fotografías. |
| Lecturas concurrentes | Cuatro fichas públicas 200, sin 5xx; **no es benchmark ni prueba controlada de cold-start**. |
| Borrado propio HTTP | Elimina fila de propiedad y objeto asociado. |

La firma de 300 s se emitió directamente para el fixture del mismo bucket. Es prueba real de expiración del servicio con TTL del PDF; no demuestra vencimiento extremo a extremo de todas las firmas de ficha/galería (600/900 s), renovación del visor ni revocación instantánea.

## UI y controles adicionales

- Navegador integrado, anchos 375 y 1440 px: ficha sin overflow horizontal; fotografía firmada cargada y dirección privada ausente. Visor abre/cierra. Inventario y formulario de demanda a 375 px sin overflow; menú abre y navega. Formulario vacío bloqueado por validación nativa. **No equivale a Chrome/Safari ni teléfono real, ni UI autenticada integral**.
- Lint/typecheck pasan; 14 unit tests y 29 tests SQL reportados por Node (27 subcasos, test padre y baseline) pasan. `npm audit` completo y sin dev: cero vulnerabilidades reportadas en este corte.
- 15 HTTP sin sesión PASS de nuevo. No enviar altas válidas anónimas como prueba de humo habitual.
- `aud002_preflight.sql` ejecutado sólo lectura: cero propiedades, galerías excesivas/duplicadas o URL legado; bucket privado y helper de operaciones presentes.
- `soft_launch_preflight.sql` inicialmente falló: `ORDER BY signature::text` usa un alias dentro de una expresión. Se cambió por `p.oid::regprocedure::text`, sin efectos funcionales ni de datos, y se añadió regresión al baseline. Nueva ejecución remota pasa: 15 tablas, cero sin RLS, cero intereses/oportunidades duplicados.
- Advisors señala la vista pública SECURITY DEFINER, RPC definer autorizados y tablas privadas sin policies. No añadir policies permisivas para silenciarlo. La vista de 046 aplica filtro explícito, oculta PII y tiene sólo SELECT; revisar riesgos contextualmente, no declarar limpio todo el proyecto por un build.

## Limpieza comprobada independientemente

Después del tercer ensayo: **0 usuarios Auth, propiedades, demandas, contactos, autorizaciones, notificaciones, intereses, oportunidades, procedencias y objetos de ambos buckets**. Se preservaron bitácora sintética sin actor y marcas privadas de ejecución única. Se retiraron únicamente los datos sintéticos de cada ejecución; no son recuperables como cuentas operativas y no se borraron datos del proyecto actual.

## Bloqueantes / pendiente real

**NO-GO**. AUD-002 no se cierra en el proyecto actual.

1. **AUD-022 / ALTO:** rechazo 400 en upload de propiedad con cuenta nueva antes de borrador. Confirmado en dos ensayos; causa no identificada, código funcional no corregido. Los 24 PASS anteriores no sustituyen esta comprobación reciente. Aislar etapa/código sin PII/secretos y repetir publicación desde UI, siete fotografías, edición, PDF y limpieza.
2. **AUD-023 / ALTO de configuración:** panel staging tiene SMTP personalizado desactivado. Usuario tiene cuenta Resend, pero confirmó no tener dominio. No se configuró ni se desactivó confirmación. [Resend exige dominio verificado](https://resend.com/docs/send-with-supabase-smtp); [SMTP integrado Supabase sólo sirve al equipo](https://supabase.com/docs/guides/auth/auth-smtp). Elegir y configurar un remitente autorizado con solución $0; no comprar dominio ni contratar/activar overages.
3. Restauración íntegra de BD/Auth/Storage, expiración/renovación 600/900 s, UI autenticada y dispositivos reales, fallos de red y cold-start controlado, configuración/corte seguro en el proyecto actual y revisión legal siguen pendientes.

Estos resultados y la corrección del preflight están locales; deben subirse a `develop` antes de afirmar que GitHub contiene este nuevo informe.
