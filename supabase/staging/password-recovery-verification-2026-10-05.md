# AUD-026 — Recuperación de contraseña, 2026-10-05

## Dictamen y alcance

**ALTO / CORREGIDO Y DESPLEGADO STAGING — FLUJO NORMAL VALIDADO POR USUARIO; COBERTURA PARCIAL. NO-GO general.** Usuario autorizó implementar en develop sólo para staging. No feature de panel de seguridad, magic-link login, autenticación alternativa ni cambio de arquitectura: se completan solicitud/reset de acceso y un Route Handler del propio usuario. Código/diagnóstico anteriores en QRIH_AUDIT.md. No petición de correo ni cambio de contraseña remoto ejecutados por agente; sin lectura de enlaces/credenciales/cookies/usuarios reales.

## Login y conservación visibles confirmados — 2026-10-05 18:31 local

Tras la comprobación solicitada, usuario confirma login con contraseña nueva y que se conserva todo: perfil, mismo borrador, portada y siete fotos. Completa por reporte la cadena normal solicitud→correo→cambio→login→datos visibles conservados; no inspección independiente ni comparación íntegra BD/roles. Rechazo de contraseña anterior, logout/sesiones y negativos reales de enlaces/otra cuenta/TTL permanecen pendientes. No repetir recovery/login/fotos; puede retomarse envío del mismo borrador a revisión. No transición pending confirmada todavía. Sólo documentación por agente, sin nuevas verificaciones remotas ni código/configuración/datos/producción modificados; NO-GO general y AUD-002 en actual sin cierre. El reporte de las 18:26 que sigue es el corte anterior.

## Ensayo funcional reportado — 2026-10-05 18:26 local

El usuario informa que completó el proceso de recuperación, recibió el correo y pudo cambiar la contraseña de su cuenta. Llegada y cambio registrados como **confirmados por usuario**, no como inspección independiente de Auth/SMTP/plantilla/cookies. Sin enlaces ni contraseñas recibidos. No inferir login nuevo, rechazo de anterior, logout/sesiones, integridad de perfil/roles/draft/portada/siete fotos ni casos negativos a partir de este reporte. Próximo: login nuevo y revisión de datos sin editar ni enviar a revisión; no repetir solicitud/cambio. AUD-026 permanece parcialmente validado; AUD-002 en actual y NO-GO general sin cambio. Sólo documentación modificada por agente. Verificaciones anteriores conservadas abajo con su corte temporal.

## Entrega y comprobaciones remotas — 2026-10-05 18:13 local

- HEAD y origin/develop: `e3adb3942146b8298ef5d7d970dbfcca15aebc90`, árbol limpio antes de esta actualización documental.
- API oficial Netlify: commit exacto publicado en qrih-staging, `6ac43bec9300d800080306b9`, READY, develop, 2026-10-06 00:08:40.379 UTC. Cuenta Free, recargas y overages desactivados; no contratación/configuración modificada.
- `QRIH_SMOKE_ORIGIN=https://qrih-staging.netlify.app npm run test:http`: **20 PASS/0 fallos**, incluidos GET de las dos rutas nuevas y POST recovery sin Origin/sin autorización/origen cruzado (403/401/403). Sin identidad/cookie de usuario ni llamada autorizada de actualización.
- Sólo verificación read-only y solicitudes HTTP denegadas, sin correo enviado ni cambio de contraseña por agente. Sin pruebas mutantes, migraciones, nuevos usuarios, datos o producción modificados. La llegada del correo, callback recovery remoto, UI de cuenta correcta, cambio/login y conservación de datos todavía no comprobados. No cerrar AUD-026 ni AUD-002 en actual.

## Flujo y trazabilidad

1. app/login/page.tsx → enlace Olvidé mi contraseña.
2. app/recuperar-contrasena/page.tsx → email explícito, guard ref de doble submit/60 s UI. lib/password-recovery.ts → resetPasswordForEmail/publishable, redirectTo exacto /auth/callback. Respuesta no enumeradora; fallo de cuota/disponibilidad sin revelar errores privados.
3. app/auth/callback/route.ts → code + sb_flow_id válido (SDK instalado soporta PKCE aislado); intercambio con verifier en cookies del mismo navegador. Evento público PASSWORD_RECOVERY, no query type/next ni campo interno SDK. Registros normales siguen ensureOwnProfile→Publicar; recovery no accede/escribe profiles.
4. Cookie qrih-recovery HttpOnly/Lax/Secure en HTTPS, 600 s, timestamp y hash de token+usuario; no token/UUID en claro. **Marca de flujo/UX, no autorización ni cookie firmada**; toda operación vuelve a validar token candidato getSession mediante getUser(token). Otra sesión/token/usuario falla; expiración o refresh que cambie token requiere otro enlace.
5. app/restablecer-contrasena/page.tsx force-dynamic/metadata referrer no-referrer → correo de cuenta validada y ResetPasswordForm; sin enlace/sesión/marca válida no hay formulario. Cliente no recibe tokens del handler ni genera firmas/cambios de rol.
6. POST app/api/auth/restablecer/route.ts → Origin obligatorio/canónico; JSON 4 KiB; password y confirmación 8–128, sin trim del secreto. updateUser({password}) sólo con cliente del actor, no service_role ni ID/email/metadata elegibles. Retirar marca tras éxito; signOut global. Logout fallido no falsea fallo de password; resultado advierte limpieza incompleta. UI borra campos y tras éxito navega a Login con aviso.

No new env/dependencias/migraciones/RLS/buckets/template/Site URL/allowlist/Supabase config/Netlify config/producción. Canonical origin y callback ya existentes reutilizados. Guía Supabase/changelog consultados: [reset](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail), [SSR](https://supabase.com/docs/guides/auth/server-side/advanced-guide), [sesiones](https://supabase.com/docs/guides/auth/sessions). Sin opciones de sesiones Pro ni plan contratado.

## Verificaciones locales comprobadas

| Caso | Evidencia |
|---|---|
| Unitarias completas | 37 PASS; 8 nuevas en tests/password-recovery.test.mjs. |
| SDK real instalado, sin red Auth | createBrowserClient + createServerClient, jar de cookies/challenge PKCE, PASSWORD_RECOVERY, callback y update/logout; fetch simulado, no correo. |
| Callback registro | auth-profile.test.mjs mantiene normal/error; type=recovery arbitrario no concede marca ni cambia destino de signup. |
| Binding/session/expire | Marker nulo/malformado/futuro/600 s, token o usuario distinto/anon/no confirmado/Auth error rechazados. getSession no decide identidad. |
| POST inválido | Origin ausente/cruzado 403, sin marca 401, JSON/cuerpo/contraseña inválidos 400; cero update en fixture. |
| POST válido | Sólo password al SDK aun con campos role/id/email extra; logout global/retiro cookie; errores privados no expuestos ni éxito falso. |
| Login/recovery públicos | Pantallas locales verificadas en navegador integrado; no se introdujo ni envió email/contraseña. Reset sin autorización muestra aviso, no formulario. |
| SQL aisladas | 30 PASS sobre PGlite, no migraciones/remoto. |
| HTTP local sin sesión | 20 PASS; 15 anteriores + 2 GET nuevas + 3 POST inválidos; no writes válidos ni sesión real. |
| Cache/referrer | Callback/API private,no-store y no-referrer; reset SSR private,no-cache,no-store en HTTP local, metadata no-referrer. Recovery/login estáticos no contienen identidad ni tokens. |
| Lint/tipos/build | PASS con variables públicas staging y wrapper que quita clave privada del compilador. |
| Pre-Git/bundle | Índice 176 archivos/0 hallazgos de secretos; 28 JS cliente/0 indicadores de clave privada. Detector señaló primero una URL con credenciales ficticias del fixture; origen negativo construido como URL sintética, sin excepción ni detector desactivado. |

Prueba inicial del SDK sintético falló por no contemplar code_challenge/code_challenge_method null que agrega el SDK a updateUser; fixture ajustado al transporte real, no relajación de handler. Tipos motivaron usar evento público en lugar de redirectType interno. Smoke inicial 127.0.0.1 recibió 403 porque Next representa Request.url como localhost; fixture usa localhost sin relajar origen. Estos ensayos intermedios no son fallos remotos ni nuevas mutaciones.

## Límites y matriz pendiente después del despliegue

Correo y cambio real confirmados por usuario en el ensayo superior: no repetirlos. Esto acredita entrega/recuperación funcional para esa solicitud, no inspección de plantilla/allowlist/configuración ni fiabilidad/cuotas/spam general de SMTP. SDK simulado por sí solo no acredita Supabase remoto. Un correo Dashboard previo no tiene necesariamente el verifier de una solicitud iniciada por QRIH; no usarlo para las pruebas del flujo nuevo. No pedir enlaces/códigos/contraseña en chat.

| Caso real pendiente | Resultado esperado |
|---|---|
| develop exacto publicado — COMPROBADO PARCIAL | e3adb39 READY y 20 HTTP sin sesión PASS; enlace/UI autenticada y flujo recovery de correo reales pendientes. |
| Solicitud válida — CONFIRMADA POR USUARIO; desconocida pendiente | Correo recibido para su recuperación; no enumera cuentas desconocidas ni bucles/bypass de cuotas: pendiente real. |
| Email→reset — CONFIRMADO POR USUARIO | Reporta proceso completado y cambio; no inspección independiente de callback/cookies/identidad mostrada. |
| Cambio/login nuevo — CONFIRMADOS POR USUARIO; anterior/logout pendientes | Usuario puede entrar con nueva contraseña. Rechazo de anterior y cierre de sesiones aún pendientes; no asumir invalidación instantánea de JWT. |
| Perfil/borrador/portada/siete fotos visibles — CONFIRMADOS POR USUARIO | Conservación visible reportada; comparación íntegra BD/roles/propietario pendiente, sin inferirla del render. |
| Vencido/usado/alterado/otro navegador | Rechazo seguro/mensaje y solicitud nueva; no bypass por verifier ausente. |
| Sesión anterior de otra cuenta | No cambia inadvertidamente esa cuenta, UI muestra cuenta validada. |
| Ventana 600 s/token refrescado | Marca vencida/otro token no permite handler; solicitud nueva disponible. |
| Signup y login normales | Regresión funcional normal/admin/publisher comprobada sin interferencia de recovery. |
| Red/doble submit/fortaleza/same-password | Sin éxito falso, no secreto en logs; error/reconciliación de resultado claros. |
| Producción | Sin cambios hasta GO/corte explícito; local/staging no equivale a cierre en actual. |

No garantía de idempotencia server-side del password update/logout: guard doble submit es UI; no hay transacción entre Auth y logout. Marca no es permiso de administración ni puede cambiar otra identidad sin su sesión validada. Logout global revoca refresh según proveedor, JWT previos pueden persistir hasta expiry; sesión real pendiente de comprobar, sin afirmación de revocación inmediata.
