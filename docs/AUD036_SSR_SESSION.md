# AUD-036 — Persistencia de renovación SSR

2026-10-06. **MEDIO / CORREGIDO LOCAL — RENOVACIÓN VERIFICADA CON SDK REAL Y AUTH SINTÉTICO; SESIÓN REAL PROLONGADA/RC PENDIENTES.** Rama fix/aud-036-ssr-session sobre aislamiento local AUD-034; sin deploy/merge/main/producción.

## Corte vigente — commits y acceso local, 2026-10-08

**Actualización posterior autorizada:** cadena integrada localmente en develop4302fef, build exacto/preflight/25HTTP anon reejecutados PASS, main intacta y sin push/deploy. Servidor3107 reiniciado normalmente tras build, panel privado/publicación de prueba conservados tras recarga observada. No logout ni extracción de cookies/tokens ni expiración forzada; no cierra renovación tras caducidad/callback positivo.114unit/14SSR/lint/tipos anteriores conservados sobre entradas idénticas; documentación posterior aparte. [Evidencia del candidato](RC_CANDIDATE_2026-10-08.md). Las afirmaciones inferiores sin integración/buildnuevo describen el corte previo.

Las cuatro pruebas adicionales quedan en `6efd78ece7c433f95ae6c5b40f17eaed8fc371f4`, separadas de AUD-037/038; documentación aparte.114unit actuales (incluyen14SSR), lint completo/tipos sin emisión PASS reejecutados. Sin integración develop/main/push/deploy; referencias originales conservadas. Build/preflight/25HTTP/43SQL anteriores no se reejecutan ni certifican como artefacto compilado de este SHA.

Usuario inició sesión legítima personalmente en localhost3107. Agente observó `/mis-propiedades` con saludo autenticado y la publicación sintética; una recarga completa mantiene el panel y la publicación sin volver al login. Observación de sólo lectura, sin leer/exportar cookies/tokens/contraseña, modificar cuenta/propiedad ni emitir correo. Runtime loopback/STAGING continúa activo para la sesión del usuario; la afirmación inferior sobre servidores detenidos describe el lote inicial del 2026-10-06.

**No cierra renovación prolongada:** no se inspeccionó ni forzó caducidad/TTL y no hay evidencia de refresh real durante esa recarga. Callback positivo local, reuse real y RC Netlify pendientes. Guía Supabase orientó separar inicio/persistencia inmediata de renovación y de fixtures. AUD-036 sigue MEDIO/CORREGIDO LOCAL—PARCIAL; AUD-018 pausado/bloqueante y NO-GO externo intactos.

## Antecedente — antes del versionado y de la sesión del usuario

## Validación adicional — 2026-10-08, sólo pruebas locales

El usuario pidió otro paso y rechazó el análisis privado del respaldo AUD-018. No se descifra/restaura, reconfigura Supabase, inicia servicios ni realiza deploy. Se completa únicamente la cobertura sintética pendiente de red/concurrencia, sin corregir código funcional: no aparece un defecto nuevo en estos cuatro casos.

| Caso nuevo | Resultado comprobado |
|---|---|
| Interrupción breve de refresh | Primer fetch falla; SDK instalado reintenta y recibe sesión ficticia rotada. Cookie llega a request/response; petición siguiente no repite refresh. |
| Auth devuelve503 con sesión vigente | Proxy mantiene continuación/cache privada, sin cookie/identidad fabricada. Factory real devuelve user=null/error503; conserva cookie. Al recuperar Auth vuelve a validar actor, sin refresh. |
| Dos requests con cookie vencida | Barrera fuerza dos refresh simultáneos. Auth simulado devuelve la misma rotación a ambos; cookies coherentes aplicando respuestas en orden inverso, siguiente petición sin refresh. No se afirma deduplicación global: dos clientes independientes/dos llamadas. |
| Dos cuentas ficticias simultáneas | Transporte asocia refresh/JWT a actor; cookies request/response y validación getUser de cada RSC permanecen separados. Sin crear cuentas reales. |

**14 tests SSR / 91 unit PASS,0 fallos/skips, lint del test y git diff --check PASS.** Ejecutados sobre checkout docs/aud-018-recovery-preparation/HEAD afab3b7 más test local sin commit; no RC integrado ni publicado. El fixture sólo admite el origen ficticio y sustituye fetch íntegramente; conserva/restaura entorno público/fetch/cookie store. Timeouts5s y barrera1s acotan nuevos tests; interrupción usa backoff real del SDK(~200ms), no reloj alterado. No imports nuevos/dependencias/migraciones/env/Storage/RLS/secretos/logs reales. Avisos MODULE_TYPELESS y error sintético de revocación previos se mantienen, no cambios de arquitectura para silenciarlos.

**Límites y próximos pendientes:** no reproduce reuse/configuración del Auth real, outage prolongado, browser/cold-start ni TTL real; la [guía de sesiones Supabase](https://supabase.com/docs/guides/auth/sessions) orientó separar estas pruebas de la política del servidor, sin modificarla. Sesión legítima prolongada y callback/email localhost positivos siguen pendientes. Lint/tipos/build/preflight/25HTTP/43SQL y audit anteriores no reejecutados en este lote; no convertir resultados antiguos en nuevos. AUD-036 sigue MEDIO/CORREGIDO LOCAL—PARCIAL y NO-GO externo se conserva con AUD-018 abierto/pausado.

## Diagnóstico previo a corrección — evidencia del 2026-10-06

lib/supabase-server.ts permite lectura de cookies en Server Components pero ignora la excepción de escritura. Sin proxy/middleware, getUser puede renovar un token vencido en memoria sin emitir la cookie renovada al navegador. Prueba del factory real y SDK @supabase/ssr instalado, transporte Auth simulado sin red: dos peticiones RSC con cookie vencida → dos refresh → dos escrituras rechazadas → cookie persistente sigue vencida. Control Route Handler writable → una renovación → cookie persistida → segunda petición sin refresh.

Confirmado defecto de persistencia con contexto RSC de sólo lectura. No demuestra cierre de sesión de cuentas reales, explotación o fallo de autorización: páginas/APIs mantienen getUser y permisos propios/RLS. Refresh repetido/reuse/latencia y terminación eventual son riesgos, no sucesos remotos probados.

## Corrección mínima implementada

proxy.ts antes de páginas privadas SSR: perfil, mis-propiedades (incluye edición/solicitudes), notificaciones y admin. Cliente público por petición/cookies del actor; getUser para validación con Auth (sin confiar getSession/metadata), guardar cookies renovadas tanto en request para RSC como response para navegador. Preservar cookies/cache headers; respuesta privada no-store. No redirects/roles/permisos nuevos en proxy: autorización sigue en rutas/RLS.

Excluye páginas públicas, assets, API, callback y restablecer-contrasena. APIs/Server Actions/Route Handlers ya pueden escribir cookies. Recovery usa marca ligada al access token exacto y no debe rotarse preventivamente antes de su validación. PKCE/callback existentes intactos; sin cambios de esquema, env, dependencias, negocio ni configuración Netlify. Cambio acotado de ciclo HTTP, no reorganización de arquitectura. Comentario en factory explica responsabilidad RSC; package.json incluye proxy en lint y suite nueva en test.

Proxy utiliza exclusivamente clave pública, cliente nuevo por petición/getUser, no getSession ni service_role. Cookie no es autorización; páginas/RLS siguen validando actor/rol/suspensión. En error no inventa identidad ni destino y devuelve continuación/cache privada para que ruta mantenga sus controles. Actualiza request/response, conserva cookies anteriores si hay más de un setAll, aplica headers SDK permitidos y cache privada al finalizar. No cambia cookies ajenas ni marca recovery.

## Callbacks locales — configuración staging autorizada y verificada

Lectura UI del proyecto exacto mcyxunymhuxyiwklyfpy encontró sólo callback Netlify. El registro/recovery usa window.location.origin: localhost no estaba permitido y caería en Site URL remoto; no se envió correo para comprobarlo. Usuario autorizó específicamente ambas URLs locales; se guardaron únicamente http://localhost:3000/auth/callback y http://localhost:3107/auth/callback. UI posterior: Total URLs 3, callback original y Site URL https://qrih-staging.netlify.app intactos, sin wildcard/127.0.0.1/original/producción. Captura no secreta fuera del repo como evidencia. No cambia SMTP/plantillas/confirmación, claves ni cuentas. Badge «main PRODUCTION» del dashboard corresponde a la rama principal de ESTE proyecto STAGING, no al proyecto original.

## Pruebas y límites

87 unit PASS (77 previas +10 nuevas), lint/tipos/build/preflight PASS. Build reconoce Proxy. 28 JS cliente/0 clave privada real o nombre variable/0 referencia original; sin lock/dependencias/SQL/RLS/Storage cambiados. Guard Netlify read-only revalidó stop_builds true/Free/publicado f67fa46 intacto, sin deploy.

| Prueba | Resultado / alcance |
|---|---|
| RSC anterior sólo lectura, SDK real/transport simulado | Defecto reproducido: dos refresh, cookie persistente vieja; caracteriza causa, no regresión introducida. |
| Route Handler writable de control | Una renovación, segunda lectura sin refresh. |
| Proxy → request RSC → response → siguiente petición | Nueva cookie en ambos, identidad validada por getUser, sólo un refresh. |
| Sesión vigente / ausente | Vigente consulta Auth sin refresh; ausente no consulta Auth ni fabrica cookie. |
| Refresh revocado / JWT no aceptado por Auth | Cookie revocada retirada; RSC sin actor; cookie/claims locales no conceden identidad. |
| Cookies chunked / cookie ajena recovery | Borra chunks previos, conserva sesión nueva y cookie ajena; marca no modificada. |
| Config ausente / excepción | Sin sesión fabricada/redirect, cache privada, log propio constante. |
| Matcher real Next instalado | Incluye privadas SSR; excluye público/API/callback/recovery/assets. |
| HTTP localhost compilado | 25 PASS: 21 previas +4 callback inválido/marca recovery inválida/cache privada; sin sesión/cuerpos inválidos, no filas/correos/cuentas nuevas. |
| HTTP localhost desarrollo | Mismos 25 PASS con QRIH_SMOKE_MODE=development explícito/local-only; no 50 casos distintos. Next dev sustituye cache de render por no-cache,must-revalidate (base-server instalado), por eso fixture admite sólo ese literal en dev. Compilado/RC exige private,no-store sin excepción. Primer ensayo dev de cache falló por esa diferencia; fixture acotado y suite reejecutada, no configuración/protección relajada en aplicación. |

Suite SSR usa factory/proxy reales, NextRequest/NextResponse y SDK instalado; sólo transporte Auth/cookies RSC simulado. Prueba importa API de matcher cuyo nombre instalado sigue unstable_doesMiddlewareMatch; primeros intentos de fixture fallaron por alias/import CJS y contexto AsyncLocalStorage no inicializado en runner, ajustados al Next instalado y reejecutados, sin relajar aplicación. SDK imprime error sintético de revocación: no credenciales ni diagnóstico remoto.

Pendientes: sesión legítima real prolongada/renovación navegador y flujo positivo email→callback localhost (sin nueva alta si puede usarse cuenta existente/recovery acordado), concurrencia/reuse y falla real de red, recepción de correo y adaptación Netlify en RC autorizado. getUser agrega una comprobación Auth en páginas privadas antes de la comprobación existente de la página; latencia/cold-start no medidos y no sustituir por confianza en cookies por rendimiento. Configuración allowlist verificada no demuestra email ni callback exitoso. No requerir otra cuenta que usuario omitió; no usar service_role/confirmación administrativa/password temporal para simular sesión real. Servidores detenidos al terminar, original/main/producción intactos, NO-GO externo conservado.

Guía Supabase orientó persistencia request/response y cache privada; docs Next16 instalado confirman proxy.ts (no middleware.ts). [SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Next proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy). Changelog leído; deprecación @supabase/server no aplica a @supabase/ssr instalado. Sin servicios de pago ni nuevas cuentas.
